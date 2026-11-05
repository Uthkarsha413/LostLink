
import os
from pathlib import Path

import pymysql
from dotenv import load_dotenv


ENV_FILE = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=ENV_FILE)


def get_mysql_connection():
    """Create a connection to the LostLink MySQL database."""

    required_variables = [
        "MYSQL_HOST",
        "MYSQL_PORT",
        "MYSQL_USER",
        "MYSQL_PASSWORD",
        "MYSQL_DATABASE",
    ]

    missing = [
        variable
        for variable in required_variables
        if not os.getenv(variable)
    ]

    if missing:
        raise RuntimeError(
            f"Missing environment variables: {', '.join(missing)}"
        )

    return pymysql.connect(
        host=os.getenv("MYSQL_HOST"),
        port=int(os.getenv("MYSQL_PORT", "3306")),
        user=os.getenv("MYSQL_USER"),
        password=os.getenv("MYSQL_PASSWORD"),
        database=os.getenv("MYSQL_DATABASE"),
        cursorclass=pymysql.cursors.DictCursor,
        connect_timeout=10,
        charset="utf8mb4",
        autocommit=False,
    )


def check_mysql_connection() -> dict:
    """Check database connectivity without exposing credentials."""

    try:
        connection = get_mysql_connection()

        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT DATABASE() AS database_name, "
                    "CURRENT_USER() AS connected_user"
                )
                result = cursor.fetchone()
        finally:
            connection.close()

        return {
            "connected": True,
            "database": result["database_name"],
            "user": result["connected_user"],
        }

    except Exception as error:
        return {
            "connected": False,
            "error": str(error),
        }
