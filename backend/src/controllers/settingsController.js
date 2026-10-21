import prisma from '../config/database.js';
import { randomUUID } from 'crypto';

const ALLOWED_SETTING_KEYS = [
  'whatsapp_number',
  'business_name',
  'business_subname',
  'contact_phone',
  'contact_email',
  'location',
  'currency_symbol',
  'minimum_order_value',
  'operating_hours'
];

export const getPublicSettings = async (_req, res, next) => {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ALLOWED_SETTING_KEYS
        }
      }
    });

    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });

    // Provide default fallbacks matching brandData
    const result = {
      whatsapp_number: settingsObj.whatsapp_number || process.env.WHATSAPP_NUMBER || '94715498142',
      business_name: settingsObj.business_name || 'Pearl Grove',
      business_subname: settingsObj.business_subname || 'MICROGREENS',
      contact_phone: settingsObj.contact_phone || '071 549 8142',
      contact_email: settingsObj.contact_email || 'pearlgrovemicrogreens@gmail.com',
      location: settingsObj.location || 'Upcot, Maskeliya, Sri Lanka',
      currency_symbol: settingsObj.currency_symbol || 'Rs.',
      ...settingsObj
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) { next(error); }
};

export const getAdminSettings = async (req, res, next) => {
  try {
    const settings = await prisma.setting.findMany();
    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });

    res.json({
      success: true,
      data: settingsMap
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdminSettings = async (req, res, next) => {
  try {
    const updates = req.body;

    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid settings payload.'
      });
    }
    if (Object.keys(updates).length === 0) return res.status(400).json({ success: false, error: 'Provide at least one setting to update.' });

    for (const [key, value] of Object.entries(updates)) {
      if (!ALLOWED_SETTING_KEYS.includes(key)) return res.status(400).json({ success: false, error: 'Unknown setting key.' });
      if (typeof value !== 'string' || value.trim().length > 1000) return res.status(400).json({ success: false, error: 'Setting values must be text up to 1000 characters.' });
    }

    const saved = {};
    for (const [key, value] of Object.entries(updates)) {
      if (ALLOWED_SETTING_KEYS.includes(key)) {
        const record = await prisma.setting.upsert({
          where: { key },
          update: { value: value.trim(), updatedAt: new Date() },
          create: { id: randomUUID(), key, value: value.trim(), updatedAt: new Date() }
        });
        saved[record.key] = record.value;
      }
    }

    res.json({
      success: true,
      message: 'Settings updated successfully.',
      data: saved
    });
  } catch (error) {
    next(error);
  }
};
