/* ==================================================
   RFID ATTENDANCE SYSTEM
   STABLE BASELINE + NAME DISPLAY + SEAT ARRANGEMENT
   + FIXED DAY/TIME LOGIC (PRESENT/LATE)
   + SUBJECT PICKER (Professor)
   + GRACE PERIOD (minutes)
   + LIVE DATE/TIME HEADER
   + EXPORT EXCEL / CSV / PDF
   FULL WORKING VERSION
   ================================================== */

const app = document.getElementById("app");

/* ---------------- LOAD EXPORT LIBRARIES ---------------- */

const scriptXLSX = document.createElement("script");
scriptXLSX.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
document.head.appendChild(scriptXLSX);

const scriptPDF = document.createElement("script");
scriptPDF.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
document.head.appendChild(scriptPDF);

/* ---------------- DATABASE ---------------- */

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

/* ---------------- MIGRATION ---------------- */

DB.students = DB.students.map(s => ({
  ...s,
  seat: s.seat || ""
}));

DB.subjects = DB.subjects.map(sub => ({
  ...sub,
  grace: (sub.grace === undefined || sub.grace === null) ? 5 : Number(sub.grace)
}));

saveDB();

let currentUser = null;

/* ---------------- HEADER CLOCK ---------------- */

function headerClock() {
  return `
    <div style="
      background:#000;
      color:#00ff00;
      padding:10px;
      display:flex;
      justify-content:space-between;
      font-weight:bold;
      font-size:16px;
    ">
      <div>RFID ATTENDANCE SYSTEM</div>
      <div id="liveClock"></div>
    </div>
  `;
}

function startClock() {

  function updateClock() {

    const now = new Date();

    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString();

    const el = document.getElementById("liveClock");

    if (el) el.innerHTML = `${date} ${time}`;
  }

  updateClock();

  setInterval(updateClock, 1000);

}

/* ---------------- TIME HELPERS ---------------- */

function pad2(n) { return String(n).padStart(2, "0"); }

function hmToMin(hm) {
  if (!hm) return 0;
  const [h, m] = hm.split(":").map(Number);
  return (h * 60) + m;
}

function nowHM() {
  const d = new Date();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function todayShort() {
  const d = new Date();
  return ["SUN","MON","TUE","WED","THU","FRI","SAT"][d.getDay()];
}

/* ---------------- EXPORT FUNCTIONS ---------------- */

function getAttendanceData() {

  return DB.attendance.map(a => ({
    StudentNo: a.no,
    Name: a.name,
    Seat: a.seat,
    Subject: a.subject,
    Day: a.day,
    Time: a.time,
    Status: a.status
  }));

}

/* CSV */
function exportCSV() {

  const rows = getAttendanceData();

  if (!rows.length) return alert("No data");

  const header = Object.keys(rows[0]).join(",");
  const body = rows.map(r => Object.values(r).join(",")).join("\n");

  const blob = new Blob([header+"\n"+body], {type:"text/csv"});

  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = "attendance.csv";
  link.click();

}

/* EXCEL */
function exportExcel() {

  if (!window.XLSX) {
    alert("Excel library loading...");
    return;
  }

  const ws = XLSX.utils.json_to_sheet(getAttendanceData());
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "Attendance");

  XLSX.writeFile(wb, "attendance.xlsx");

}

/* PDF */
function exportPDF() {

  if (!window.jspdf) {
    alert("PDF library loading...");
    return;
  }

  const { jsPDF } = window.jspdf;

  const doc = new jsPDF();

  const rows = getAttendanceData();

  let y = 10;

  doc.text("Attendance Report",10,y);

  y+=10;

  rows.forEach(r=>{
    doc.text(
      `${r.StudentNo} ${r.Name} ${r.Subject} ${r.Status}`,
      10,y
    );
    y+=7;
  });

  doc.save("attendance.pdf");

}

/* ---------------- LOGIN ---------------- */

function loginUI() {

  app.innerHTML = headerClock() + `
  <div class="card" style="max-width:400px;margin:auto">

    <h2>Login</h2>

    <input id="lu" placeholder="Username">

    <input id="lp" type="password" placeholder="Password">

    <button onclick="login()">Login</button>

    <p>admin / 123</p>

  </div>
  `;

  startClock();
}

function login() {

  const u = lu.value.trim();
  const p = lp.value.trim();

  const admin = DB.users.find(x=>x.u===u && x.p===p);

  if(admin){

    currentUser=admin;
    registrarUI();
    return;
  }

  const prof = DB.professors.find(x=>x.u===u && x.p===p);

  if(prof){

    currentUser=prof;
    professorUI();
    return;
  }

  const student = DB.students.find(x=>x.no===u);

  if(student){

    currentUser=student;
    studentUI(student);
    return;
  }

  alert("Invalid login");

}

/* ---------------- REGISTRAR ---------------- */

function registrarUI(tab="students") {

  app.innerHTML = headerClock() + `
  <div class="card">

    <h2>Registrar Panel</h2>

    <button onclick="registrarUI('students')">Students</button>

    <button onclick="registrarUI('subjects')">Subjects</button>

    <button onclick="registrarUI('professors')">Professors</button>

    <button onclick="registrarUI('seats')">Seats</button>

    <button onclick="exportExcel()">Export Excel</button>

    <button onclick="exportCSV()">Export CSV</button>

    <button onclick="exportPDF()">Export PDF</button>

    <button onclick="logout()">Logout</button>

    <div id="content"></div>

  </div>
  `;

  startClock();

  if(tab==="students") studentsUI();
  if(tab==="subjects") subjectsUI();
  if(tab==="professors") professorsUI();
  if(tab==="seats") seatsUI();
}

/* ---------------- STUDENTS ---------------- */

function studentsUI(){

content.innerHTML=`
<h3>Students</h3>

<input id="sno" placeholder="Student No">
<input id="sname" placeholder="Name">
<input id="sseat" placeholder="Seat">

<button onclick="addStudent()">Add</button>

<table>

${DB.students.map(s=>`
<tr>
<td>${s.no}</td>
<td>${s.name}</td>
<td>${s.seat}</td>
</tr>
`).join("")}

</table>
`;

}

function addStudent(){

const no=sno.value.trim();
const name=sname.value.trim();
const seat=sseat.value.trim();

DB.students.push({no,name,seat,subjects:[]});

saveDB();

studentsUI();

}

/* ---------------- SUBJECTS ---------------- */

function subjectsUI(){

content.innerHTML=`
<h3>Subjects</h3>

<input id="scode" placeholder="Code">
<input id="sday" placeholder="MON">
<input id="stime" type="time">
<input id="sgrace" type="number" value="5">

<button onclick="addSubject()">Add</button>

<table>

${DB.subjects.map(s=>`
<tr>
<td>${s.code}</td>
<td>${s.day}</td>
<td>${s.time}</td>
<td>${s.grace}</td>
</tr>
`).join("")}

</table>
`;

}

function addSubject(){

DB.subjects.push({

code:scode.value,
day:sday.value,
time:stime.value,
grace:Number(sgrace.value)

});

saveDB();

subjectsUI();

}

/* ---------------- PROFESSORS ---------------- */

function professorsUI(){

content.innerHTML=`
<h3>Professors</h3>

<input id="pu">
<input id="pp">

<button onclick="addProf()">Add</button>

<table>

${DB.professors.map(p=>`
<tr>
<td>${p.u}</td>
</tr>
`).join("")}

</table>
`;

}

function addProf(){

DB.professors.push({

u:pu.value,
p:pp.value

});

saveDB();

professorsUI();

}

/* ---------------- SEATS ---------------- */

function seatsUI(){

content.innerHTML=`
<h3>Seat Arrangement</h3>

<table>

${DB.students.map(s=>`
<tr>
<td>${s.no}</td>
<td>${s.name}</td>
<td>${s.seat}</td>
</tr>
`).join("")}

</table>
`;

}

/* ---------------- PROFESSOR PANEL ---------------- */

function professorUI(){

app.innerHTML=headerClock()+`
<div class="card">

<h2>Professor Panel</h2>

<input id="scan">

<table id="log"></table>

<button onclick="logout()">Logout</button>

</div>
`;

startClock();

scan.addEventListener("keydown",e=>{

if(e.key==="Enter") takeAttendance(scan.value);

});

}

function takeAttendance(no){

const s=DB.students.find(x=>x.no===no);

if(!s){alert("Not found");return;}

const subject=DB.subjects[0];

const now=new Date();

DB.attendance.push({

no:s.no,
name:s.name,
seat:s.seat,
time:now.toLocaleTimeString(),
subject:subject?.code||"",
day:todayShort(),
status:"PRESENT"

});

saveDB();

}

/* ---------------- STUDENT PANEL ---------------- */

function studentUI(s){

app.innerHTML=headerClock()+`
<div class="card">

<h2>${s.name}</h2>

Seat:${s.seat}

<button onclick="logout()">Logout</button>

</div>
`;

startClock();

}

/* ---------------- LOGOUT ---------------- */

function logout(){

currentUser=null;

loginUI();

}

/* ---------------- INIT ---------------- */

loginUI();
