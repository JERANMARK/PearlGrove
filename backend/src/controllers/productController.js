import prisma from '../config/database.js';
import { randomUUID } from 'crypto';
import { isPlainObject, isText, parseMoney, UUID_PATTERN, validOptionalBoolean } from '../utils/validation.js';

const PRODUCT_FIELDS = new Set(['name', 'description', 'notes', 'image', 'price', 'discountPrice', 'stock', 'isAvailable', 'isFeatured', 'profile', 'bestSuitedFor', 'categoryId']);
const textRules = { name: { required: true, max: 120 }, description: { required: true, max: 10000 }, notes: { max: 1000 }, image: { required: true, max: 2048 }, profile: { max: 500 }, bestSuitedFor: { max: 2000 } };
const invalid = (res, error) => res.status(400).json({ success: false, error });
const validImageReference = (value) => {
  if (typeof value !== 'string' || value.length > 2048 || value.includes('\\') || value.split('/').some((part) => part === '.' || part === '..')) return false;
  if (value.startsWith('/images/')) return true;
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
};

export const validateProductPayload = (body, creating) => {
  if (!isPlainObject(body) || Object.keys(body).some((key) => !PRODUCT_FIELDS.has(key))) return 'Invalid product payload.';
  if (creating && (!Object.hasOwn(body, 'name') || !Object.hasOwn(body, 'description') || !Object.hasOwn(body, 'price'))) return 'Name, description, and price are required.';
  for (const [field, rule] of Object.entries(textRules)) {
    if (body[field] !== undefined && body[field] !== null && body[field] !== '' && !isText(body[field], rule)) return `${field} must be text with a maximum of ${rule.max} characters.`;
    if (creating && rule.required && !isText(body[field], rule)) return `${field} is required.`;
  }
  if (body.image !== undefined && body.image !== null && body.image !== '' && !validImageReference(body.image)) return 'Image must be an application image path or an HTTPS URL.';
  if (body.price !== undefined && parseMoney(body.price) === null) return 'Price must be a valid non-negative amount with at most two decimal places.';
  if (body.discountPrice !== undefined && body.discountPrice !== null && body.discountPrice !== '' && parseMoney(body.discountPrice) === null) return 'Discount price must be a valid non-negative amount.';
  if (body.stock !== undefined && (!Number.isInteger(body.stock) || body.stock < 0 || body.stock > 100000000)) return 'Stock must be a non-negative whole number.';
  if (!validOptionalBoolean(body.isAvailable) || !validOptionalBoolean(body.isFeatured)) return 'Availability and featured values must be booleans.';
  if (body.categoryId !== undefined && body.categoryId !== null && body.categoryId !== '' && (typeof body.categoryId !== 'string' || !UUID_PATTERN.test(body.categoryId))) return 'Category ID is invalid.';
  if (body.profile !== undefined && body.profile !== null && body.profile !== '' && !(isText(body.profile, textRules.profile) || (Array.isArray(body.profile) && body.profile.length <= 20 && body.profile.every((v) => isText(v, { max: 80 })))) ) return 'Profile must be short text or a list of up to 20 values.';
  if (body.bestSuitedFor !== undefined && body.bestSuitedFor !== null && body.bestSuitedFor !== '' && !(isText(body.bestSuitedFor, textRules.bestSuitedFor) || (Array.isArray(body.bestSuitedFor) && body.bestSuitedFor.length <= 30 && body.bestSuitedFor.every((v) => isText(v, { max: 120 })))) ) return 'Best suited for must be text or a list of up to 30 values.';
  const price = body.price === undefined ? null : parseMoney(body.price);
  const discount = body.discountPrice === undefined || body.discountPrice === null || body.discountPrice === '' ? null : parseMoney(body.discountPrice);
  if (discount !== null && price !== null && discount >= price) return 'Discount price must be lower than the regular price.';
  return null;
};

const normalize = (body) => ({
  ...(body.name !== undefined && { name: body.name.trim() }),
  ...(body.description !== undefined && { description: body.description.trim() }),
  ...(body.notes !== undefined && { notes: body.notes?.trim() || null }),
  ...(body.image !== undefined && { image: body.image.trim() }),
  // Prisma stores money as Decimal; convert validated integer cents to a number
  // so Prisma serializes the exact two-decimal value for DECIMAL(12,2).
  ...(body.price !== undefined && { price: parseMoney(body.price) / 100 }),
  ...(body.discountPrice !== undefined && { discountPrice: body.discountPrice === null || body.discountPrice === '' ? null : parseMoney(body.discountPrice) / 100 }),
  ...(body.stock !== undefined && { stock: body.stock }),
  ...(body.isAvailable !== undefined && { isAvailable: body.isAvailable }),
  ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
  ...(body.profile !== undefined && { profile: Array.isArray(body.profile) ? body.profile.map((v) => v.trim()).join(', ') : body.profile?.trim() || null }),
  ...(body.bestSuitedFor !== undefined && { bestSuitedFor: Array.isArray(body.bestSuitedFor) ? body.bestSuitedFor.map((v) => v.trim()).join(', ') : body.bestSuitedFor?.trim() || null }),
  ...(body.categoryId !== undefined && { categoryId: body.categoryId || null }),
});

export const getProducts = async (req, res, next) => {
  try {
    const { category, search, availableOnly, featuredOnly } = req.query;
    if ([category, search, availableOnly, featuredOnly].some((v) => Array.isArray(v))) return invalid(res, 'Invalid product query.');
    if ((search && (typeof search !== 'string' || search.length > 120)) || (category && (typeof category !== 'string' || category.length > 120))) return invalid(res, 'Search and category filters must be at most 120 characters.');
    if (availableOnly !== undefined && !['true', 'false'].includes(availableOnly)) return invalid(res, 'availableOnly must be true or false.');
    if (featuredOnly !== undefined && !['true', 'false'].includes(featuredOnly)) return invalid(res, 'featuredOnly must be true or false.');
    const where = {};
    if (category && category !== 'All') where.OR = [{ categoryId: category }, { category: { name: category } }, { profile: { contains: category } }];
    if (search) where.AND = [...(where.AND || []), { OR: ['name', 'description', 'notes', 'profile', 'bestSuitedFor'].map((key) => ({ [key]: { contains: search } })) }];
    if (availableOnly === 'true') where.isAvailable = true;
    if (featuredOnly === 'true') where.isFeatured = true;
    const products = await prisma.product.findMany({ where, include: { category: { select: { id: true, name: true } } }, orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }] });
    res.json({ success: true, count: products.length, data: products });
  } catch (error) { next(error); }
};

export const getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!UUID_PATTERN.test(id)) return invalid(res, 'Product ID is invalid.');
    const product = await prisma.product.findUnique({ where: { id }, include: { category: { select: { id: true, name: true, description: true } } } });
    if (!product) return res.status(404).json({ success: false, error: 'Product not found.' });
    res.json({ success: true, data: product });
  } catch (error) { next(error); }
};

export const createProduct = async (req, res, next) => {
  try {
    const validationError = validateProductPayload(req.body, true);
    if (validationError) return invalid(res, validationError);
    const data = { id: randomUUID(), ...normalize(req.body), stock: req.body.stock ?? 0, isAvailable: req.body.isAvailable ?? true, isFeatured: req.body.isFeatured ?? false, image: req.body.image?.trim() || '/images/Radish.jpg', updatedAt: new Date() };
    if (data.categoryId && !await prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true } })) return invalid(res, 'Specified category does not exist.');
    const product = await prisma.product.create({ data, include: { category: true } });
    res.status(201).json({ success: true, message: 'Product created successfully.', data: product });
  } catch (error) { next(error); }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!UUID_PATTERN.test(id)) return invalid(res, 'Product ID is invalid.');
    const validationError = validateProductPayload(req.body, false);
    if (validationError) return invalid(res, validationError);
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, error: 'Product not found.' });
    const data = normalize(req.body);
    const priceCents = parseMoney(req.body.price ?? existing.price);
    const discountCents = req.body.discountPrice === undefined ? (existing.discountPrice === null ? null : parseMoney(existing.discountPrice)) : (data.discountPrice === null ? null : parseMoney(req.body.discountPrice));
    if (discountCents !== null && priceCents !== null && discountCents >= priceCents) return invalid(res, 'Discount price must be lower than the regular price.');
    if (data.categoryId && !await prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true } })) return invalid(res, 'Specified category does not exist.');
    const updated = await prisma.product.update({ where: { id }, data, include: { category: true } });
    res.json({ success: true, message: 'Product updated successfully.', data: updated });
  } catch (error) { next(error); }
};

export const toggleProductAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!UUID_PATTERN.test(id)) return invalid(res, 'Product ID is invalid.');
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, error: 'Product not found.' });
    const updated = await prisma.product.update({ where: { id }, data: { isAvailable: !existing.isAvailable } });
    res.json({ success: true, message: `Product marked as ${updated.isAvailable ? 'available' : 'unavailable'}.`, data: updated });
  } catch (error) { next(error); }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!UUID_PATTERN.test(id)) return invalid(res, 'Product ID is invalid.');
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, error: 'Product not found.' });
    await prisma.product.delete({ where: { id } });
    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) { next(error); }
};
