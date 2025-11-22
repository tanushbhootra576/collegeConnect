import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Resource from '@/models/Resource';
import User from '@/models/User';
import { validateContent } from '@/lib/moderation';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');
        const branch = searchParams.get('branch');
        const search = searchParams.get('search');
        const uploaderId = searchParams.get('uploaderId');
        const year = searchParams.get('year');

        let query: any = {};

        if (type) {
            // Type filtering is complex in new schema, ignoring for now or implementing basic check
        }
        if (branch) query.branch = branch;
        if (year) {
            if (year.includes(',')) {
                const years = year.split(',').map(y => parseInt(y.trim())).filter(n => !isNaN(n));
                if (years.length > 0) {
                    query.year = { $in: years };
                }
            } else {
                const y = parseInt(year);
                if (!isNaN(y)) query.year = y;
            }
        }
        if (uploaderId && /^[a-fA-F0-9]{24}$/.test(uploaderId)) query.uploaderId = uploaderId;
        if (search) {
            query.$or = [
                { courseName: { $regex: search, $options: 'i' } },
                { courseCode: { $regex: search, $options: 'i' } },
            ];
        }

        const resources = await Resource.find(query).populate('uploaderId', 'name').sort({ createdAt: -1 }).lean();
        return NextResponse.json({ resources });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();
        // Again, assuming client sends valid userId for prototype speed.

        // Moderation check
        try {
            await validateContent(body.title, 'title');
            await validateContent(body.description, 'description');
        } catch (modError: any) {
            return NextResponse.json({ error: modError.message }, { status: 400 });
        }

        const resource = await Resource.create(body);
        return NextResponse.json({ resource }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
