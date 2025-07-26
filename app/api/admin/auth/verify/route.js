// app/api/admin/auth/verify/route.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key-change-this';

export async function GET(request) {
    try {
        const token = request.cookies.get('admin_token')?.value;

        if (!token) {
            return NextResponse.json(
                { error: 'No token provided' },
                { status: 401 }
            );
        }

        // Verify JWT token
        const decoded = jwt.verify(token, JWT_SECRET);

        if (decoded.role !== 'admin') {
            return NextResponse.json(
                { error: 'Invalid role' },
                { status: 403 }
            );
        }

        return NextResponse.json({ 
            success: true,
            user: {
                username: decoded.username,
                role: decoded.role
            }
        });

    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        console.error('Auth verification error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}