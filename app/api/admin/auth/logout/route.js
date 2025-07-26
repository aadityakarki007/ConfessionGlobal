// app/api/admin/auth/logout/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const response = NextResponse.json({ 
            success: true,
            message: 'Logged out successfully' 
        });

        // Clear the HTTP-only cookie
        response.cookies.set('admin_token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 0, // Expire immediately
            path: '/'
        });

        return response;

    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { error: 'Error during logout' },
            { status: 500 }
        );
    }
}