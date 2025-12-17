/* =========================================================
   RFID ATTENDANCE SYSTEM – FULL WORKING DEMO APP.JS
   School: Jesus The Exalted Name School
   ========================================================= */

/* ===================== BASIC DB ===================== */
const DB = {
  users: JSON.parse(localStorage.getItem("users")) || [
    { u: "admin", p: hash("123"), role: "admin" }
  ],
  students: JSON.parse(localStorage.getItem("students")) || [],
  professors: JSON.parse(localStorage.getItem("professors")) || [],
  subjects: JSON.parse(localStorage.getItem("subjects")) || [],
  attendance: JSON.parse(localStorage.getItem("attendance")) || [],
  seats: JSON.parse(localStorage.getItem("seats")) || {}
};

let currentUser = null;
const app = document.getElementById("app");

/* ===================== UTIL ===================== */
function saveDB() {
  Object.keys(DB).forEach(k =>
    localStorage.setItem(k, JSON.stringify(DB[k]))
  );
}

function hash(str) {
  return btoa(str); // demo hash (simple, acceptable for thesis demo)
}

function btn(c, t, f) {
  return `<button class="${c}" onclick="${f}">${t}</button>`;
}

/* ===================== LOGIN ===================== */
function loginUI() {
  app.innerHTML = `
    <div class="card">
      <h2>Login</h2>
      <input id="lu" placeholder="Username / Student No">
      <input id="lp" type="password" placeholder="Password (blank for student)">
      <button onclick="login()">Login</button>
      <p><b>admin / 123</b></p>
    </div>`;
}

function login() {
  const u = lu.value.trim();
  const p = lp.value.trim();

  let user = DB.users.find(x => x.u === u && x.p === hash(p));
  if (user) {
    currentUser = user;
    return adminUI();
  }

  let prof = DB.professors.find(x => x.u === u && x.p === hash(p));
  if (prof) {
    currentUser = prof;
    return professorUI(prof);
  }

  let student = DB.students.find(x => x.no === u);
  if (student) {
    currentUser = student;
    return studentUI(student);
  }

  alert("Invalid login");
}

/* ===================== ADMIN / REGISTRAR ===================== */
function adminUI(tab = "students") {
  app.innerHTML = `
    <div class="card">
      <h2>Registrar Panel</h2>
      <div class="tabs">
        ${btn("tab","Students","adminUI('students')")}
        ${btn("tab","Subjects","adminUI('subjects')")}
        ${btn("tab","Professors","adminUI('professors')")}
        ${btn("tab","Seats","adminUI('seats')")}
        ${btn("tab","Export","exportAll()")}
        ${btn("tab","Logout","logout()")}
      </div>
      <div id="content"></div>
    </div>`;
  if (tab === "students") studentsUI();
  if (tab === "subjects") subjectsUI();
  if (tab === "professors") professorsUI();
  if (tab === "seats") seatsUI();
}

/* ===================== STUDENTS ===================== */
function studentsUI() {
  content.innerHTML = `
    <h3>Students</h3>
    <table class="table">
      <tr>
        <th>No</th><th>Name</th><th>Seat</th><th>Subjects</th><th>Action</th>
      </tr>
      <tr>
        <td><input id="sno"></td>
        <td><input id="sname"></td>
        <td>-</td>
        <td>-</td>
        <td>${btn("green","Add","addStudent()")}</td>
      </tr>
      ${DB.students.map(s => `
        <tr>
          <td>${s.no}</td>
          <td>${s.name}</td>
          <td>${s.seat || "-"}</td>
          <td>${s.subjects.join("<br>") || "-"}</td>
          <td>
            ${btn("gray","Edit",`editStudent('${s.no}')`)}
            ${btn("red","Delete",`delStudent('${s.no}')`)}
          </td>
        </tr>`).join("")}
    </table>`;
}

function addStudent() {
  DB.students.push({
    no: sno.value,
    name: sname.value,
    subjects: [],
    seat: null
  });
  saveDB(); studentsUI();
}

function delStudent(no) {
  DB.students = DB.students.filter(s => s.no !== no);
  saveDB(); studentsUI();
}

function editStudent(no) {
  const s = DB.students.find(x => x.no === no);
  const subj = prompt("Assign subject code (comma separated):", s.subjects.join(","));
  if (subj !== null) s.subjects = subj.split(",").map(x => x.trim());
  saveDB(); studentsUI();
}

/* ===================== SUBJECTS ===================== */
function subjectsUI() {
  content.innerHTML = `
    <h3>Subjects</h3>
    <table class="table">
      <tr>
        <th>Code</th><th>Professor</th><th>Day</th><th>Time</th><th>Action</th>
      </tr>
      <tr>
        <td><input id="scode"></td>
        <td><input id="sprof"></td>
        <td><input id="sday"></td>
        <td><input id="stime" type="time"></td>
        <td>${btn("green","Add","addSubject()")}</td>
      </tr>
      ${DB.subjects.map(s => `
        <tr>
          <td>${s.code}</td>
          <td>${s.prof}</td>
          <td>${s.day}</td>
          <td>${s.time}</td>
          <td>${btn("red","Delete",`delSubject('${s.code}')`)}</td>
        </tr>`).join("")}
    </table>`;
}

function addSubject() {
  DB.subjects.push({
    code: scode.value,
    prof: sprof.value,
    day: sday.value,
    time: stime.value
  });
  saveDB(); subjectsUI();
}

function delSubject(c) {
  DB.subjects = DB.subjects.filter(s => s.code !== c);
  saveDB(); subjectsUI();
}

/* ===================== PROFESSORS ===================== */
function professorsUI() {
  content.innerHTML = `
    <h3>Professors</h3>
    <table class="table">
      <tr><th>User</th><th>Pass</th><th>Action</th></tr>
      <tr>
        <td><input id="pu"></td>
        <td><input id="pp" type="password"></td>
        <td>${btn("green","Add","addProf()")}</td>
      </tr>
      ${DB.professors.map(p => `
        <tr>
          <td>${p.u}</td>
          <td>••••</td>
          <td>${btn("red","Delete",`delProf('${p.u}')`)}</td>
        </tr>`).join("")}
    </table>`;
}

function addProf() {
  DB.professors.push({ u: pu.value, p: hash(pp.value) });
  saveDB(); professorsUI();
}

function delProf(u) {
  DB.professors = DB.professors.filter(p => p.u !== u);
  saveDB(); professorsUI();
}

/* ===================== SEATS ===================== */
function seatsUI() {
  let grid = "";
  for (let i = 1; i <= 20; i++) {
    const taken = Object.values(DB.seats).includes(i);
    grid += `<div class="seat ${taken?"taken":""}" onclick="assignSeat(${i})">${i}</div>`;
  }
  content.innerHTML = `<h3>Seat Assignment</h3><div class="grid">${grid}</div>`;
}

function assignSeat(n) {
  const uid = prompt("Assign to Student No:");
  const s = DB.students.find(x => x.no === uid);
  if (!s) return alert("Student not found");
  DB.seats[uid] = n;
  s.seat = n;
  saveDB(); seatsUI();
}

/* ===================== PROFESSOR PANEL ===================== */
function professorUI(p) {
  app.innerHTML = `
    <div class="card">
      <h2>Professor Panel (${p.u})</h2>
      <input id="scan" placeholder="RFID / Student No">
      <table class="table">
        <tr><th>Student</th><th>Time</th><th>Status</th></tr>
        <tbody id="log"></tbody>
      </table>
      ${btn("gray","Logout","logout()")}
    </div>`;

  scan.addEventListener("keydown", e => {
    if (e.key === "Enter") takeAttendance(scan.value);
  });
}

function takeAttendance(no) {
  const now = new Date();
  const status = now.getMinutes() === 0 ? "PRESENT" : "LATE";
  DB.attendance.push({ no, time: now.toLocaleTimeString(), status });
  saveDB();
  log.innerHTML += `<tr><td>${no}</td><td>${now.toLocaleTimeString()}</td><td>${status}</td></tr>`;
}

/* ===================== STUDENT ===================== */
function studentUI(s) {
  const att = DB.attendance.filter(a => a.no === s.no);
  app.innerHTML = `
    <div class="card">
      <h2>${s.name}</h2>
      <p>Seat: ${s.seat || "-"}</p>
      <h4>Subjects</h4>
      <ul>${s.subjects.map(x=>`<li>${x}</li>`).join("")}</ul>
      <h4>Attendance</h4>
      <table class="table">
        <tr><th>Time</th><th>Status</th></tr>
        ${att.map(a=>`<tr><td>${a.time}</td><td>${a.status}</td></tr>`).join("")}
      </table>
      ${btn("gray","Logout","logout()")}
    </div>`;
}

/* ===================== EXPORT ===================== */
function exportAll() {
  const csv = JSON.stringify(DB, null, 2);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/plain" }));
  a.download = "attendance_export.txt";
  a.click();
}

/* ===================== LOGOUT ===================== */
function logout() {
  currentUser = null;
  loginUI();
}

/* ===================== INIT ===================== */
loginUI();
