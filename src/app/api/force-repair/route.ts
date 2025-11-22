import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import mongoose, { Schema } from 'mongoose';

// Force delete the model from cache to ensure we use the latest schema
if (mongoose.models.Resource) {
    delete mongoose.models.Resource;
}

const ResourceSchema = new Schema({
    uploaderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ['PYQ', 'NOTES', 'LINK', 'OTHER'], required: true },
    courseCode: { type: String },
    branch: { type: String },
    semester: { type: Number },
    year: { type: Number }, // Explicitly defined
    fileUrl: { type: String },
    linkUrl: { type: String },
    downloads: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

const Resource = mongoose.model('Resource', ResourceSchema);

const year1Codes = [
  'BCHY101L', 'BECE102L', 'BECE201L', 'BECE203L', 'BEEE102L', 
  'BENG101L', 'BMAT101L', 'BMAT102L', 'BPHY101L'
];

export async function GET() {
    try {
        await dbConnect();
        
        const resources = await Resource.find({});
        let updatedCount = 0;

        for (const r of resources) {
            let newYear = 2; 
            
            if (r.courseCode && year1Codes.includes(r.courseCode)) {
                newYear = 1;
            } else if (r.courseCode) {
                const match = r.courseCode.match(/\d/);
                if (match) {
                    const digit = parseInt(match[0]);
                    if (digit >= 1 && digit <= 4) {
                        newYear = digit;
                    }
                }
            }

            // Use updateOne directly on the model to bypass any document validation weirdness
            await Resource.updateOne(
                { _id: r._id },
                { $set: { year: newYear, semester: newYear * 2 - 1 } }
            );
            updatedCount++;
        }

        // Verify
        const countWithYear = await Resource.countDocuments({ year: { $exists: true } });

        return NextResponse.json({ 
            success: true, 
            updated: updatedCount,
            countWithYear,
            message: "Model cache cleared and updates applied"
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
