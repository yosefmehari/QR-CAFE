const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

// Mirror owner check logic from src/lib/owner.ts
const OWNER_EMAIL = (process.env.NEXT_PUBLIC_OWNER_EMAIL || process.env.OWNER_EMAIL || 'admin@qrcafe.com').toLowerCase().trim();

function isOwner(userOrEmail) {
  if (!userOrEmail) return false;
  if (typeof userOrEmail === 'string') {
    return userOrEmail.trim().toLowerCase() === OWNER_EMAIL;
  }
  const email = userOrEmail.email?.trim().toLowerCase();
  if (email && email === OWNER_EMAIL) return true;
  const name = userOrEmail.name?.toLowerCase();
  if (name && (name.includes('(owner)') || name.includes('admin owner'))) return true;
  return false;
}

async function testOwnerVisibility() {
  console.log('=== TESTING ADMIN OWNER VISIBILITY RULES ===\n');

  const allStaff = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Total database users: ${allStaff.length}`);

  // Test 1: Logged in as Regular Admin (e.g. admin@qrcafe.dev)
  const regularAdminSession = {
    userId: 'admin-dev-id',
    email: 'admin@qrcafe.dev',
    name: 'Cafe Admin',
    role: 'ADMIN',
  };

  const isRegularAdminOwner = isOwner(regularAdminSession);
  console.log(`\n[Scenario 1] Regular Admin Session (${regularAdminSession.email}):`);
  console.log(`  isOwner: ${isRegularAdminOwner}`);

  const regularAdminVisibleStaff = isRegularAdminOwner
    ? allStaff
    : allStaff.filter((s) => !isOwner(s));

  console.log(`  Visible staff count for Admin: ${regularAdminVisibleStaff.length}`);
  const containsOwner1 = regularAdminVisibleStaff.some((s) => isOwner(s));
  console.log(`  Can Admin view the Owner? ${containsOwner1 ? 'YES (FAIL)' : 'NO (PASS)'}`);
  console.log('  Visible names: ', regularAdminVisibleStaff.map(s => `${s.name} (${s.email})`));

  if (containsOwner1) {
    throw new Error('FAILED: Admin should NOT be able to view owner!');
  }

  // Test 2: Logged in as Owner (e.g. admin@qrcafe.com)
  const ownerSession = {
    userId: 'owner-id',
    email: 'admin@qrcafe.com',
    name: 'Cafe Admin (Owner)',
    role: 'ADMIN',
  };

  const isOwnerSessionOwner = isOwner(ownerSession);
  console.log(`\n[Scenario 2] Owner Session (${ownerSession.email}):`);
  console.log(`  isOwner: ${isOwnerSessionOwner}`);

  const ownerVisibleStaff = isOwnerSessionOwner
    ? allStaff
    : allStaff.filter((s) => !isOwner(s));

  console.log(`  Visible staff count for Owner: ${ownerVisibleStaff.length}`);
  const containsOwner2 = ownerVisibleStaff.some((s) => isOwner(s));
  const containsRegularAdmin = ownerVisibleStaff.some((s) => s.email === 'admin@qrcafe.dev');
  console.log(`  Can Owner view self/Owner? ${containsOwner2 ? 'YES (PASS)' : 'NO (FAIL)'}`);
  console.log(`  Can Owner view Regular Admin? ${containsRegularAdmin ? 'YES (PASS)' : 'NO (FAIL)'}`);
  console.log(`  Can Owner view all staff? ${ownerVisibleStaff.length === allStaff.length ? 'YES (PASS)' : 'NO (FAIL)'}`);
  console.log('  Visible names: ', ownerVisibleStaff.map(s => `${s.name} (${s.email})`));

  if (!containsOwner2 || !containsRegularAdmin || ownerVisibleStaff.length !== allStaff.length) {
    throw new Error('FAILED: Owner must be able to view all users!');
  }

  console.log('\n=== ALL ACCESS CONTROL TESTS PASSED SUCCESSFULLY! ===');
  await prisma.$disconnect();
}

testOwnerVisibility().catch((err) => {
  console.error(err);
  process.exit(1);
});
