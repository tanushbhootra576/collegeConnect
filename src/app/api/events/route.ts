import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Event from '@/models/Event';
import User from '@/models/User';

import { validateContent } from '@/lib/moderation';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const events = await Event.find().sort({ date: 1 }); // Upcoming first
        return NextResponse.json({ events });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        // RBAC Check
        const user = await User.findById(body.organizerId);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
        }

        // Moderation check
        try {
            await validateContent(body.title, 'title');
            await validateContent(body.description, 'description');
        } catch (modError: any) {
            return NextResponse.json({ error: modError.message }, { status: 400 });
        }

        const event = await Event.create(body);
        return NextResponse.json({ event }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
