import prisma from '../config/database.js';
import { randomUUID } from 'crypto';
import { isPlainObject, isText, UUID_PATTERN } from '../utils/validation.js';

const invalid = (res, error) => res.status(400).json({ success: false, error });
export const validateCategoryPayload = (body, creating) => {
  if (!isPlainObject(body) || Object.keys(body).some((key) => !['name', 'description'].includes(key))) return 'Invalid category payload.';
  if (creating && !Object.hasOwn(body, 'name')) return 'Category name is required.';
  if (body.name !== undefined && !isText(body.name, { required: true, max: 100 })) return 'Category name must be non-empty text up to 100 characters.';
  if (body.description !== undefined && body.description !== null && body.description !== '' && !isText(body.description, { max: 2000 })) return 'Category description must be text up to 2000 characters.';
  return null;
};

export const getCategories = async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({ include: { _count: { select: { products: true } } }, orderBy: { name: 'asc' } });
    res.json({ success: true, data: categories });
  } catch (error) { next(error); }
};

export const getCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!UUID_PATTERN.test(id)) return invalid(res, 'Category ID is invalid.');
    const category = await prisma.category.findUnique({ where: { id }, include: { products: true, _count: { select: { products: true } } } });
    if (!category) return res.status(404).json({ success: false, error: 'Category not found.' });
    res.json({ success: true, data: category });
  } catch (error) { next(error); }
};

export const createCategory = async (req, res, next) => {
  try {
    const message = validateCategoryPayload(req.body, true);
    if (message) return invalid(res, message);
    const name = req.body.name.trim();
    const category = await prisma.category.create({ data: { id: randomUUID(), name, description: req.body.description?.trim() || null, updatedAt: new Date() } });
    res.status(201).json({ success: true, message: 'Category created successfully.', data: category });
  } catch (error) { next(error); }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!UUID_PATTERN.test(id)) return invalid(res, 'Category ID is invalid.');
    const message = validateCategoryPayload(req.body, false);
    if (message) return invalid(res, message);
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, error: 'Category not found.' });
    const data = {};
    if (req.body.name !== undefined) data.name = req.body.name.trim();
    if (req.body.description !== undefined) data.description = req.body.description?.trim() || null;
    if (!Object.keys(data).length) return invalid(res, 'Provide at least one category field to update.');
    data.updatedAt = new Date();
    const updated = await prisma.category.update({ where: { id }, data });
    res.json({ success: true, message: 'Category updated successfully.', data: updated });
  } catch (error) { next(error); }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!UUID_PATTERN.test(id)) return invalid(res, 'Category ID is invalid.');
    const category = await prisma.category.findUnique({ where: { id }, include: { _count: { select: { products: true } } } });
    if (!category) return res.status(404).json({ success: false, error: 'Category not found.' });
    if (category._count.products > 0) return res.status(400).json({ success: false, error: 'This category contains products. Reassign or remove them before deleting it.' });
    await prisma.category.delete({ where: { id } });
    res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (error) { next(error); }
};
