const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function initComplaintsTable() {
  console.log('Initializing OrderComplaint table in PostgreSQL...');
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "OrderComplaint" (
        "id" TEXT PRIMARY KEY,
        "orderId" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "items" TEXT,
        "details" TEXT NOT NULL,
        "desiredAction" TEXT,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "staffNotes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "OrderComplaint_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "OrderComplaint_orderId_idx" ON "OrderComplaint"("orderId");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "OrderComplaint_status_idx" ON "OrderComplaint"("status");
    `);

    const result = await prisma.$queryRawUnsafe('SELECT COUNT(*) AS total FROM "OrderComplaint"');
    console.log('Successfully created/verified "OrderComplaint" table. Current row count:', result[0].total);
  } catch (error) {
    console.error('Failed to initialize OrderComplaint table:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initComplaintsTable();
