import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // 1. Clean up existing records (reverse dependency order)
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.table.deleteMany()
  await prisma.user.deleteMany()

  // 2. Demo Users
  const defaultPassword = process.env.SEED_ADMIN_PASSWORD || 'joss5501'
  const hashedPassword = await bcrypt.hash(defaultPassword, 10)

  const staffUsers = [
    { name: 'Cafe Admin', email: 'admin@qrcafe.dev', role: 'ADMIN' as const },
    { name: 'Cafe Admin (Owner)', email: 'admin@qrcafe.com', role: 'ADMIN' as const },
    { name: 'Kitchen Staff', email: 'kitchen@qrcafe.dev', role: 'KITCHEN' as const },
    { name: 'Head Chef Marco', email: 'kitchen@qrcafe.com', role: 'KITCHEN' as const },
    { name: 'Cook Sarah', email: 'linecook@qrcafe.com', role: 'KITCHEN' as const },
    { name: 'Juice Master Leo', email: 'juice@qrcafe.dev', role: 'JUICE_MAKER' as const },
    { name: 'Head Waiter Alex', email: 'waiter@qrcafe.dev', role: 'WAITER' as const },
  ]

  for (const user of staffUsers) {
    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role,
      },
    })
  }

  console.log(`👤 Seeded ${staffUsers.length} staff users with password "${defaultPassword}"`)

  // 3. Categories
  const categoriesData = [
    { name: 'Burgers', slug: 'burgers', emoji: '🍔', sortOrder: 1 },
    { name: 'Pizza', slug: 'pizza', emoji: '🍕', sortOrder: 2 },
    { name: 'Drinks', slug: 'drinks', emoji: '🥤', sortOrder: 3 },
    { name: 'Coffee', slug: 'coffee', emoji: '☕', sortOrder: 4 },
    { name: 'Desserts', slug: 'desserts', emoji: '🍰', sortOrder: 5 },
  ]

  const createdCategories: Record<string, string> = {}

  for (const cat of categoriesData) {
    const record = await prisma.category.create({
      data: cat,
    })
    createdCategories[cat.slug] = record.id
  }

  console.log(`📂 Categories seeded: ${Object.keys(createdCategories).length}`)

  // 4. Products
  const productsData = [
    // Burgers
    {
      name: 'Beef Burger',
      description: 'Juicy 100% Angus beef patty with fresh lettuce, cheddar cheese, ripe tomato, and house relish.',
      price: 11.99,
      categorySlug: 'burgers',
    },
    {
      name: 'Chicken Burger',
      description: 'Crispy fried chicken breast fillet topped with creamy coleslaw, spicy mayo, and pickles.',
      price: 10.99,
      categorySlug: 'burgers',
    },
    {
      name: 'Veggie Truffle Burger',
      description: 'Plant-based artisan patty with sautéed mushrooms, melted provolone, and truffle aioli.',
      price: 12.49,
      categorySlug: 'burgers',
    },

    // Pizza
    {
      name: 'Margherita Pizza',
      description: 'Classic Neapolitan style pizza with San Marzano tomato sauce, fresh buffalo mozzarella, and basil.',
      price: 13.5,
      categorySlug: 'pizza',
    },
    {
      name: 'Pepperoni Supreme Pizza',
      description: 'Crispy artisan crust loaded with cured pepperoni, spicy chili flakes, and shredded mozzarella.',
      price: 15.99,
      categorySlug: 'pizza',
    },
    {
      name: 'Truffle & Mushroom Pizza',
      description: 'White base pizza with wild woodland mushrooms, creamy fior di latte, and aromatic white truffle oil.',
      price: 16.5,
      categorySlug: 'pizza',
    },

    // Drinks
    {
      name: 'Coca-Cola',
      description: 'Classic ice-cold Coca-Cola served with lemon slice and fresh mint leaves.',
      price: 2.99,
      categorySlug: 'drinks',
    },
    {
      name: 'Fresh Orange Juice',
      description: '100% pure freshly squeezed Valencia oranges served chilled.',
      price: 4.5,
      categorySlug: 'drinks',
    },
    {
      name: 'Sparkling Mineral Water',
      description: 'Chilled premium sparkling water with lime wedge.',
      price: 3.0,
      categorySlug: 'drinks',
    },

    // Coffee
    {
      name: 'Cappuccino',
      description: 'Rich double espresso topped with silky smooth microfoam and a dusting of cocoa.',
      price: 4.25,
      categorySlug: 'coffee',
    },
    {
      name: 'Espresso',
      description: 'Pure double shot of specialty Arabica blend roasted to perfection.',
      price: 3.25,
      categorySlug: 'coffee',
    },
    {
      name: 'Iced Caramel Latte',
      description: 'Espresso poured over chilled oat milk, Madagascar vanilla, and drizzled with artisan caramel.',
      price: 5.25,
      categorySlug: 'coffee',
    },

    // Desserts
    {
      name: 'Chocolate Cake',
      description: 'Decadent multi-layered Belgian dark chocolate fudge cake with ganache frosting.',
      price: 6.99,
      categorySlug: 'desserts',
    },
    {
      name: 'New York Cheesecake',
      description: 'Creamy classic baked cheesecake served with a raspberry coulis drizzle.',
      price: 6.5,
      categorySlug: 'desserts',
    },
    {
      name: 'Tiramisu Classico',
      description: 'Traditional Italian espresso-soaked savoiardi biscuits layered with mascarpone cream.',
      price: 7.25,
      categorySlug: 'desserts',
    },
  ]

  for (const item of productsData) {
    await prisma.product.create({
      data: {
        name: item.name,
        description: item.description,
        price: item.price,
        categoryId: createdCategories[item.categorySlug],
        isAvailable: true,
      },
    })
  }

  console.log(`🍽️ Products seeded: ${productsData.length}`)

  // 5. Tables for QR scanning
  const tablesCount = 8
  for (let i = 1; i <= tablesCount; i++) {
    await prisma.table.create({
      data: {
        number: i,
        isActive: true,
      },
    })
  }

  console.log(`🪑 Tables seeded: ${tablesCount} (Tables 1 through ${tablesCount})`)
  console.log('✨ Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
