import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Resource from '@/models/Resource';
import User from '@/models/User'; // Ensure User model is registered

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        
        // In a real app, you would verify the user is an admin here.
        // For this demo, we'll assume the route is protected or open for the "admin" user.

        const query = {
            $or: [
                { isApproved: false },
                { "syllabus.isApproved": false },
                { "modules.isApproved": false },
                { "pyqs.isApproved": false },
                { "others.isApproved": false }
            ]
        };

        const resources = await Resource.find(query).populate('uploaderId', 'name email').lean();

        return NextResponse.json({ resources });
    } catch (error) {
        console.error('Admin fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
