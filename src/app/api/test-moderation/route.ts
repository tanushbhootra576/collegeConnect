import { NextRequest, NextResponse } from 'next/server';
import { containsProfanity, validateContent } from '@/lib/moderation';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { text } = body;

        console.log('Testing moderation for:', text);

        const isProfane = await containsProfanity(text);
        console.log('Result:', isProfane);

        try {
            await validateContent(text, 'test-field');
        } catch (e: any) {
            return NextResponse.json({ 
                isProfane, 
                error: e.message,
                clean: 'N/A' 
            });
        }

        return NextResponse.json({ isProfane, message: 'Content is clean' });
    } catch (error: any) {
        console.error('Test route error:', error);
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
