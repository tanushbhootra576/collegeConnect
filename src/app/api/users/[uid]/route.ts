import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Project from '@/models/Project';
import DiscussionThread from '@/models/DiscussionThread';
import SkillListing from '@/models/SkillListing';
import Event from '@/models/Event';
import Message from '@/models/Message';
import Quiz from '@/models/Quiz';
import Resource from '@/models/Resource';
import { validateContent } from '@/lib/moderation';

export async function GET(req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
    try {
        await dbConnect();
        const { uid } = await params;
        const user = await User.findOne({ firebaseUid: uid });

        if (!user) {
            return NextResponse.json({ user: null }, { status: 200 });
        }

        return NextResponse.json({ user }, { status: 200 });
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
    try {
        await dbConnect();
        const body = await req.json();
        const { uid } = await params;

        // Moderation check for bio and name
        try {
            if (body.bio) await validateContent(body.bio, 'bio');
            if (body.name) await validateContent(body.name, 'name');
        } catch (modError: any) {
            return NextResponse.json({ error: modError.message }, { status: 400 });
        }

        let user = await User.findOne({ firebaseUid: uid });

        if (user) {
            // Update existing user
            if (user.profileLocked) {
                // Prevent updating branch and year if locked
                delete body.branch;
                delete body.year;
            } else if (body.branch && body.year) {
                // Lock profile if branch and year are being set
                body.profileLocked = true;
            }

            delete body.firebaseUid;
            delete body.email; // Usually email is managed by Auth provider

            Object.assign(user, body);
            await user.save();
        } else {
            // Create new user
            if (!body.email) {
                return NextResponse.json({ error: 'Email is required for creating a profile' }, { status: 400 });
            }

            // Lock profile if branch and year are provided on creation
            if (body.branch && body.year) {
                body.profileLocked = true;
            }

            user = await User.create({
                ...body,
                firebaseUid: uid,
            });
        }

        return NextResponse.json({ user }, { status: 200 });
    } catch (error: any) {
        console.error('Error updating user:', error);
        return NextResponse.json({
            error: error.message || 'Internal Server Error',
            details: error.errors
        }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ uid: string }> }
) {
    try {
        await dbConnect();
        const { uid } = await params;
        console.log('Attempting to delete user with firebaseUid:', uid);

        // Find the user first to get their ObjectId
        const user = await User.findOne({ firebaseUid: uid });

        if (!user) {
            console.log('User not found for deletion');
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const userId = user._id;

        // 1. Delete Discussion Threads
        await DiscussionThread.deleteMany({ authorId: userId });

        // 2. Delete Skill Listings
        await SkillListing.deleteMany({ userId: userId });

        // 3. Delete Events
        await Event.deleteMany({ organizerId: userId });

        // 4. Delete Messages
        await Message.deleteMany({ senderId: userId });

        // 5. Delete Quizzes
        await Quiz.deleteMany({ createdBy: userId });

        // 6. Delete Resources
        await Resource.deleteMany({ uploaderId: userId });

        // 7. Handle Projects (Remove user from team, delete if empty)
        const projects = await Project.find({ teamMembers: userId });
        for (const project of projects) {
            project.teamMembers = project.teamMembers.filter(
                (memberId: any) => memberId.toString() !== userId.toString()
            );
            if (project.teamMembers.length === 0) {
                await Project.findByIdAndDelete(project._id);
            } else {
                await project.save();
            }
        }

        // Finally, delete the user
        await User.findByIdAndDelete(userId);
        
        console.log('User and related data deleted successfully');

        return NextResponse.json({ message: 'User and related data deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
