
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await pool.execute(
      `SELECT
         location_id AS locationId,
         parent_location_id AS parentLocationId,
         location_code AS locationCode,
         location_name AS locationName,
         location_type AS locationType,
         floor_number AS floorNumber,
         floor_name AS floorName,
         room_type AS roomType,
         department_or_use AS departmentOrUse,
         data_status AS dataStatus,
         verification_needed AS verificationNeeded
       FROM campus_locations
       WHERE is_active = 1
       ORDER BY
         FIELD(location_type, 'CAMPUS', 'BLOCK', 'FLOOR', 'AREA', 'ROOM'),
         location_code ASC`
    );

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('Locations API error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Unable to load campus locations',
      },
      { status: 500 }
    );
  }
}


