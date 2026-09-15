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
    { name: 'Delivery Courier Dawit', email: 'delivery@qrcafe.dev', role: 'DELIVERY' as const },
    { name: 'Delivery Rider Sam', email: 'delivery@qrcafe.com', role: 'DELIVERY' as const },
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
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'Chicken Burger',
      description: 'Crispy fried chicken breast fillet topped with creamy coleslaw, spicy mayo, and pickles.',
      price: 10.99,
      categorySlug: 'burgers',
      imageUrl: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'Veggie Truffle Burger',
      description: 'Plant-based artisan patty with sautéed mushrooms, melted provolone, and truffle aioli.',
      price: 12.49,
      categorySlug: 'burgers',
      imageUrl: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=800&auto=format&fit=crop&q=80',
    },

    // Pizza
    {
      name: 'Margherita Pizza',
      description: 'Classic Neapolitan style pizza with San Marzano tomato sauce, fresh buffalo mozzarella, and basil.',
      price: 13.5,
      categorySlug: 'pizza',
      imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'Pepperoni Supreme Pizza',
      description: 'Crispy artisan crust loaded with cured pepperoni, spicy chili flakes, and shredded mozzarella.',
      price: 15.99,
      categorySlug: 'pizza',
      imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'Truffle & Mushroom Pizza',
      description: 'White base pizza with wild woodland mushrooms, creamy fior di latte, and aromatic white truffle oil.',
      price: 16.5,
      categorySlug: 'pizza',
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
    },

    // Drinks
    {
      name: 'Coca-Cola',
      description: 'Classic ice-cold Coca-Cola served with lemon slice and fresh mint leaves.',
      price: 2.99,
      categorySlug: 'drinks',
      imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'Fresh Orange Juice',
      description: '100% pure freshly squeezed Valencia oranges served chilled.',
      price: 4.5,
      categorySlug: 'drinks',
      imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'Sparkling Mineral Water',
      description: 'Chilled premium sparkling water with lime wedge.',
      price: 3.0,
      categorySlug: 'drinks',
      imageUrl: 'https://images.unsplash.com/photo-1559839914-1b34645a380e?w=800&auto=format&fit=crop&q=80',
    },

    // Coffee
    {
      name: 'Cappuccino',
      description: 'Rich double espresso topped with silky smooth microfoam and a dusting of cocoa.',
      price: 4.25,
      categorySlug: 'coffee',
      imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'Espresso',
      description: 'Pure double shot of specialty Arabica blend roasted to perfection.',
      price: 3.25,
      categorySlug: 'coffee',
      imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'Iced Caramel Latte',
      description: 'Espresso poured over chilled oat milk, Madagascar vanilla, and drizzled with artisan caramel.',
      price: 5.25,
      categorySlug: 'coffee',
      imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&auto=format&fit=crop&q=80',
    },

    // Desserts
    {
      name: 'Chocolate Cake',
      description: 'Decadent multi-layered Belgian dark chocolate fudge cake with ganache frosting.',
      price: 6.99,
      categorySlug: 'desserts',
      imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'New York Cheesecake',
      description: 'Creamy classic baked cheesecake served with a raspberry coulis drizzle.',
      price: 6.5,
      categorySlug: 'desserts',
      imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&auto=format&fit=crop&q=80',
    },
    {
      name: 'Tiramisu Classico',
      description: 'Traditional Italian espresso-soaked savoiardi biscuits layered with mascarpone cream.',
      price: 7.25,
      categorySlug: 'desserts',
      imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&auto=format&fit=crop&q=80',
    },
  ]

  for (const item of productsData) {
    await prisma.product.create({
      data: {
        name: item.name,
        description: item.description,
        price: item.price,
        categoryId: createdCategories[item.categorySlug],
        imageUrl: item.imageUrl,
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
