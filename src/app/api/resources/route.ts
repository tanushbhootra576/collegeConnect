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
        const includePending = searchParams.get('includePending') === 'true';

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

        // If includePending is true (e.g. for profile view), return everything
        if (includePending) {
            return NextResponse.json({ resources });
        }

        // Filter out unapproved content
        const filteredResources = resources.map((resource: any) => {
            // If the course itself is explicitly unapproved, hide it
            if (resource.isApproved === false) return null;

            if (resource.syllabus && resource.syllabus.isApproved === false) {
                delete resource.syllabus;
            }
            
            if (resource.modules) {
                resource.modules = resource.modules.filter((m: any) => m.isApproved !== false);
            }
            
            if (resource.pyqs) {
                resource.pyqs = resource.pyqs.filter((p: any) => p.isApproved !== false);
            }
            
            if (resource.others) {
                resource.others = resource.others.filter((o: any) => o.isApproved !== false);
            }
            
            return resource;
        }).filter(Boolean);

        return NextResponse.json({ resources: filteredResources });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();
        const { courseCode, courseName, year, branch, category, item, userId } = body;

        if (!courseCode || !category || !item) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Force content to be unapproved by default
        item.isApproved = false;

        // Moderation check on item fields
        try {
            if (item.title) await validateContent(item.title, 'title');
            if (item.description) await validateContent(item.description, 'description');
        } catch (modError: any) {
            return NextResponse.json({ error: modError.message }, { status: 400 });
        }

        // Find existing resource document
        let resource = await Resource.findOne({ courseCode: courseCode.toUpperCase() });

        if (!resource) {
            // Create new if not exists
            if (!courseName || !year) {
                return NextResponse.json({ error: 'Course Name and Year are required for new subjects' }, { status: 400 });
            }
            
            const newResourceData: any = {
                courseCode: courseCode.toUpperCase(),
                courseName,
                year,
                branch: branch || 'Common',
                uploaderId: userId,
                modules: [],
                pyqs: [],
                others: []
            };

            if (category === 'SYLLABUS') {
                newResourceData.syllabus = item;
            } else if (category === 'NOTES') {
                newResourceData.modules = [item];
            } else if (category === 'PYQ') {
                newResourceData.pyqs = [item];
            } else {
                newResourceData.others = [item];
            }

            resource = await Resource.create(newResourceData);
        } else {
            // Update existing
            if (category === 'SYLLABUS') {
                resource.syllabus = item;
            } else if (category === 'NOTES') {
                resource.modules.push(item);
            } else if (category === 'PYQ') {
                resource.pyqs.push(item);
            } else {
                resource.others.push(item);
            }
            await resource.save();
        }

        return NextResponse.json({ resource }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
