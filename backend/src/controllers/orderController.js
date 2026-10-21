import prisma from '../config/database.js';
import { randomUUID } from 'crypto';
import { calculateOrderTotals, createOrderPayloadHash, isValidIdempotencyKey } from '../utils/validation.js';
import { reconcileOrderStockForStatus, releaseOrderStock, reserveOrderStock } from '../utils/orderStock.js';
import { createIdempotentOrder } from '../utils/orderIdempotency.js';

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'COMPLETED', 'CANCELLED'];
const MAX_ORDER_ITEMS = 20;
const MAX_QUANTITY = 100;
const MAX_FIELD_LENGTHS = { name: 120, phone: 40, address: 500, businessType: 80, message: 2000, variety: 100 };
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const publicOrder = (order) => {
  if (!order) return order;
  const { idempotencyKey, payloadHash, ...safeOrder } = order;
  return safeOrder;
};

const optionalText = (value, maxLength, field) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || value.trim().length > maxLength) {
    throw Object.assign(new Error(`${field} must be text no longer than ${maxLength} characters.`), { statusCode: 400 });
  }
  return value.trim() || null;
};

export const getOrders = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    if (Array.isArray(status) || Array.isArray(search) || (search && (typeof search !== 'string' || search.length > 120)) || (status && status !== 'ALL' && (typeof status !== 'string' || !VALID_STATUSES.includes(status.toUpperCase())))) return res.status(400).json({ success: false, error: 'Invalid order filters.' });

    const where = {};

    if (status && status !== 'ALL') {
      where.status = status.toUpperCase();
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search } },
        { customerPhone: { contains: search } },
        { customerAddress: { contains: search } },
        { businessType: { contains: search } },
        { id: { contains: search } }
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true, image: true, price: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      count: orders.length,
      data: orders.map(publicOrder)
    });
  } catch (error) {
    next(error);
  }
};

export const getOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!UUID_PATTERN.test(id)) return res.status(400).json({ success: false, error: 'Order ID is invalid.' });

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found.'
      });
    }

    res.json({
      success: true,
      data: publicOrder(order)
    });
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ success: false, error: 'Invalid order request structure.' });
    }
    const {
      customerName,
      customerPhone,
      customerAddress,
      businessType,
      message,
      selectedVarieties,
      items,
    } = req.body;
    const idempotencyKey = req.get('Idempotency-Key');
    if (!isValidIdempotencyKey(idempotencyKey)) {
      return res.status(400).json({ success: false, error: 'A valid Idempotency-Key header is required.' });
    }

    const allowedFields = new Set(['customerName', 'customerPhone', 'customerAddress', 'businessType', 'message', 'selectedVarieties', 'items']);
    if (Object.keys(req.body).some((key) => !allowedFields.has(key))) {
      return res.status(400).json({ success: false, error: 'Invalid order request structure.' });
    }

    if (typeof customerName !== 'string' || customerName.trim() === '' || customerName.trim().length > MAX_FIELD_LENGTHS.name) {
      return res.status(400).json({
        success: false,
        error: 'Customer name is required.'
      });
    }

    if (typeof customerPhone !== 'string' || customerPhone.trim() === '' || customerPhone.trim().length > MAX_FIELD_LENGTHS.phone) {
      return res.status(400).json({
        success: false,
        error: 'Customer phone number is required.'
      });
    }

    const cleanName = customerName.trim();
    const cleanPhone = customerPhone.trim();
    const cleanAddress = optionalText(customerAddress, MAX_FIELD_LENGTHS.address, 'Customer address');
    const cleanBusinessType = optionalText(businessType, MAX_FIELD_LENGTHS.businessType, 'Business type') || 'General Enquiry';
    const cleanMessage = optionalText(message, MAX_FIELD_LENGTHS.message, 'Message');
    if (selectedVarieties !== undefined && selectedVarieties !== null && (!Array.isArray(selectedVarieties) || selectedVarieties.length > 20 || selectedVarieties.some((v) => typeof v !== 'string' || v.trim().length > MAX_FIELD_LENGTHS.variety))) {
      return res.status(400).json({ success: false, error: 'Selected varieties must be a list of up to 20 short text values.' });
    }

    if (items !== undefined && (!Array.isArray(items) || items.length === 0 || items.length > MAX_ORDER_ITEMS)) {
      return res.status(400).json({ success: false, error: `Items must contain between 1 and ${MAX_ORDER_ITEMS} products.` });
    }

    const normalizedItems = items?.map(({ productId, quantity }) => ({ productId, quantity }));
    const payloadHash = createOrderPayloadHash({
      customerName: cleanName,
      customerPhone: cleanPhone,
      customerAddress: cleanAddress,
      businessType: cleanBusinessType,
      message: cleanMessage,
      selectedVarieties: Array.isArray(selectedVarieties) ? selectedVarieties.map((value) => value.trim()) : null,
      items: normalizedItems || null,
    });

    let order;
    try {
      const result = await createIdempotentOrder({ db: prisma, idempotencyKey, payloadHash, create: async (tx) => {
        const orderItemsData = [];
        let totals = { totalCents: 0, pricedLines: [] };
        if (items !== undefined) {
          if (items.some((item) => !item || typeof item !== 'object' || Array.isArray(item) || Object.keys(item).some((key) => !['productId', 'quantity'].includes(key)) || !UUID_PATTERN.test(item.productId || '') || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QUANTITY) || new Set(items.map((item) => item.productId)).size !== items.length) {
            throw Object.assign(new Error(`Each item needs a valid product ID and a whole quantity from 1 to ${MAX_QUANTITY}.`), { statusCode: 400 });
          }
          const products = await tx.product.findMany({
            where: { id: { in: items.map((item) => item.productId) } },
            select: { id: true, name: true, price: true, discountPrice: true, isAvailable: true, stock: true },
          });
          const productById = new Map(products.map((product) => [product.id, product]));
          if (products.length !== items.length) throw Object.assign(new Error('One or more products could not be found.'), { statusCode: 400 });
          totals = calculateOrderTotals(items.map((item) => {
            const product = productById.get(item.productId);
            return { price: product.discountPrice ?? product.price, quantity: item.quantity };
          }));
          if (!totals) throw Object.assign(new Error('A product has an invalid price or the order total is outside the supported range.'), { statusCode: 409 });
          for (const [index, item] of items.entries()) {
            const product = productById.get(item.productId);
            if (!product.isAvailable || product.stock < item.quantity) throw Object.assign(new Error(`${product.name} is not available in the requested quantity.`), { statusCode: 409 });
            const { unitCents, subtotalCents } = totals.pricedLines[index];
            orderItemsData.push({ id: randomUUID(), productId: product.id, quantity: item.quantity, price: unitCents / 100, subtotal: subtotalCents / 100 });
          }
          // The caller's serializable transaction rolls back all reservations if any line fails.
          await reserveOrderStock(tx, items);
        }
        const createdOrder = await tx.order.create({
        data: {
          id: randomUUID(),
          customerName: cleanName,
          customerPhone: cleanPhone,
          customerAddress: cleanAddress,
          businessType: cleanBusinessType,
          message: cleanMessage,
          selectedVarieties: Array.isArray(selectedVarieties) ? selectedVarieties.join(', ') : null,
          totalAmount: totals.totalCents / 100,
          idempotencyKey,
          payloadHash,
          status: 'PENDING',
          updatedAt: new Date(),
          ...(orderItemsData.length > 0 && { orderItems: { create: orderItemsData } }),
        },
        include: { orderItems: { include: { product: true } } },
        });
        return createdOrder;
      } });
      order = result.order;
      if (result.replayed) {
        return res.status(200).json({ success: true, message: 'Order already recorded.', data: publicOrder(order), replayed: true });
      }
    } catch (error) {
      if (error.statusCode) throw error;
      if (error.code === 'P2034') throw Object.assign(new Error('Stock changed while placing this order. Please retry.'), { statusCode: 409 });
      throw error;
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully.',
      data: publicOrder(order)
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) return res.status(400).json({ success: false, error: 'Invalid status payload.' });
    const { status } = req.body;

    if (typeof status !== 'string' || !VALID_STATUSES.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    if (!UUID_PATTERN.test(id)) return res.status(400).json({ success: false, error: 'Order ID is invalid.' });
    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({ where: { id }, include: { orderItems: true } });
      if (!existing) return null;
      const nextStatus = status.toUpperCase();
        const changed = await reconcileOrderStockForStatus(tx, existing, nextStatus);
        if (!changed) return existing;
      return tx.order.update({ where: { id }, data: { status: nextStatus, updatedAt: new Date() }, include: { orderItems: true } });
    }, { isolationLevel: 'Serializable' });
    if (!updated) return res.status(404).json({ success: false, error: 'Order not found.' });

    res.json({
      success: true,
      message: `Order status updated to ${updated.status}.`,
      data: publicOrder(updated)
    });
  } catch (error) {
    next(error);
  }
};

export const deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!UUID_PATTERN.test(id)) return res.status(400).json({ success: false, error: 'Order ID is invalid.' });
    const deleted = await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({ where: { id }, include: { orderItems: true } });
      if (!existing) return false;
      if (existing.status !== 'CANCELLED') {
        await releaseOrderStock(tx, existing.orderItems);
      }
      await tx.order.delete({ where: { id } });
      return true;
    }, { isolationLevel: 'Serializable' });
    if (!deleted) return res.status(404).json({ success: false, error: 'Order not found.' });

    res.json({
      success: true,
      message: 'Order deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
