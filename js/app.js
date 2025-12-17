/* ===============================
   RFID ATTENDANCE SYSTEM (STABLE)
   ROLLBACK VERSION
   =============================== */

const app = document.getElementById("app");

/* ---------- DATABASE ---------- */
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

/* ---------- LOGIN ---------- */
function loginUI() {
  app.innerHTML = `
    <div class="card">
      <h2>Login</h2>
      <input id="lu" placeholder="Username / Student No">
      <input id="lp" type="password" placeholder="Password (blank for student)">
      <button onclick="login()">Login</button>
      <p><b>admin / 123</b></p>
    </div>
  `;
}

function login() {
  const u = lu.value.trim();
  const p = lp.value.trim();

  // Admin
  const admin = DB.users.find(x => x.u === u && x.p === p);
  if (admin) return registrarUI();

  // Professor
  const prof = DB.professors.find(x => x.u === u && x.p === p);
  if (prof) return professorUI(prof);

  // Student
  const student = DB.students.find(x => x.no === u);
  if (student) return studentUI(student);

  alert("Invalid login");
}

/* ---------- REGISTRAR ---------- */
function registrarUI(tab = "students") {
  app.innerHTML = `
    <div class="card">
      <h2>Registrar Panel</h2>
      <div class="tabs">
        <button onclick="registrarUI('students')">Students</button>
        <button onclick="registrarUI('subjects')">Subjects</button>
        <button onclick="registrarUI('professors')">Professors</button>
        <button onclick="logout()">Logout</button>
      </div>
      <div id="content"></div>
    </div>
  `;

  if (tab === "students") studentsUI();
  if (tab === "subjects") subjectsUI();
  if (tab === "professors") professorsUI();
}

/* ---------- STUDENTS ---------- */
function studentsUI() {
  content.innerHTML = `
    <h3>Students</h3>
    <table class="table">
      <tr>
        <th>Student No</th>
        <th>Name</th>
        <th>Subjects</th>
      </tr>
      <tr>
        <td><input id="sno"></td>
        <td><input id="sname"></td>
        <td><button onclick="addStudent()">Add</button></td>
      </tr>
      ${DB.students.map(s => `
        <tr>
          <td>${s.no}</td>
          <td>${s.name}</td>
          <td>
            <select onchange="assignSubject('${s.no}', this.value)">
              <option value="">Assign subject</option>
              ${DB.subjects.map(sub =>
                `<option value="${sub.code}">${sub.code}</option>`
              ).join("")}
            </select>
            <br>
            ${s.subjects?.join(", ") || ""}
          </td>
        </tr>
      `).join("")}
    </table>
  `;
}

function addStudent() {
  DB.students.push({
    no: sno.value,
    name: sname.value,
    subjects: []
  });
  saveDB();
  studentsUI();
}

function assignSubject(no, code) {
  const s = DB.students.find(x => x.no === no);
  if (!s.subjects.includes(code)) s.subjects.push(code);
  saveDB();
  studentsUI();
}

/* ---------- SUBJECTS ---------- */
function subjectsUI() {
  content.innerHTML = `
    <h3>Subjects</h3>
    <table class="table">
      <tr>
        <th>Code</th>
        <th>Day</th>
        <th>Time</th>
      </tr>
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
  DB.subjects.push({
    code: scode.value,
    day: sday.value,
    time: stime.value
  });
  saveDB();
  subjectsUI();
}

/* ---------- PROFESSORS ---------- */
function professorsUI() {
  content.innerHTML = `
    <h3>Professors</h3>
    <table class="table">
      <tr>
        <th>User</th>
        <th>Password</th>
      </tr>
      <tr>
        <td><input id="pu"></td>
        <td><input id="pp"></td>
        <td><button onclick="addProf()">Add</button></td>
      </tr>
      ${DB.professors.map(p => `
        <tr>
          <td>${p.u}</td>
          <td>${p.p}</td>
        </tr>
      `).join("")}
    </table>
  `;
}

function addProf() {
  DB.professors.push({ u: pu.value, p: pp.value });
  saveDB();
  professorsUI();
}

/* ---------- PROFESSOR PANEL ---------- */
function professorUI(p) {
  app.innerHTML = `
    <div class="card">
      <h2>Professor Panel</h2>
      <input id="scan" placeholder="Student No">
      <table class="table">
        <tr><th>Student</th><th>Time</th><th>Status</th></tr>
        <tbody id="log"></tbody>
      </table>
      <button onclick="logout()">Logout</button>
    </div>
  `;

  scan.addEventListener("keydown", e => {
    if (e.key === "Enter") takeAttendance(scan.value);
  });
}

function takeAttendance(no) {
  const now = new Date();
  const status = now.getMinutes() === 0 ? "PRESENT" : "LATE";
  DB.attendance.push({
    no,
    time: now.toLocaleTimeString(),
    status
  });
  saveDB();
  log.innerHTML += `
    <tr>
      <td>${no}</td>
      <td>${now.toLocaleTimeString()}</td>
      <td>${status}</td>
    </tr>`;
}

/* ---------- STUDENT PANEL ---------- */
function studentUI(s) {
  const my = DB.attendance.filter(a => a.no === s.no);
  app.innerHTML = `
    <div class="card">
      <h2>${s.name}</h2>
      <h4>Subjects</h4>
      <ul>${s.subjects.map(x => `<li>${x}</li>`).join("")}</ul>
      <h4>Attendance</h4>
      <table class="table">
        <tr><th>Time</th><th>Status</th></tr>
        ${my.map(a => `
          <tr>
            <td>${a.time}</td>
            <td>${a.status}</td>
          </tr>`).join("")}
      </table>
      <button onclick="logout()">Logout</button>
    </div>
  `;
}

/* ---------- LOGOUT ---------- */
function logout() {
  loginUI();
}

/* ---------- INIT ---------- */
loginUI();
