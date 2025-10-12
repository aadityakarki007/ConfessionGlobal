// app/api/admin/banned-users/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BannedIP from '@/models/BannedIP';
import { withAdminAuth } from '@/lib/auth';

async function handler(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Query for active bans only, or all bans
    const query = includeInactive ? {} : { active: true };

    const bans = await BannedIP.find(query)
      .sort({ bannedAt: -1 })
      .limit(200);

    // Format the response with useful info
    const formattedBans = bans.map(ban => ({
      _id: ban._id,
      ip: ban.ip || 'N/A',
      hasFingerprint: !!ban.fingerprint,
      hasTrackingId: !!ban.trackingId,
      hasLocalStorageId: !!ban.localStorageId,
      reason: ban.reason,
      notes: ban.notes,
      bannedBy: ban.bannedBy,
      bannedAt: ban.bannedAt,
      active: ban.active,
      expiresAt: ban.expiresAt,
      // Show protection level (how many identifiers are banned)
      protectionLevel: [
        ban.ip,
        ban.fingerprint,
        ban.trackingId,
        ban.localStorageId
      ].filter(Boolean).length
    }));

    return NextResponse.json({
      success: true,
      count: formattedBans.length,
      bans: formattedBans
    });

  } catch (error) {
    console.error('Error fetching banned users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withAdminAuth(handler);