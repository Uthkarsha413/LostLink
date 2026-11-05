import { NextResponse } from 'next/server';
import pool from '@/lib/db';


export async function GET() {
  try {
    const [rows] = await pool.query(
      'SELECT DATABASE() AS database_name, CURRENT_USER() AS database_user, VERSION() AS mysql_version'
    );

    return NextResponse.json({
      success: true,
      message: 'LostLink database connected successfully',
      data: rows,
    });
  } catch (error) {
    console.error('Database connection failed:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Database connection failed',
      },
      { status: 500 }
    );
  }
}
