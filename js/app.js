/* ============================================================
   JTEN RFID ATTENDANCE SYSTEM – FINAL MULTI-SUBJECT VERSION
============================================================ */

const DB_KEY = "JTEN_FINAL_DB";

/* ================= DATABASE ================= */
function loadDB(){
  return JSON.parse(localStorage.getItem(DB_KEY)) || {
    users:[{username:"admin",password:"123"}],
    students:[],   // {studentNo,name,seat,schedules:[{subjectId,day,startTime}]}
    professors:[], // {username,password,name}
    subjects:[],   // {id,code,professor}
    rooms:{rows:5,cols:8},
    attendance:[], // {studentNo,subjectId,time,status}
    session:{active:false,subjectId:null}
  };
}
let DB=loadDB();
function saveDB(){localStorage.setItem(DB_KEY,JSON.stringify(DB));}
const app=document.getElementById("app");

document.addEventListener("DOMContentLoaded",renderLogin);

/* ================= LOGIN ================= */
function renderLogin(){
  app.innerHTML=`
  <div class="max-w-md mx-auto bg-white p-6 rounded shadow">
    <h2 class="text-xl font-bold mb-4 text-center">Login</h2>
    <input id="loginUser" class="border p-2 w-full mb-3" placeholder="Username / Student No">
    <input id="loginPass" type="password" class="border p-2 w-full mb-4"
      placeholder="Password (blank for student)">
    <button onclick="login()" class="w-full bg-sky-600 text-white py-2 rounded">Login</button>
  </div>`;
}

function login(){
  if(loginUser.value==="admin" && loginPass.value==="123") return registrarUI();
  const prof=DB.professors.find(p=>p.username===loginUser.value && p.password===loginPass.value);
  if(prof) return professorUI(prof);
  const st=DB.students.find(s=>s.studentNo===loginUser.value && loginPass.value==="");
  if(st) return studentUI(st);
  alert("Invalid login");
}

/* ================= REGISTRAR ================= */
function registrarUI(){
  app.innerHTML=`
  <div class="bg-white p-6 rounded shadow max-w-7xl mx-auto">
    <h2 class="text-xl font-bold mb-4">Registrar Panel</h2>

    <div class="flex gap-2 mb-4">
      <button onclick="enrollUI()" class="bg-sky-600 text-white px-4 py-2 rounded">Enroll</button>
      <button onclick="recordsUI()" class="bg-indigo-600 text-white px-4 py-2 rounded">Student Records</button>
      <button onclick="roomUI()" class="bg-emerald-600 text-white px-4 py-2 rounded">Room Setup</button>
      <button onclick="renderLogin()" class="bg-gray-500 text-white px-4 py-2 rounded">Logout</button>
    </div>

    <div id="content"></div>
  </div>`;
  enrollUI();
}

/* ---------- ENROLL (ADD SUBJECT TO STUDENT) ---------- */
function enrollUI(){
  content.innerHTML=`
  <h3 class="font-bold mb-2">Enroll / Add Subject to Student</h3>

  <input id="stNo" class="border p-2 w-full mb-2" placeholder="Student No">
  <input id="stName" class="border p-2 w-full mb-2" placeholder="Name (new student only)">

  <select id="stSubject" class="border p-2 w-full mb-2"></select>
  <select id="stDay" class="border p-2 w-full mb-2">
    <option>MON</option><option>TUE</option><option>WED</option>
    <option>THU</option><option>FRI</option>
  </select>
  <input id="stTime" type="time" class="border p-2 w-full mb-2" value="08:00">

  <button onclick="addOrUpdateStudent()"
    class="bg-green-600 text-white px-4 py-2 rounded">
    Save
  </button>`;
  stSubject.innerHTML=DB.subjects.map(s=>`<option value="${s.id}">${s.code}</option>`).join("");
}

function addOrUpdateStudent(){
  let st=DB.students.find(s=>s.studentNo===stNo.value);

  if(!st){
    st={
      studentNo:stNo.value,
      name:stName.value,
      seat:null,
      schedules:[]
    };
    DB.students.push(st);
  }

  st.schedules.push({
    subjectId:Number(stSubject.value),
    day:stDay.value,
    startTime:stTime.value
  });

  saveDB();
  alert("Subject added to student");
}

/* ---------- STUDENT RECORDS ---------- */
function recordsUI(){
  content.innerHTML=`
  <h3 class="font-bold mb-3">Student Records</h3>
  <table class="w-full border text-sm text-center">
    <tr class="bg-slate-200">
      <th>Student No</th><th>Name</th><th>Seat</th>
    </tr>
    ${DB.students.map(s=>`
      <tr onclick="editStudent('${s.studentNo}')"
        class="cursor-pointer hover:bg-slate-100">
        <td class="text-blue-600 font-bold">${s.studentNo}</td>
        <td>${s.name}</td>
        <td>${s.seat||"-"}</td>
      </tr>`).join("")}
  </table>`;
}

function editStudent(stNo){
  const st=DB.students.find(s=>s.studentNo===stNo);
  content.innerHTML=`
  <h3 class="font-bold mb-2">Edit Student – ${st.studentNo}</h3>

  <h4 class="font-semibold mb-2">Schedules</h4>
  ${st.schedules.map((sch,i)=>{
    const subj=DB.subjects.find(x=>x.id===sch.subjectId);
    return `<p>${subj.code} | ${sch.day} | ${sch.startTime}</p>`;
  }).join("")}

  <h4 class="font-semibold mt-4 mb-1">Seat Assignment</h4>
  <div id="seats" class="grid gap-2"></div>

  <button onclick="recordsUI()" class="mt-4 bg-gray-500 text-white px-3 py-1 rounded">
    Back
  </button>`;
  renderSeats(st);
}

/* ---------- SEATS ---------- */
function renderSeats(student){
  seats.style.gridTemplateColumns=`repeat(${DB.rooms.cols},1fr)`;
  seats.innerHTML="";
  for(let i=1;i<=DB.rooms.rows*DB.rooms.cols;i++){
    const taken=DB.students.find(s=>s.seat===i);
    seats.innerHTML+=`
    <div onclick="assignSeat('${student.studentNo}',${i})"
      class="cursor-pointer border rounded p-3 text-center font-bold
      ${taken?(taken.studentNo===student.studentNo?"bg-blue-400":"bg-red-300"):"bg-green-200"}">
      ${i}
    </div>`;
  }
}

function assignSeat(stNo,seatNo){
  DB.students.forEach(s=>{if(s.seat===seatNo) s.seat=null;});
  DB.students.find(s=>s.studentNo===stNo).seat=seatNo;
  saveDB();
  editStudent(stNo);
}

/* ---------- ROOM ---------- */
function roomUI(){
  content.innerHTML=`
  <h3 class="font-bold mb-2">Room Setup</h3>
  <input id="rRows" type="number" class="border p-2 w-full mb-2" value="${DB.rooms.rows}">
  <input id="rCols" type="number" class="border p-2 w-full mb-2" value="${DB.rooms.cols}">
  <button onclick="saveRoom()" class="bg-green-600 text-white px-4 py-2 rounded">Save</button>`;
}
function saveRoom(){
  DB.rooms.rows=Number(rRows.value);
  DB.rooms.cols=Number(rCols.value);
  DB.students.forEach(s=>{if(s.seat>DB.rooms.rows*DB.rooms.cols) s.seat=null;});
  saveDB(); alert("Room updated");
}

/* ================= PROFESSOR ================= */
function professorUI(prof){
  app.innerHTML=`
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
      placeholder="RFID / Student No then ENTER">
    <div id="attTable"></div>
    <button onclick="renderLogin()" class="mt-4 bg-gray-500 text-white px-3 py-1 rounded">
      Logout
    </button>
  </div>`;
  scanInput.addEventListener("keydown",e=>{if(e.key==="Enter") autoTap();});
}

function startSession(){
  DB.session.active=true;
  DB.session.subjectId=Number(profSub.value);
  saveDB(); alert("Session started");
}

function autoTap(){
  const uid=scanInput.value.trim();
  const st=DB.students.find(s=>s.studentNo===uid);
  if(!st) return alert("Student not found");

  const today=["SUN","MON","TUE","WED","THU","FRI","SAT"][new Date().getDay()];
  const sch=st.schedules.find(s=>s.subjectId===DB.session.subjectId && s.day===today);
  if(!sch) return alert("No schedule today");

  const now=new Date();
  const [h,m]=sch.startTime.split(":").map(Number);
  const t=new Date(); t.setHours(h,m,0,0);

  DB.attendance.unshift({
    studentNo:uid,
    subjectId:sch.subjectId,
    time:now.toLocaleTimeString(),
    status: now<=t?"PRESENT":"LATE"
  });
  saveDB(); renderAttendance(); scanInput.value="";
}

function renderAttendance(){
  const list=DB.attendance.filter(a=>a.subjectId===DB.session.subjectId);
  attTable.innerHTML=`
  <table class="w-full border text-sm text-center">
    <tr class="bg-slate-200">
      <th>Student</th><th>Time</th><th>Status</th>
    </tr>
    ${list.map(a=>`
      <tr>
        <td>${a.studentNo}</td>
        <td>${a.time}</td>
        <td>${a.status}</td>
      </tr>`).join("")}
  </table>`;
}

/* ================= STUDENT ================= */
function studentUI(st){
  app.innerHTML=`
  <div class="bg-white p-6 rounded shadow max-w-xl mx-auto">
    <h2 class="text-xl font-bold mb-4">My Schedule</h2>
    ${st.schedules.map(s=>{
      const sub=DB.subjects.find(x=>x.id===s.subjectId);
      return `<p>${sub.code} | ${s.day} | ${s.startTime}</p>`;
    }).join("")}
    <p class="mt-2"><b>Seat:</b> ${st.seat||"Not assigned"}</p>
    <button onclick="renderLogin()" class="mt-4 bg-gray-500 text-white px-3 py-1 rounded">
      Logout
    </button>
  </div>`;
}
