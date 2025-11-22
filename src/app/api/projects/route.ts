import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';
import { validateContent } from '@/lib/moderation';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const memberId = searchParams.get('memberId');
        const query: any = {};
        if (memberId && /^[a-fA-F0-9]{24}$/.test(memberId)) {
            query.teamMembers = memberId;
        }
        const projects = await Project.find(query)
            .sort({ isFeatured: -1, createdAt: -1 })
            .populate('teamMembers', 'firebaseUid name email')
            .lean();
        return NextResponse.json({ projects });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        // Moderation check
        try {
            await validateContent(body.title, 'title');
            await validateContent(body.description, 'description');
        } catch (modError: any) {
            return NextResponse.json({ error: modError.message }, { status: 400 });
        }

        const project = await Project.create(body);
        return NextResponse.json({ project }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
