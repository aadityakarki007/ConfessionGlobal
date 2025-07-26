// app/api/admin/auth/login/route.js //
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'aaditya12';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD; // Temporary fallback
const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request) {
    try {
        const { username, password } = await request.json();

        console.log('\n=== LOGIN ATTEMPT ===');
        console.log('Username received:', username);
        console.log('Password received:', password ? '[HIDDEN]' : 'EMPTY');
        console.log('Environment loaded:', {
            hasUsername: !!ADMIN_USERNAME,
            hasPasswordHash: !!ADMIN_PASSWORD_HASH,
            hasPasswordPlain: !!ADMIN_PASSWORD,
            hasJWT: !!JWT_SECRET
        });

        if (!username || !password) {
            console.log('❌ Missing credentials');
            return NextResponse.json(
                { error: 'Username and password are required' },
                { status: 400 }
            );
        }

        // Check username
        if (username !== ADMIN_USERNAME) {
            console.log('❌ Username mismatch');
            console.log('Expected:', ADMIN_USERNAME);
            console.log('Received:', username);
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Check password
        let isValidPassword = false;
        
        if (ADMIN_PASSWORD_HASH) {
            console.log('✓ Testing with bcrypt hash...');
            isValidPassword = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
            console.log('Hash validation result:', isValidPassword);
        }
        
        // Fallback to plain text if hash fails or doesn't exist
        if (!isValidPassword && ADMIN_PASSWORD) {
            console.log('✓ Testing with plain text password...');
            isValidPassword = password === ADMIN_PASSWORD;
            console.log('Plain text validation result:', isValidPassword);
        }

        if (!isValidPassword) {
            console.log('❌ Password validation failed');
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Create JWT token
        console.log('✓ Creating JWT token...');
        const token = jwt.sign(
            { 
                username: ADMIN_USERNAME,
                role: 'admin',
                iat: Math.floor(Date.now() / 1000)
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Create response with cookie
        const response = NextResponse.json({ 
            success: true,
            message: 'Login successful' 
        });

        response.cookies.set('admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60, // 24 hours
            path: '/'
        });

        console.log('✅ Login successful');
        console.log('====================\n');

        return response;

    } catch (error) {
        console.error('❌ Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}