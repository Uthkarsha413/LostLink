
from app.services.mysql_client import get_mysql_connection


def get_active_reports(report_type: str | None = None) -> list[dict]:
    """Fetch active LOST and FOUND reports from MySQL."""

    if report_type not in (None, "LOST", "FOUND"):
        raise ValueError("Report type must be LOST or FOUND.")

    query = """
        SELECT
            ir.report_id,
            ir.report_type,
            ir.title,
            ir.description,
            ir.brand,
            ir.color,
            ir.event_datetime,
            ir.report_status,
            c.category_name,
            cl.location_name
        FROM item_reports ir
        LEFT JOIN categories c
            ON ir.category_id = c.category_id
        LEFT JOIN campus_locations cl
            ON ir.location_id = cl.location_id
        WHERE ir.report_status = 'ACTIVE'
    """

    parameters = []

    if report_type:
        query += " AND ir.report_type = %s"
        parameters.append(report_type)

    query += " ORDER BY ir.created_at DESC"

    connection = get_mysql_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute(query, parameters)
            return cursor.fetchall()
    finally:
        connection.close()


def get_report_by_id(report_id: int) -> dict | None:
    """Fetch one report using its ID."""

    query = """
        SELECT
            ir.report_id,
            ir.report_type,
            ir.title,
            ir.description,
            ir.brand,
            ir.color,
            ir.event_datetime,
            ir.report_status,
            c.category_name,
            cl.location_name
        FROM item_reports ir
        LEFT JOIN categories c
            ON ir.category_id = c.category_id
        LEFT JOIN campus_locations cl
            ON ir.location_id = cl.location_id
        WHERE ir.report_id = %s
    """

    connection = get_mysql_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute(query, (report_id,))
            return cursor.fetchone()
    finally:
        connection.close()


def get_active_reports_with_images(report_type: str | None = None) -> list[dict]:
    """Fetch active reports and their primary image records."""

    if report_type not in (None, "LOST", "FOUND"):
        raise ValueError("Report type must be LOST or FOUND.")

    query = """
        SELECT
            ir.report_id,
            ir.report_type,
            ir.title,
            ir.description,
            ir.brand,
            ir.color,
            ir.event_datetime,
            ir.report_status,
            c.category_name,
            cl.location_name,
            ri.image_id,
            ri.storage_key,
            ri.mime_type,
            ri.image_quality_status,
            ri.is_primary
        FROM item_reports ir
        LEFT JOIN categories c
            ON ir.category_id = c.category_id
        LEFT JOIN campus_locations cl
            ON ir.location_id = cl.location_id
        INNER JOIN report_images ri
            ON ir.report_id = ri.report_id
        WHERE ir.report_status = 'ACTIVE'
          AND ri.is_primary = 1
    """

    parameters = []

    if report_type:
        query += " AND ir.report_type = %s"
        parameters.append(report_type)

    query += " ORDER BY ir.created_at DESC"

    connection = get_mysql_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute(query, parameters)
            return cursor.fetchall()
    finally:
        connection.close()
def get_active_report_with_image(report_id: int) -> dict | None:
    """Fetch one active report and its primary image."""

    query = """
        SELECT
            ir.report_id,
            ir.report_type,
            ir.title,
            ir.description,
            ir.brand,
            ir.color,
            ir.event_datetime,
            ir.report_status,
            c.category_name,
            cl.location_name,
            ri.image_id,
            ri.storage_key,
            ri.mime_type,
            ri.image_quality_status,
            ri.is_primary
        FROM item_reports ir
        LEFT JOIN categories c
            ON ir.category_id = c.category_id
        LEFT JOIN campus_locations cl
            ON ir.location_id = cl.location_id
        INNER JOIN report_images ri
            ON ir.report_id = ri.report_id
        WHERE ir.report_id = %s
          AND ir.report_status = 'ACTIVE'
          AND ri.is_primary = 1
        LIMIT 1
    """

    connection = get_mysql_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute(query, (report_id,))
            return cursor.fetchone()
    finally:
        connection.close()


def get_active_report_images(report_id: int) -> list[dict]:
    """Fetch all images belonging to one active report."""

    query = """
        SELECT
            ir.report_id,
            ir.report_type,
            ir.title,
            ir.description,
            ir.brand,
            ir.color,
            ir.report_status,
            c.category_name,
            cl.location_name,
            ri.image_id,
            ri.storage_key,
            ri.mime_type,
            ri.image_quality_status,
            ri.is_primary
        FROM item_reports ir
        LEFT JOIN categories c
            ON ir.category_id = c.category_id
        LEFT JOIN campus_locations cl
            ON ir.location_id = cl.location_id
        INNER JOIN report_images ri
            ON ir.report_id = ri.report_id
        WHERE ir.report_id = %s
          AND ir.report_status = 'ACTIVE'
        ORDER BY ri.is_primary DESC, ri.image_id ASC
    """

    connection = get_mysql_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute(query, (report_id,))
            return cursor.fetchall()
    finally:
        connection.close()
