/* =========================================================
   JTEN RFID ATTENDANCE SYSTEM
   Frontend-only | GitHub Pages safe | Demo-ready
========================================================= */

const STORAGE_KEY = "jten_attendance_system";

/* ===================== DATABASE ===================== */
function loadDB() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
    users: [
      { username: "admin", password: "123", role: "admin" }
    ],
    students: [],        // { studentNo, name, subjects: [] }
    subjects: [],        // { id, code }
    attendance: [],      // { studentNo, subjectId, time, status }
    session: { active: false, subjectId: null }
  };
}

function saveDB() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DB));
}

let DB = loadDB();
const app = document.getElementById("app");

/* ===================== INIT ===================== */
document.addEventListener("DOMContentLoaded", () => {
  renderLogin();
});

/* ===================== LOGIN ===================== */
function renderLogin() {
  app.innerHTML = `
    <div class="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 class="text-xl font-bold mb-4 text-center">Login</h2>

      <input id="loginUser" class="border p-2 w-full mb-3 rounded"
        placeholder="Username / Student No">
      <input id="loginPass" type="password" class="border p-2 w-full mb-4 rounded"
        placeholder="Password">

      <button onclick="login()"
        class="w-full bg-sky-600 text-white py-2 rounded">
        Login
      </button>

      <p class="text-xs text-center mt-3 text-gray-500">
        Admin: admin / 123
      </p>
    </div>
  `;
}

function login() {
  const u = loginUser.value.trim();
  const p = loginPass.value.trim();

  if (u === "admin" && p === "123") {
    return registrarUI();
  }

  const student = DB.students.find(s => s.studentNo === u);
  if (student) {
    return studentUI(student);
  }

  alert("Invalid login");
}

/* ===================== REGISTRAR ===================== */
function registrarUI() {
  app.innerHTML = `
    <div class="bg-white p-6 rounded shadow max-w-5xl mx-auto">
      <h2 class="text-xl font-bold mb-4">Registrar Panel</h2>

      <div class="grid md:grid-cols-2 gap-6">

        <div>
          <h3 class="font-bold mb-2">Enroll Student</h3>
          <input id="stNo" class="border p-2 w-full mb-2" placeholder="Student No">
          <input id="stName" class="border p-2 w-full mb-2" placeholder="Student Name">
          <button onclick="addStudent()"
            class="bg-green-600 text-white px-3 py-1 rounded">
            Add Student
          </button>
        </div>

        <div>
          <h3 class="font-bold mb-2">Create Subject</h3>
          <input id="subCode" class="border p-2 w-full mb-2" placeholder="Subject Code">
          <button onclick="addSubject()"
            class="bg-green-600 text-white px-3 py-1 rounded">
            Add Subject
          </button>
        </div>

      </div>

      <div class="mt-6">
        <h3 class="font-bold mb-2">Assign Subject to Student</h3>
        <select id="assignStudent" class="border p-2 w-full mb-2"></select>
        <select id="assignSubject" class="border p-2 w-full mb-2"></select>
        <button onclick="assignSubject()"
          class="bg-blue-600 text-white px-3 py-1 rounded">
          Assign
        </button>
      </div>

      <div class="mt-6 flex gap-2">
        <button onclick="professorUI()"
          class="bg-purple-600 text-white px-4 py-2 rounded">
          Go to Professor
        </button>
        <button onclick="renderLogin()"
          class="bg-gray-500 text-white px-4 py-2 rounded">
          Logout
        </button>
      </div>
    </div>
  `;

  refreshRegistrarLists();
}

function addStudent() {
  if (!stNo.value || !stName.value) return;
  DB.students.push({
    studentNo: stNo.value,
    name: stName.value,
    subjects: []
  });
  saveDB();
  registrarUI();
}

function addSubject() {
  if (!subCode.value) return;
  DB.subjects.push({
    id: Date.now(),
    code: subCode.value
  });
  saveDB();
  registrarUI();
}

function refreshRegistrarLists() {
  assignStudent.innerHTML = DB.students
    .map(s => `<option value="${s.studentNo}">${s.studentNo} - ${s.name}</option>`)
    .join("");

  assignSubject.innerHTML = DB.subjects
    .map(s => `<option value="${s.id}">${s.code}</option>`)
    .join("");
}

function assignSubject() {
  const student = DB.students.find(s => s.studentNo === assignStudent.value);
  const subjectId = Number(assignSubject.value);

  if (!student.subjects.includes(subjectId)) {
    student.subjects.push(subjectId);
  }

  saveDB();
  alert("Subject assigned");
}

/* ===================== PROFESSOR ===================== */
function professorUI() {
  DB.session.active = false;
  DB.session.subjectId = null;
  saveDB();

  app.innerHTML = `
    <div class="bg-white p-6 rounded shadow max-w-3xl mx-auto">
      <h2 class="text-xl font-bold mb-4">Professor Attendance</h2>

      <select id="profSubject" class="border p-2 w-full mb-3">
        ${DB.subjects.map(s => `<option value="${s.id}">${s.code}</option>`).join("")}
      </select>

      <button onclick="startSession()"
        class="bg-green-600 text-white px-4 py-2 rounded mb-3">
        Start Session
      </button>

      <input id="scanInput" class="border p-2 w-full mb-4"
        placeholder="Tap RFID / Type Student No then ENTER">

      <div id="attendanceTable"></div>

      <button onclick="registrarUI()"
        class="mt-4 bg-gray-500 text-white px-3 py-1 rounded">
        Back
      </button>
    </div>
  `;

  scanInput.addEventListener("keydown", e => {
    if (e.key === "Enter") autoTap();
  });
}

function startSession() {
  DB.session.active = true;
  DB.session.subjectId = Number(profSubject.value);
  saveDB();
  alert("Session Started");
}

function autoTap() {
  if (!DB.session.active) return alert("Session not started");

  const uid = scanInput.value.trim();
  if (!uid) return;

  const now = new Date();
  const status =
    now.getHours() < 8 || (now.getHours() === 8 && now.getMinutes() === 0)
      ? "PRESENT"
      : "LATE";

  DB.attendance.unshift({
    studentNo: uid,
    subjectId: DB.session.subjectId,
    time: now.toLocaleTimeString(),
    status
  });

  saveDB();
  scanInput.value = "";
  renderAttendanceTable();
}

function renderAttendanceTable() {
  attendanceTable.innerHTML = `
    <table class="w-full border text-sm">
      <tr class="bg-slate-100">
        <th class="border p-1">Student No</th>
        <th class="border p-1">Time</th>
        <th class="border p-1">Status</th>
      </tr>
      ${DB.attendance.map(a => `
        <tr>
          <td class="border p-1">${a.studentNo}</td>
          <td class="border p-1">${a.time}</td>
          <td class="border p-1 font-bold">${a.status}</td>
        </tr>
      `).join("")}
    </table>
  `;
}

/* ===================== STUDENT ===================== */
function studentUI(student) {
  const records = DB.attendance.filter(a => a.studentNo === student.studentNo);

  app.innerHTML = `
    <div class="bg-white p-6 rounded shadow max-w-xl mx-auto">
      <h2 class="text-xl font-bold mb-4">My Attendance</h2>

      <table class="w-full border text-sm">
        <tr class="bg-slate-100">
          <th class="border p-1">Time</th>
          <th class="border p-1">Status</th>
        </tr>
        ${records.map(r => `
          <tr>
            <td class="border p-1">${r.time}</td>
            <td class="border p-1 font-bold">${r.status}</td>
          </tr>
        `).join("")}
      </table>

      <button onclick="renderLogin()"
        class="mt-4 bg-gray-500 text-white px-3 py-1 rounded">
        Logout
      </button>
    </div>
  `;
}
