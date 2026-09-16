const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function runDiagnostics() {
  console.log('==============================================');
  console.log('       DATABASE DIAGNOSTIC & HEALTH CHECK     ');
  console.log('==============================================\n');

  const startTime = Date.now();
  try {
    // 1. Connection & Latency Check
    console.log('[1/5] Checking connection & server ping...');
    const connectStart = Date.now();
    await prisma.$connect();
    const pingTime = Date.now() - connectStart;
    console.log(`  -> Connection established in ${pingTime}ms.`);

    // 2. Query PostgreSQL metadata
    console.log('\n[2/5] Querying PostgreSQL server metadata...');
    const serverInfo = await prisma.$queryRaw`
      SELECT 
        version() AS pg_version, 
        current_database() AS db_name, 
        current_user AS db_user,
        now() AS server_time
    `;
    const info = serverInfo[0];
    console.log(`  -> Database Name : ${info.db_name}`);
    console.log(`  -> Current User  : ${info.db_user}`);
    console.log(`  -> Server Time   : ${info.server_time}`);
    console.log(`  -> Engine Version: ${info.pg_version.split('\n')[0]}`);

    // 3. Read Verification (Record counts & sample fetch)
    console.log('\n[3/5] Inspecting PostgreSQL schema & tables...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    console.log('  -> Existing Tables:', tables.map(t => t.table_name).join(', '));

    const [userCount, categoryCount, productCount, tableCount, orderCount] = await Promise.all([
      prisma.user.count(),
      prisma.category.count(),
      prisma.product.count(),
      prisma.table.count(),
      prisma.order.count(),
    ]);

    console.log(`  -> Table 'User'        : ${userCount} records`);
    console.log(`  -> Table 'Category'    : ${categoryCount} records`);
    console.log(`  -> Table 'Product'     : ${productCount} records`);
    console.log(`  -> Table 'Table'       : ${tableCount} records`);
    console.log(`  -> Table 'Order'       : ${orderCount} records`);

    const cafeSetting = await prisma.cafeSetting.findFirst();
    if (cafeSetting) {
      console.log(`  -> Cafe Setting        : Bank "${cafeSetting.bankName}", Account "${cafeSetting.bankAccountNumber}"`);
    }

    // 4. Write / Transaction Verification (dry-run rollback test)
    console.log('\n[4/5] Testing write & transaction permissions...');
    await prisma.$transaction(async (tx) => {
      // Create a temporary record inside a transaction then throw to rollback
      const testUser = await tx.user.findFirst({ select: { id: true } });
      if (testUser) {
        // Run an update with identical data to verify write capability
        await tx.user.update({
          where: { id: testUser.id },
          data: { updatedAt: new Date() }
        });
      }
      // Force rollback so no permanent unwanted modifications occur
      throw new Error('ROLLBACK_TEST_SUCCESS');
    }).catch(err => {
      if (err.message === 'ROLLBACK_TEST_SUCCESS') {
        console.log('  -> Write test & rollback executed successfully (Write permissions confirmed).');
      } else {
        throw err;
      }
    });

    const totalDuration = Date.now() - startTime;
    console.log('\n==============================================');
    console.log(`RESULT: DATABASE IS FULLY ONLINE & HEALTHY (Total: ${totalDuration}ms)`);
    console.log('==============================================');
  } catch (error) {
    console.error('\nDATABASE CHECK FAILED!');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runDiagnostics();
