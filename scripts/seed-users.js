const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function seedUsers() {
  const defaultPassword = process.env.SEED_ADMIN_PASSWORD || 'joss5501';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const staffUsers = [
    { name: 'Cafe Admin', email: 'admin@qrcafe.dev', role: 'ADMIN' },
    { name: 'Cafe Admin (Owner)', email: 'admin@qrcafe.com', role: 'ADMIN' },
    { name: 'Kitchen Staff', email: 'kitchen@qrcafe.dev', role: 'KITCHEN' },
    { name: 'Head Chef Marco', email: 'kitchen@qrcafe.com', role: 'KITCHEN' },
    { name: 'Juice Master Leo', email: 'juice@qrcafe.dev', role: 'JUICE_MAKER' },
    { name: 'Head Waiter Alex', email: 'waiter@qrcafe.dev', role: 'WAITER' },
    { name: 'Delivery Courier Dawit', email: 'delivery@qrcafe.dev', role: 'DELIVERY' },
  ];

  console.log('Seeding user accounts into database...\n');
  for (const user of staffUsers) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          password: hashedPassword,
          role: user.role,
        },
      });
      console.log(`[CREATED] ${user.name} (${user.email}) -> Role: ${user.role}`);
    } else {
      await prisma.user.update({
        where: { email: user.email },
        data: { password: hashedPassword, role: user.role },
      });
      console.log(`[UPDATED] ${user.name} (${user.email})`);
    }
  }

  console.log(`\nAll users successfully created with password: "${defaultPassword}"`);
  await prisma.$disconnect();
}

seedUsers().catch(err => {
  console.error(err);
  process.exit(1);
});
