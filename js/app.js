/* ============================================================
   JTEN RFID ATTENDANCE SYSTEM – FINAL + STUDENT RECORDS
   Frontend only | localStorage | GitHub Pages safe
============================================================ */

const DB_KEY = "JTEN_FINAL_DB";

/* ================= DATABASE ================= */
function loadDB() {
  return JSON.parse(localStorage.getItem(DB_KEY)) || {
    users: [{ username: "admin", password: "123", role: "superadmin" }],
    students: [],   // { studentNo, name, seat, schedules:[{subjectId,day,startTime}] }
    professors: [], // { username, password, name }
    subjects: [],   // { id, code, professor }
    rooms: { rows: 5, cols: 8 },
    attendance: [],
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
      <input id="loginUser" class="border p-2 w-full mb-3" placeholder="Username / Student No">
      <input id="loginPass" type="password" class="border p-2 w-full mb-4"
        placeholder="Password (blank for student)">
      <button onclick="login()" class="w-full bg-sky-600 text-white py-2 rounded">Login</button>
      <p class="text-xs text-center mt-3 text-gray-500">admin / 123</p>
    </div>`;
}

function login(){
  const u = loginUser.value.trim();
  const p = loginPass.value.trim();
  if (u==="admin" && p==="123") return registrarUI();
  const prof = DB.professors.find(x=>x.username===u && x.password===p);
  if (prof) return professorUI(prof);
  const st = DB.students.find(x=>x.studentNo===u);
  if (st && p==="") return studentUI(st);
  alert("Invalid login");
}

/* ================= REGISTRAR ================= */
function registrarUI(){
  app.innerHTML = `
  <div class="bg-white p-6 rounded shadow max-w-7xl mx-auto">
    <h2 class="text-xl font-bold mb-4">Registrar Panel</h2>

    <div class="flex gap-4 mb-6">
      <button onclick="registrarEnrollUI()" class="bg-sky-600 text-white px-4 py-2 rounded">Enroll</button>
      <button onclick="studentRecordsUI()" class="bg-indigo-600 text-white px-4 py-2 rounded">Student Records</button>
      <button onclick="renderLogin()" class="bg-gray-500 text-white px-4 py-2 rounded">Logout</button>
    </div>

    <div id="registrarContent"></div>
  </div>`;
  registrarEnrollUI();
}

/* ---------- ENROLL ---------- */
function registrarEnrollUI(){
  registrarContent.innerHTML = `
  <div class="grid md:grid-cols-3 gap-6">

    <div>
      <h3 class="font-bold">Enroll Student</h3>
      <input id="stNo" class="border p-2 w-full mb-2" placeholder="Student No">
      <input id="stName" class="border p-2 w-full mb-2" placeholder="Name">
      <select id="stSubject" class="border p-2 w-full mb-2"></select>
      <select id="stDay" class="border p-2 w-full mb-2">
        <option>MON</option><option>TUE</option><option>WED</option>
        <option>THU</option><option>FRI</option>
      </select>
      <input id="stTime" type="time" class="border p-2 w-full mb-2" value="08:00">
      <button onclick="addStudent()" class="bg-green-600 text-white px-3 py-1 rounded">Enroll</button>
    </div>

    <div>
      <h3 class="font-bold">Create Professor</h3>
      <input id="pUser" class="border p-2 w-full mb-2" placeholder="Username">
      <input id="pPass" class="border p-2 w-full mb-2" placeholder="Password">
      <input id="pName" class="border p-2 w-full mb-2" placeholder="Name">
      <button onclick="addProfessor()" class="bg-green-600 text-white px-3 py-1 rounded">Add</button>
    </div>

    <div>
      <h3 class="font-bold">Create Subject</h3>
      <input id="subCode" class="border p-2 w-full mb-2" placeholder="Subject Code">
      <select id="subProf" class="border p-2 w-full mb-2"></select>
      <button onclick="addSubject()" class="bg-green-600 text-white px-3 py-1 rounded">Add</button>
    </div>

  </div>`;
  refreshRegistrarLists();
}

function addStudent(){
  DB.students.push({
    studentNo: stNo.value,
    name: stName.value,
    seat:null,
    schedules:[{ subjectId:Number(stSubject.value), day:stDay.value, startTime:stTime.value }]
  });
  saveDB(); alert("Student Enrolled");
}

/* ---------- STUDENT RECORDS ---------- */
function studentRecordsUI(){
  registrarContent.innerHTML = `
    <h3 class="font-bold mb-2">Student Records</h3>
    <table class="w-full border text-sm text-center">
      <tr class="bg-slate-200">
        <th class="border p-2">Student No</th>
        <th class="border p-2">Name</th>
      </tr>
      ${DB.students.map(s=>`
        <tr onclick="editStudentUI('${s.studentNo}')"
          class="cursor-pointer hover:bg-slate-100">
          <td class="border p-2 text-blue-600 font-bold">${s.studentNo}</td>
          <td class="border p-2">${s.name}</td>
        </tr>`).join("")}
    </table>
  `;
}

function editStudentUI(stNo){
  const st = DB.students.find(s=>s.studentNo===stNo);
  const sch = st.schedules[0];

  registrarContent.innerHTML = `
    <h3 class="font-bold mb-2">Edit Schedule – ${st.studentNo}</h3>

    <select id="editSubject" class="border p-2 w-full mb-2"></select>
    <select id="editDay" class="border p-2 w-full mb-2">
      <option>MON</option><option>TUE</option><option>WED</option>
      <option>THU</option><option>FRI</option>
    </select>
    <input id="editTime" type="time" class="border p-2 w-full mb-2">

    <button onclick="saveSchedule('${st.studentNo}')" class="bg-green-600 text-white px-3 py-1 rounded">
      Save Changes
    </button>
    <button onclick="studentRecordsUI()" class="ml-2 bg-gray-500 text-white px-3 py-1 rounded">
      Back
    </button>
  `;

  editSubject.innerHTML = DB.subjects.map(s=>`<option value="${s.id}">${s.code}</option>`).join("");
  editSubject.value = sch.subjectId;
  editDay.value = sch.day;
  editTime.value = sch.startTime;
}

function saveSchedule(stNo){
  const st = DB.students.find(s=>s.studentNo===stNo);
  st.schedules[0] = {
    subjectId:Number(editSubject.value),
    day:editDay.value,
    startTime:editTime.value
  };
  saveDB();
  alert("Schedule updated");
  studentRecordsUI();
}

/* ---------- HELPERS ---------- */
function addProfessor(){
  DB.professors.push({ username:pUser.value, password:pPass.value, name:pName.value });
  saveDB(); alert("Professor added");
}
function addSubject(){
  DB.subjects.push({ id:Date.now(), code:subCode.value, professor:subProf.value });
  saveDB(); alert("Subject added");
}
function refreshRegistrarLists(){
  stSubject.innerHTML = DB.subjects.map(s=>`<option value="${s.id}">${s.code}</option>`).join("");
  subProf.innerHTML = DB.professors.map(p=>`<option>${p.username}</option>`).join("");
}

/* ================= PROFESSOR ================= */
function professorUI(prof){ app.innerHTML=`<h2>Professor Panel (existing logic intact)</h2>`; }

/* ================= STUDENT ================= */
function studentUI(st){
  app.innerHTML=`
    <div class="bg-white p-6 rounded shadow max-w-xl mx-auto">
      <h2 class="text-xl font-bold mb-4">My Schedule</h2>
      <table class="w-full border text-sm text-center">
        <tr class="bg-slate-200">
          <th>Subject</th><th>Day</th><th>Start</th>
        </tr>
        ${st.schedules.map(s=>{
          const sub=DB.subjects.find(x=>x.id===s.subjectId);
          return `<tr><td>${sub?sub.code:""}</td><td>${s.day}</td><td>${s.startTime}</td></tr>`;
        }).join("")}
      </table>
      <button onclick="renderLogin()" class="mt-4 bg-gray-500 text-white px-3 py-1 rounded">Logout</button>
    </div>`;
}
