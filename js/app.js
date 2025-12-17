/* ============================================================
   JTEN RFID ATTENDANCE SYSTEM – FINAL STABLE VERSION
   Frontend only | localStorage | GitHub Pages safe
============================================================ */

const DB_KEY = "JTEN_FINAL_DB";

/* ================= DATABASE ================= */
function loadDB() {
  return JSON.parse(localStorage.getItem(DB_KEY)) || {
    users: [{ username: "admin", password: "123", role: "superadmin" }],
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
document.addEventListener("DOMContentLoaded", renderLogin);

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
  const u = document.getElementById("loginUser").value.trim();
  const p = document.getElementById("loginPass").value.trim();

  if (u === "admin" && p === "123") return registrarUI();

  const prof = DB.professors.find(x => x.username === u && x.password === p);
  if (prof) return professorUI(prof);

  const st = DB.students.find(x => x.studentNo === u);
  if (st && p === "") return studentUI(st);

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
          <button onclick="addStudent()"
            class="bg-green-600 text-white px-3 py-1 rounded">
            Add Student
          </button>
        </div>

        <div>
          <h3 class="font-bold">Create Professor</h3>
          <input id="pUser" class="border p-2 w-full mb-2" placeholder="Username">
          <input id="pPass" class="border p-2 w-full mb-2" placeholder="Password">
          <input id="pName" class="border p-2 w-full mb-2" placeholder="Name">
          <button onclick="addProfessor()"
            class="bg-green-600 text-white px-3 py-1 rounded">
            Add Professor
          </button>
        </div>

        <div>
          <h3 class="font-bold">Create Subject</h3>
          <input id="subCode" class="border p-2 w-full mb-2" placeholder="Subject Code">
          <select id="subProf" class="border p-2 w-full mb-2"></select>
          <button onclick="addSubject()"
            class="bg-green-600 text-white px-3 py-1 rounded">
            Add Subject
          </button>
        </div>

      </div>

      <div class="mt-6">
        <h3 class="font-bold">Assign Subject to Student</h3>
        <select id="asStudent" class="border p-2 w-full mb-2"></select>
        <select id="asSubject" class="border p-2 w-full mb-2"></select>
        <button onclick="assignSubject()"
          class="bg-blue-600 text-white px-3 py-1 rounded">
          Assign
        </button>
      </div>

      <div class="mt-6">
        <h3 class="font-bold mb-2">Cinema Seating</h3>
        <p class="text-sm mb-2">Select student, then click a seat</p>
        <div id="seats" class="grid gap-2"></div>
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
  if(!pUser.value || !pPass.value || !pName.value) return;
  DB.professors.push({ username:pUser.value, password:pPass.value, name:pName.value });
  saveDB(); registrarUI();
}

function addSubject(){
  if(!subCode.value) return;
  DB.subjects.push({ id:Date.now(), code:subCode.value, professor:subProf.value });
  saveDB(); registrarUI();
}

function refreshRegistrar(){
  subProf.innerHTML = DB.professors.map(p=>`<option>${p.username}</option>`).join("");
  asStudent.innerHTML = DB.students.map(s=>`<option>${s.studentNo}</option>`).join("");
  asSubject.innerHTML = DB.subjects.map(s=>`<option value="${s.id}">${s.code}</option>`).join("");
  renderSeats();
}

/* ===== CINEMA SEATING ===== */
function renderSeats(){
  seats.style.gridTemplateColumns = `repeat(${DB.rooms.cols}, 1fr)`;
  seats.innerHTML = "";
  for(let i=1;i<=DB.rooms.rows*DB.rooms.cols;i++){
    const taken = DB.students.find(s=>s.seat===i);
    seats.innerHTML += `
      <div onclick="assignSeat(${i})"
        class="cursor-pointer border rounded p-3 text-center font-bold
        ${taken ? "bg-red-300" : "bg-green-200"}">
        ${i}
      </div>`;
  }
}

function assignSeat(seatNo){
  const st = DB.students.find(s=>s.studentNo===asStudent.value);
  if(!st) return alert("Select student first");
  DB.students.forEach(s=>{ if(s.seat===seatNo) s.seat=null; });
  st.seat = seatNo;
  saveDB(); renderSeats();
}

/* ================= PROFESSOR ================= */
function professorUIFromAdmin(){
  if(DB.professors.length===0) return alert("Create professor first");
  professorUI(DB.professors[0]);
}

function professorUI(prof){
  DB.session={active:false,subjectId:null}; saveDB();
  app.innerHTML = `
    <div class="bg-white p-6 rounded shadow max-w-4xl mx-auto">
      <h2 class="text-xl font-bold mb-4">Professor: ${prof.name}</h2>

      <select id="profSub" class="border p-2 w-full mb-3">
        ${DB.subjects.filter(s=>s.professor===prof.username)
          .map(s=>`<option value="${s.id}">${s.code}</option>`).join("")}
      </select>

      <button onclick="startSession()"
        class="bg-green-600 text-white px-4 py-2 rounded mb-3">
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
  scanInput.addEventListener("keydown",e=>{ if(e.key==="Enter") autoTap(); });
}

function startSession(){
  DB.session.active=true;
  DB.session.subjectId=Number(profSub.value);
  saveDB(); alert("Session Started");
}

function autoTap(){
  if(!DB.session.active) return alert("Session not started");
  const uid=scanInput.value.trim(); if(!uid) return;

  const now=new Date();
  const status =
    now.getHours()<8 || (now.getHours()===8 && now.getMinutes()===0)
      ? "PRESENT":"LATE";

  DB.attendance.unshift({
    studentNo:uid,
    subjectId:DB.session.subjectId,
    time:now.toLocaleTimeString(),
    status
  });
  saveDB(); scanInput.value=""; renderAttendance();
}

function renderAttendance(){
  attTable.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full border-collapse border text-sm text-center">
        <thead class="bg-slate-200">
          <tr>
            <th class="border px-3 py-2">Student No</th>
            <th class="border px-3 py-2">Time</th>
            <th class="border px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          ${DB.attendance.map(a=>`
            <tr>
              <td class="border px-3 py-2">${a.studentNo}</td>
              <td class="border px-3 py-2">${a.time}</td>
              <td class="border px-3 py-2 font-bold ${
                a.status==="LATE"?"text-red-600":"text-green-600"
              }">${a.status}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

/* ================= STUDENT ================= */
function studentUI(st){
  const rec = DB.attendance.filter(a=>a.studentNo===st.studentNo);
  app.innerHTML = `
    <div class="bg-white p-6 rounded shadow max-w-xl mx-auto">
      <h2 class="text-xl font-bold mb-4">My Attendance</h2>

      ${
        rec.length===0
          ? `<div class="bg-yellow-100 border border-yellow-400
             text-yellow-800 p-4 rounded text-center font-semibold">
             No attendance record found.
             </div>`
          : `
            <div class="overflow-x-auto">
              <table class="w-full border-collapse border text-sm text-center">
                <thead class="bg-slate-200">
                  <tr>
                    <th class="border px-3 py-2">Time</th>
                    <th class="border px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${rec.map(r=>`
                    <tr>
                      <td class="border px-3 py-2">${r.time}</td>
                      <td class="border px-3 py-2 font-bold ${
                        r.status==="LATE"?"text-red-600":"text-green-600"
                      }">${r.status}</td>
                    </tr>`).join("")}
                </tbody>
              </table>
            </div>
          `
      }

      <button onclick="renderLogin()"
        class="mt-4 bg-gray-500 text-white px-3 py-1 rounded">
        Logout
      </button>
    </div>
  `;
}
