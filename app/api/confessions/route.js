// app/api/confessions/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Confession from '@/models/Confession';
import BannedIP from '@/models/BannedIP';

export async function POST(request) {
  try {
    const { content, category, trackingData } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Confession content is required' },
        { status: 400 }
      );
    }

    if (content.length > 1500) {
      return NextResponse.json(
        { error: 'Confession is too long (max 1500 characters)' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Get client IP and user agent
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded
      ? forwarded.split(',')[0].trim()
      : request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Extract tracking data
    const fingerprint = trackingData?.fingerprint || null;
    const trackingId = trackingData?.trackingId || null;
    const localStorageId = trackingData?.localStorageId || null;

    // === MULTI-LAYER BAN CHECK ===
    
    // 1. Check if IP is banned
    const bannedByIP = await BannedIP.findOne({ ip });
    if (bannedByIP) {
      return NextResponse.json(
        { error: 'You are banned from submitting confessions.' },
        { status: 403 }
      );
    }

    // 2. Check if fingerprint is banned
    if (fingerprint) {
      const bannedByFingerprint = await BannedIP.findOne({ fingerprint });
      if (bannedByFingerprint) {
        return NextResponse.json(
          { error: 'You are banned from submitting confessions.' },
          { status: 403 }
        );
      }
    }

    // 3. Check if tracking ID (cookie) is banned
    if (trackingId) {
      const bannedByTrackingId = await BannedIP.findOne({ trackingId });
      if (bannedByTrackingId) {
        return NextResponse.json(
          { error: 'You are banned from submitting confessions.' },
          { status: 403 }
        );
      }
    }

    // 4. Check if localStorage ID is banned
    if (localStorageId) {
      const bannedByLocalStorage = await BannedIP.findOne({ localStorageId });
      if (bannedByLocalStorage) {
        return NextResponse.json(
          { error: 'You are banned from submitting confessions.' },
          { status: 403 }
        );
      }
    }

    // === MULTI-LAYER RATE LIMITING ===
    const RATE_LIMIT_MAX = 15; // Max confessions per hour
    const RATE_LIMIT_WINDOW_HOURS = 1;
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000);

    // Build OR query to check rate limit across all identifiers
    const rateLimitQuery = {
      createdAt: { $gte: windowStart },
      $or: []
    };

    // Add IP to rate limit check
    rateLimitQuery.$or.push({ ipAddress: ip });

    // Add fingerprint to rate limit check
    if (fingerprint) {
      rateLimitQuery.$or.push({ fingerprint });
    }

    // Add tracking ID to rate limit check
    if (trackingId) {
      rateLimitQuery.$or.push({ trackingId });
    }

    // Add localStorage ID to rate limit check
    if (localStorageId) {
      rateLimitQuery.$or.push({ localStorageId });
    }

    // Check rate limit across all identifiers
    if (rateLimitQuery.$or.length > 0) {
      const recentCount = await Confession.countDocuments(rateLimitQuery);
      if (recentCount >= RATE_LIMIT_MAX) {
        return NextResponse.json(
          { error: `Rate limit exceeded: Only ${RATE_LIMIT_MAX} confessions allowed per hour.` },
          { status: 429 }
        );
      }
    }

    // === STORE CONFESSION WITH ALL TRACKING DATA ===
    const confession = await Confession.create({
      content: content.trim(),
      category: category || 'other',
      ipAddress: ip,
      userAgent,
      fingerprint,
      trackingId,
      localStorageId,
      hasLocalStorage: trackingData?.hasLocalStorage || false,
      trackingTimestamp: trackingData?.timestamp || Date.now()
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