/* ================= JTEN RFID ATTENDANCE SYSTEM ================= */
/* FRONTEND ONLY – DEMO READY */

const KEY = "jten_demo_db";

/* ---------- DATABASE ---------- */
function loadDB() {
  return JSON.parse(localStorage.getItem(KEY)) || {
    users: [
      { username: "admin", password: "123", role: "admin" }
    ],
    students: [],
    subjects: [],
    attendance: [],
    session: { active: false, subject: null }
  };
}

function saveDB() {
  localStorage.setItem(KEY, JSON.stringify(DB));
}

let DB = loadDB();
const app = document.getElementById("app");

/* ---------- INIT ---------- */
document.addEventListener("DOMContentLoaded", () => {
  loginUI();
});

/* ---------- LOGIN ---------- */
function loginUI() {
  app.innerHTML = `
    <div class="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 class="text-xl font-bold mb-4 text-center">Login</h2>

      <input id="u" class="border p-2 w-full mb-3 rounded" placeholder="Username / Student No">
      <input id="p" type="password" class="border p-2 w-full mb-4 rounded" placeholder="Password">

      <button onclick="login()" class="w-full bg-sky-600 text-white py-2 rounded">
        Login
      </button>

      <p class="text-xs text-center mt-3">admin / 123</p>
    </div>
  `;
}

function login() {
  const u = document.getElementById("u").value.trim();
  const p = document.getElementById("p").value.trim();

  if (u === "admin" && p === "123") return adminUI();

  const student = DB.students.find(s => s.studentNo === u);
  if (student) return studentUI(student);

  return alert("Invalid login");
}

/* ---------- ADMIN / REGISTRAR ---------- */
function adminUI() {
  app.innerHTML = `
    <div class="bg-white p-6 rounded shadow max-w-4xl mx-auto">
      <h2 class="text-xl font-bold mb-4">Registrar Panel</h2>

      <div class="grid md:grid-cols-2 gap-6">

        <div>
          <h3 class="font-bold mb-2">Enroll Student</h3>
          <input id="sn" class="border p-2 w-full mb-2" placeholder="Student No">
          <input id="nm" class="border p-2 w-full mb-2" placeholder="Name">
          <button onclick="addStudent()" class="bg-green-600 text-white px-3 py-1 rounded">
            Add Student
          </button>
        </div>

        <div>
          <h3 class="font-bold mb-2">Create Subject</h3>
          <input id="sc" class="border p-2 w-full mb-2" placeholder="Subject Code">
          <button onclick="addSubject()" class="bg-green-600 text-white px-3 py-1 rounded">
            Add Subject
          </button>
        </div>

      </div>

      <div class="mt-6">
        <h3 class="font-bold mb-2">Assign Subject to Student</h3>
        <select id="asStudent" class="border p-2 w-full mb-2"></select>
        <select id="asSubject" class="border p-2 w-full mb-2"></select>
        <button onclick="assignSubject()" class="bg-blue-600 text-white px-3 py-1 rounded">
          Assign
        </button>
      </div>

      <div class="mt-6">
        <button onclick="professorUI()" class="bg-purple-600 text-white px-3 py-1 rounded">
          Go to Professor
        </button>
        <button onclick="loginUI()" class="ml-2 bg-gray-500 text-white px-3 py-1 rounded">
          Logout
        </button>
      </div>
    </div>
  `;

  refreshSelects();
}

function addStudent() {
  if (!sn.value || !nm.value) return;
  DB.students.push({ studentNo: sn.value, name: nm.value, subjects: [] });
  saveDB();
  adminUI();
}

function addSubject() {
  if (!sc.value) return;
  DB.subjects.push({ id: Date.now(), code: sc.value });
  saveDB();
  adminUI();
}

function refreshSelects() {
  asStudent.innerHTML = DB.students.map(s =>
    `<option value="${s.studentNo}">${s.name}</option>`).join("");
  asSubject.innerHTML = DB.subjects.map(s =>
    `<option value="${s.id}">${s.code}</option>`).join("");
}

function assignSubject() {
  const st = DB.students.find(s => s.studentNo === asStudent.value);
  const sid = Number(asSubject.value);
  if (!st.subjects.includes(sid)) st.subjects.push(sid);
  saveDB();
  alert("Subject Assigned");
}

/* ---------- PROFESSOR ---------- */
function professorUI() {
  DB.session.active = false;
  saveDB();

  app.innerHTML = `
    <div class="bg-white p-6 rounded shadow max-w-2xl mx-auto">
      <h2 class="text-xl font-bold mb-4">Professor Attendance</h2>

      <button onclick="startSession()" class="bg-green-600 text-white px-4 py-2 rounded mb-3">
        Start Session
      </button>

      <input id="scan" class="border p-2 w-full mb-4"
        placeholder="Tap RFID / Type Student No then ENTER">

      <div id="att"></div>

      <button onclick="adminUI()" class="mt-4 bg-gray-500 text-white px-3 py-1 rounded">
        Back
      </button>
    </div>
  `;

  scan.addEventListener("keydown", e => {
    if (e.key === "Enter") tapIn();
  });
}

function startSession() {
  DB.session.active = true;
  saveDB();
  alert("Session Started");
}

function tapIn() {
  if (!DB.session.active) return alert("Session not started");

  const uid = scan.value.trim();
  if (!uid) return;

  const now = new Date();
  const status =
    now.getHours() < 8 || (now.getHours() === 8 && now.getMinutes() === 0)
      ? "PRESENT"
      : "LATE";

  DB.attendance.unshift({
    studentNo: uid,
    time: now.toLocaleTimeString(),
    status
  });

  saveDB();
  scan.value = "";
  renderAttendance();
}

function renderAttendance() {
  att.innerHTML = `
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

/* ---------- STUDENT ---------- */
function studentUI(st) {
  const rec = DB.attendance.filter(a => a.studentNo === st.studentNo);

  app.innerHTML = `
    <div class="bg-white p-6 rounded shadow max-w-xl mx-auto">
      <h2 class="text-xl font-bold mb-4">My Attendance</h2>

      <table class="w-full border text-sm">
        <tr class="bg-slate-100">
          <th class="border p-1">Time</th>
          <th class="border p-1">Status</th>
        </tr>
        ${rec.map(r => `
          <tr>
            <td class="border p-1">${r.time}</td>
            <td class="border p-1 font-bold">${r.status}</td>
          </tr>
        `).join("")}
      </table>

      <button onclick="loginUI()" class="mt-4 bg-gray-500 text-white px-3 py-1 rounded">
        Logout
      </button>
    </div>
  `;
}
