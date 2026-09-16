const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

const accounts = [
  {
    email: 'admin@qrcafe.dev',
    name: 'Cafe Admin',
    role: 'ADMIN',
    passwordPlain: 'Admin@Cafe#2026'
  },
  {
    email: 'admin@qrcafe.com',
    name: 'Cafe Admin (Owner)',
    role: 'ADMIN',
    passwordPlain: 'Owner@Master!99'
  },
  {
    email: 'kitchen@qrcafe.dev',
    name: 'Kitchen Staff',
    role: 'KITCHEN',
    passwordPlain: 'Chef#Kitchen44'
  },
  {
    email: 'kitchen@qrcafe.com',
    name: 'Head Chef Marco',
    role: 'KITCHEN',
    passwordPlain: 'Marco$Flame77'
  },
  {
    email: 'juice@qrcafe.dev',
    name: 'Juice Master Leo',
    role: 'JUICE_MAKER',
    passwordPlain: 'Juice*Smoothie33'
  },
  {
    email: 'waiter@qrcafe.dev',
    name: 'Head Waiter Alex',
    role: 'WAITER',
    passwordPlain: 'Waiter%Floor55'
  },
  {
    email: 'delivery@qrcafe.dev',
    name: 'Delivery Courier Dawit',
    role: 'DELIVERY',
    passwordPlain: 'Rider&Fast88'
  }
];

async function updatePasswords() {
  console.log('Setting individual unique passwords for all staff...\n');

  for (const acc of accounts) {
    const hashedPassword = await bcrypt.hash(acc.passwordPlain, 10);
    const updated = await prisma.user.upsert({
      where: { email: acc.email },
      update: {
        name: acc.name,
        role: acc.role,
        password: hashedPassword
      },
      create: {
        name: acc.name,
        email: acc.email,
        role: acc.role,
        password: hashedPassword
      }
    });

    const isMatch = await bcrypt.compare(acc.passwordPlain, updated.password);
    console.log(`[OK] ${acc.role.padEnd(12)} | ${acc.email.padEnd(22)} | Password: ${acc.passwordPlain.padEnd(18)} | Verified: ${isMatch}`);
  }

  console.log('\nAll unique passwords have been successfully updated in PostgreSQL!');
  await prisma.$disconnect();
}

updatePasswords().catch(err => {
  console.error(err);
  process.exit(1);
});
