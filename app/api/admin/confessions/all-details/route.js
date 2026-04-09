// app/api/admin/confessions/all-details/route.js
import dbConnect from '@/lib/mongodb';
import Confession from '@/models/Confession';
import { withAdminAuth } from '@/lib/auth';

async function getConfessionsHandler(req) {
  try {
    await dbConnect();

    // Fetch ALL confessions with ALL details
    const confessions = await Confession.find({})
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Found ${confessions.length} confessions in database`);

    // Format response with detailed information
    const detailedConfessions = confessions.map((confession, index) => ({
      position: index + 1,
      _id: confession._id,
      content: confession.content || 'N/A',
      category: confession.category || 'N/A',
      isRead: confession.isRead || false,
      createdAt: new Date(confession.createdAt).toLocaleString(),
      createdAtISO: confession.createdAt,
      updatedAt: confession.updatedAt ? new Date(confession.updatedAt).toLocaleString() : 'N/A',
      ipAddress: confession.ipAddress || 'N/A',
      userAgent: confession.userAgent || 'N/A',
      fingerprint: confession.fingerprint ? `${confession.fingerprint.substring(0, 32)}...` : 'N/A',
      fingerprintFull: confession.fingerprint || 'N/A',
      trackingId: confession.trackingId ? `${confession.trackingId.substring(0, 32)}...` : 'N/A',
      trackingIdFull: confession.trackingId || 'N/A',
      localStorageId: confession.localStorageId ? `${confession.localStorageId.substring(0, 32)}...` : 'N/A',
      localStorageIdFull: confession.localStorageId || 'N/A',
      hasLocalStorage: confession.hasLocalStorage || false,
      trackingTimestamp: confession.trackingTimestamp || 'N/A',
      contentLength: (confession.content || '').length,
    }));

    return Response.json({
      success: true,
      totalConfessions: confessions.length,
      confessions: detailedConfessions,
      summary: {
        read: confessions.filter(c => c.isRead).length,
        unread: confessions.filter(c => !c.isRead).length,
        byCategory: {
          love: confessions.filter(c => c.category === 'love').length,
          work: confessions.filter(c => c.category === 'work').length,
          family: confessions.filter(c => c.category === 'family').length,
          friendship: confessions.filter(c => c.category === 'friendship').length,
          personal: confessions.filter(c => c.category === 'personal').length,
          other: confessions.filter(c => c.category === 'other').length,
        }
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching confessions:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export const GET = withAdminAuth(getConfessionsHandler);
