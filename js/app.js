/* ==================================================
   RFID ATTENDANCE SYSTEM
   STABLE BASELINE + NAME DISPLAY + SEAT ARRANGEMENT
   + FIXED DAY/TIME LOGIC (PRESENT/LATE)
   + SUBJECT PICKER (Professor)
   + GRACE PERIOD (minutes)
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

function saveDB() {
  Object.keys(DB).forEach(k =>
    localStorage.setItem(k, JSON.stringify(DB[k]))
  );
}

/* ---------------- MIGRATION (add seat field + subject grace) ---------------- */
DB.students = DB.students.map(s => ({
  ...s,
  seat: s.seat || ""
}));

DB.subjects = DB.subjects.map(sub => ({
  ...sub,
  grace: (sub.grace === undefined || sub.grace === null) ? 5 : Number(sub.grace) // default 5 mins
}));

saveDB();

let currentUser = null;

/* ---------------- TIME HELPERS ---------------- */
function pad2(n) { return String(n).padStart(2, "0"); }

function hmToMin(hm) {
  if (!hm) return 0;
  const [h, m] = hm.split(":").map(Number);
  return (h * 60) + m;
}

function nowHM() {
  const d = new Date();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function todayShort() {
  // returns "MON","TUE",...
  const d = new Date();
  return ["SUN","MON","TUE","WED","THU","FRI","SAT"][d.getDay()];
}

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
      <p style="opacity:.7;font-size:12px">
        Tip: Add subjects with Day (MON/TUE/...) and Time (HH:MM). Default grace = 5 minutes.
      </p>
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
    return professorUI();
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
  if (!s.subjects) s.subjects = [];
  if (!s.subjects.includes(code)) s.subjects.push(code);
  saveDB(); studentsUI();
}

/* ---------------- SEAT ARRANGEMENT ---------------- */
function seatsUI() {
  content.innerHTML = `
    <h3>Seat Arrangement</h3>
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

function autoSeatFill() {
  if (!confirm("Auto-fill seats for students with blank seat?")) return;

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  let idx = 0;

  const used = new Set(DB.students.map(s => (s.seat||"").trim()).filter(Boolean));

  function nextSeat() {
    while (true) {
      const row = Math.floor(idx / 50);
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
    if (!s.seat || !s.seat.trim()) s.seat = nextSeat();
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
      <tr><th>Code</th><th>Day</th><th>Time</th><th>Grace (min)</th></tr>
      <tr>
        <td><input id="scode" placeholder="MATH101"></td>
        <td>
          <select id="sday">
            ${["MON","TUE","WED","THU","FRI","SAT","SUN"].map(d => `<option value="${d}">${d}</option>`).join("")}
          </select>
        </td>
        <td><input id="stime" type="time"></td>
        <td><input id="sgrace" type="number" min="0" value="5" style="width:90px"></td>
        <td><button onclick="addSubject()">Add</button></td>
      </tr>
      ${DB.subjects.map(s => `
        <tr>
          <td>${s.code}</td>
          <td>${s.day}</td>
          <td>${s.time}</td>
          <td>${s.grace ?? 5}</td>
        </tr>
      `).join("")}
    </table>
    <p style="opacity:.7;font-size:12px">
      Attendance status uses: <b>PRESENT</b> if scan time <= subject time + grace minutes; else <b>LATE</b>.
    </p>
  `;
}

function addSubject() {
  const code = (scode.value || "").trim();
  const day = (sday.value || "").trim().toUpperCase();
  const time = (stime.value || "").trim(); // "HH:MM"
  const grace = Number(document.getElementById("sgrace").value || 5);

  if (!code) return alert("Subject code required");
  if (!time) return alert("Time required");
  if (!day) return alert("Day required");

  DB.subjects.push({ code, day, time, grace });
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
  const day = todayShort();
  const todaysSubjects = DB.subjects.filter(s => (s.day || "").toUpperCase() === day);

  app.innerHTML = `
    <div class="card">
      <h2>Professor Panel</h2>

      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <input id="scan" placeholder="Scan RFID / Student No" style="flex:1">
        <select id="psub" style="min-width:200px">
          ${todaysSubjects.length ? todaysSubjects.map(s => `
            <option value="${s.code}">${s.code} (${s.time})</option>
          `).join("") : `<option value="">No subject today (${day})</option>`}
        </select>
      </div>

      <table class="table" style="margin-top:10px">
        <tr><th>Student Name</th><th>Seat</th><th>Time</th><th>Subject</th><th>Status</th></tr>
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
  const timeHM = nowHM(); // HH:MM

  const day = todayShort();
  const subCode = (document.getElementById("psub")?.value || "").trim();
  const subject = DB.subjects.find(s => s.code === subCode && (s.day || "").toUpperCase() === day);

  // If no subject matches today, default present (or you can force error)
  if (!subject) {
    alert(`No valid subject selected for today (${day}). Please add subject with correct Day.`);
    return;
  }

  // PRESENT if scan <= subject.time + grace
  const grace = Number(subject.grace ?? 5);
  const allowedUntil = hmToMin(subject.time) + grace;
  const scanMin = hmToMin(timeHM);

  const status = scanMin <= allowedUntil ? "PRESENT" : "LATE";

  DB.attendance.push({
    no: student.no,
    name: student.name,
    seat: student.seat || "",
    time: now.toLocaleTimeString(),
    subject: subject.code,
    day: day,
    status
  });

  saveDB();

  log.innerHTML += `
    <tr>
      <td>${student.name}</td>
      <td>${student.seat || ""}</td>
      <td>${now.toLocaleTimeString()}</td>
      <td>${subject.code}</td>
      <td>${status}</td>
    </tr>
  `;

  scan.value = "";
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
        <tr><th>Day</th><th>Subject</th><th>Time</th><th>Status</th></tr>
        ${my.map(a => `
          <tr>
            <td>${a.day || ""}</td>
            <td>${a.subject || ""}</td>
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
