import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BannedIP from '@/models/BannedIP';

export async function POST(request) {
  try {
    const { ip } = await request.json();

    if (!ip) {
      return NextResponse.json({ error: 'IP address is required' }, { status: 400 });
    }

    await dbConnect();

    // Check if IP is already banned
    const existing = await BannedIP.findOne({ ip });
    if (existing) {
      return NextResponse.json({ error: 'IP is already banned' }, { status: 400 });
    }

    // Add to banned IPs
    const banned = new BannedIP({ ip });
    await banned.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to ban IP:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
