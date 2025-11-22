import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import DiscussionThread from '@/models/DiscussionThread';
import User from '@/models/User';
import mongoose from 'mongoose';
import { validateContent } from '@/lib/moderation';

function normalize(thread: any) {
  return {
    _id: String(thread._id),
    title: thread.title,
    content: thread.content,
    category: thread.category,
    tags: Array.isArray(thread.tags) ? thread.tags : [],
    authorId: thread.authorId || { name: 'Unknown' },
    createdAt: thread.createdAt,
    upvotes: Array.isArray(thread.upvotes) ? thread.upvotes.map((u: any) => String(u)) : [],
    comments: Array.isArray(thread.comments) ? thread.comments.map((c: any) => ({
      _id: c._id ? String(c._id) : undefined,
      authorId: c.authorId || { name: 'Unknown' },
      content: c.content,
      createdAt: c.createdAt,
    })) : []
  };
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    await dbConnect();
    mongoose.set('strictPopulate', false);
    const resolved = 'then' in context.params ? await context.params : context.params;
    const id = resolved.id;
    if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) {
      return NextResponse.json({ error: 'Invalid id format', id }, { status: 400 });
    }
    const thread = await DiscussionThread.findById(id)
      .populate({ path: 'authorId', select: 'name', strictPopulate: false })
      .populate({ path: 'comments.authorId', select: 'name', strictPopulate: false })
      .lean();
    if (!thread) {
      return NextResponse.json({ error: 'Not found', id }, { status: 404 });
    }
    return NextResponse.json({ thread: normalize(thread) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[GET /api/discussions/:id] Error', msg);
    return NextResponse.json({ error: 'Internal Server Error', detail: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    await dbConnect();
    mongoose.set('strictPopulate', false);
    const body = await req.json();
    const { userId, title, content, category, tags } = body;
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }
    
    const resolved = 'then' in context.params ? await context.params : context.params;
    const thread = await DiscussionThread.findById(resolved.id);
    
    if (!thread) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Check if this is an edit operation (presence of content fields)
    if (title || content || category || tags) {
        // Moderation check
        try {
            if (title) await validateContent(title, 'title');
            if (content) await validateContent(content, 'content');
            if (tags && Array.isArray(tags)) {
                for (const tag of tags) {
                    await validateContent(tag, 'tag');
                }
            }
        } catch (modError: any) {
            return NextResponse.json({ error: modError.message }, { status: 400 });
        }

        const user = await User.findById(userId);
        const isAuthor = String(thread.authorId) === userId;
        const isAdmin = user?.role === 'admin';

        if (!isAuthor && !isAdmin) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        if (title) thread.title = title;
        if (content) thread.content = content;
        if (category) thread.category = category;
        if (tags) thread.tags = tags;
        
        await thread.save();
    } else {
        // Upvote toggle logic
        const hasUpvoted = thread.upvotes.some((u: unknown) => String(u) === userId);
        if (hasUpvoted) {
          thread.upvotes = thread.upvotes.filter((u: unknown) => String(u) !== userId);
        } else {
          thread.upvotes.push(userId);
        }
        await thread.save();
    }

    const updated = await DiscussionThread.findById(resolved.id)
      .populate({ path: 'authorId', select: 'name', strictPopulate: false })
      .populate({ path: 'comments.authorId', select: 'name', strictPopulate: false })
      .lean();
      
    if (!updated) {
      return NextResponse.json({ error: 'Updated thread fetch failed' }, { status: 500 });
    }
    
    const normalized = {
      ...updated,
      upvotes: (updated.upvotes || []).map((u: unknown) => String(u)),
    };
    
    return NextResponse.json({ thread: normalized });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[discussions.PATCH] Error', msg);
    return NextResponse.json({ error: 'Internal Server Error', detail: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    await dbConnect();
    mongoose.set('strictPopulate', false);
    const body = await req.json();
    const { userId, content } = body;
    if (!userId || !content) {
      return NextResponse.json({ error: 'userId and content required' }, { status: 400 });
    }

    // Moderation check
    try {
        await validateContent(content, 'comment');
    } catch (modError: any) {
        return NextResponse.json({ error: modError.message }, { status: 400 });
    }

    const resolved = 'then' in context.params ? await context.params : context.params;
    console.log('[POST /api/discussions/:id] incoming id', resolved.id);
    const thread = await DiscussionThread.findById(resolved.id);
    if (!thread) {
      console.warn('[POST /api/discussions/:id] thread not found for id', resolved.id);
    }
    if (!thread) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    // Push raw object; cast to any to satisfy TS since subdocument methods not needed here
    (thread.comments as any).push({ authorId: userId, content, createdAt: new Date() });
    await thread.save();
    const updated = await DiscussionThread.findById(resolved.id)
      .populate({ path: 'authorId', select: 'name', strictPopulate: false })
      .populate({ path: 'comments.authorId', select: 'name', strictPopulate: false })
      .lean();
    if (!updated) {
      return NextResponse.json({ error: 'Updated thread fetch failed' }, { status: 500 });
    }
    const normalized = {
      ...updated,
      upvotes: (updated.upvotes || []).map((u: unknown) => String(u)),
    };
    return NextResponse.json({ thread: normalized });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[discussions.POST] Error', msg);
    return NextResponse.json({ error: 'Internal Server Error', detail: msg }, { status: 500 });
  }
}
