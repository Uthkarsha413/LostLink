import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { createSession } from '@/lib/session';

interface LoginUser {
  user_id: string | number | bigint;
  full_name: string;
  email: string;
  password_hash: string;
  account_status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  roles: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const email =
      typeof body.email === 'string'
        ? body.email.trim().toLowerCase()
        : '';

    const password =
      typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const [rows] = await pool.execute(
      `SELECT
         u.user_id,
         u.full_name,
         u.email,
         u.password_hash,
         u.account_status,
         GROUP_CONCAT(r.role_name) AS roles
       FROM users u
       LEFT JOIN user_roles ur ON u.user_id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.role_id
       WHERE u.email = ?
       GROUP BY u.user_id
       LIMIT 1`,
      [email]
    );

    const users = rows as LoginUser[];

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = users[0];

    const passwordMatches = await verifyPassword(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (user.account_status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, message: 'This account is not active' },
        { status: 403 }
      );
    }

    await createSession(String(user.user_id), user.email);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        userId: String(user.user_id),
        fullName: user.full_name,
        email: user.email,
        roles: user.roles ? user.roles.split(',') : [],
      },
    });
  } catch (error) {
    console.error('Login error:', error);

    return NextResponse.json(
      { success: false, message: 'Login failed' },
      { status: 500 }
    );
  }
}
