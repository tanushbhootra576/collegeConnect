import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const res = await fetch('http://localhost:3000/api/resources');
        const data = await res.json();
        
        // Count by year
        const counts: Record<string, number> = {};
        data.resources.forEach((r: any) => {
            const y = r.year || 'undefined';
            counts[y] = (counts[y] || 0) + 1;
        });

        return NextResponse.json({
            counts,
            sample: data.resources.slice(0, 3)
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
