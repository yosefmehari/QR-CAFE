const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const newPassword = 'rider66';
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const deliveryUsers = await prisma.user.findMany({
    where: { role: 'DELIVERY' },
  });

  for (const user of deliveryUsers) {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });
    const isMatch = await bcrypt.compare(newPassword, updated.password);
    console.log(`[UPDATED] ${updated.name} (${updated.email}) -> Password: "${newPassword}" | Verified: ${isMatch}`);
  }

  // Also ensure delivery@qrcafe.dev is covered
  const devCourier = await prisma.user.findUnique({ where: { email: 'delivery@qrcafe.dev' } });
  if (devCourier) {
    await prisma.user.update({
      where: { email: 'delivery@qrcafe.dev' },
      data: { password: hashedPassword }
    });
  }

  console.log('\nDelivery password updated successfully!');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
