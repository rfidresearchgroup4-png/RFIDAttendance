/* =====================================================
   RFID ATTENDANCE SYSTEM - FULL FINAL VERSION
   ===================================================== */

console.log("RFID FULL SYSTEM FINAL LOADED");

const app = document.getElementById("app");
const KEY = "RFID_FULL_FINAL";

/* ================= DATABASE ================= */
let DB = JSON.parse(localStorage.getItem(KEY)) || {
  admin: { u: "admin", p: "123" },
  professors: [],
  students: [],
  subjects: [],
  attendance: [],
  room: { rows: 5, cols: 8 }
};

function save() {
  localStorage.setItem(KEY, JSON.stringify(DB));
}

/* ================= UTIL ================= */
function csvExport(filename, rows) {
  const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
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
      <button class="btn-blue" onclick="studentsUI()">Students</button>
      <button class="btn-purple" onclick="subjectsUI()">Subjects</button>
      <button class="btn-green" onclick="profUI()">Professors</button>
      <button class="btn-blue" onclick="seatUI()">Seats</button>
      <button class="btn-gray" onclick="exportAll()">Export</button>
      <button class="btn-gray" onclick="loginUI()">Logout</button>
    </div>
    <div id="content"></div>
  </div>`;
  studentsUI();
}

/* ================= STUDENTS ================= */
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
        <td><button class="btn-green" onclick="addStudent()">Add</button></td>
      </tr>
      ${DB.students.map((s,i)=>`
        <tr>
          <td>${s.no}</td>
          <td>${s.name}</td>
          <td>${s.seat || "-"}</td>
          <td>${s.subjects.join(", ")}</td>
          <td>
            <button onclick="editStudent(${i})">Edit</button>
            <button onclick="delStudent(${i})">Delete</button>
          </td>
        </tr>`).join("")}
    </table>`;
}

function addStudent(){
  DB.students.push({no:sno.value,name:sname.value,subjects:[],seat:null});
  save(); studentsUI();
}
function delStudent(i){DB.students.splice(i,1);save();studentsUI();}
function editStudent(i){
  const s=DB.students[i];
  const n=prompt("Name",s.name);
  if(n){s.name=n;save();studentsUI();}
}

/* ================= PROFESSORS ================= */
function profUI(){
  content.innerHTML=`
  <h3>Professors</h3>
  <table class="table">
    <tr><th>User</th><th>Pass</th><th>Action</th></tr>
    <tr>
      <td><input id="pu"></td>
      <td><input id="pp"></td>
      <td><button onclick="addProf()">Add</button></td>
    </tr>
    ${DB.professors.map((p,i)=>`
      <tr>
        <td>${p.u}</td>
        <td>${p.p}</td>
        <td><button onclick="DB.professors.splice(${i},1);save();profUI()">Delete</button></td>
      </tr>`).join("")}
  </table>`;
}
function addProf(){DB.professors.push({u:pu.value,p:pp.value});save();profUI();}

/* ================= SUBJECTS ================= */
function subjectsUI(){
  content.innerHTML=`
  <h3>Subjects</h3>
  <table class="table">
    <tr><th>Code</th><th>Prof</th><th>Day</th><th>Time</th><th>Action</th></tr>
    <tr>
      <td><input id="scode"></td>
      <td><select id="sprof">${DB.professors.map(p=>`<option>${p.u}</option>`)}</select></td>
      <td><select id="sday"><option>MON</option><option>TUE</option><option>WED</option></select></td>
      <td><input id="stime" type="time"></td>
      <td><button onclick="addSub()">Add</button></td>
    </tr>
    ${DB.subjects.map((s,i)=>`
      <tr>
        <td>${s.code}</td>
        <td>${s.prof}</td>
        <td>${s.day}</td>
        <td>${s.time}</td>
        <td><button onclick="DB.subjects.splice(${i},1);save();subjectsUI()">Delete</button></td>
      </tr>`).join("")}
  </table>`;
}
function addSub(){
  DB.subjects.push({code:scode.value,prof:sprof.value,day:sday.value,time:stime.value});
  save(); subjectsUI();
}

/* ================= SEATS ================= */
function seatUI(){
  content.innerHTML=`
  <h3>Seat Assignment</h3>
  <div class="seats" style="grid-template-columns:repeat(${DB.room.cols},1fr)">
    ${Array.from({length:DB.room.rows*DB.room.cols},(_,i)=>{
      const s=DB.students.find(x=>x.seat===i+1);
      return `<div class="seat ${s?'taken':'free'}" onclick="assignSeat(${i+1})">${i+1}</div>`;
    }).join("")}
  </div>`;
}
function assignSeat(n){
  const uid=prompt("Student No");
  const st=DB.students.find(x=>x.no===uid);
  if(st){st.seat=n;save();seatUI();}
}

/* ================= PROFESSOR PANEL ================= */
function professorUI(p){
  app.innerHTML=`
  <div class="card">
    <h2>Professor (${p.u})</h2>
    <input id="scan" placeholder="Student No">
    <table class="table">
      <tr><th>No</th><th>Time</th><th>Status</th></tr>
      <tbody id="log"></tbody>
    </table>
    <button onclick="loginUI()">Logout</button>
  </div>`;
  scan.addEventListener("keydown",e=>{
    if(e.key==="Enter"){
      const t=new Date();
      DB.attendance.push({no:scan.value,time:t.toLocaleTimeString(),status:t.getMinutes()==0?"PRESENT":"LATE"});
      save();
      log.innerHTML+=`<tr><td>${scan.value}</td><td>${t.toLocaleTimeString()}</td><td>${t.getMinutes()==0?"PRESENT":"LATE"}</td></tr>`;
      scan.value="";
    }
  });
}

/* ================= STUDENT PANEL ================= */
function studentUI(s){
  app.innerHTML=`
  <div class="card">
    <h2>Student Portal</h2>
    <p>${s.no} - ${s.name}</p>

    <h4>Subjects</h4>
    <table class="table">${s.subjects.map(x=>`<tr><td>${x}</td></tr>`).join("")}</table>

    <h4>Attendance</h4>
    <table class="table">
      ${DB.attendance.filter(a=>a.no===s.no)
        .map(a=>`<tr><td>${a.time}</td><td>${a.status}</td></tr>`).join("")}
    </table>

    <button onclick="loginUI()">Logout</button>
  </div>`;
}

/* ================= EXPORT ================= */
function exportAll(){
  csvExport("students.csv", [["No","Name","Seat","Subjects"],
    ...DB.students.map(s=>[s.no,s.name,s.seat,s.subjects.join("|")])]);

  csvExport("subjects.csv", [["Code","Prof","Day","Time"],
    ...DB.subjects.map(s=>[s.code,s.prof,s.day,s.time])]);

  csvExport("attendance.csv", [["No","Time","Status"],
    ...DB.attendance.map(a=>[a.no,a.time,a.status])]);
}

/* ================= INIT ================= */
loginUI();
