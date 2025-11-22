import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Report from '@/models/Report';
import User from '@/models/User';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();
        const { reporterId, targetType, targetId, reason, description } = body;

        if (!reporterId || !targetType || !targetId || !reason) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify reporter exists
        const reporter = await User.findById(reporterId);
        if (!reporter) {
            // Try finding by firebaseUid if not ObjectId
            const reporterByUid = await User.findOne({ firebaseUid: reporterId });
            if (!reporterByUid) {
                 return NextResponse.json({ error: 'Reporter not found' }, { status: 404 });
            }
        }

        const report = await Report.create({
            reporterId,
            targetType,
            targetId,
            reason,
            description
        });

        return NextResponse.json({ report }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating report:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
