import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { z } from 'zod';

// التحقق من صحة البيانات
const statsSchema = z.object({
  win_count: z.number().int().min(0),
  loss_count: z.number().int().min(0),
  user_picks: z.array(z.string()),
});

// GET: جلب الإحصائيات
export async function GET() {
  try {
    const rows = await sql`
      SELECT id, win_count, loss_count, user_picks
      FROM wheel_stats
      ORDER BY id ASC
      LIMIT 1
    `;

    if (rows.length === 0) {
      // إذا ما في صف، ننشئ واحد افتراضي
      const created = await sql`
        INSERT INTO wheel_stats (win_count, loss_count, user_picks)
        VALUES (0, 0, '[]')
        RETURNING id, win_count, loss_count, user_picks
      `;
      return NextResponse.json({
        id: created[0].id,
        win_count: created[0].win_count,
        loss_count: created[0].loss_count,
        user_picks: JSON.parse(created[0].user_picks),
      });
    }

    const row = rows[0];
    return NextResponse.json({
      id: row.id,
      win_count: row.win_count,
      loss_count: row.loss_count,
      user_picks: JSON.parse(row.user_picks),
    });
  } catch (error) {
    console.error('GET stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}

// POST: تحديث الإحصائيات
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = statsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid stats data', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { win_count, loss_count, user_picks } = parsed.data;
    const userPicksJson = JSON.stringify(user_picks);

    // نتحقق إذا في صف موجود
    const existing = await sql`SELECT id FROM wheel_stats ORDER BY id ASC LIMIT 1`;

    let rows;
    if (existing.length === 0) {
      // ما في صف → ننشئ واحد جديد
      rows = await sql`
        INSERT INTO wheel_stats (win_count, loss_count, user_picks)
        VALUES (${win_count}, ${loss_count}, ${userPicksJson})
        RETURNING id, win_count, loss_count, user_picks
      `;
    } else {
      // في صف → نحدّثه
      rows = await sql`
        UPDATE wheel_stats
        SET win_count = ${win_count},
            loss_count = ${loss_count},
            user_picks = ${userPicksJson}
        WHERE id = ${existing[0].id}
        RETURNING id, win_count, loss_count, user_picks
      `;
    }

    const row = rows[0];
    return NextResponse.json({
      id: row.id,
      win_count: row.win_count,
      loss_count: row.loss_count,
      user_picks: JSON.parse(row.user_picks),
    });
  } catch (error) {
    console.error('POST stats error:', error);
    return NextResponse.json({ error: 'Failed to update stats' }, { status: 500 });
  }
}