import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword } from '@/lib/password';

export async function POST(request: NextRequest) {
  let connection;

  try {
    const body = await request.json();

    const fullName =
      typeof body.fullName === 'string' ? body.fullName.trim() : '';

    const email =
      typeof body.email === 'string'
        ? body.email.trim().toLowerCase()
        : '';

    const universityId =
      typeof body.universityId === 'string'
        ? body.universityId.trim().toUpperCase()
        : '';

    const password =
      typeof body.password === 'string' ? body.password : '';

    const phoneNumber =
      typeof body.phoneNumber === 'string'
        ? body.phoneNumber.trim()
        : null;

    if (!fullName || !email || !universityId || !password) {
      return NextResponse.json(
        { success: false, message: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    if (fullName.length > 100 || universityId.length > 50) {
      return NextResponse.json(
        { success: false, message: 'Name or university ID is too long' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    if (password.length < 8 || password.length > 72) {
      return NextResponse.json(
        { success: false, message: 'Password must contain 8 to 72 characters' },
        { status: 400 }
      );
    }

    if (phoneNumber && phoneNumber.length > 20) {
      return NextResponse.json(
        { success: false, message: 'Phone number is too long' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [roleRows] = await connection.execute(
      `SELECT role_id FROM roles WHERE role_name = ?`,
      ['STUDENT']
    );

    const roles = roleRows as { role_id: number }[];

    if (roles.length === 0) {
      throw new Error('STUDENT role is not configured in the database');
    }

    const [userResult] = await connection.execute(
      `INSERT INTO users (
        full_name,
        email,
        password_hash,
        university_id,
        phone_number
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        fullName,
        email,
        passwordHash,
        universityId,
        phoneNumber || null,
      ]
    );

    const userId = String(
      (userResult as { insertId: number | bigint }).insertId
    );

    await connection.execute(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES (?, ?)`,
      [userId, roles[0].role_id]
    );

    await connection.commit();

    return NextResponse.json(
      {
        success: true,
        message: 'Student account created successfully',
        data: {
          userId,
          fullName,
          email,
          universityId,
          accountStatus: 'ACTIVE',
          emailVerified: false,
          role: 'STUDENT',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    const dbError = error as { code?: string };

    if (dbError.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        {
          success: false,
          message: 'Email or university ID is already registered',
        },
        { status: 409 }
      );
    }

    console.error('Registration error:', error);

    return NextResponse.json(
      { success: false, message: 'Registration failed' },
      { status: 500 }
    );
  } finally {
    connection?.release();
  }
}
