import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // ንደሓንነት Vercel Cron ጥራይ ምዃኑ ንምርግጋጽ
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // In production, enforce CRON_SECRET if configured
  if (process.env.NODE_ENV === 'production' && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } else if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. መጀመርታ ናቶም OrderItems ድምሰስ
    const deletedItems = await db.orderItem.deleteMany({
      where: {
        order: {
          createdAt: { lt: thirtyDaysAgo },
        },
      },
    });

    // 2. ድሕሪኡ ነቶም ናይ 30 መዓልቲ ኣረገውቲ Orders ድምሰስ
    const deletedOrders = await db.order.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedOrders.count} old orders and ${deletedItems.count} order items.`,
      deletedOrders: deletedOrders.count,
      deletedItems: deletedItems.count,
    });
  } catch (error) {
    console.error('Error in cron cleanup route:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
