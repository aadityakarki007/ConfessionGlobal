import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Confession from '@/models/Confession';
import { withAdminAuth } from '@/lib/auth';
import { decodeHtmlEntities } from '@/utils/htmlDecoder';

async function handler(request) {
  try {
    await dbConnect();

    const confessions = await Confession.find({})
      .sort({ createdAt: -1 })
      .lean();

    const decodedConfessions = confessions.map(confession => ({
      ...confession,
      content: decodeHtmlEntities(confession.content)
    }));

    return NextResponse.json(decodedConfessions);

  } catch (error) {
    console.error('Error fetching confessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Wrap with admin auth and export as GET
export const GET = withAdminAuth(handler);
