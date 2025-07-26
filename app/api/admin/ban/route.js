// app/api/admin/ban/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BannedIP from '@/models/BannedIP';
import { withAdminAuth } from '@/lib/auth';

async function handler(request) {
  try {
    const { ip } = await request.json();

    if (!ip) {
      return NextResponse.json(
        { error: 'IP address is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    const existing = await BannedIP.findOne({ ip });
    if (existing) {
      return NextResponse.json(
        { error: 'IP is already banned' },
        { status: 400 }
      );
    }

    const banned = new BannedIP({ ip });
    await banned.save();

    return NextResponse.json({
      success: true,
      message: `IP ${ip} has been banned`
    });
  } catch (error) {
    console.error('Error banning IP:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withAdminAuth(handler);
