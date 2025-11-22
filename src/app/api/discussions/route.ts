import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import DiscussionThread from '@/models/DiscussionThread';
import User from '@/models/User';
import mongoose from 'mongoose';
import { validateContent } from '@/lib/moderation';

export async function GET(req: NextRequest) {
    const start = Date.now();
    try {
        await dbConnect();
    } catch (connErr: any) {
        console.error('[discussions.GET] DB connect failed', connErr?.message);
        return NextResponse.json({ error: 'Database connection failed', detail: connErr?.message }, { status: 500 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');
        const debug = searchParams.get('debug');
        const pageParam = searchParams.get('page');
        const pageSizeParam = searchParams.get('pageSize');
        const sort = searchParams.get('sort'); // 'newest' | 'upvotes'

        const page = Math.max(1, Number(pageParam) || 1);
        const pageSize = Math.min(50, Math.max(1, Number(pageSizeParam) || 10));
        const skip = (page - 1) * pageSize;

        const query: Record<string, any> = {};
        if (category) query.category = category;

        // Ensure strictPopulate disabled even on cached connections
        mongoose.set('strictPopulate', false);

        let raw: any[] = [];
        let total = await DiscussionThread.countDocuments(query);
        if (sort === 'upvotes') {
            // Aggregate to sort by upvotes length
            const pipeline: any[] = [
                { $match: query },
                { $addFields: { upvotesCount: { $size: { $ifNull: ['$upvotes', []] } } } },
                { $sort: { upvotesCount: -1, createdAt: -1 } },
                { $skip: skip },
                { $limit: pageSize },
            ];
            raw = await DiscussionThread.aggregate(pipeline);
            // Populate manually after aggregate
            raw = await DiscussionThread.populate(raw, [
                { path: 'authorId', select: 'name', strictPopulate: false },
                { path: 'comments.authorId', select: 'name', strictPopulate: false },
            ]);
        } else {
            raw = await DiscussionThread.find(query)
                .populate({ path: 'authorId', select: 'name', strictPopulate: false })
                .populate({ path: 'comments.authorId', select: 'name', strictPopulate: false })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(pageSize)
                .lean();
        }

        const threads = Array.isArray(raw) ? raw.map(t => ({
            _id: String(t._id),
            title: t.title,
            content: t.content,
            category: t.category,
            tags: Array.isArray(t.tags) ? t.tags : [],
            authorId: t.authorId || { name: 'Unknown' },
            createdAt: t.createdAt,
            upvotes: Array.isArray(t.upvotes) ? t.upvotes.map((u: unknown) => String(u)) : [],
            comments: Array.isArray(t.comments) ? t.comments.map((c: any) => ({
                _id: c._id ? String(c._id) : undefined,
                authorId: c.authorId || { name: 'Unknown' },
                content: c.content,
                createdAt: c.createdAt,
            })) : []
        })) : [];

        return NextResponse.json({ threads, ok: true, page, pageSize, total });
    } catch (error: any) {
        console.error('[discussions.GET] Query failed', error?.message, error);
        const { searchParams } = new URL(req.url);
        const debug = searchParams.get('debug');
        return NextResponse.json(
            debug === '1'
                ? { error: 'Failed to fetch discussions', detail: error?.message, stack: error?.stack }
                : { error: 'Failed to fetch discussions' },
            { status: 500 }
        );
    } finally {
        const ms = Date.now() - start;
        if (ms > 1000) {
            console.warn(`[discussions.GET] Slow response: ${ms}ms`);
        }
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
    } catch (connErr: any) {
        console.error('[discussions.POST] DB connect failed', connErr?.message);
        return NextResponse.json({ error: 'Database connection failed', detail: connErr?.message }, { status: 500 });
    }
    try {
        const body = await req.json();
        const { authorId, category, title, content } = body;

        // Moderation check
        try {
            await validateContent(title, 'title');
            await validateContent(content, 'content');
        } catch (modError: any) {
            return NextResponse.json({ error: modError.message }, { status: 400 });
        }

        // Check permissions for ALL categories
        const user = await User.findById(authorId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const isAuthorized = user.role === 'alumni' || user.role === 'admin';
        
        if (!isAuthorized) {
            return NextResponse.json({ 
                error: 'Permission denied', 
                detail: 'Only Alumni and Admins can post discussions.' 
            }, { status: 403 });
        }

        const thread = await DiscussionThread.create(body);
        return NextResponse.json({ thread }, { status: 201 });
    } catch (error: any) {
        console.error('[discussions.POST] Create failed', error?.message, error);
        return NextResponse.json({ error: 'Failed to create discussion', detail: error?.message }, { status: 500 });
    }
}
