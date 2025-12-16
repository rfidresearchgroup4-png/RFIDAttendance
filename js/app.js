/* ============================================================
   JTEN RFID ATTENDANCE SYSTEM – FINAL DEMO VERSION
   Roles: Super Admin, Registrar, Professor, Student
   Frontend Only | localStorage | GitHub Pages Safe
============================================================ */

const KEY = "JTEN_FINAL_DB";

/* ================= DATABASE ================= */
function loadDB() {
  return JSON.parse(localStorage.getItem(KEY)) || {
    users: [
      { username: "admin", password: "123", role: "superadmin" }
    ],
    students: [],     // { studentNo, name, seat, subjects:[] }
    professors: [],   // { username, password, name }
    subjects: [],     // { id, code, professor }
    rooms: { rows: 5, cols: 8 }, // cinema style
    attendance: [],   // { studentNo, subjectId, time, status }
    session: { active:false, subjectId:null }
  };
}
function saveDB(){ localStorage.setItem(KEY, JSON.stringify(DB)); }
let DB = loadDB();
const app = document.getElementById("app");

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", loginUI);

/* ================= LOGIN ================= */
function loginUI(){
  app.innerHTML = `
  <div class="max-w-md mx-auto bg-white p-6 rounded shadow">
    <h2 class="text-xl font-bold mb-4 text-center">Login</h2>
    <input id="u" class="border p-2 w-full mb-3" placeholder="Username / Student No">
    <input id="p" type="password" class="border p-2 w-full mb-4" placeholder="Password">
    <button onclick="login()" class="w-full bg-sky-600 text-white py-2 rounded">Login</button>
    <p class="text-xs text-center mt-3">Super Admin: admin / 123</p>
  </div>`;
}

function login(){
  const u=u.value.trim(), p=p.value.trim();
  if(u==="admin" && p==="123") return registrarUI();
  const prof=DB.professors.find(x=>x.username===u && x.password===p);
  if(prof) return professorUI(prof);
  const stu=DB.students.find(x=>x.studentNo===u);
  if(stu) return studentUI(stu);
  alert("Invalid login");
}

/* ================= REGISTRAR ================= */
function registrarUI(){
  app.innerHTML=`
  <div class="bg-white p-6 rounded shadow max-w-6xl mx-auto">
    <h2 class="text-xl font-bold mb-4">Registrar Panel</h2>

    <div class="grid md:grid-cols-3 gap-6">

      <div>
        <h3 class="font-bold">Enroll Student</h3>
        <input id="sn" class="border p-2 w-full mb-2" placeholder="Student No">
        <input id="nm" class="border p-2 w-full mb-2" placeholder="Name">
        <button onclick="addStudent()" class="bg-green-600 text-white px-3 py-1 rounded">Add</button>
      </div>

      <div>
        <h3 class="font-bold">Create Professor</h3>
        <input id="pu" class="border p-2 w-full mb-2" placeholder="Username">
        <input id="pp" class="border p-2 w-full mb-2" placeholder="Password">
        <input id="pn" class="border p-2 w-full mb-2" placeholder="Name">
        <button onclick="addProfessor()" class="bg-green-600 text-white px-3 py-1 rounded">Add</button>
      </div>

      <div>
        <h3 class="font-bold">Create Subject</h3>
        <input id="sc" class="border p-2 w-full mb-2" placeholder="Subject Code">
        <select id="sp" class="border p-2 w-full mb-2"></select>
        <button onclick="addSubject()" class="bg-green-600 text-white px-3 py-1 rounded">Add</button>
      </div>

    </div>

    <div class="mt-6">
      <h3 class="font-bold">Assign Subject to Student</h3>
      <select id="asStu" class="border p-2 w-full mb-2"></select>
      <select id="asSub" class="border p-2 w-full mb-2"></select>
      <button onclick="assignSubject()" class="bg-blue-600 text-white px-3 py-1 rounded">Assign</button>
    </div>

    <div class="mt-6">
      <h3 class="font-bold">Cinema Seating (Click to Assign)</h3>
      <div id="seats" class="grid gap-2"></div>
    </div>

    <button onclick="loginUI()" class="mt-6 bg-gray-500 text-white px-4 py-2 rounded">Logout</button>
  </div>`;
  refreshRegistrar();
}

function addStudent(){
  DB.students.push({studentNo:sn.value,name:nm.value,seat:null,subjects:[]});
  saveDB(); registrarUI();
}
function addProfessor(){
  DB.professors.push({username:pu.value,password:pp.value,name:pn.value});
  saveDB(); registrarUI();
}
function addSubject(){
  DB.subjects.push({id:Date.now(),code:sc.value,professor:sp.value});
  saveDB(); registrarUI();
}
function assignSubject(){
  const s=DB.students.find(x=>x.studentNo===asStu.value);
  const sid=Number(asSub.value);
  if(!s.subjects.includes(sid)) s.subjects.push(sid);
  saveDB(); alert("Assigned");
}

function refreshRegistrar(){
  sp.innerHTML=DB.professors.map(p=>`<option>${p.username}</option>`).join("");
  asStu.innerHTML=DB.students.map(s=>`<option>${s.studentNo}</option>`).join("");
  asSub.innerHTML=DB.subjects.map(s=>`<option value="${s.id}">${s.code}</option>`).join("");
  renderSeats();
}

/* ===== CINEMA SEATING ===== */
function renderSeats(){
  seats.style.gridTemplateColumns=`repeat(${DB.rooms.cols},1fr)`;
  seats.innerHTML="";
  for(let i=1;i<=DB.rooms.rows*DB.rooms.cols;i++){
    const taken=DB.students.find(s=>s.seat===i);
    seats.innerHTML+=`
    <div onclick="assignSeat(${i})"
      class="border p-2 text-center ${taken?'bg-red-200':'bg-green-100'}">
      ${i}
    </div>`;
  }
}
function assignSeat(i){
  const s=DB.students.find(x=>x.studentNo===asStu.value);
  s.seat=i; saveDB(); renderSeats();
}

/* ================= PROFESSOR ================= */
function professorUI(prof){
  app.innerHTML=`
  <div class="bg-white p-6 rounded shadow max-w-4xl mx-auto">
    <h2 class="text-xl font-bold mb-4">Professor: ${prof.name}</h2>

    <select id="ps" class="border p-2 w-full mb-3">
      ${DB.subjects.filter(s=>s.professor===prof.username)
        .map(s=>`<option value="${s.id}">${s.code}</option>`).join("")}
    </select>

    <button onclick="startSession()" class="bg-green-600 text-white px-4 py-2 rounded mb-3">
      Start Session
    </button>

    <input id="scan" class="border p-2 w-full mb-4"
      placeholder="RFID / Type Student No then ENTER">

    <div id="att"></div>

    <button onclick="exportCSV()" class="mt-3 bg-blue-600 text-white px-3 py-1 rounded">
      Export to Excel
    </button>

    <button onclick="loginUI()" class="mt-3 bg-gray-500 text-white px-3 py-1 rounded">
      Logout
    </button>
  </div>`;

  scan.addEventListener("keydown",e=>{ if(e.key==="Enter") tapIn(); });
}

function startSession(){
  DB.session={active:true,subjectId:Number(ps.value)};
  saveDB(); alert("Session Started");
}

function tapIn(){
  if(!DB.session.active) return alert("Session not started");
  const uid=scan.value.trim();
  const now=new Date();
  const status=(now.getHours()<8||(now.getHours()==8&&now.getMinutes()==0))
    ?"PRESENT":"LATE";
  DB.attendance.unshift({
    studentNo:uid,subjectId:DB.session.subjectId,
    time:now.toLocaleTimeString(),status
  });
  saveDB(); scan.value=""; renderAtt();
}

function renderAtt(){
  att.innerHTML=`
  <table class="w-full border text-sm">
    <tr class="bg-slate-100">
      <th>Student</th><th>Time</th><th>Status</th>
    </tr>
    ${DB.attendance.map(a=>`
      <tr><td>${a.studentNo}</td><td>${a.time}</td><td>${a.status}</td></tr>`).join("")}
  </table>`;
}

/* ===== EXPORT ===== */
function exportCSV(){
  let csv="Student,Time,Status\n";
  DB.attendance.forEach(a=>csv+=`${a.studentNo},${a.time},${a.status}\n`);
  const blob=new Blob([csv],{type:"text/csv"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob); a.download="attendance.csv"; a.click();
}

/* ================= STUDENT ================= */
function studentUI(st){
  const rec=DB.attendance.filter(a=>a.studentNo===st.studentNo);
  app.innerHTML=`
  <div class="bg-white p-6 rounded shadow max-w-xl mx-auto">
    <h2 class="text-xl font-bold mb-4">My Attendance</h2>
    <table class="w-full border text-sm">
      <tr class="bg-slate-100"><th>Time</th><th>Status</th></tr>
      ${rec.map(r=>`<tr><td>${r.time}</td><td>${r.status}</td></tr>`).join("")}
    </table>
    <button onclick="exportCSV()" class="mt-3 bg-blue-600 text-white px-3 py-1 rounded">
      Export
    </button>
    <button onclick="loginUI()" class="mt-3 bg-gray-500 text-white px-3 py-1 rounded">
      Logout
    </button>
  </div>`;
}
