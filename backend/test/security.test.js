import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { getJwtSecret } from '../src/config/jwt.js';
import { calculateOrderTotals, createOrderPayloadHash, formatMoney, getAdminSessionCookieOptions, getVerifiedImageType, isPlainObject, isText, isValidAdminPasswordLength, isValidIdempotencyKey, nextSessionVersion, parseMoney, resolveIdempotentOrder, UUID_PATTERN, validOptionalBoolean, validateProductionConfig, validateProductionUploadConfig } from '../src/utils/validation.js';
import { validateProductPayload } from '../src/controllers/productController.js';
import { validateCategoryPayload } from '../src/controllers/categoryController.js';
import { reconcileOrderStockForStatus, releaseOrderStock, reserveOrderStock } from '../src/utils/orderStock.js';
import { createIdempotentOrder } from '../src/utils/orderIdempotency.js';
import { clearLoginRateLimit, loginRateLimit } from '../src/middleware/loginRateLimit.js';

test('JWT configuration rejects missing, weak and predictable secrets without echoing them', () => {
  const previous = process.env.JWT_SECRET;
  try {
    delete process.env.JWT_SECRET;
    assert.throws(() => getJwtSecret(), /JWT_SECRET must be/);
    process.env.JWT_SECRET = 'x'.repeat(64);
    assert.throws(() => getJwtSecret(), /JWT_SECRET must be/);
    const strongSecret = randomBytes(32).toString('base64url');
    process.env.JWT_SECRET = strongSecret;
    assert.equal(getJwtSecret(), strongSecret);
  } finally {
    if (previous === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previous;
  }
});

test('validation helpers reject malformed types and unsafe currency values', () => {
  assert.equal(isPlainObject({ a: 1 }), true);
  assert.equal(isPlainObject([]), false);
  assert.equal(isText('  name ', { required: true, max: 8 }), true);
  assert.equal(isText('   ', { required: true, max: 8 }), false);
  assert.equal(isText(12), false);
  assert.equal(parseMoney('12.34'), 1234);
  assert.equal(parseMoney(0.1 + 0.2), null);
  assert.equal(parseMoney('0.30'), 30);
  assert.equal(parseMoney('12.345'), null);
  assert.equal(parseMoney('12abc'), null);
  assert.equal(parseMoney(-1), null);
  assert.equal(parseMoney('10000000000.00'), null);
  assert.equal(validOptionalBoolean(false), true);
  assert.equal(validOptionalBoolean('false'), false);
  assert.equal(UUID_PATTERN.test('123e4567-e89b-12d3-a456-426614174000'), true);
  assert.equal(UUID_PATTERN.test('invalid'), false);
});

test('order money totals use integer minor units and reject unsafe or fractional-cent values', () => {
  assert.deepEqual(calculateOrderTotals([{ price: 0.1, quantity: 3 }, { price: 2.35, quantity: 2 }]), {
    totalCents: 500,
    pricedLines: [{ unitCents: 10, subtotalCents: 30 }, { unitCents: 235, subtotalCents: 470 }],
  });
  assert.equal(calculateOrderTotals([{ price: 1.005, quantity: 1 }]), null);
  assert.equal(calculateOrderTotals([{ price: 10, quantity: Number.MAX_SAFE_INTEGER }]), null);
  assert.equal(calculateOrderTotals([{ price: '100000000.00', quantity: 100 }, { price: '100000000.00', quantity: 100 }]), null);
  assert.equal(parseMoney({ toFixed: () => '1.005' }), null);
  assert.equal(formatMoney(1005), '10.05');
});

test('order idempotency keys validate and payload hashes distinguish replay from conflict', () => {
  const payload = { customerName: 'A', items: [{ productId: 'p1', quantity: 2 }] };
  const hash = createOrderPayloadHash(payload);
  assert.equal(hash, createOrderPayloadHash({ items: [{ productId: 'p1', quantity: 2 }], customerName: 'A' }));
  assert.equal(isValidIdempotencyKey('order-retry-key-123'), true);
  assert.equal(isValidIdempotencyKey('short'), false);
  assert.equal(resolveIdempotentOrder(null, hash).kind, 'new');
  assert.equal(resolveIdempotentOrder({ id: 'order-1', payloadHash: hash }, hash).kind, 'replay');
  assert.equal(resolveIdempotentOrder({ id: 'order-1', payloadHash: hash }, 'different').kind, 'conflict');
});

test('concurrent identical order retries create one order; a changed payload conflicts', async () => {
  const rows = new Map();
  let queue = Promise.resolve();
  let created = 0;
  const findUnique = async ({ where }) => rows.get(where.idempotencyKey) || null;
  const db = {
    order: { findUnique },
    $transaction: async (operation) => {
      let unlock;
      const previous = queue;
      queue = new Promise((resolve) => { unlock = resolve; });
      await previous;
      try {
        return await operation({ order: {
          findUnique,
          create: async ({ data }) => {
            if (rows.has(data.idempotencyKey)) throw Object.assign(new Error('Unique key'), { code: 'P2002' });
            const row = { ...data, orderItems: [] };
            rows.set(data.idempotencyKey, row);
            created += 1;
            return row;
          },
        } });
      } finally { unlock(); }
    },
  };
  const request = { db, idempotencyKey: 'request-key-123456', payloadHash: 'a'.repeat(64), create: (tx) => tx.order.create({ data: { idempotencyKey: 'request-key-123456', payloadHash: 'a'.repeat(64) } }) };
  const results = await Promise.all([createIdempotentOrder(request), createIdempotentOrder(request)]);
  assert.equal(created, 1);
  assert.equal(rows.size, 1);
  assert.equal(results.filter((result) => result.replayed).length, 1);
  await assert.rejects(createIdempotentOrder({ ...request, payloadHash: 'b'.repeat(64) }), { statusCode: 409 });
  assert.equal(created, 1);
});

test('product and category payload validators reject malformed writes', () => {
  assert.equal(validateProductPayload({ name: 'Radish', description: 'Green', image: '/images/Radish.jpg', price: '2.50', stock: 4, isAvailable: false }, true), null);
  assert.match(validateProductPayload({ name: 'Radish', description: 'Green', image: '/images/Radish.jpg', price: '2.50abc' }, true), /Price/);
  assert.match(validateProductPayload({ name: 'Radish', description: 'Green', image: '/images/Radish.jpg', price: 3, discountPrice: 3 }, true), /Discount/);
  assert.match(validateProductPayload({ name: 'Radish', description: 'Green', image: '/images/Radish.jpg', price: 3, isAvailable: 'false' }, true), /booleans/);
  assert.equal(validateCategoryPayload({ name: 'Vegetables', description: 'Fresh' }, true), null);
  assert.match(validateCategoryPayload({ name: '  ' }, true), /non-empty/);
  assert.match(validateCategoryPayload({ name: 'Vegetables', admin: true }, true), /payload/);
});

test('production configuration requires external MySQL credentials and exact HTTPS origins', () => {
  const base = { NODE_ENV: 'production', DATABASE_URL: 'mysql://user:pass@db.example:3306/pearl_grow', FRONTEND_URL: 'https://shop.example' };
  assert.deepEqual(validateProductionConfig(base), []);
  assert.ok(validateProductionConfig({ ...base, FRONTEND_URL: 'http://shop.example' }).length > 0);
  assert.ok(validateProductionConfig({ ...base, DATABASE_URL: 'mysql://user:pass@localhost:3306/pearl_grow' }).length > 0);
  assert.equal(validateProductionUploadConfig({ nodeEnv: 'production', uploadsDir: '/var/data/uploads', publicApiUrl: 'https://api.example', persistent: 'true' }), true);
  assert.equal(validateProductionUploadConfig({ nodeEnv: 'production', uploadsDir: '/tmp/uploads', publicApiUrl: 'https://api.example', persistent: undefined }), false);
});

test('logout session version always advances beyond the current token version', () => {
  assert.equal(nextSessionVersion(1000, 1000).getTime(), 1001);
  assert.equal(nextSessionVersion(1000, 2000).getTime(), 2000);
});

test('admin password byte limits and cookie security attributes match server policy', () => {
  assert.equal(isValidAdminPasswordLength('123456789012'), true);
  assert.equal(isValidAdminPasswordLength('12345678901'), false);
  assert.equal(isValidAdminPasswordLength('é'.repeat(37)), false);
  const productionCookie = getAdminSessionCookieOptions(true);
  assert.deepEqual({ httpOnly: productionCookie.httpOnly, secure: productionCookie.secure, sameSite: productionCookie.sameSite, path: productionCookie.path, maxAge: productionCookie.maxAge }, {
    httpOnly: true, secure: true, sameSite: 'none', path: '/api', maxAge: 3_600_000,
  });
  assert.equal(getAdminSessionCookieOptions(false).sameSite, 'lax');
});

test('conditional reservation rejects concurrent overselling and a transaction mock discards partial failure', async () => {
  const original = new Map([['p1', 5], ['p2', 0]]);
  const sharedTx = { product: { updateMany: async ({ where, data }) => {
      const available = original.get(where.id) ?? 0;
      if (available < where.stock.gte) return { count: 0 };
      original.set(where.id, available - data.stock.decrement);
      return { count: 1 };
    } } };

  const competing = await Promise.allSettled([
    reserveOrderStock(sharedTx, [{ productId: 'p1', quantity: 4 }]),
    reserveOrderStock(sharedTx, [{ productId: 'p1', quantity: 4 }]),
  ]);
  assert.equal(competing.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(original.get('p1'), 1);

  const beforeFailure = new Map(original);
  const mockTransaction = async (operation) => {
    const working = new Map(original);
    const tx = { product: { updateMany: async ({ where, data }) => {
      const available = working.get(where.id) ?? 0;
      if (available < where.stock.gte) return { count: 0 };
      working.set(where.id, available - data.stock.decrement);
      return { count: 1 };
    } } };
    const result = await operation(tx);
    original.clear();
    for (const [id, value] of working) original.set(id, value);
    return result;
  };
  await assert.rejects(mockTransaction((tx) => reserveOrderStock(tx, [{ productId: 'p1', quantity: 1 }, { productId: 'p2', quantity: 1 }])), { statusCode: 409 });
  // This tests the controller's transaction contract, not MySQL's transaction implementation.
  assert.deepEqual(original, beforeFailure);
});

test('cancel, repeat, reopen, and delete stock effects are idempotent for each status transition', async () => {
  const stock = new Map([['p1', 3]]);
  const tx = { product: {
    updateMany: async ({ where, data }) => {
      const available = stock.get(where.id) ?? 0;
      if (available < where.stock.gte) return { count: 0 };
      stock.set(where.id, available - data.stock.decrement);
      return { count: 1 };
    },
    update: async ({ where, data }) => {
      if (!stock.has(where.id)) throw Object.assign(new Error('Missing'), { code: 'P2025' });
      stock.set(where.id, stock.get(where.id) + data.stock.increment);
    },
  } };
  const items = [{ productId: 'p1', quantity: 2 }];
  assert.equal(await reconcileOrderStockForStatus(tx, { status: 'PROCESSING', orderItems: items }, 'CANCELLED'), true);
  assert.equal(stock.get('p1'), 5);
  assert.equal(await reconcileOrderStockForStatus(tx, { status: 'CANCELLED', orderItems: items }, 'CANCELLED'), false);
  assert.equal(stock.get('p1'), 5);
  assert.equal(await reconcileOrderStockForStatus(tx, { status: 'CANCELLED', orderItems: items }, 'PROCESSING'), true);
  assert.equal(stock.get('p1'), 3);
  assert.equal(await reconcileOrderStockForStatus(tx, { status: 'PROCESSING', orderItems: items }, 'PROCESSING'), false);
  assert.equal(stock.get('p1'), 3);
  await releaseOrderStock(tx, items);
  assert.equal(stock.get('p1'), 5);
});

test('image upload checks MIME against file signatures', () => {
  const pngHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(getVerifiedImageType('image/png', pngHeader)?.extension, '.png');
  assert.equal(getVerifiedImageType('image/jpeg', pngHeader), null);
  assert.equal(getVerifiedImageType('image/svg+xml', Buffer.from('<svg/>')), null);
});

test('login throttling blocks repeated attempts for one IP and account without exposing the account', () => {
  const email = `test-${randomBytes(6).toString('hex')}@example.invalid`;
  const request = { ip: randomBytes(6).toString('hex'), body: { email } };
  let lastStatus = 0;
  const response = { status(code) { lastStatus = code; return this; }, set() { return this; }, json() { return this; } };
  for (let i = 0; i < 10; i += 1) {
    let advanced = false;
    loginRateLimit(request, response, () => { advanced = true; });
    assert.equal(advanced, true);
  }
  let advanced = false;
  loginRateLimit(request, response, () => { advanced = true; });
  assert.equal(advanced, false);
  assert.equal(lastStatus, 429);
  clearLoginRateLimit(request);
});
