/* ================================
   RFID ATTENDANCE SYSTEM
   FULL ONE-DROP VERSION
   ================================ */

console.log("FULL SYSTEM LOADED");

const app = document.getElementById("app");
const KEY = "RFID_FULL_SYS";

/* ================= DATABASE ================= */
let DB = JSON.parse(localStorage.getItem(KEY)) || {
  admin: { u: "admin", p: "123" },
  professors: [],
  students: [],
  subjects: [],
  attendance: []
};

function save() {
  localStorage.setItem(KEY, JSON.stringify(DB));
}

/* ================= LOGIN ================= */
function loginUI() {
  app.innerHTML = `
    <div class="login-wrap">
      <div class="card" style="max-width:420px">
        <h2>Login</h2>
        <input id="u" placeholder="Username / Student No">
        <input id="p" type="password" placeholder="Password (blank for student)">
        <button class="btn-blue" onclick="login()">Login</button>
        <p style="font-size:13px;color:#555">admin / 123</p>
      </div>
    </div>`;
}

function login() {
  const u = document.getElementById("u").value.trim();
  const p = document.getElementById("p").value.trim();

  if (u === DB.admin.u && p === DB.admin.p) return registrarUI();

  const prof = DB.professors.find(x => x.u === u && x.p === p);
  if (prof) return professorUI(prof);

  const st = DB.students.find(x => x.no === u && p === "");
  if (st) return studentUI(st);

  alert("Invalid login");
}

/* ================= REGISTRAR ================= */
function registrarUI() {
  app.innerHTML = `
  <div class="card">
    <h2>Registrar Panel</h2>
    <div class="nav">
      <button class="btn-blue" onclick="enrollUI()">Enroll Student</button>
      <button class="btn-purple" onclick="subjectUI()">Subjects</button>
      <button class="btn-green" onclick="profUI()">Professors</button>
      <button class="btn-gray" onclick="recordsUI()">Student Records</button>
      <button class="btn-gray" onclick="loginUI()">Logout</button>
    </div>
    <div id="content"></div>
  </div>`;
  enrollUI();
}

/* ---------- ENROLL ---------- */
function enrollUI() {
  content.innerHTML = `
    <h3>Enroll Student</h3>
    <input id="sno" placeholder="Student Number (UID)">
    <input id="sname" placeholder="Student Name">
    <button class="btn-green" onclick="saveStudent()">Save</button>`;
}

function saveStudent() {
  if (DB.students.find(x => x.no === sno.value)) {
    alert("Student exists"); return;
  }
  DB.students.push({ no: sno.value, name: sname.value, subjects: [] });
  save(); alert("Saved");
}

/* ---------- PROFESSORS ---------- */
function profUI() {
  content.innerHTML = `
    <h3>Professors</h3>
    <input id="pu" placeholder="Username">
    <input id="pp" placeholder="Password">
    <button class="btn-green" onclick="addProf()">Add</button>
    <ul>${DB.professors.map(p => `<li>${p.u}</li>`).join("")}</ul>`;
}
function addProf() {
  DB.professors.push({ u: pu.value, p: pp.value });
  save(); profUI();
}

/* ---------- SUBJECTS ---------- */
function subjectUI() {
  content.innerHTML = `
    <h3>Subjects</h3>
    <input id="scode" placeholder="Subject Code">
    <select id="sprof">${DB.professors.map(p => `<option>${p.u}</option>`)}</select>
    <select id="sday"><option>MON</option><option>TUE</option><option>WED</option></select>
    <input id="stime" type="time" value="08:00">
    <button class="btn-green" onclick="addSubject()">Add</button>
    <ul>${DB.subjects.map(s => `<li>${s.code} (${s.prof})</li>`).join("")}</ul>`;
}
function addSubject() {
  DB.subjects.push({
    code: scode.value,
    prof: sprof.value,
    day: sday.value,
    time: stime.value
  });
  save(); subjectUI();
}

/* ---------- STUDENT RECORDS ---------- */
function recordsUI() {
  content.innerHTML = `
    <h3>Students</h3>
    ${DB.students.map(s => `
      <div class="card">
        <b>${s.no}</b> - ${s.name}
        <select onchange="assignSub('${s.no}',this.value)">
          <option value="">Assign Subject</option>
          ${DB.subjects.map(x => `<option>${x.code}</option>`)}
        </select>
        <div>${s.subjects.join(", ")}</div>
      </div>`).join("")}`;
}

function assignSub(no, code) {
  const st = DB.students.find(x => x.no === no);
  if (!st.subjects.includes(code)) st.subjects.push(code);
  save(); recordsUI();
}

/* ================= PROFESSOR ================= */
function professorUI(p) {
  app.innerHTML = `
    <div class="card">
      <h2>Professor Panel (${p.u})</h2>
      <input id="scan" placeholder="Student No">
      <div id="log"></div>
      <button class="btn-gray" onclick="loginUI()">Logout</button>
    </div>`;
  scan.addEventListener("keydown", e => {
    if (e.key === "Enter") takeAttendance(scan.value);
  });
}

function takeAttendance(no) {
  const now = new Date();
  DB.attendance.push({
    no,
    time: now.toLocaleTimeString(),
    status: now.getMinutes() === 0 ? "PRESENT" : "LATE"
  });
  save();
  log.innerHTML += `<p>${no} - ${DB.attendance.at(-1).status}</p>`;
  scan.value = "";
}

/* ================= STUDENT ================= */
function studentUI(s) {
  app.innerHTML = `
    <div class="card">
      <h2>Student Portal</h2>
      <p>${s.no} - ${s.name}</p>
      <h4>Subjects</h4>
      ${s.subjects.join("<br>") || "None"}
      <h4>Attendance</h4>
      ${DB.attendance.filter(a => a.no === s.no)
        .map(a => `${a.time} - ${a.status}`).join("<br>") || "No record"}
      <button class="btn-gray" onclick="loginUI()">Logout</button>
    </div>`;
}

/* ================= INIT ================= */
loginUI();
