const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const newPassword = 'admin11';
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update Cafe Admin (Owner)
  const owner = await prisma.user.update({
    where: { email: 'admin@qrcafe.com' },
    data: { password: hashedPassword },
  });

  // Also update admin@qrcafe.dev so both admin accounts work smoothly with admin11 if requested
  const adminDev = await prisma.user.update({
    where: { email: 'admin@qrcafe.dev' },
    data: { password: hashedPassword },
  });

  const isOwnerValid = await bcrypt.compare(newPassword, owner.password);
  const isAdminDevValid = await bcrypt.compare(newPassword, adminDev.password);

  console.log(`[UPDATED] ${owner.name} (${owner.email}) -> Password: "${newPassword}" | Verified: ${isOwnerValid}`);
  console.log(`[UPDATED] ${adminDev.name} (${adminDev.email}) -> Password: "${newPassword}" | Verified: ${isAdminDevValid}`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
