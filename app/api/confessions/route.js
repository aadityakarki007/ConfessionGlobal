// app/api/confessions/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Confession from '@/models/Confession';
import BannedIP from '@/models/BannedIP';  // <-- import here

export async function POST(request) {
  try {
    const { content, category } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Confession content is required' },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Confession is too long (max 2000 characters)' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Get client IP and user agent for basic tracking (not for identification)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Check if IP is banned
    const banned = await BannedIP.findOne({ ip });
    if (banned) {
      return NextResponse.json(
        { error: 'You are banned from submitting confessions.' },
        { status: 403 }
      );
    }

    // RATE LIMIT SETTINGS
    const RATE_LIMIT_MAX = 15; // Max confessions per hour
    const RATE_LIMIT_WINDOW_HOURS = 1;
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000);

    // Count confessions from this IP in the time window
    const recentCount = await Confession.countDocuments({
      ipAddress: ip,
      createdAt: { $gte: windowStart }
    });

    if (recentCount >= RATE_LIMIT_MAX) {
      return NextResponse.json(
        { error: `Rate limit exceeded: Only ${RATE_LIMIT_MAX} confessions allowed per hour.` },
        { status: 429 }
      );
    }

    const confession = await Confession.create({
      content: content.trim(),
      category: category || 'other',
      ipAddress: ip,
      userAgent: userAgent
    });

    return NextResponse.json({ success: true, id: confession._id });

  } catch (error) {
    console.error('Error creating confession:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
