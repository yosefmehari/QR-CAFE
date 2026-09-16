const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findUnique({ where: { email: 'admin@qrcafe.dev' } });
  const valid = await bcrypt.compare('joss5501', admin.password);
  console.log('Login verification test for admin@qrcafe.dev with "joss5501":', valid ? 'SUCCESS (Match)' : 'FAILED');
  await prisma.$disconnect();
}

main();
