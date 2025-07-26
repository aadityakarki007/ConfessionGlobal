// app/api/admin/confessions/[id]/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Confession from '@/models/Confession';
import { withAdminAuth } from '@/lib/auth';

async function patchHandler(request, { params }) {
  try {
    const { id } = params;
    const { isRead } = await request.json();

    await dbConnect();

    const confession = await Confession.findByIdAndUpdate(
      id,
      { isRead },
      { new: true }
    );

    if (!confession) {
      return NextResponse.json(
        { error: 'Confession not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(confession);

  } catch (error) {
    console.error('Error updating confession:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function deleteHandler(request, { params }) {
  try {
    const { id } = params;

    await dbConnect();

    const confession = await Confession.findByIdAndDelete(id);

    if (!confession) {
      return NextResponse.json(
        { error: 'Confession not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting confession:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const PATCH = withAdminAuth(patchHandler);
export const DELETE = withAdminAuth(deleteHandler);
