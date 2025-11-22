import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Message from '@/models/Message';
import User from '@/models/User';
import { validateContent } from '@/lib/moderation';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');
        const branch = searchParams.get('branch');
        const year = searchParams.get('year');

        if (!type) {
            return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
        }

        const query: any = { type };
        if (type === 'branch') {
            if (!branch) return NextResponse.json({ error: 'Branch required' }, { status: 400 });
            query.branch = branch;
        }
        if (type === 'year') {
            if (!year) return NextResponse.json({ error: 'Year required' }, { status: 400 });
            query.year = Number(year);
        }

        const messages = await Message.find(query)
            .sort({ createdAt: 1 }) // Oldest first
            .limit(100); // Limit to last 100 messages

        return NextResponse.json({ messages }, { status: 200 });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();
        const { content, senderId, type, branch, year } = body;

        if (!content || !senderId || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify sender exists and get name
        const sender = await User.findById(senderId);
        if (!sender) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Moderation check
        try {
            await validateContent(content, 'message');
        } catch (modError: any) {
            return NextResponse.json({ error: modError.message }, { status: 400 });
        }

        // Verify branch/year match
        if (type === 'branch') {
            if (!branch) return NextResponse.json({ error: 'Branch is required' }, { status: 400 });
            // Allow if sender.branch is missing (legacy users) or matches
            if (sender.branch && sender.branch !== branch) {
                return NextResponse.json({ error: 'Wrong branch' }, { status: 403 });
            }
        }
        if (type === 'year') {
            if (!year) return NextResponse.json({ error: 'Year is required' }, { status: 400 });
            
            // Allow if sender.year is missing (legacy users) or matches
            if (sender.year && Number(sender.year) !== Number(year)) {
                return NextResponse.json({ error: `Wrong year. You are in Year ${sender.year}, but trying to post to Year ${year}` }, { status: 403 });
            }
        }

        const message = await Message.create({
            content,
            senderId,
            senderName: sender.name,
            type,
            branch: type === 'branch' ? branch : undefined,
            year: type === 'year' ? year : undefined,
        });

        return NextResponse.json({ message }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating message:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
