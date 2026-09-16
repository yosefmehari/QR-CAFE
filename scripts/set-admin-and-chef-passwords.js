const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  // 1. Admin (Cafe Admin) -> admin22
  const adminHash = await bcrypt.hash('admin22', 10);
  const admin = await prisma.user.update({
    where: { email: 'admin@qrcafe.dev' },
    data: { password: adminHash },
  });

  // 2. Kitchen Staff & Head Chef -> chef33
  const chefHash = await bcrypt.hash('chef33', 10);
  const kitchenStaff = await prisma.user.update({
    where: { email: 'kitchen@qrcafe.dev' },
    data: { password: chefHash },
  });
  const headChef = await prisma.user.update({
    where: { email: 'kitchen@qrcafe.com' },
    data: { password: chefHash },
  });

  // Verify
  const adminValid = await bcrypt.compare('admin22', admin.password);
  const kitchenStaffValid = await bcrypt.compare('chef33', kitchenStaff.password);
  const headChefValid = await bcrypt.compare('chef33', headChef.password);

  console.log(`[UPDATED] ${admin.name} (${admin.email}) -> Password: "admin22" | Verified: ${adminValid}`);
  console.log(`[UPDATED] ${kitchenStaff.name} (${kitchenStaff.email}) -> Password: "chef33" | Verified: ${kitchenStaffValid}`);
  console.log(`[UPDATED] ${headChef.name} (${headChef.email}) -> Password: "chef33" | Verified: ${headChefValid}`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
