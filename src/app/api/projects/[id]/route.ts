import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import { validateContent } from '@/lib/moderation';

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  const resolved = 'then' in context.params ? await context.params : context.params;
  const id = resolved.id;
  if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) {
    return NextResponse.json({ error: 'Invalid project id' }, { status: 400 });
  }
  try {
    await dbConnect();
    const body = await req.json();
    // Expect `userId` in body for ownership check (teamMembers includes userId)
    const { userId, teamMembers: incomingMembers, ...updates } = body;
    if (!userId || !/^[a-fA-F0-9]{24}$/.test(userId)) {
      return NextResponse.json({ error: 'userId missing or invalid' }, { status: 400 });
    }
    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    const canEdit = project.teamMembers.some(m => String(m) === userId);
    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Moderation check
    try {
        if (updates.title) await validateContent(updates.title, 'title');
        if (updates.description) await validateContent(updates.description, 'description');
    } catch (modError: any) {
        return NextResponse.json({ error: modError.message }, { status: 400 });
    }

    // Whitelist updatable fields
    const allowed: Array<keyof typeof project> = ['title','description','techStack','demoLink','repoLink','images','isFeatured'];
    for (const k of allowed) {
      if (k in updates) {
        // @ts-ignore
        project[k] = updates[k];
      }
    }
    if (Array.isArray(incomingMembers)) {
      // Validate ids
      const cleaned = incomingMembers
        .map((m: unknown) => String(m))
        .filter(id => /^[a-fA-F0-9]{24}$/.test(id));
      // Ensure editor remains a member
      if (!cleaned.includes(userId)) cleaned.push(userId);
      // Dedupe
      const unique = Array.from(new Set(cleaned));
      project.teamMembers = unique as any;
    }
    await project.save();
    const populated = await Project.findById(id).populate('teamMembers','firebaseUid name email').lean();
    return NextResponse.json({ project: populated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown';
    console.error('[projects.PATCH] Error', msg);
    return NextResponse.json({ error: 'Internal Server Error', detail: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> | { id: string } }) {
  const resolved = 'then' in context.params ? await context.params : context.params;
  const id = resolved.id;
  if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) {
    return NextResponse.json({ error: 'Invalid project id' }, { status: 400 });
  }
  try {
    await dbConnect();
    const project = await Project.findById(id).populate('teamMembers','firebaseUid name email').lean();
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ project });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown';
    return NextResponse.json({ error: 'Internal Server Error', detail: msg }, { status: 500 });
  }
}