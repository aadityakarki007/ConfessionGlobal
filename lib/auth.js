// lib/auth.js
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key-change-this';

export function verifyAdminAuth(request) {
    try {
        const token = request.cookies.get('admin_token')?.value;

        if (!token) {
            return { error: 'No token provided', status: 401 };
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        if (decoded.role !== 'admin') {
            return { error: 'Insufficient permissions', status: 403 };
        }

        return { user: decoded };

    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return { error: 'Invalid or expired token', status: 401 };
        }
        return { error: 'Authentication error', status: 500 };
    }
}

// Middleware wrapper for API routes
export function withAdminAuth(handler) {
    return async (request, ...args) => {
        const authResult = verifyAdminAuth(request);
        
        if (authResult.error) {
            return NextResponse.json(
                { error: authResult.error },
                { status: authResult.status }
            );
        }

        // Add user info to request
        request.user = authResult.user;
        return handler(request, ...args);
    };
}