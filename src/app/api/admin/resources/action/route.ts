import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Resource from '@/models/Resource';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const { resourceId, category, itemId, action } = await req.json();

        if (!resourceId || !category || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const resource = await Resource.findById(resourceId);
        if (!resource) {
            return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
        }

        if (action === 'APPROVE') {
            if (category === 'COURSE') {
                resource.isApproved = true;
            } else if (category === 'SYLLABUS') {
                if (resource.syllabus) resource.syllabus.isApproved = true;
            } else if (category === 'NOTES') {
                const item = resource.modules.find(m => m._id.toString() === itemId);
                if (item) item.isApproved = true;
            } else if (category === 'PYQ') {
                const item = resource.pyqs.find(p => p._id.toString() === itemId);
                if (item) item.isApproved = true;
            } else if (category === 'OTHER') {
                const item = resource.others.find(o => o._id.toString() === itemId);
                if (item) item.isApproved = true;
            }
            await resource.save();
        } else if (action === 'REJECT') {
            if (category === 'COURSE') {
                // If the course itself is rejected, delete the whole document
                await Resource.findByIdAndDelete(resourceId);
                return NextResponse.json({ message: 'Course rejected and deleted' });
            } else if (category === 'SYLLABUS') {
                resource.syllabus = undefined;
            } else if (category === 'NOTES') {
                resource.modules = resource.modules.filter(m => m._id.toString() !== itemId);
            } else if (category === 'PYQ') {
                resource.pyqs = resource.pyqs.filter(p => p._id.toString() !== itemId);
            } else if (category === 'OTHER') {
                resource.others = resource.others.filter(o => o._id.toString() !== itemId);
            }
            await resource.save();
        }

        return NextResponse.json({ message: 'Action processed successfully' });
    } catch (error) {
        console.error('Admin action error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
