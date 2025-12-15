/* ========= SIMPLE RFID ATTENDANCE SYSTEM (FRONTEND ONLY) ========= */

/* ---------- STORAGE ---------- */
const DB_KEY = "jten_attendance_db";

function loadDB() {
  return JSON.parse(localStorage.getItem(DB_KEY)) || {
    users: [
      { username: "admin", password: "123", role: "admin", name: "Super Admin" }
    ],
    students: [],
    subjects: [],
    attendance: [],
    session: { active: false, subjectId: null }
  };
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

let DB = loadDB();
const app = document.getElementById("app");

/* ---------- INIT ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderLogin();
});

/* ---------- LOGIN ---------- */
function renderLogin() {
  app.innerHTML = `
    <div class="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 class="text-xl font-bold mb-4 text-center">Login</h2>

      <input id="user" class="w-full border p-2 mb-3 rounded" placeholder="Username / Student No"/>
      <input id="pass" type="password" class="w-full border p-2 mb-4 rounded" placeholder="Password"/>

      <button onclick="login()" class="w-full bg-sky-600 text-white py-2 rounded">Login</button>
    </div>
  `;
}

function login() {
  const u = user.value.trim();
  const p = pass.value.trim();

  const admin = DB.users.find(x => x.username === u && x.password === p);
  if (admin) {
    renderAdmin();
    return;
  }

  const student = DB.students.find(s => s.studentNo === u);
  if (student) {
    renderStudent(student);
    return;
  }

  alert("Invalid login");
}

/* ---------- ADMIN / REGISTRAR ---------- */
function renderAdmin() {
  app.innerHTML = `
    <div class="bg-white p-6 rounded shadow">
      <h2 class="text-xl font-bold mb-4">Registrar / Admin</h2>

      <h3 class="font-bold mt-2">Enroll Student</h3>
      <input id="sn" class="border p-2 w-full mb-2" placeholder="Student No"/>
      <input id="snm" class="border p-2 w-full mb-2" placeholder="Name"/>
      <button onclick="addStudent()" class="bg-green-600 text-white px-3 py-1 rounded mb-4">Add Student</button>

      <h3 class="font-bold">Create Subject</h3>
      <input id="sub" class="border p-2 w-full mb-2" placeholder="Subject Code"/>
      <button onclick="addSubject()" class="bg-green-600 text-white px-3 py-1 rounded mb-4">Add Subject</button>

      <h3 class="font-bold">Assign Subject to Student</h3>
      <select id="asStudent" class="border p-2 w-full mb-2"></select>
      <select id="asSubject" class="border p-2 w-full mb-2"></select>
      <button onclick="assignSubject()" class="bg-blue-600 text-white px-3 py-1 rounded">Assign</button>

      <button onclick="renderLogin()" class="mt-4 bg-gray-500 text-white px-3 py-1 rounded">Logout</button>
    </div>
  `;
  populateSelects();
}

function addStudent() {
  if (!sn.value || !snm.value) return;
  DB.students.push({ studentNo: sn.value, name: snm.value, subjects: [] });
  saveDB(DB);
  renderAdmin();
}

function addSubject() {
  if (!sub.value) return;
  DB.subjects.push({ id: Date.now(), code: sub.value });
  saveDB(DB);
  renderAdmin();
}

function populateSelects() {
  asStudent.innerHTML = DB.students.map(s => `<option value="${s.studentNo}">${s.name}</option>`).join("");
  asSubject.innerHTML = DB.subjects.map(s => `<option value="${s.id}">${s.code}</option>`).join("");
}

function assignSubject() {
  const st = DB.students.find(s => s.studentNo === asStudent.value);
  const sid = Number(asSubject.value);
  if (!st.subjects.includes(sid)) st.subjects.push(sid);
  saveDB(DB);
  alert("Assigned");
}

/* ---------- PROFESSOR ---------- */
function renderProfessor(subjectId) {
  DB.session = { active: false, subjectId };
  saveDB(DB);

  app.innerHTML = `
    <div class="bg-white p-6 rounded shadow">
      <h2 class="text-xl font-bold mb-4">Professor Attendance</h2>

      <button onclick="startSession()" class="bg-green-600 text-white px-4 py-2 rounded mb-3">
        Start Session
      </button>

      <input id="scan" class="border p-2 w-full mb-3"
        placeholder="Tap RFID / Type Student No then ENTER"/>

      <div id="att"></div>

      <button onclick="renderLogin()" class="mt-4 bg-gray-500 text-white px-3 py-1 rounded">Logout</button>
    </div>
  `;

  scan.addEventListener("keydown", e => {
    if (e.key === "Enter") tapIn();
  });
}

function startSession() {
  DB.session.active = true;
  saveDB(DB);
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

  saveDB(DB);
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
function renderStudent(st) {
  const rec = DB.attendance.filter(a => a.studentNo === st.studentNo);

  app.innerHTML = `
    <div class="bg-white p-6 rounded shadow">
      <h2 class="text-xl font-bold mb-4">Student Attendance</h2>

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

      <button onclick="renderLogin()" class="mt-4 bg-gray-500 text-white px-3 py-1 rounded">Logout</button>
    </div>
  `;
}
