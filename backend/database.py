import sqlite3
import os


# ============================================================
# PROJECT FOLDER
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)


# ============================================================
# DATABASE FOLDER
# ============================================================

DATABASE_FOLDER = os.path.join(
    BASE_DIR,
    "database"
)


# ============================================================
# DATABASE FILE
# ============================================================

DATABASE_FILE = os.path.join(
    DATABASE_FOLDER,
    "attendance.db"
)


# ============================================================
# GET DATABASE CONNECTION
# ============================================================

def get_connection():

    # Create database folder if it does not exist
    os.makedirs(
        DATABASE_FOLDER,
        exist_ok=True
    )

    # Connect to SQLite database
    connection = sqlite3.connect(
        DATABASE_FILE
    )

    # Access database columns using their names
    connection.row_factory = sqlite3.Row

    return connection


# ============================================================
# CREATE DATABASE TABLES
# ============================================================

def create_tables():

    connection = get_connection()

    cursor = connection.cursor()


    # ========================================================
    # STUDENTS TABLE
    # ========================================================

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS students (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            name TEXT NOT NULL,

            roll_number TEXT NOT NULL UNIQUE,

            department TEXT NOT NULL,

            year TEXT NOT NULL

        )
    """)


    # ========================================================
    # ATTENDANCE TABLE
    # ========================================================

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS attendance (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            student_id INTEGER NOT NULL,

            date TEXT NOT NULL,

            status TEXT NOT NULL,

            FOREIGN KEY (student_id)
            REFERENCES students(id)

        )
    """)


    # Save changes
    connection.commit()


    # Close database connection
    connection.close()


# ============================================================
# RUN THIS FILE DIRECTLY
# ============================================================

if __name__ == "__main__":

    create_tables()

    print("✅ Database created successfully!")

    print(
        "📁 Database location:"
    )

    print(
        DATABASE_FILE
    )