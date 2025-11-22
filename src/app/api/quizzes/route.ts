import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Quiz from '@/models/Quiz';
import User from '@/models/User';
import { validateContent } from '@/lib/moderation';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const quizzes = await Quiz.find().sort({ createdAt: -1 });
        return NextResponse.json({ quizzes });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        // RBAC Check
        const user = await User.findById(body.createdBy);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
        }

        // Moderation check
        try {
            await validateContent(body.title, 'title');
            await validateContent(body.description, 'description');
            // Check questions if they exist
            if (body.questions && Array.isArray(body.questions)) {
                for (const q of body.questions) {
                    await validateContent(q.question, 'question');
                    if (Array.isArray(q.options)) {
                        for (const opt of q.options) {
                            await validateContent(opt, 'option');
                        }
                    }
                }
            }
        } catch (modError: any) {
            return NextResponse.json({ error: modError.message }, { status: 400 });
        }

        const quiz = await Quiz.create(body);
        return NextResponse.json({ quiz }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
