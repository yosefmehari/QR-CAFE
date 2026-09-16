const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true }
  });
  console.log(`Found ${users.length} users:`);
  console.log(JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}

main();
