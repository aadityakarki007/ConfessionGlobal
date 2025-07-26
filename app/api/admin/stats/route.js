// app/api/admin/stats/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Confession from '@/models/Confession';
import { withAdminAuth } from '@/lib/auth';

async function handler(request) {
  try {
    await dbConnect();

    const total = await Confession.countDocuments();
    const unread = await Confession.countDocuments({ isRead: false });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCount = await Confession.countDocuments({
      createdAt: { $gte: today }
    });

    return NextResponse.json({
      total,
      unread,
      today: todayCount
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAdminAuth(handler);
