import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { z } from 'zod';

// التحقق من صحة البيانات
const symbolSchema = z.object({
  symbol_id: z.string().min(1),
});

// GET: جلب كل النتائج
export async function GET() {
  try {
    const rows = await sql`
      SELECT id, symbol_id, created_at
      FROM wheel_sequence
      ORDER BY created_at ASC
    `;
    return NextResponse.json(rows);
  } catch (error) {
    console.error('GET sequence error:', error);
    return NextResponse.json({ error: 'Failed to fetch sequence' }, { status: 500 });
  }
}

// POST: إضافة نتيجة جديدة
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = symbolSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid symbol_id' }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO wheel_sequence (symbol_id)
      VALUES (${parsed.data.symbol_id})
      RETURNING id, symbol_id, created_at
    `;

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('POST sequence error:', error);
    return NextResponse.json({ error: 'Failed to add symbol' }, { status: 500 });
  }
}

// DELETE: حذف آخر نتيجة
export async function DELETE() {
  try {
    const rows = await sql`
      DELETE FROM wheel_sequence
      WHERE id = (SELECT id FROM wheel_sequence ORDER BY id DESC LIMIT 1)
      RETURNING id
    `;
    return NextResponse.json({ deleted: rows[0] ?? null });
  } catch (error) {
    console.error('DELETE sequence error:', error);
    return NextResponse.json({ error: 'Failed to delete last symbol' }, { status: 500 });
  }
}

// PUT: حذف كل النتائج
export async function PUT() {
  try {
    await sql`DELETE FROM wheel_sequence`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT sequence error:', error);
    return NextResponse.json({ error: 'Failed to clear sequence' }, { status: 500 });
  }
}