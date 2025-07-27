// app/api/admin/confessions/[id]/archive/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Confession from '@/models/Confession';
import { verifyAdminAuth } from '@/lib/auth';


// Archive a confession
export async function PATCH(request, { params }) {
    try {
        // Verify admin authentication
        const authResult = verifyAdminAuth(request);
        if (!authResult.success) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await connectDB();
        
        const { id } = params;
        const body = await request.json();
        const { isArchived } = body;

        // Find and update the confession
        const confession = await Confession.findByIdAndUpdate(
            id,
            { 
                isArchived: isArchived,
                archivedAt: isArchived ? new Date() : null
            },
            { new: true }
        );

        if (!confession) {
            return NextResponse.json(
                { error: 'Confession not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ 
            success: true, 
            confession,
            message: isArchived ? 'Confession archived successfully' : 'Confession unarchived successfully'
        });

    } catch (error) {
        console.error('Archive/Unarchive error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}