const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  // 1. Juice Maker -> juice44
  const juiceHash = await bcrypt.hash('juice44', 10);
  const juiceMaker = await prisma.user.update({
    where: { email: 'juice@qrcafe.dev' },
    data: { password: juiceHash },
  });

  // 2. Waiter Staff -> waiter55
  const waiterHash = await bcrypt.hash('waiter55', 10);
  const waiter = await prisma.user.update({
    where: { email: 'waiter@qrcafe.dev' },
    data: { password: waiterHash },
  });

  const isJuiceValid = await bcrypt.compare('juice44', juiceMaker.password);
  const isWaiterValid = await bcrypt.compare('waiter55', waiter.password);

  console.log(`[UPDATED] ${juiceMaker.name} (${juiceMaker.email}) -> Password: "juice44" | Verified: ${isJuiceValid}`);
  console.log(`[UPDATED] ${waiter.name} (${waiter.email}) -> Password: "waiter55" | Verified: ${isWaiterValid}`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
