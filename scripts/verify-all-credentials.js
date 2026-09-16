const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

const testCredentials = [
  { email: 'admin@qrcafe.com', pass: 'admin11', expectedRole: 'ADMIN' },
  { email: 'admin@qrcafe.dev', pass: 'admin22', expectedRole: 'ADMIN' },
  { email: 'kitchen@qrcafe.dev', pass: 'chef33', expectedRole: 'KITCHEN' },
  { email: 'kitchen@qrcafe.com', pass: 'chef33', expectedRole: 'KITCHEN' },
  { email: 'juice@qrcafe.dev', pass: 'juice44', expectedRole: 'JUICE_MAKER' },
  { email: 'waiter@qrcafe.dev', pass: 'waiter55', expectedRole: 'WAITER' },
  { email: 'delivery@qrcafe.dev', pass: 'rider66', expectedRole: 'DELIVERY' },
];

async function verify() {
  console.log('Final verification of all accounts and passwords:\n');
  for (const cred of testCredentials) {
    const user = await prisma.user.findUnique({ where: { email: cred.email } });
    if (!user) {
      console.log(`[FAIL] ${cred.email} not found in database!`);
      continue;
    }
    const match = await bcrypt.compare(cred.pass, user.password);
    console.log(`[${match ? 'PASS' : 'FAIL'}] ${user.role.padEnd(12)} | ${user.name.padEnd(23)} | ${user.email.padEnd(20)} | PW: ${cred.pass.padEnd(10)}`);
  }
  await prisma.$disconnect();
}

verify();
