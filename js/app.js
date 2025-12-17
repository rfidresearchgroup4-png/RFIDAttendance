/* ===============================
   RFID ATTENDANCE SYSTEM
   STABLE WORKING BASE APP.JS
   =============================== */

console.log("ATTENDANCE SYSTEM STABLE APP.JS LOADED");

const app = document.getElementById("app");
const STORAGE_KEY = "ATT_SYS_STABLE";

/* ---------- DATABASE ---------- */
function loadDB() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
    admin: { username: "admin", password: "123" },
    professors: [
      // sample:
      // { username:"prof1", password:"123", name:"Prof One" }
    ],
    students: [
      // sample:
      // { no:"2025001", name:"Juan Dela Cruz", subjects:[] }
    ]
  };
}

let DB = loadDB();
function saveDB() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DB));
}

/* ---------- LOGIN UI ---------- */
function loginUI() {
  app.innerHTML = `
    <div class="login-wrap">
      <div class="card login-card">
        <h2>Login</h2>

        <input id="loginUser" placeholder="Username / Student No">
        <input id="loginPass" type="password" placeholder="Password (blank for student)">

        <button class="btn-blue" onclick="login()">Login</button>

        <div class="hint">
          Admin: <b>admin / 123</b>
        </div>
      </div>
    </div>
  `;
}

/* ---------- LOGIN LOGIC ---------- */
function login() {
  const username = document.getElementById("loginUser").value.trim();
  const password = document.getElementById("loginPass").value.trim();

  /* ADMIN */
  if (
    username === DB.admin.username &&
    password === DB.admin.password
  ) {
    registrarUI();
    return;
  }

  /* PROFESSOR */
  const prof = DB.professors.find(
    p => p.username === username && p.password === password
  );
  if (prof) {
    professorUI(prof);
    return;
  }

  /* STUDENT (NO PASSWORD) */
  const student = DB.students.find(
    s => s.no === username && password === ""
  );
  if (student) {
    studentUI(student);
    return;
  }

  alert("Invalid login credentials");
}

/* ---------- REGISTRAR ---------- */
function registrarUI() {
  app.innerHTML = `
    <div class="card">
      <h2>Registrar Panel</h2>

      <div class="nav">
        <button class="btn-blue" onclick="enrollUI()">Enroll Student</button>
        <button class="btn-purple" onclick="studentListUI()">Student Records</button>
        <button class="btn-gray" onclick="loginUI()">Logout</button>
      </div>

      <div id="content"></div>
    </div>
  `;
  enrollUI();
}

/* ---------- ENROLL STUDENT ---------- */
function enrollUI() {
  document.getElementById("content").innerHTML = `
    <h3>Enroll Student</h3>

    <input id="studNo" placeholder="Student Number (UID)">
    <input id="studName" placeholder="Student Name">

    <button class="btn-green" onclick="saveStudent()">Save Student</button>
  `;
}

function saveStudent() {
  const no = document.getElementById("studNo").value.trim();
  const name = document.getElementById("studName").value.trim();

  if (!no || !name) {
    alert("Please complete all fields");
    return;
  }

  if (DB.students.find(s => s.no === no)) {
    alert("Student already exists");
    return;
  }

  DB.students.push({
    no: no,
    name: name,
    subjects: []
  });

  saveDB();
  alert("Student enrolled successfully");
  studentListUI();
}

/* ---------- STUDENT LIST ---------- */
function studentListUI() {
  document.getElementById("content").innerHTML = `
    <h3>Student Records</h3>

    <table class="table">
      <tr>
        <th>Student No</th>
        <th>Name</th>
      </tr>
      ${DB.students
        .map(
          s => `
          <tr>
            <td>${s.no}</td>
            <td>${s.name}</td>
          </tr>
        `
        )
        .join("")}
    </table>
  `;
}

/* ---------- PROFESSOR ---------- */
function professorUI(prof) {
  app.innerHTML = `
    <div class="card">
      <h2>Professor Panel</h2>
      <p><b>${prof.name || prof.username}</b></p>

      <input id="scanInput" placeholder="RFID / Student No">
      <div id="scanResult"></div>

      <button class="btn-gray" onclick="loginUI()">Logout</button>
    </div>
  `;

  const scanInput = document.getElementById("scanInput");
  scanInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      handleScan(scanInput.value.trim());
      scanInput.value = "";
    }
  });
}

function handleScan(studentNo) {
  const student = DB.students.find(s => s.no === studentNo);
  if (!student) {
    document.getElementById("scanResult").innerHTML =
      "<p style='color:red'>Student not found</p>";
    return;
  }

  document.getElementById("scanResult").innerHTML =
    `<p style="color:green">${student.name} (${student.no}) - PRESENT</p>`;
}

/* ---------- STUDENT ---------- */
function studentUI(student) {
  app.innerHTML = `
    <div class="card">
      <h2>Student Portal</h2>

      <p><b>Student No:</b> ${student.no}</p>
      <p><b>Name:</b> ${student.name}</p>

      <p>No attendance records yet.</p>

      <button class="btn-gray" onclick="loginUI()">Logout</button>
    </div>
  `;
}

/* ---------- INIT ---------- */
loginUI();
