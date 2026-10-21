import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory as well as current working directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('The seed script is disabled in production.');
  console.log('🌱 Starting Pearl Grow database seeding...');

  // Seed reference categories without replacing administrator-managed descriptions.
  const categories = [
    { name: 'Microgreens', description: 'Fresh, nutrient-dense young vegetable greens grown for maximum flavor and nutrition.' },
    { name: 'Specialty Greens', description: 'Unique gourmet greens cultivated for fine dining and culinary creations.' },
    { name: 'Edible Flowers', description: 'Vibrant, food-safe blossoms to elevate garnishes and beverage presentations.' },
    { name: 'Fresh Herbs', description: 'Aromatic herbs harvested fresh for commercial and modern kitchens.' },
  ];

  const categoryMap = {};
  for (const cat of categories) {
    const createdCat = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: { id: randomUUID(), ...cat, updatedAt: new Date() },
    });
    categoryMap[createdCat.name] = createdCat.id;
  }
  console.log(`✅ Seeded ${categories.length} categories`);

  // Seed products only when absent; never overwrite managed product data.
  const microgreensCategory = categoryMap['Microgreens'];

  const products = [
    {
      name: 'Radish',
      notes: 'Peppery, Crisp, Vibrant',
      description: 'A vibrant microgreen with a fresh crunch and distinctive peppery character.',
      bestSuitedFor: 'Salads, Sandwiches, Bowls, Restaurant plating, Modern culinary creations',
      profile: 'Peppery, Colourful',
      image: '/images/Radish.jpg',
      price: 1500,
      discountPrice: 1350,
      stock: 50,
      isAvailable: true,
      isFeatured: true,
      categoryId: microgreensCategory,
    },
    {
      name: 'Pea Shoots',
      notes: 'Sweet, Fresh, Crisp',
      description: 'Fresh and naturally sweet with a delicate crunch.',
      bestSuitedFor: 'Salads, Bowls, Healthy meals, Café dishes, Garnishes',
      profile: 'Sweet',
      image: '/images/Pea Shoots.jpg',
      price: 1400,
      discountPrice: null,
      stock: 60,
      isAvailable: true,
      isFeatured: true,
      categoryId: microgreensCategory,
    },
    {
      name: 'Sunflower',
      notes: 'Crunchy, Fresh, Substantial',
      description: 'A fuller microgreen with a satisfying texture and fresh flavour.',
      bestSuitedFor: 'Salads, Bowls, Sandwiches, Healthy meals',
      profile: 'Mild',
      image: '/images/Sunflower.jpg',
      price: 1450,
      discountPrice: null,
      stock: 40,
      isAvailable: true,
      isFeatured: false,
      categoryId: microgreensCategory,
    },
    {
      name: 'Broccoli',
      notes: 'Mild, Delicate, Versatile',
      description: 'A delicate and mild microgreen suitable for a wide range of everyday dishes.',
      bestSuitedFor: 'Salads, Healthy meals, Sandwiches, Bowls, Garnishes',
      profile: 'Mild',
      image: '/images/Broccoli.jpg',
      price: 1600,
      discountPrice: 1500,
      stock: 35,
      isAvailable: true,
      isFeatured: true,
      categoryId: microgreensCategory,
    },
    {
      name: 'Red Cabbage',
      notes: 'Colourful, Delicate, Elegant',
      description: 'A visually striking microgreen that brings colour and a delicate character to plates.',
      bestSuitedFor: 'Fine-dining garnishes, Restaurant plating, Salads, Modern culinary creations',
      profile: 'Colourful, Mild',
      image: '/images/Red Cabbage.jpg',
      price: 1550,
      discountPrice: null,
      stock: 45,
      isAvailable: true,
      isFeatured: true,
      categoryId: microgreensCategory,
    },
    {
      name: 'Mustard',
      notes: 'Bold, Peppery, Distinctive',
      description: 'A bold variety with a distinctive peppery character for dishes that need extra flavour.',
      bestSuitedFor: 'Fine-dining dishes, Salads, Sandwiches, Modern culinary creations',
      profile: 'Peppery',
      image: '/images/Mustard.png',
      price: 1400,
      discountPrice: null,
      stock: 30,
      isAvailable: true,
      isFeatured: false,
      categoryId: microgreensCategory,
    },
  ];

  for (const productData of products) {
    const existing = await prisma.product.findFirst({
      where: { name: productData.name },
    });

    if (!existing) {
      await prisma.product.create({
        data: { id: randomUUID(), ...productData, updatedAt: new Date() },
      });
    }
  }
  console.log(`✅ Seeded ${products.length} products`);

  // Seed business settings only when absent; preserve configured values.
  const settings = [
    { key: 'whatsapp_number', value: '94715498142' },
    { key: 'business_name', value: 'Pearl Grove' },
    { key: 'business_subname', value: 'MICROGREENS' },
    { key: 'contact_phone', value: '071 549 8142' },
    { key: 'contact_email', value: 'pearlgrovemicrogreens@gmail.com' },
    { key: 'location', value: 'Upcot, Maskeliya, Sri Lanka' },
    { key: 'currency_symbol', value: 'Rs.' },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: { id: randomUUID(), ...setting, updatedAt: new Date() },
    });
  }
  console.log(`✅ Seeded ${settings.length} business settings`);

  console.log('✨ Pearl Grow database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
