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

        // Calculate year, role, and branch from Name (RegNo) or Email
        let yearOfStudy = 1;
        let calculatedRole = 'student';
        let extractedBranch: string | undefined = undefined;

        // 1. Try to parse Registration Number from Name (e.g., "Tanush Bhootra 24BRS1282")
        // Pattern: 2 digits (Year), optional space, 3 letters (Branch), optional space, 4 digits (Serial)
        // Case insensitive for branch code
        const regNoMatch = name.match(/\b(\d{2})\s*([a-zA-Z]{3})\s*(\d{4})\b/);

        if (regNoMatch) {
            const shortYear = parseInt(regNoMatch[1], 10); // e.g., 24
            const branchCode = regNoMatch[2].toUpperCase(); // e.g., BRS
            const joiningYear = 2000 + shortYear; // 2024

            const now = new Date();
            const currentCalendarYear = now.getFullYear();
            const currentMonth = now.getMonth(); // 0-11. July is 6.

            yearOfStudy = currentCalendarYear - joiningYear;
            if (currentMonth >= 6) { // July or later
                yearOfStudy += 1;
            }
            
            // Use the branch code directly as requested
            extractedBranch = branchCode;

        } else {
            // 2. Fallback: Extract from Email
            const match = email.match(/(\d{4})@vitstudent\.ac\.in$/);
            if (match) {
                const joiningYear = parseInt(match[1], 10);
                const now = new Date();
                const currentCalendarYear = now.getFullYear();
                const currentMonth = now.getMonth();

                yearOfStudy = currentCalendarYear - joiningYear;
                if (currentMonth >= 6) {
                    yearOfStudy += 1;
                }
            }
        }

        if (yearOfStudy < 1) yearOfStudy = 1;
        if (yearOfStudy > 4) calculatedRole = 'alumni';

        if (!user) {
            user = await User.create({
                firebaseUid,
                email,
                name,
                role: calculatedRole,
                year: yearOfStudy,
                branch: extractedBranch, // Set branch if found
                profileLocked: !!extractedBranch, // Lock profile if branch is auto-detected
                skills: [],
                interests: [],
            });
        } else {
            // Update existing user
            const updates: any = {};
            
            // Update Year if changed
            if (!user.year || user.year !== yearOfStudy) {
                updates.year = yearOfStudy;
            }
            
            // Update Role if changed (and not admin)
            if (user.role !== 'admin' && user.role !== calculatedRole) {
                updates.role = calculatedRole;
            }

            // Update Branch if found in name and not set or different
            // We prioritize the RegNo branch if available
            if (extractedBranch) {
                if (user.branch !== extractedBranch) {
                    updates.branch = extractedBranch;
                }
                // If branch is auto-detected, ensure profile is locked
                if (!user.profileLocked) {
                    updates.profileLocked = true;
                }
            }
            
            if (Object.keys(updates).length > 0) {
                user = await User.findByIdAndUpdate(user._id, updates, { new: true });
            }
        }

        return NextResponse.json({ user }, { status: 201 });
    } catch (error) {
        console.error('Error syncing user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
