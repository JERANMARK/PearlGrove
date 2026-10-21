import { resolveIdempotentOrder } from './validation.js';

const orderInclude = { orderItems: { include: { product: true } } };
const conflict = () => Object.assign(new Error('This Idempotency-Key was already used with a different request.'), { statusCode: 409 });

export const createIdempotentOrder = async ({ db, idempotencyKey, payloadHash, create }) => {
  try {
    return await db.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({ where: { idempotencyKey }, include: orderInclude });
      const resolution = resolveIdempotentOrder(existing, payloadHash);
      if (resolution.kind === 'replay') return { order: resolution.order, replayed: true };
      if (resolution.kind === 'conflict') throw conflict();
      return { order: await create(tx), replayed: false };
    }, { isolationLevel: 'Serializable' });
  } catch (error) {
    if (error.statusCode) throw error;
    if (error.code !== 'P2002') throw error;

    // A concurrent insert may win the unique key after this transaction's initial lookup.
    const existing = await db.order.findUnique({ where: { idempotencyKey }, include: orderInclude });
    const resolution = resolveIdempotentOrder(existing, payloadHash);
    if (resolution.kind === 'replay') return { order: resolution.order, replayed: true };
    if (resolution.kind === 'conflict') throw conflict();
    throw error;
  }
};
