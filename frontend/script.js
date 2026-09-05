const BACKEND_URL = "http://127.0.0.1:5000";

let students = [];
let attendanceRecords = {};
let currentUser = null;

const users = [
    {
        username: "admin",
        password: "admin123",
        role: "Admin"
    },
    {
        username: "teacher",
        password: "teacher123",
        role: "Teacher"
    }
];

document.addEventListener("DOMContentLoaded", function () {
    initializeApplication();
});

async function initializeApplication() {
    setTodayDate();
    setupEventListeners();
    checkLogin();

    await loadStudents();
    await loadAttendance();

    updateStatistics();
    updateAttendanceSummary();
    updateHeaderDate();
}


// ============================================================
// LOGIN
// ============================================================

function setupEventListeners() {
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", function (event) {
            event.preventDefault();
            login();
        });
    }

    const navButtons = document.querySelectorAll(".nav-btn");

    navButtons.forEach(function (button) {
        button.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();

            const sectionId = button.getAttribute("data-section");

            if (sectionId) {
                showSection(sectionId);
            }
        });
    });

    const studentForm = document.getElementById("studentForm");

    if (studentForm) {
        studentForm.addEventListener("submit", function (event) {
            event.preventDefault();
            addStudent();
        });
    }

    const attendanceDate = document.getElementById("attendanceDate");

    if (attendanceDate) {
        attendanceDate.addEventListener("change", async function () {
            const selectedDate = attendanceDate.value;

            const dashboardDate = document.getElementById("attendanceDate");

            if (dashboardDate) {
                dashboardDate.value = selectedDate;
            }

            await loadAttendance(selectedDate);

            displayAttendance();
            updateAttendanceSummary();
            updateStatistics();
            updateHeaderDate();
        });
    }

    const studentListSearch = document.getElementById("studentListSearch");

    if (studentListSearch) {
        studentListSearch.addEventListener("input", displayStudents);
    }

    const departmentFilter = document.getElementById("departmentFilter");

    if (departmentFilter) {
        departmentFilter.addEventListener("change", displayStudents);
    }

    const yearFilter = document.getElementById("yearFilter");

    if (yearFilter) {
        yearFilter.addEventListener("change", displayStudents);
    }

    const attendanceDashboardDate =
        document.getElementById("attendanceDate");

    if (attendanceDashboardDate) {
        attendanceDashboardDate.addEventListener("change", async function () {
            const selectedDate = attendanceDashboardDate.value;

            const attendanceDateText =
                document.getElementById("attendanceDateText");

            if (attendanceDateText) {
                attendanceDateText.value = selectedDate;
            }

            await loadAttendance(selectedDate);

            updateStatistics();
            updateAttendanceSummary();
            updateHeaderDate();
        });
    }

    const studentSearch = document.getElementById("studentSearch");

    if (studentSearch) {
        studentSearch.addEventListener("input", searchStudentReport);
    }
}

function login() {
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const loginMessage = document.getElementById("loginMessage");

    if (!usernameInput || !passwordInput) {
        return;
    }

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    const user = users.find(function (item) {
        return (
            item.username === username &&
            item.password === password
        );
    });

    if (!user) {
        if (loginMessage) {
            loginMessage.textContent = "Invalid username or password.";
            loginMessage.style.color = "red";
        }

        return;
    }

    currentUser = {
        username: user.username,
        role: user.role
    };

    localStorage.setItem(
        "attendanceUser",
        JSON.stringify(currentUser)
    );

    if (loginMessage) {
        loginMessage.textContent = "";
    }

    showMainApplication();
}

function checkLogin() {
    const savedUser = localStorage.getItem("attendanceUser");

    if (!savedUser) {
        showLoginPage();
        return;
    }

    try {
        currentUser = JSON.parse(savedUser);

        if (
            !currentUser ||
            !currentUser.username ||
            !currentUser.role
        ) {
            throw new Error("Invalid user data");
        }

        showMainApplication();
    } catch (error) {
        console.error("Login data error:", error);

        localStorage.removeItem("attendanceUser");
        currentUser = null;

        showLoginPage();
    }
}

function showLoginPage() {
    const loginPage = document.getElementById("loginPage");
    const mainApp = document.getElementById("mainApp");

    if (loginPage) {
        loginPage.style.display = "flex";
    }

    if (mainApp) {
        mainApp.style.display = "none";
    }
}

function showMainApplication() {
    const loginPage = document.getElementById("loginPage");
    const mainApp = document.getElementById("mainApp");

    if (loginPage) {
        loginPage.style.display = "none";
    }

    if (mainApp) {
        mainApp.style.display = "flex";
    }

    updateUserInfo();
    updateRolePermissions();
    showSection("dashboard");
}

function logout() {
    currentUser = null;

    localStorage.removeItem("attendanceUser");

    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const loginMessage = document.getElementById("loginMessage");

    if (usernameInput) {
        usernameInput.value = "";
    }

    if (passwordInput) {
        passwordInput.value = "";
    }

    if (loginMessage) {
        loginMessage.textContent = "";
    }

    showLoginPage();
}

function updateUserInfo() {
    const userNameElements =
        document.querySelectorAll(".current-user-name");

    const userRoleElements =
        document.querySelectorAll(".current-user-role");

    userNameElements.forEach(function (element) {
        element.textContent = currentUser
            ? currentUser.username
            : "";
    });

    userRoleElements.forEach(function (element) {
        element.textContent = currentUser
            ? currentUser.role
            : "";
    });
}

function updateRolePermissions() {
    const isAdmin =
        currentUser &&
        currentUser.role === "Admin";

    const adminOnlyElements =
        document.querySelectorAll(".admin-only");

    adminOnlyElements.forEach(function (element) {
        element.style.display = isAdmin ? "" : "none";
    });
}


// ============================================================
// NAVIGATION
// ============================================================

function showSection(sectionId) {
    const sections =
        document.querySelectorAll(".content-section");

    sections.forEach(function (section) {
        section.classList.remove("active");
        section.style.display = "none";
    });

    const selectedSection =
        document.getElementById(sectionId);

    if (!selectedSection) {
        return;
    }

    selectedSection.classList.add("active");
    selectedSection.style.display = "block";

    const navButtons =
        document.querySelectorAll(".nav-btn");

    navButtons.forEach(function (button) {
        button.classList.remove("active");
    });

    navButtons.forEach(function (button) {
        const buttonSection =
            button.getAttribute("data-section");

        if (buttonSection === sectionId) {
            button.classList.add("active");
        }
    });

    updatePageTitle(sectionId);

    if (sectionId === "dashboard") {
        updateStatistics();
        updateAttendanceSummary();
    }

    if (sectionId === "students") {
        displayStudents();
    }

    if (sectionId === "attendance") {
        displayAttendance();
        updateAttendanceSummary();
    }

    if (sectionId === "reports") {
        searchStudentReport();
    }
}

function updatePageTitle(sectionId) {
    const pageTitle =
        document.getElementById("pageTitle");

    const pageSubtitle =
        document.getElementById("pageSubtitle");

    const titles = {
        dashboard: {
            title: "Dashboard",
            subtitle: "Overview of student attendance"
        },
        students: {
            title: "Students",
            subtitle: "Manage student information"
        },
        attendance: {
            title: "Attendance",
            subtitle: "Mark and manage attendance"
        },
        reports: {
            title: "Reports",
            subtitle: "View student attendance reports"
        }
    };

    const page = titles[sectionId];

    if (!page) {
        return;
    }

    if (pageTitle) {
        pageTitle.textContent = page.title;
    }

    if (pageSubtitle) {
        pageSubtitle.textContent = page.subtitle;
    }
}


// ============================================================
// DATE FUNCTIONS
// ============================================================

function getTodayDate() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(
        today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        today.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function setTodayDate() {
    const today = getTodayDate();

    const attendanceDate =
        document.getElementById("attendanceDate");

    const attendanceDateText =
        document.getElementById("attendanceDateText");

    if (attendanceDate) {
        attendanceDate.value = today;
    }

    if (attendanceDateText) {
        attendanceDateText.value = today;
    }
}

function getSelectedAttendanceDate() {
    const attendanceDateText =
        document.getElementById("attendanceDateText");

    const attendanceDate =
        document.getElementById("attendanceDate");

    if (
        attendanceDateText &&
        attendanceDateText.value
    ) {
        return attendanceDateText.value;
    }

    if (
        attendanceDate &&
        attendanceDate.value
    ) {
        return attendanceDate.value;
    }

    return getTodayDate();
}

function updateHeaderDate() {
    const dateElement =
        document.getElementById("headerDate");

    if (!dateElement) {
        return;
    }

    const selectedDate =
        getSelectedAttendanceDate();

    if (!selectedDate) {
        return;
    }

    const date = new Date(
        selectedDate + "T00:00:00"
    );

    dateElement.textContent =
        date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
}


// ============================================================
// STUDENTS - LOAD
// ============================================================

async function loadStudents() {
    try {
        const response = await fetch(
            BACKEND_URL + "/api/students"
        );

        if (!response.ok) {
            throw new Error(
                "Failed to load students"
            );
        }

        students = await response.json();

        displayStudents();
        updateStudentFilters();
    } catch (error) {
        console.error(
            "Load students error:",
            error
        );
    }
}


// ============================================================
// STUDENTS - DISPLAY
// ============================================================

function displayStudents() {
    const tableBody =
        document.getElementById("studentListBody");

    if (!tableBody) {
        return;
    }

    const searchInput =
        document.getElementById("studentListSearch");

    const departmentFilter =
        document.getElementById("departmentFilter");

    const yearFilter =
        document.getElementById("yearFilter");

    const searchTerm =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";

    const selectedDepartment =
        departmentFilter
            ? departmentFilter.value
            : "";

    const selectedYear =
        yearFilter
            ? yearFilter.value
            : "";

    const filteredStudents =
        students.filter(function (student) {
            const name =
                String(student.name || "")
                    .toLowerCase();

            const rollNumber =
                String(student.roll_number || "")
                    .toLowerCase();

            const department =
                String(student.department || "");

            const year =
                String(student.year || "");

            const matchesSearch =
                name.includes(searchTerm) ||
                rollNumber.includes(searchTerm);

            const matchesDepartment =
                !selectedDepartment ||
                department === selectedDepartment;

            const matchesYear =
                !selectedYear ||
                year === selectedYear;

            return (
                matchesSearch &&
                matchesDepartment &&
                matchesYear
            );
        });

    tableBody.innerHTML = "";

    if (filteredStudents.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data">
                    No students found.
                </td>
            </tr>
        `;

        updateStudentCount(0);
        return;
    }

    filteredStudents.forEach(function (student, index) {
        const row =
            document.createElement("tr");

        let actionButtons = "";

        if (
            currentUser &&
            currentUser.role === "Admin"
        ) {
            actionButtons = `
                <button
                    type="button"
                    class="edit-btn"
                    onclick="editStudent(${student.id})"
                >
                    ✏️ Edit
                </button>

                <button
                    type="button"
                    class="delete-btn"
                    onclick="deleteStudent(${student.id})"
                >
                    🗑️ Delete
                </button>
            `;
        } else {
            actionButtons = `
                <span class="teacher-access">
                    👁️ View Only
                </span>
            `;
        }

        row.innerHTML = `
            <td>${index + 1}</td>

            <td>
                ${escapeHtml(student.name)}
            </td>

            <td>
                ${escapeHtml(student.roll_number)}
            </td>

            <td>
                ${escapeHtml(student.department)}
            </td>

            <td>
                ${escapeHtml(student.year)}
            </td>

            <td class="action-buttons">
                ${actionButtons}
            </td>
        `;

        tableBody.appendChild(row);
    });

    updateStudentCount(
        filteredStudents.length
    );
}

function updateStudentCount(count) {
    const studentCount =
        document.getElementById("studentCount");

    if (studentCount) {
        studentCount.textContent = count;
    }
}

function updateStudentFilters() {
    const departmentFilter =
        document.getElementById("departmentFilter");

    const yearFilter =
        document.getElementById("yearFilter");

    if (departmentFilter) {
        const currentValue =
            departmentFilter.value;

        const departments =
            [...new Set(
                students.map(function (student) {
                    return student.department;
                })
            )].filter(Boolean);

        departmentFilter.innerHTML =
            `<option value="">All Departments</option>`;

        departments.forEach(function (department) {
            const option =
                document.createElement("option");

            option.value = department;
            option.textContent = department;

            departmentFilter.appendChild(option);
        });

        departmentFilter.value = currentValue;
    }

    if (yearFilter) {
        const currentValue =
            yearFilter.value;

        const years =
            [...new Set(
                students.map(function (student) {
                    return student.year;
                })
            )].filter(Boolean);

        yearFilter.innerHTML =
            `<option value="">All Years</option>`;

        years.forEach(function (year) {
            const option =
                document.createElement("option");

            option.value = year;
            option.textContent = year;

            yearFilter.appendChild(option);
        });

        yearFilter.value = currentValue;
    }
}


// ============================================================
// STUDENTS - ADD
// ============================================================

async function addStudent() {
    if (
        !currentUser ||
        currentUser.role !== "Admin"
    ) {
        alert(
            "Only Admin can add students."
        );
        return;
    }

    const name =
        document.getElementById("studentName").value.trim();

    const rollNumber =
        document.getElementById("rollNumber").value.trim();

    const department =
        document.getElementById("department").value.trim();

    const year =
        document.getElementById("year").value.trim();

    if (
        !name ||
        !rollNumber ||
        !department ||
        !year
    ) {
        alert(
            "Please fill in all student details."
        );
        return;
    }

    try {
        const response = await fetch(
            BACKEND_URL + "/api/students",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name: name,
                    roll_number: rollNumber,
                    department: department,
                    year: year
                })
            }
        );

        const data =
            await response.json();

        if (!response.ok) {
            alert(
                data.error ||
                "Failed to add student."
            );
            return;
        }

        alert(
            "Student added successfully!"
        );

        const studentForm =
            document.getElementById("studentForm");

        if (studentForm) {
            studentForm.reset();
        }

        await loadStudents();

        showSection("students");
    } catch (error) {
        console.error(
            "Add student error:",
            error
        );

        alert(
            "Could not connect to backend."
        );
    }
}


// ============================================================
// STUDENTS - EDIT
// ============================================================

async function editStudent(studentId) {
    if (
        !currentUser ||
        currentUser.role !== "Admin"
    ) {
        alert(
            "Only Admin can edit students."
        );
        return;
    }

    const student =
        students.find(function (item) {
            return Number(item.id) === Number(studentId);
        });

    if (!student) {
        alert("Student not found.");
        return;
    }

    const name =
        prompt(
            "Enter student name:",
            student.name
        );

    if (name === null) {
        return;
    }

    const rollNumber =
        prompt(
            "Enter roll number:",
            student.roll_number
        );

    if (rollNumber === null) {
        return;
    }

    const department =
        prompt(
            "Enter department:",
            student.department
        );

    if (department === null) {
        return;
    }

    const year =
        prompt(
            "Enter year:",
            student.year
        );

    if (year === null) {
        return;
    }

    if (
        !name.trim() ||
        !rollNumber.trim() ||
        !department.trim() ||
        !year.trim()
    ) {
        alert(
            "All fields are required."
        );
        return;
    }

    try {
        const response = await fetch(
            BACKEND_URL +
            "/api/students/" +
            studentId,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name: name.trim(),
                    roll_number: rollNumber.trim(),
                    department: department.trim(),
                    year: year.trim()
                })
            }
        );

        const data =
            await response.json();

        if (!response.ok) {
            alert(
                data.error ||
                "Failed to update student."
            );
            return;
        }

        alert(
            "Student updated successfully!"
        );

        await loadStudents();

        showSection("students");
    } catch (error) {
        console.error(
            "Edit student error:",
            error
        );

        alert(
            "Could not connect to backend."
        );
    }
}


// ============================================================
// STUDENTS - DELETE
// ============================================================

async function deleteStudent(studentId) {
    if (
        !currentUser ||
        currentUser.role !== "Admin"
    ) {
        alert(
            "Only Admin can delete students."
        );
        return;
    }

    const student =
        students.find(function (item) {
            return Number(item.id) === Number(studentId);
        });

    if (!student) {
        alert("Student not found.");
        return;
    }

    const confirmed =
        confirm(
            `Are you sure you want to delete ${student.name}?`
        );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(
            BACKEND_URL +
            "/api/students/" +
            studentId,
            {
                method: "DELETE"
            }
        );

        const data =
            await response.json();

        if (!response.ok) {
            alert(
                data.error ||
                "Failed to delete student."
            );
            return;
        }

        alert(
            "Student deleted successfully!"
        );

        await loadStudents();

        showSection("students");
    } catch (error) {
        console.error(
            "Delete student error:",
            error
        );

        alert(
            "Could not connect to backend."
        );
    }
}


// ============================================================
// ATTENDANCE - LOAD
// ============================================================

async function loadAttendance(date = null) {
    const selectedDate =
        date || getSelectedAttendanceDate();

    try {
        const response = await fetch(
            BACKEND_URL +
            "/api/attendance?date=" +
            encodeURIComponent(selectedDate)
        );

        if (!response.ok) {
            throw new Error(
                "Failed to load attendance"
            );
        }

        const records =
            await response.json();

        attendanceRecords[selectedDate] = {};

        records.forEach(function (record) {
            attendanceRecords[selectedDate][
                record.student_id
            ] = record.status;
        });

        renderAttendanceTable(selectedDate);
    } catch (error) {
        console.error(
            "Load attendance error:",
            error
        );

        if (
            !attendanceRecords[selectedDate]
        ) {
            attendanceRecords[selectedDate] = {};
        }
    }
}


// ============================================================
// ATTENDANCE - DISPLAY
// ============================================================

function displayAttendance() {
    const selectedDate =
        getSelectedAttendanceDate();

    renderAttendanceTable(selectedDate);
}

function renderAttendanceTable(selectedDate) {
    const tableBody =
        document.getElementById(
            "attendanceTableBody"
        );

    if (!tableBody) {
        return;
    }

    if (!attendanceRecords[selectedDate]) {
        attendanceRecords[selectedDate] = {};
    }

    tableBody.innerHTML = "";

    if (students.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="no-data">
                    No students available.
                </td>
            </tr>
        `;
        return;
    }

    students.forEach(function (student, index) {
        const status =
            attendanceRecords[selectedDate][
                student.id
            ];

        let statusText =
            "Not Marked";

        let statusClass =
            "status-not-marked";

        if (status === "Present") {
            statusText = "Present";
            statusClass = "status-present";
        }

        if (status === "Absent") {
            statusText = "Absent";
            statusClass = "status-absent";
        }

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>${index + 1}</td>

            <td>
                ${escapeHtml(student.name)}
            </td>

            <td>
                ${escapeHtml(student.roll_number)}
            </td>

            <td>
                <span class="${statusClass}">
                    ${statusText}
                </span>
            </td>

            <td class="attendance-actions">
                <button
                    type="button"
                    class="attendance-present-btn"
                    onclick="markAttendance(${student.id}, 'Present')"
                >
                    ✅ Present
                </button>

                <button
                    type="button"
                    class="attendance-absent-btn"
                    onclick="markAttendance(${student.id}, 'Absent')"
                >
                    ❌ Absent
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}


// ============================================================
// ATTENDANCE - MARK
// ============================================================

async function markAttendance(
    studentId,
    status,
    date = null
) {
    const selectedDate =
        date || getSelectedAttendanceDate();

    if (
        status !== "Present" &&
        status !== "Absent"
    ) {
        alert("Invalid attendance status.");
        return false;
    }

    try {
        const response = await fetch(
            BACKEND_URL + "/api/attendance",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    student_id: studentId,
                    date: selectedDate,
                    status: status
                })
            }
        );

        const data =
            await response.json();

        if (!response.ok) {
            alert(
                data.error ||
                "Failed to save attendance."
            );

            return false;
        }

        if (!attendanceRecords[selectedDate]) {
            attendanceRecords[selectedDate] = {};
        }

        attendanceRecords[selectedDate][
            studentId
        ] = status;

        renderAttendanceTable(selectedDate);
        updateAttendanceSummary();
        updateStatistics();

        return true;
    } catch (error) {
        console.error(
            "Attendance error:",
            error
        );

        alert(
            "Could not connect to backend."
        );

        return false;
    }
}


// ============================================================
// ATTENDANCE - MARK ALL
// ============================================================

async function markAllAttendance(status) {
    if (
        status !== "Present" &&
        status !== "Absent"
    ) {
        return;
    }

    if (students.length === 0) {
        alert("No students available.");
        return;
    }

    const selectedDate =
        getSelectedAttendanceDate();

    for (const student of students) {
        await markAttendance(
            student.id,
            status,
            selectedDate
        );
    }

    renderAttendanceTable(selectedDate);
    updateAttendanceSummary();
    updateStatistics();
}


// ============================================================
// ATTENDANCE - SUMMARY
// ============================================================

function updateAttendanceSummary() {
    const selectedDate =
        getSelectedAttendanceDate();

    const records =
        attendanceRecords[selectedDate] || {};

    let present = 0;
    let absent = 0;

    students.forEach(function (student) {
        const status =
            records[student.id];

        if (status === "Present") {
            present++;
        }

        if (status === "Absent") {
            absent++;
        }
    });

    const total =
        students.length;

    const notMarked =
        Math.max(
            0,
            total - present - absent
        );

    const summaryTotal =
        document.getElementById("summaryTotal");

    const summaryPresent =
        document.getElementById("summaryPresent");

    const summaryAbsent =
        document.getElementById("summaryAbsent");

    const summaryNotMarked =
        document.getElementById("summaryNotMarked");

    if (summaryTotal) {
        summaryTotal.textContent = total;
    }

    if (summaryPresent) {
        summaryPresent.textContent = present;
    }

    if (summaryAbsent) {
        summaryAbsent.textContent = absent;
    }

    if (summaryNotMarked) {
        summaryNotMarked.textContent = notMarked;
    }
}


// ============================================================
// DASHBOARD STATISTICS
// ============================================================

function updateStatistics() {
    const selectedDate =
        getSelectedAttendanceDate();

    const records =
        attendanceRecords[selectedDate] || {};

    let present = 0;
    let absent = 0;

    students.forEach(function (student) {
        const status =
            records[student.id];

        if (status === "Present") {
            present++;
        }

        if (status === "Absent") {
            absent++;
        }
    });

    const total =
        students.length;

    const notMarked =
        Math.max(
            0,
            total - present - absent
        );

    const attendancePercentage =
        total > 0
            ? Math.round((present / total) * 100)
            : 0;

    const presentPercentage =
        total > 0
            ? Math.round((present / total) * 100)
            : 0;

    const absentPercentage =
        total > 0
            ? Math.round((absent / total) * 100)
            : 0;

    const notMarkedPercentage =
        total > 0
            ? Math.round((notMarked / total) * 100)
            : 0;

    setText(
        "totalStudents",
        total
    );

    setText(
        "presentStudents",
        present
    );

    setText(
        "absentStudents",
        absent
    );

    setText(
        "attendancePercentage",
        attendancePercentage + "%"
    );

    setText(
        "presentPercentage",
        presentPercentage + "%"
    );

    setText(
        "absentPercentage",
        absentPercentage + "%"
    );

    setText(
        "notMarkedPercentage",
        notMarkedPercentage + "%"
    );

    const presentBar =
        document.getElementById("presentBar");

    const absentBar =
        document.getElementById("absentBar");

    const notMarkedBar =
        document.getElementById("notMarkedBar");

    if (presentBar) {
        presentBar.style.width =
            presentPercentage + "%";
    }

    if (absentBar) {
        absentBar.style.width =
            absentPercentage + "%";
    }

    if (notMarkedBar) {
        notMarkedBar.style.width =
            notMarkedPercentage + "%";
    }
}


// ============================================================
// REPORTS
// ============================================================

async function searchStudentReport() {
    const reportContainer =
        document.getElementById("studentReport");

    const searchInput =
        document.getElementById("studentSearch");

    if (!reportContainer) {
        return;
    }

    const searchTerm =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";

    if (!searchTerm) {
        reportContainer.innerHTML = `
            <div class="report-placeholder">
                Search for a student to view attendance report.
            </div>
        `;
        return;
    }

    const student =
        students.find(function (item) {
            const name =
                String(item.name || "")
                    .toLowerCase();

            const rollNumber =
                String(item.roll_number || "")
                    .toLowerCase();

            return (
                name.includes(searchTerm) ||
                rollNumber.includes(searchTerm)
            );
        });

    if (!student) {
        reportContainer.innerHTML = `
            <div class="report-placeholder">
                No student found.
            </div>
        `;
        return;
    }

    try {
        const response = await fetch(
            BACKEND_URL +
            "/api/attendance/student/" +
            student.id
        );

        if (!response.ok) {
            throw new Error(
                "Failed to load student report"
            );
        }

        const records =
            await response.json();

        let present = 0;
        let absent = 0;

        records.forEach(function (record) {
            if (record.status === "Present") {
                present++;
            }

            if (record.status === "Absent") {
                absent++;
            }
        });

        const totalMarked =
            records.length;

        const percentage =
            totalMarked > 0
                ? Math.round(
                    (present / totalMarked) * 100
                )
                : 0;

        let attendanceRows = "";

        if (records.length === 0) {
            attendanceRows = `
                <tr>
                    <td colspan="2">
                        No attendance records found.
                    </td>
                </tr>
            `;
        } else {
            records.forEach(function (record) {
                const statusClass =
                    record.status === "Present"
                        ? "status-present"
                        : "status-absent";

                attendanceRows += `
                    <tr>
                        <td>
                            ${escapeHtml(record.date)}
                        </td>

                        <td>
                            <span class="${statusClass}">
                                ${escapeHtml(record.status)}
                            </span>
                        </td>
                    </tr>
                `;
            });
        }

        reportContainer.innerHTML = `
            <div class="student-report-card">

                <h3>
                    ${escapeHtml(student.name)}
                </h3>

                <p>
                    Roll Number:
                    <strong>
                        ${escapeHtml(student.roll_number)}
                    </strong>
                </p>

                <p>
                    Department:
                    <strong>
                        ${escapeHtml(student.department)}
                    </strong>
                </p>

                <p>
                    Year:
                    <strong>
                        ${escapeHtml(student.year)}
                    </strong>
                </p>

                <div class="report-stats">

                    <div class="report-stat">
                        <span>Total Marked</span>
                        <strong>${totalMarked}</strong>
                    </div>

                    <div class="report-stat">
                        <span>Present</span>
                        <strong>${present}</strong>
                    </div>

                    <div class="report-stat">
                        <span>Absent</span>
                        <strong>${absent}</strong>
                    </div>

                    <div class="report-stat">
                        <span>Attendance</span>
                        <strong>${percentage}%</strong>
                    </div>

                </div>

                <div class="report-table-wrapper">

                    <table class="report-table">

                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            ${attendanceRows}
                        </tbody>

                    </table>

                </div>

            </div>
        `;
    } catch (error) {
        console.error(
            "Student report error:",
            error
        );

        reportContainer.innerHTML = `
            <div class="report-placeholder">
                Could not load student report.
            </div>
        `;
    }
}


// ============================================================
// SAVE ATTENDANCE MESSAGE
// ============================================================

function saveAttendanceMessage() {
    const selectedDate =
        getSelectedAttendanceDate();

    const records =
        attendanceRecords[selectedDate] || {};

    let present = 0;
    let absent = 0;

    Object.values(records).forEach(function (status) {
        if (status === "Present") {
            present++;
        }

        if (status === "Absent") {
            absent++;
        }
    });

    const notMarked =
        Math.max(
            0,
            students.length - present - absent
        );

    alert(
        `Attendance saved successfully!\n\n` +
        `Date: ${selectedDate}\n` +
        `Present: ${present}\n` +
        `Absent: ${absent}\n` +
        `Not Marked: ${notMarked}`
    );
}


// ============================================================
// CSV EXPORT
// ============================================================

function csvEscape(value) {
    return (
        '"' +
        String(value ?? "")
            .replace(/"/g, '""') +
        '"'
    );
}

function exportAttendanceCSV() {
    const selectedDate =
        getSelectedAttendanceDate();

    const records =
        attendanceRecords[selectedDate] || {};

    if (students.length === 0) {
        alert(
            "No student attendance data available."
        );
        return;
    }

    let csv =
        "Roll Number,Name,Department,Year,Date,Status\n";

    students.forEach(function (student) {
        const status =
            records[student.id] ||
            "Not Marked";

        csv +=
            csvEscape(student.roll_number) +
            "," +
            csvEscape(student.name) +
            "," +
            csvEscape(student.department) +
            "," +
            csvEscape(student.year) +
            "," +
            csvEscape(selectedDate) +
            "," +
            csvEscape(status) +
            "\n";
    });

    const blob =
        new Blob(
            [csv],
            {
                type: "text/csv;charset=utf-8;"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        "attendance_" +
        selectedDate +
        ".csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}


// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function setText(elementId, value) {
    const element =
        document.getElementById(elementId);

    if (element) {
        element.textContent = value;
    }
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ============================================================
// GLOBAL FUNCTIONS
// ============================================================

window.showSection = showSection;
window.login = login;
window.logout = logout;

window.addStudent = addStudent;
window.editStudent = editStudent;
window.deleteStudent = deleteStudent;

window.markAttendance = markAttendance;
window.markAllAttendance = markAllAttendance;

window.saveAttendanceMessage =
    saveAttendanceMessage;

window.exportAttendanceCSV =
    exportAttendanceCSV;

window.searchStudentReport =
    searchStudentReport;