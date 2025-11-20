import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

// List / search users
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search');
        const branch = searchParams.get('branch');
        const year = searchParams.get('year');
        const skill = searchParams.get('skill');
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

        type UserQuery = {
            branch?: string;
            year?: number;
            skills?: { $regex: string; $options: string };
            $or?: Array<Record<string, { $regex: string; $options: string }>>;
        };
        const query: UserQuery = {};
        if (branch) query.branch = branch;
        if (year) query.year = parseInt(year, 10);
        if (skill) query.skills = { $regex: skill, $options: 'i' };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { branch: { $regex: search, $options: 'i' } },
                { interests: { $regex: search, $options: 'i' } },
                { skills: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            User.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('firebaseUid name email branch year skills interests role'),
            User.countDocuments(query),
        ]);

        return NextResponse.json({
            users,
            page,
            total,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Error listing users:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Sync / create user (called after auth sign-in)
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();
        const { firebaseUid, email, name } = body;

        if (!firebaseUid || !email || !name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let user = await User.findOne({ firebaseUid });

        if (!user) {
            user = await User.create({
                firebaseUid,
                email,
                name,
                role: 'student',
                skills: [],
                interests: [],
            });
        }

        return NextResponse.json({ user }, { status: 201 });
    } catch (error) {
        console.error('Error syncing user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
