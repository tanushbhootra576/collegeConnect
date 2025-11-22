import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SkillListing from '@/models/SkillListing';
import User from '@/models/User';
import { validateContent } from '@/lib/moderation';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');
        const category = searchParams.get('category');
        const search = searchParams.get('search');
        const userId = searchParams.get('userId');

        let query: any = {};

        // If userId is provided, we return all skills (OPEN and CLOSED) so they appear on profile
        // If no userId (main feed), we only show OPEN skills
        if (!userId) {
            query.status = 'OPEN';
        }

        if (type) query.type = type;
        if (category) query.category = category;
        if (userId && /^[a-fA-F0-9]{24}$/.test(userId)) query.userId = userId;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } },
            ];
        }

        const skills = await SkillListing.find(query).populate('userId', 'name email branch year').sort({ createdAt: -1 }).lean();
        return NextResponse.json({ skills });
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
            if (body.tags && Array.isArray(body.tags)) {
                for (const tag of body.tags) {
                    await validateContent(tag, 'tag');
                }
            }
        } catch (modError: any) {
            return NextResponse.json({ error: modError.message }, { status: 400 });
        }

        // In a real app, we would verify the user from the session/token here.
        // For this prototype, we'll assume the client sends the correct userId or we'd use a middleware.
        // To keep it simple and fast, we will trust the client-sent userId for now, 
        // BUT strictly we should verify the Firebase token. 
        // Let's implement basic token verification later if needed.

        const skill = await SkillListing.create(body);
        return NextResponse.json({ skill }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
