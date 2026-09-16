const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    include: { category: true }
  });

  console.log(`Found ${products.length} products in database:\n`);
  for (const p of products) {
    console.log(`- [${p.category?.name || 'No Category'}] "${p.name}" | ImageUrl: ${p.imageUrl || 'NULL (Showing Emoji!)'}`);
  }

  await prisma.$disconnect();
}

main();
