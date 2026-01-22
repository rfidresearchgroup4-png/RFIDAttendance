/* ==================================================
   RFID ATTENDANCE SYSTEM
   STABLE BASELINE + NAME DISPLAY + SEAT ARRANGEMENT
   ================================================== */

const app = document.getElementById("app");

/* ---------------- DATABASE ---------------- */
const DB = {
  users: JSON.parse(localStorage.getItem("users")) || [
    { u: "admin", p: "123", role: "admin" }
  ],
  students: JSON.parse(localStorage.getItem("students")) || [],
  professors: JSON.parse(localStorage.getItem("professors")) || [],
  subjects: JSON.parse(localStorage.getItem("subjects")) || [],
  attendance: JSON.parse(localStorage.getItem("attendance")) || []
};

/* ---------------- MIGRATION (add seat field) ---------------- */
DB.students = DB.students.map(s => ({
  ...s,
  seat: s.seat || "" // NEW
}));
saveDB();

function saveDB() {
  Object.keys(DB).forEach(k =>
    localStorage.setItem(k, JSON.stringify(DB[k]))
  );
}

let currentUser = null;

/* ---------------- LOGIN ---------------- */
function loginUI() {
  app.innerHTML = `
    <div class="card" style="max-width:400px;margin:auto">
      <h2>Login</h2>

      <input id="lu" placeholder="Username / Student No">

      <div style="display:flex;gap:6px">
        <input id="lp" type="password" placeholder="Password" style="flex:1">
        <button onclick="togglePass('lp')">👁️</button>
      </div>

      <button onclick="login()">Login</button>
      <p><b>admin / 123</b></p>
    </div>
  `;
}

function togglePass(id) {
  const el = document.getElementById(id);
  el.type = el.type === "password" ? "text" : "password";
}

function login() {
  const u = lu.value.trim();
  const p = lp.value.trim();

  const admin = DB.users.find(x => x.u === u && x.p === p);
  if (admin) {
    currentUser = admin;
    return registrarUI();
  }

  const prof = DB.professors.find(x => x.u === u && x.p === p);
  if (prof) {
    currentUser = prof;
    return professorUI(prof);
  }

  const student = DB.students.find(x => x.no === u);
  if (student) {
    currentUser = student;
    return studentUI(student);
  }

  alert("Invalid login");
}

/* ---------------- REGISTRAR ---------------- */
function registrarUI(tab = "students") {
  app.innerHTML = `
    <div class="card">
      <h2>Registrar Panel</h2>
      <div class="tabs">
        <button onclick="registrarUI('students')">Students</button>
        <button onclick="registrarUI('subjects')">Subjects</button>
        <button onclick="registrarUI('professors')">Professors</button>
        <button onclick="registrarUI('seats')">Seat Arrangement</button>
        <button onclick="changePasswordUI()">Change Password</button>
        <button onclick="logout()">Logout</button>
      </div>
      <div id="content"></div>
    </div>
  `;

  if (tab === "students") studentsUI();
  if (tab === "subjects") subjectsUI();
  if (tab === "professors") professorsUI();
  if (tab === "seats") seatsUI();
}

/* ---------------- STUDENTS ---------------- */
function studentsUI() {
  content.innerHTML = `
    <h3>Students</h3>
    <table class="table">
      <tr>
        <th>No</th><th>Name</th><th>Seat</th><th>Subjects</th>
      </tr>
      <tr>
        <td><input id="sno"></td>
        <td><input id="sname"></td>
        <td><input id="sseat" placeholder="e.g. A-01"></td>
        <td><button onclick="addStudent()">Add</button></td>
      </tr>
      ${DB.students.map(s => `
        <tr>
          <td>${s.no}</td>
          <td>${s.name}</td>
          <td>
            <input value="${s.seat || ""}"
                   placeholder="Seat"
                   oninput="updateSeat('${s.no}', this.value)">
          </td>
          <td>
            <select onchange="assignSubject('${s.no}', this.value)">
              <option value="">Assign subject</option>
              ${DB.subjects.map(sub =>
                `<option value="${sub.code}">${sub.code}</option>`
              ).join("")}
            </select>
            <br>${(s.subjects || []).join(", ")}
          </td>
        </tr>
      `).join("")}
    </table>
  `;
}

function addStudent() {
  const no = sno.value.trim();
  const name = sname.value.trim();
  const seat = (document.getElementById("sseat").value || "").trim();

  if (!no || !name) return alert("Student No and Name required");
  if (DB.students.some(s => s.no === no)) return alert("Student No already exists");

  DB.students.push({ no, name, seat, subjects: [] });
  saveDB(); studentsUI();
}

function updateSeat(no, seat) {
  const s = DB.students.find(x => x.no === no);
  if (!s) return;
  s.seat = (seat || "").trim();
  saveDB();
}

function assignSubject(no, code) {
  if (!code) return;
  const s = DB.students.find(x => x.no === no);
  if (!s.subjects.includes(code)) s.subjects.push(code);
  saveDB(); studentsUI();
}

/* ---------------- SEAT ARRANGEMENT ----------------
   Simple view: shows who sits on what seat
   You can search by seat and reassign quickly.
--------------------------------------------------- */
function seatsUI() {
  // sort by seat then name
  const list = DB.students.slice().sort((a,b) => (a.seat||"").localeCompare(b.seat||"") || a.name.localeCompare(b.name));

  content.innerHTML = `
    <h3>Seat Arrangement</h3>
    <p style="margin-top:-6px;opacity:.8">Assign seats per student (e.g., A-01, A-02, B-01...).</p>

    <div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0">
      <input id="seatSearch" placeholder="Search seat / name / student no" style="flex:1" oninput="renderSeatTable()">
      <button onclick="autoSeatFill()">Auto Fill Seats</button>
    </div>

    <table class="table">
      <thead>
        <tr><th>Seat</th><th>Student No</th><th>Name</th><th>Update Seat</th></tr>
      </thead>
      <tbody id="seatBody"></tbody>
    </table>

    <p style="opacity:.7;margin-top:10px">
      Tip: Use format like <b>A-01</b>, <b>A-02</b>... for easy sorting.
    </p>
  `;

  renderSeatTable();
}

function renderSeatTable() {
  const q = (document.getElementById("seatSearch")?.value || "").trim().toLowerCase();
  const body = document.getElementById("seatBody");
  if (!body) return;

  const list = DB.students
    .slice()
    .sort((a,b) => (a.seat||"").localeCompare(b.seat||"") || a.name.localeCompare(b.name))
    .filter(s => {
      if (!q) return true;
      const hay = `${s.seat||""} ${s.no||""} ${s.name||""}`.toLowerCase();
      return hay.includes(q);
    });

  body.innerHTML = list.map(s => `
    <tr>
      <td>${s.seat || "-"}</td>
      <td>${s.no}</td>
      <td>${s.name}</td>
      <td>
        <input value="${s.seat || ""}" placeholder="e.g. A-01"
               oninput="updateSeat('${s.no}', this.value)">
      </td>
    </tr>
  `).join("");
}

/* Auto fill seats (optional helper)
   - Fills blank seats only
   - Uses A-01, A-02... then B-01... up to Z
*/
function autoSeatFill() {
  if (!confirm("Auto-fill seats for students with blank seat?")) return;

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  let idx = 0;

  // get used seats
  const used = new Set(DB.students.map(s => (s.seat||"").trim()).filter(Boolean));

  function nextSeat() {
    while (true) {
      const row = Math.floor(idx / 50); // 50 seats per letter row
      const col = (idx % 50) + 1;
      idx++;
      const seat = `${letters[row] || "Z"}-${String(col).padStart(2,"0")}`;
      if (!used.has(seat)) {
        used.add(seat);
        return seat;
      }
    }
  }

  DB.students.forEach(s => {
    if (!s.seat || !s.seat.trim()) {
      s.seat = nextSeat();
    }
  });

  saveDB();
  seatsUI();
  alert("Seats auto-filled!");
}

/* ---------------- SUBJECTS ---------------- */
function subjectsUI() {
  content.innerHTML = `
    <h3>Subjects</h3>
    <table class="table">
      <tr><th>Code</th><th>Day</th><th>Time</th></tr>
      <tr>
        <td><input id="scode"></td>
        <td><input id="sday"></td>
        <td><input id="stime" type="time"></td>
        <td><button onclick="addSubject()">Add</button></td>
      </tr>
      ${DB.subjects.map(s => `
        <tr>
          <td>${s.code}</td>
          <td>${s.day}</td>
          <td>${s.time}</td>
        </tr>
      `).join("")}
    </table>
  `;
}

function addSubject() {
  DB.subjects.push({ code: scode.value, day: sday.value, time: stime.value });
  saveDB(); subjectsUI();
}

/* ---------------- PROFESSORS ---------------- */
function professorsUI() {
  content.innerHTML = `
    <h3>Professors</h3>
    <table class="table">
      <tr><th>User</th><th>Password</th></tr>
      <tr>
        <td><input id="pu"></td>
        <td>
          <div style="display:flex;gap:6px">
            <input id="pp" type="password">
            <button onclick="togglePass('pp')">👁️</button>
          </div>
        </td>
        <td><button onclick="addProf()">Add</button></td>
      </tr>
      ${DB.professors.map(p => `
        <tr>
          <td>${p.u}</td>
          <td>••••••</td>
        </tr>
      `).join("")}
    </table>
  `;
}

function addProf() {
  DB.professors.push({ u: pu.value, p: pp.value });
  saveDB(); professorsUI();
}

/* ---------------- PROFESSOR PANEL ---------------- */
function professorUI() {
  app.innerHTML = `
    <div class="card">
      <h2>Professor Panel</h2>
      <input id="scan" placeholder="Scan RFID / Student No">
      <table class="table">
        <tr><th>Student Name</th><th>Seat</th><th>Time</th><th>Status</th></tr>
        <tbody id="log"></tbody>
      </table>
      <button onclick="changePasswordUI()">Change Password</button>
      <button onclick="logout()">Logout</button>
    </div>
  `;

  scan.addEventListener("keydown", e => {
    if (e.key === "Enter") takeAttendance(scan.value.trim());
  });
}

function takeAttendance(no) {
  const student = DB.students.find(s => s.no === no);
  if (!student) {
    alert("Student not found");
    return;
  }

  const now = new Date();
  const status = now.getMinutes() === 0 ? "PRESENT" : "LATE";

  DB.attendance.push({
    no: student.no,
    name: student.name,
    seat: student.seat || "",
    time: now.toLocaleTimeString(),
    status
  });

  saveDB();

  log.innerHTML += `
    <tr>
      <td>${student.name}</td>
      <td>${student.seat || ""}</td>
      <td>${now.toLocaleTimeString()}</td>
      <td>${status}</td>
    </tr>
  `;
}

/* ---------------- STUDENT PANEL ---------------- */
function studentUI(s) {
  const my = DB.attendance.filter(a => a.no === s.no);

  app.innerHTML = `
    <div class="card">
      <h2>${s.name}</h2>
      <p><b>Seat:</b> ${s.seat || "-"}</p>

      <h4>Subjects</h4>
      <ul>${(s.subjects || []).map(x => `<li>${x}</li>`).join("")}</ul>

      <h4>Attendance</h4>
      <table class="table">
        <tr><th>Time</th><th>Status</th></tr>
        ${my.map(a => `
          <tr>
            <td>${a.time}</td>
            <td>${a.status}</td>
          </tr>
        `).join("")}
      </table>

      <button onclick="logout()">Logout</button>
    </div>
  `;
}

/* ---------------- CHANGE PASSWORD ---------------- */
function changePasswordUI() {
  app.innerHTML = `
    <div class="card" style="max-width:400px;margin:auto">
      <h2>Change Password</h2>

      <input id="oldp" type="password" placeholder="Old password">

      <div style="display:flex;gap:6px">
        <input id="newp" type="password" placeholder="New password" style="flex:1">
        <button onclick="togglePass('newp')">👁️</button>
      </div>

      <button onclick="changePassword()">Save</button>
      <button onclick="logout()">Cancel</button>
    </div>
  `;
}

function changePassword() {
  const oldp = document.getElementById("oldp").value;
  const newp = document.getElementById("newp").value;

  if (currentUser.p !== oldp) {
    alert("Old password incorrect");
    return;
  }

  currentUser.p = newp;
  saveDB();
  alert("Password updated");
  logout();
}

/* ---------------- LOGOUT ---------------- */
function logout() {
  currentUser = null;
  loginUI();
}

/* ---------------- INIT ---------------- */
loginUI();
