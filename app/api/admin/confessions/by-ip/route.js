import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Confession from '@/models/Confession';

export async function DELETE(request) {
  try {
    const { ip } = await request.json();
    if (!ip) {
      return NextResponse.json({ error: 'IP is required' }, { status: 400 });
    }

    await dbConnect();
    const result = await Confession.deleteMany({ ipAddress: ip });

    return NextResponse.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Failed to delete confessions by IP:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
