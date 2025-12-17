import { NextResponse } from 'next/server';

// In-memory store
// Note: This resets on server restart. For persistent storage in a real app, use a DB.
// For this mini-site, we rely on the client fetching and storing in localStorage if needed,
// or just this ephemeral store for the session.
let payloads: any[] = [];

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const payload = {
            id: Date.now().toString(),
            receivedAt: new Date().toISOString(),
            data: body
        };

        // Keep last 20
        payloads = [payload, ...payloads].slice(0, 20);

        return NextResponse.json({ ok: true, id: payload.id, receivedAt: payload.receivedAt });
    } catch (e) {
        return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
    }
}

export async function GET() {
    return NextResponse.json(payloads);
}

export async function DELETE() {
    payloads = [];
    return NextResponse.json({ ok: true });
}
