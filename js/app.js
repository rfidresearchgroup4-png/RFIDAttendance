/* ============================================================
   JTEN RFID ATTENDANCE SYSTEM – FINAL WITH SEAT CUSTOMIZATION
============================================================ */

const DB_KEY = "JTEN_FINAL_DB";

function loadDB(){
  return JSON.parse(localStorage.getItem(DB_KEY)) || {
    users:[{username:"admin",password:"123"}],
    students:[], // {studentNo,name,seat,schedules:[]}
    professors:[],
    subjects:[],
    rooms:{rows:5,cols:8},
    attendance:[],
    session:{active:false,subjectId:null}
  };
}
let DB=loadDB();
const app=document.getElementById("app");
function saveDB(){localStorage.setItem(DB_KEY,JSON.stringify(DB));}

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

/* ---------- ENROLL ---------- */
function enrollUI(){
  content.innerHTML=`
  <h3 class="font-bold mb-2">Enroll Student</h3>
  <input id="stNo" class="border p-2 w-full mb-2" placeholder="Student No">
  <input id="stName" class="border p-2 w-full mb-2" placeholder="Name">

  <select id="stSubject" class="border p-2 w-full mb-2"></select>
  <select id="stDay" class="border p-2 w-full mb-2">
    <option>MON</option><option>TUE</option><option>WED</option>
    <option>THU</option><option>FRI</option>
  </select>
  <input id="stTime" type="time" class="border p-2 w-full mb-2" value="08:00">

  <button onclick="addStudent()" class="bg-green-600 text-white px-4 py-2 rounded">
    Enroll Student
  </button>`;
  stSubject.innerHTML=DB.subjects.map(s=>`<option value="${s.id}">${s.code}</option>`).join("");
}

function addStudent(){
  DB.students.push({
    studentNo:stNo.value,
    name:stName.value,
    seat:null,
    schedules:[{subjectId:Number(stSubject.value),day:stDay.value,startTime:stTime.value}]
  });
  saveDB();
  alert("Student enrolled. Assign seat in Student Records.");
}

/* ---------- STUDENT RECORDS + SEAT ASSIGN ---------- */
function recordsUI(){
  content.innerHTML=`
  <h3 class="font-bold mb-3">Student Records</h3>
  <table class="w-full border text-sm text-center">
    <tr class="bg-slate-200">
      <th class="border p-2">Student No</th>
      <th class="border p-2">Name</th>
      <th class="border p-2">Seat</th>
    </tr>
    ${DB.students.map(s=>`
      <tr onclick="editStudent('${s.studentNo}')"
        class="cursor-pointer hover:bg-slate-100">
        <td class="border p-2 text-blue-600 font-bold">${s.studentNo}</td>
        <td class="border p-2">${s.name}</td>
        <td class="border p-2">${s.seat||"-"}</td>
      </tr>`).join("")}
  </table>`;
}

function editStudent(stNo){
  const st=DB.students.find(s=>s.studentNo===stNo);
  content.innerHTML=`
  <h3 class="font-bold mb-2">Edit Student – ${st.studentNo}</h3>

  <h4 class="font-semibold mb-1">Cinema Seat Assignment</h4>
  <div id="seats" class="grid gap-2 mb-4"></div>

  <button onclick="recordsUI()" class="bg-gray-500 text-white px-3 py-1 rounded">
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
      ${taken? (taken.studentNo===student.studentNo?"bg-blue-400":"bg-red-300") :"bg-green-200"}">
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

/* ---------- ROOM CUSTOMIZATION ---------- */
function roomUI(){
  content.innerHTML=`
  <h3 class="font-bold mb-2">Room Configuration</h3>
  <label>Rows</label>
  <input id="rRows" type="number" class="border p-2 w-full mb-2" value="${DB.rooms.rows}">
  <label>Columns</label>
  <input id="rCols" type="number" class="border p-2 w-full mb-2" value="${DB.rooms.cols}">
  <button onclick="saveRoom()" class="bg-green-600 text-white px-4 py-2 rounded">
    Save Room
  </button>`;
}

function saveRoom(){
  DB.rooms.rows=Number(rRows.value);
  DB.rooms.cols=Number(rCols.value);
  DB.students.forEach(s=>{ if(s.seat>DB.rooms.rows*DB.rooms.cols) s.seat=null;});
  saveDB();
  alert("Room updated");
}

/* ================= STUDENT VIEW ================= */
function studentUI(st){
  const subj=DB.subjects.find(x=>x.id===st.schedules[0].subjectId);
  app.innerHTML=`
  <div class="bg-white p-6 rounded shadow max-w-xl mx-auto">
    <h2 class="text-xl font-bold mb-4">My Schedule</h2>
    <p><b>Subject:</b> ${subj?subj.code:""}</p>
    <p><b>Day:</b> ${st.schedules[0].day}</p>
    <p><b>Time:</b> ${st.schedules[0].startTime}</p>
    <p class="mt-2"><b>Seat:</b> ${st.seat||"Not assigned"}</p>

    <button onclick="renderLogin()" class="mt-4 bg-gray-500 text-white px-3 py-1 rounded">
      Logout
    </button>
  </div>`;
}

/* ================= PROFESSOR (placeholder) ================= */
function professorUI(){
  app.innerHTML="<h2>Professor Panel (existing logic intact)</h2>";
}
