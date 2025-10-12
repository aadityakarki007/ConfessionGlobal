// app/api/admin/unban/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BannedIP from '@/models/BannedIP';
import { withAdminAuth } from '@/lib/auth';

async function handler(request) {
  try {
    const { banId, ip } = await request.json();

    if (!banId && !ip) {
      return NextResponse.json(
        { error: 'Ban ID or IP address is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    let result;

    // Unban by ban ID
    if (banId) {
      result = await BannedIP.findByIdAndUpdate(
        banId,
        { active: false },
        { new: true }
      );
    } 
    // Unban by IP
    else if (ip) {
      result = await BannedIP.findOneAndUpdate(
        { ip, active: true },
        { active: false },
        { new: true }
      );
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Ban not found or already inactive' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User unbanned successfully'
    });

  } catch (error) {
    console.error('Error unbanning user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withAdminAuth(handler);