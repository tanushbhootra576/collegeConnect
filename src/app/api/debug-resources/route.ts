import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Resource from '@/models/Resource';

export async function GET() {
    try {
        await dbConnect();
        
        // 1. Get a sample to see if 'year' exists
        const sample = await Resource.findOne({}).lean();
        
        // 2. Count how many have 'year'
        const countWithYear = await Resource.countDocuments({ year: { $exists: true } });
        const total = await Resource.countDocuments({});

        // 3. Try to update one document to see if it works
        let updateResult = null;
        if (sample) {
             updateResult = await Resource.updateOne(
                 { _id: sample._id },
                 { $set: { year: 99 } } // Temporary test value
             );
        }
        
        const sampleAfter = await Resource.findOne({ _id: sample?._id }).lean();

        return NextResponse.json({
            total,
            countWithYear,
            sampleBefore: sample,
            updateResult,
            sampleAfter
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
