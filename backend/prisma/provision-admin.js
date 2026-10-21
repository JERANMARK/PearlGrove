import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Set ADMIN_EMAIL to a valid address in the process environment.');
  }
  if (typeof password !== 'string' || Buffer.byteLength(password, 'utf8') < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('Set ADMIN_PASSWORD to a password between 12 and 72 bytes in the process environment.');
  }

  await prisma.$transaction(async (tx) => {
    const existing = await tx.admin.findFirst({ select: { id: true } });
    if (existing) throw new Error('An administrator already exists; provisioning will not modify existing accounts.');
    await tx.admin.create({ data: { id: randomUUID(), email, password: await bcrypt.hash(password, 12), updatedAt: new Date() } });
  }, { isolationLevel: 'Serializable' });
  console.log('Initial administrator created. Credentials were not displayed.');
}

main()
  .catch((error) => {
    console.error(error.message || 'Administrator provisioning failed.');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
