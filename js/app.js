/* ============================================================
   JTEN RFID ATTENDANCE SYSTEM – FINAL (LOGIN FIXED)
   Frontend only | localStorage | GitHub Pages safe
============================================================ */

const DB_KEY = "JTEN_FINAL_DB";

/* ================= DATABASE ================= */
function loadDB() {
  return JSON.parse(localStorage.getItem(DB_KEY)) || {
    users: [
      { username: "admin", password: "123", role: "superadmin" }
    ],
    students: [],      // { studentNo, name, seat, subjects:[] }
    professors: [],    // { username, password, name }
    subjects: [],      // { id, code, professor }
    rooms: { rows: 5, cols: 8 },
    attendance: [],    // { studentNo, subjectId, time, status }
    session: { active:false, subjectId:null }
  };
}

let DB = loadDB();
function saveDB(){ localStorage.setItem(DB_KEY, JSON.stringify(DB)); }

const app = document.getElementById("app");

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  renderLogin();
});

/* ================= LOGIN ================= */
function renderLogin(){
  app.innerHTML = `
    <div class="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 class="text-xl font-bold mb-4 text-center">Login</h2>

      <input id="loginUser" class="border p-2 w-full mb-3"
        placeholder="Username / Student No">
      <input id="loginPass" type="password" class="border p-2 w-full mb-4"
        placeholder="Password (blank for student)">

      <button id="loginBtn"
        class="w-full bg-sky-600 text-white py-2 rounded">
        Login
      </button>

      <p class="text-xs text-center mt-3 text-gray-500">
        Admin: admin / 123
      </p>
    </div>
  `;

  document.getElementById("loginBtn").onclick = login;
}

function login(){
  const username = document.getElementById("loginUser").value.trim();
  const password = document.getElementById("loginPass").value.trim();

  /* SUPER ADMIN */
  if (username === "admin" && password === "123") {
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
  const student = DB.students.find(s => s.studentNo === username);
  if (student && password === "") {
    studentUI(student);
    return;
  }

  alert("Invalid login credentials");
}

/* ================= REGISTRAR ================= */
function registrarUI(){
  app.innerHTML = `
    <div class="bg-white p-6 rounded shadow max-w-6xl mx-auto">
      <h2 class="text-xl font-bold mb-4">Registrar Panel</h2>

      <div class="grid md:grid-cols-3 gap-6">

        <div>
          <h3 class="font-bold">Enroll Student</h3>
          <input id="stNo" class="border p-2 w-full mb-2" placeholder="Student No">
          <input id="stName" class="border p-2 w-full mb-2" placeholder="Name">
          <button onclick="addStudent()" class="bg-green-600 text-white px-3 py-1 rounded">
            Add Student
          </button>
        </div>

        <div>
          <h3 class="font-bold">Create Professor</h3>
          <input id="pUser" class="border p-2 w-full mb-2" placeholder="Username">
          <input id="pPass" class="border p-2 w-full mb-2" placeholder="Password">
          <input id="pName" class="border p-2 w-full mb-2" placeholder="Name">
          <button onclick="addProfessor()" class="bg-green-600 text-white px-3 py-1 rounded">
            Add Professor
          </button>
        </div>

        <div>
          <h3 class="font-bold">Create Subject</h3>
          <input id="subCode" class="border p-2 w-full mb-2" placeholder="Subject Code">
          <select id="subProf" class="border p-2 w-full mb-2"></select>
          <button onclick="addSubject()" class="bg-green-600 text-white px-3 py-1 rounded">
            Add Subject
          </button>
        </div>

      </div>

      <div class="mt-6">
        <h3 class="font-bold">Assign Subject to Student</h3>
        <select id="asStudent" class="border p-2 w-full mb-2"></select>
        <select id="asSubject" class="border p-2 w-full mb-2"></select>
        <button onclick="assignSubject()" class="bg-blue-600 text-white px-3 py-1 rounded">
          Assign
        </button>
      </div>

      <div class="mt-6 flex gap-2">
        <button onclick="professorUIFromAdmin()"
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

  refreshRegistrar();
}

function addStudent(){
  if(!stNo.value || !stName.value) return;
  DB.students.push({ studentNo: stNo.value, name: stName.value, seat:null, subjects:[] });
  saveDB(); registrarUI();
}

function addProfessor(){
  DB.professors.push({ username:pUser.value, password:pPass.value, name:pName.value });
  saveDB(); registrarUI();
}

function addSubject(){
  DB.subjects.push({ id:Date.now(), code:subCode.value, professor:subProf.value });
  saveDB(); registrarUI();
}

function refreshRegistrar(){
  subProf.innerHTML = DB.professors.map(p=>`<option>${p.username}</option>`).join("");
  asStudent.innerHTML = DB.students.map(s=>`<option>${s.studentNo}</option>`).join("");
  asSubject.innerHTML = DB.subjects.map(s=>`<option value="${s.id}">${s.code}</option>`).join("");
}

function assignSubject(){
  const st = DB.students.find(s=>s.studentNo===asStudent.value);
  const sid = Number(asSubject.value);
  if(!st.subjects.includes(sid)) st.subjects.push(sid);
  saveDB(); alert("Subject assigned");
}

/* ================= PROFESSOR ================= */
function professorUI(prof){
  DB.session = { active:false, subjectId:null };
  saveDB();

  app.innerHTML = `
    <div class="bg-white p-6 rounded shadow max-w-4xl mx-auto">
      <h2 class="text-xl font-bold mb-4">Professor: ${prof.name}</h2>

      <select id="profSub" class="border p-2 w-full mb-3">
        ${DB.subjects.filter(s=>s.professor===prof.username)
          .map(s=>`<option value="${s.id}">${s.code}</option>`).join("")}
      </select>

      <button onclick="startSession()" class="bg-green-600 text-white px-4 py-2 rounded mb-3">
        Start Session
      </button>

      <input id="scanInput" class="border p-2 w-full mb-4"
        placeholder="RFID / Type Student No then ENTER">

      <div id="attTable"></div>

      <button onclick="renderLogin()"
        class="mt-4 bg-gray-500 text-white px-3 py-1 rounded">
        Logout
      </button>
    </div>
  `;

  scanInput.addEventListener("keydown", e=>{
    if(e.key==="Enter") autoTap();
  });
}

function professorUIFromAdmin(){
  if(DB.professors.length===0) return alert("Create professor first");
  professorUI(DB.professors[0]);
}

function startSession(){
  DB.session.active = true;
  DB.session.subjectId = Number(profSub.value);
  saveDB();
  alert("Session started");
}

function autoTap(){
  if(!DB.session.active) return alert("Session not started");

  const uid = scanInput.value.trim();
  if(!uid) return;

  const now = new Date();
  const status =
    now.getHours()<8 || (now.getHours()===8 && now.getMinutes()===0)
      ? "PRESENT" : "LATE";

  DB.attendance.unshift({
    studentNo: uid,
    subjectId: DB.session.subjectId,
    time: now.toLocaleTimeString(),
    status
  });

  saveDB();
  scanInput.value="";
  renderAttendance();
}

function renderAttendance(){
  attTable.innerHTML = `
    <table class="w-full border text-sm">
      <tr class="bg-slate-100">
        <th>Student No</th><th>Time</th><th>Status</th>
      </tr>
      ${DB.attendance.map(a=>`
        <tr>
          <td>${a.studentNo}</td>
          <td>${a.time}</td>
          <td>${a.status}</td>
        </tr>`).join("")}
    </table>
  `;
}

/* ================= STUDENT ================= */
function studentUI(st){
  const rec = DB.attendance.filter(a=>a.studentNo===st.studentNo);
  app.innerHTML = `
    <div class="bg-white p-6 rounded shadow max-w-xl mx-auto">
      <h2 class="text-xl font-bold mb-4">My Attendance</h2>
      <table class="w-full border text-sm">
        <tr class="bg-slate-100"><th>Time</th><th>Status</th></tr>
        ${rec.map(r=>`
          <tr><td>${r.time}</td><td>${r.status}</td></tr>`).join("")}
      </table>
      <button onclick="renderLogin()"
        class="mt-4 bg-gray-500 text-white px-3 py-1 rounded">
        Logout
      </button>
    </div>
  `;
}
