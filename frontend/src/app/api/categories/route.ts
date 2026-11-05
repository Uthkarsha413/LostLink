
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.execute(
      `SELECT
         category_id AS categoryId,
         category_name AS categoryName,
         description
       FROM categories
       WHERE is_active = 1
       ORDER BY category_name ASC`
    );

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('Categories API error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Unable to load categories',
      },
      { status: 500 }
    );
  }
}
