import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getAuth } from '@clerk/nextjs/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key-change-this';

export async function GET(request) {
  try {
    // 1️⃣ Get the Clerk session/user
    const { userId, sessionId } = getAuth(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'Not signed in via Clerk' },
        { status: 401 }
      );
    }

    // 2️⃣ Optional: Check Clerk roles if you store roles in metadata
    // Example: Only allow users with "confess" role
    const role = request.cookies.get('user_role')?.value; // or fetch from your DB
    if (role !== 'confess') {
      return NextResponse.json(
        { error: 'Unauthorized: role missing' },
        { status: 403 }
      );
    }

    // 3️⃣ Get your JWT token from cookies
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // 4️⃣ Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 403 });
    }

    // ✅ Success
    return NextResponse.json({
      success: true,
      clerkUserId: userId,
      user: {
        username: decoded.username,
        role: decoded.role,
      },
    });
  } catch (error) {
    console.error('Auth verification error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
