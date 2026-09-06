import sqlite3

from flask import Flask, jsonify, request
from flask_cors import CORS

from database import create_tables, get_connection


# ============================================================
# CREATE FLASK APP
# ============================================================

app = Flask(__name__)

# Allow frontend to communicate with Flask
CORS(app)


# ============================================================
# CREATE DATABASE TABLES
# ============================================================

create_tables()


# ============================================================
# HOME ROUTE
# ============================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "message": "Student Attendance System Backend is running!"
    })


# ============================================================
# GET ALL STUDENTS
# ============================================================

@app.route("/api/students", methods=["GET"])
def get_students():

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute("""
        SELECT *
        FROM students
        ORDER BY id DESC
    """)

    students = cursor.fetchall()

    connection.close()

    student_list = []

    for student in students:

        student_list.append({
            "id": student["id"],
            "name": student["name"],
            "roll_number": student["roll_number"],
            "department": student["department"],
            "year": student["year"]
        })

    return jsonify(student_list)


# ============================================================
# ADD STUDENT
# ============================================================

@app.route("/api/students", methods=["POST"])
def add_student():

    data = request.get_json()

    if not data:

        return jsonify({
            "error": "No student data received"
        }), 400


    name = data.get("name", "").strip()

    roll_number = data.get(
        "roll_number",
        ""
    ).strip()

    department = data.get(
        "department",
        ""
    ).strip()

    year = data.get(
        "year",
        ""
    ).strip()


    # Check all fields
    if (
        not name
        or not roll_number
        or not department
        or not year
    ):

        return jsonify({
            "error": "All fields are required"
        }), 400


    connection = get_connection()

    cursor = connection.cursor()


    try:

        cursor.execute("""
            INSERT INTO students
            (
                name,
                roll_number,
                department,
                year
            )
            VALUES (?, ?, ?, ?)
        """, (
            name,
            roll_number,
            department,
            year
        ))


        connection.commit()

        student_id = cursor.lastrowid

        connection.close()


        return jsonify({

            "message":
            "Student added successfully",

            "id":
            student_id

        }), 201


    except sqlite3.IntegrityError:

        connection.close()

        return jsonify({

            "error":
            "Roll number already exists"

        }), 400


    except Exception as error:

        connection.close()

        return jsonify({

            "error":
            str(error)

        }), 500


# ============================================================
# GET ONE STUDENT
# ============================================================

@app.route(
    "/api/students/<int:student_id>",
    methods=["GET"]
)
def get_student(student_id):

    connection = get_connection()

    cursor = connection.cursor()


    cursor.execute("""
        SELECT *
        FROM students
        WHERE id = ?
    """, (
        student_id,
    ))


    student = cursor.fetchone()

    connection.close()


    if student is None:

        return jsonify({
            "error": "Student not found"
        }), 404


    return jsonify({

        "id":
        student["id"],

        "name":
        student["name"],

        "roll_number":
        student["roll_number"],

        "department":
        student["department"],

        "year":
        student["year"]

    })


# ============================================================
# UPDATE STUDENT
# ============================================================

@app.route(
    "/api/students/<int:student_id>",
    methods=["PUT"]
)
def update_student(student_id):

    data = request.get_json()


    if not data:

        return jsonify({
            "error": "No student data received"
        }), 400


    name = data.get(
        "name",
        ""
    ).strip()

    roll_number = data.get(
        "roll_number",
        ""
    ).strip()

    department = data.get(
        "department",
        ""
    ).strip()

    year = data.get(
        "year",
        ""
    ).strip()


    if (
        not name
        or not roll_number
        or not department
        or not year
    ):

        return jsonify({
            "error": "All fields are required"
        }), 400


    connection = get_connection()

    cursor = connection.cursor()


    try:

        # Check student exists
        cursor.execute("""
            SELECT id
            FROM students
            WHERE id = ?
        """, (
            student_id,
        ))


        student = cursor.fetchone()


        if student is None:

            connection.close()

            return jsonify({
                "error": "Student not found"
            }), 404


        # Update student
        cursor.execute("""
            UPDATE students
            SET
                name = ?,
                roll_number = ?,
                department = ?,
                year = ?
            WHERE id = ?
        """, (
            name,
            roll_number,
            department,
            year,
            student_id
        ))


        connection.commit()

        connection.close()


        return jsonify({

            "message":
            "Student updated successfully"

        })


    except sqlite3.IntegrityError:

        connection.close()

        return jsonify({

            "error":
            "Roll number already exists"

        }), 400


    except Exception as error:

        connection.close()

        return jsonify({

            "error":
            str(error)

        }), 500


# ============================================================
# DELETE STUDENT
# ============================================================

@app.route(
    "/api/students/<int:student_id>",
    methods=["DELETE"]
)
def delete_student(student_id):

    connection = get_connection()

    cursor = connection.cursor()


    # Check student exists
    cursor.execute("""
        SELECT id
        FROM students
        WHERE id = ?
    """, (
        student_id,
    ))


    student = cursor.fetchone()


    if student is None:

        connection.close()

        return jsonify({
            "error": "Student not found"
        }), 404


    try:

        # Delete attendance records
        cursor.execute("""
            DELETE FROM attendance
            WHERE student_id = ?
        """, (
            student_id,
        ))


        # Delete student
        cursor.execute("""
            DELETE FROM students
            WHERE id = ?
        """, (
            student_id,
        ))


        connection.commit()

        connection.close()


        return jsonify({

            "message":
            "Student deleted successfully"

        })


    except Exception as error:

        connection.close()

        return jsonify({

            "error":
            str(error)

        }), 500


# ============================================================
# MARK ATTENDANCE
# ============================================================

@app.route(
    "/api/attendance",
    methods=["POST"]
)
def mark_attendance():

    data = request.get_json()


    if not data:

        return jsonify({
            "error": "No attendance data received"
        }), 400


    student_id = data.get(
        "student_id"
    )

    date = data.get(
        "date"
    )

    status = data.get(
        "status"
    )


    if (
        student_id is None
        or not date
        or not status
    ):

        return jsonify({

            "error":
            "Student ID, date and status are required"

        }), 400


    # Only allow valid attendance status
    if status not in [
        "Present",
        "Absent"
    ]:

        return jsonify({

            "error":
            "Status must be Present or Absent"

        }), 400


    connection = get_connection()

    cursor = connection.cursor()


    try:

        # Check student exists
        cursor.execute("""
            SELECT id
            FROM students
            WHERE id = ?
        """, (
            student_id,
        ))


        student = cursor.fetchone()


        if student is None:

            connection.close()

            return jsonify({

                "error":
                "Student not found"

            }), 404


        # Check if attendance already exists
        cursor.execute("""
            SELECT id
            FROM attendance
            WHERE student_id = ?
            AND date = ?
        """, (
            student_id,
            date
        ))


        existing = cursor.fetchone()


        if existing:

            # Update existing attendance
            cursor.execute("""
                UPDATE attendance
                SET status = ?
                WHERE student_id = ?
                AND date = ?
            """, (
                status,
                student_id,
                date
            ))

        else:

            # Insert new attendance
            cursor.execute("""
                INSERT INTO attendance
                (
                    student_id,
                    date,
                    status
                )
                VALUES (?, ?, ?)
            """, (
                student_id,
                date,
                status
            ))


        connection.commit()

        connection.close()


        return jsonify({

            "message":
            "Attendance saved successfully"

        })


    except Exception as error:

        connection.close()

        return jsonify({

            "error":
            str(error)

        }), 500


# ============================================================
# GET ALL ATTENDANCE
# ============================================================

@app.route(
    "/api/attendance",
    methods=["GET"]
)
def get_attendance():

    connection = get_connection()

    cursor = connection.cursor()


    cursor.execute("""
        SELECT
            attendance.id,
            attendance.student_id,
            students.name,
            students.roll_number,
            attendance.date,
            attendance.status

        FROM attendance

        INNER JOIN students
        ON attendance.student_id = students.id

        ORDER BY attendance.date DESC
    """)


    records = cursor.fetchall()

    connection.close()


    attendance_list = []


    for record in records:

        attendance_list.append({

            "id":
            record["id"],

            "student_id":
            record["student_id"],

            "name":
            record["name"],

            "roll_number":
            record["roll_number"],

            "date":
            record["date"],

            "status":
            record["status"]

        })


    return jsonify(
        attendance_list
    )


# ============================================================
# GET ATTENDANCE FOR ONE STUDENT
# ============================================================

@app.route(
    "/api/attendance/student/<int:student_id>",
    methods=["GET"]
)
def get_student_attendance(student_id):

    connection = get_connection()

    cursor = connection.cursor()


    cursor.execute("""
        SELECT
            attendance.id,
            attendance.student_id,
            students.name,
            students.roll_number,
            attendance.date,
            attendance.status

        FROM attendance

        INNER JOIN students
        ON attendance.student_id = students.id

        WHERE attendance.student_id = ?

        ORDER BY attendance.date DESC
    """, (
        student_id,
    ))


    records = cursor.fetchall()

    connection.close()


    attendance_list = []


    for record in records:

        attendance_list.append({

            "id":
            record["id"],

            "student_id":
            record["student_id"],

            "name":
            record["name"],

            "roll_number":
            record["roll_number"],

            "date":
            record["date"],

            "status":
            record["status"]

        })


    return jsonify(
        attendance_list
    )


# ============================================================
# RUN FLASK SERVER
# ============================================================

if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )