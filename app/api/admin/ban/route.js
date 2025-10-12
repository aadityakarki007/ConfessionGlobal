// app/api/admin/ban/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BannedIP from '@/models/BannedIP';
import Confession from '@/models/Confession';
import { withAdminAuth } from '@/lib/auth';

async function handler(request) {
  try {
    const body = await request.json();
    const { ip, confessionId, reason, notes } = body;

    await dbConnect();

    // If banning by confession ID, get all tracking data
    if (confessionId) {
      const confession = await Confession.findById(confessionId);
      
      if (!confession) {
        return NextResponse.json(
          { error: 'Confession not found' },
          { status: 404 }
        );
      }

      // Check if already banned by any identifier
      const existingBan = await BannedIP.findOne({
        $or: [
          { ip: confession.ipAddress },
          { fingerprint: confession.fingerprint },
          { trackingId: confession.trackingId },
          { localStorageId: confession.localStorageId },
        ]
      });

      if (existingBan) {
        return NextResponse.json(
          { error: 'User is already banned' },
          { status: 400 }
        );
      }

      // Create comprehensive ban with ALL identifiers
      const banData = {
        ip: confession.ipAddress,
        reason: reason || 'Spam/Abuse',
        notes: notes || `Banned from confession: ${confession.content.substring(0, 50)}...`,
        bannedBy: 'admin',
        active: true,
      };

      // Add optional tracking identifiers if they exist
      if (confession.fingerprint) {
        banData.fingerprint = confession.fingerprint;
      }
      if (confession.trackingId) {
        banData.trackingId = confession.trackingId;
      }
      if (confession.localStorageId) {
        banData.localStorageId = confession.localStorageId;
      }

      const banned = await BannedIP.create(banData);

      // 🔥 AUTO-DELETE ALL CONFESSIONS FROM THIS USER
      const deleteQuery = {
        $or: [
          { ipAddress: confession.ipAddress },
          confession.fingerprint ? { fingerprint: confession.fingerprint } : null,
          confession.trackingId ? { trackingId: confession.trackingId } : null,
          confession.localStorageId ? { localStorageId: confession.localStorageId } : null,
        ].filter(Boolean) // Remove null values
      };

      const deleteResult = await Confession.deleteMany(deleteQuery);

      return NextResponse.json({
        success: true,
        message: `User banned successfully. ${deleteResult.deletedCount} confession(s) deleted.`,
        banned: {
          ip: banned.ip,
          hasFingerprint: !!banned.fingerprint,
          hasTrackingId: !!banned.trackingId,
          hasLocalStorageId: !!banned.localStorageId,
        },
        deletedCount: deleteResult.deletedCount // Add deletion count
      });
    }

    // Original IP-only ban (for backward compatibility)
    if (ip) {
      const existing = await BannedIP.findOne({ ip });
      if (existing) {
        return NextResponse.json(
          { error: 'IP is already banned' },
          { status: 400 }
        );
      }

      const banned = await BannedIP.create({ 
        ip,
        reason: reason || 'Manual IP ban',
        notes: notes || '',
        bannedBy: 'admin',
        active: true,
      });

      // Also delete confessions by IP only
      const deleteResult = await Confession.deleteMany({ ipAddress: ip });

      return NextResponse.json({
        success: true,
        message: `IP ${ip} has been banned. ${deleteResult.deletedCount} confession(s) deleted.`,
        deletedCount: deleteResult.deletedCount
      });
    }

    // No valid input provided
    return NextResponse.json(
      { error: 'Either IP address or confession ID is required' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error banning user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withAdminAuth(handler);