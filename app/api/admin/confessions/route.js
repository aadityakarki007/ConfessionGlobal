// app/api/admin/confessions/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Confession from '@/models/Confession';
import { withAdminAuth } from '@/lib/auth';

async function handler(request) {
  try {
    await dbConnect();

    const confessions = await Confession.find({})
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(confessions);

  } catch (error) {
    console.error('Error fetching confessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAdminAuth(handler);
