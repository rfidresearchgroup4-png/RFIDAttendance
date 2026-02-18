/* ==================================================
   RFID ATTENDANCE SYSTEM
   FULL FINAL VERSION
   WITH:
   ✓ LIVE CLOCK
   ✓ PROFESSOR EXPORT BUTTONS
   ✓ AUTO RFID SCAN
   ✓ AUTO CLEAR INPUT
   ✓ AUTO LOG DISPLAY
   ✓ EXCEL / CSV / PDF EXPORT
   ================================================== */

const app = document.getElementById("app");

/* ---------------- LOAD LIBRARIES ---------------- */

const xlsxScript = document.createElement("script");
xlsxScript.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
document.head.appendChild(xlsxScript);

const pdfScript=document.createElement("script");
pdfScript.src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
document.head.appendChild(pdfScript);

/* ---------------- DATABASE ---------------- */

const DB={
users:JSON.parse(localStorage.getItem("users"))||[{u:"admin",p:"123",role:"admin"}],
students:JSON.parse(localStorage.getItem("students"))||[],
professors:JSON.parse(localStorage.getItem("professors"))||[],
subjects:JSON.parse(localStorage.getItem("subjects"))||[],
attendance:JSON.parse(localStorage.getItem("attendance"))||[]
};

function saveDB(){
Object.keys(DB).forEach(k=>localStorage.setItem(k,JSON.stringify(DB[k])));
}

/* ---------------- CLOCK HEADER ---------------- */

function headerClock(){
return `
<div style="background:black;color:#00ff00;padding:10px;
display:flex;justify-content:space-between;font-weight:bold">

<div>RFID ATTENDANCE SYSTEM</div>
<div id="clock"></div>

</div>
`;
}

function startClock(){

function update(){

const now=new Date();

clock.innerHTML=
now.toLocaleDateString()+" "+
now.toLocaleTimeString();

}

update();
setInterval(update,1000);

}

/* ---------------- TIME HELPERS ---------------- */

function pad2(n){return String(n).padStart(2,"0");}

function hmToMin(hm){

const[h,m]=hm.split(":").map(Number);
return h*60+m;

}

function nowHM(){

const d=new Date();
return pad2(d.getHours())+":"+pad2(d.getMinutes());

}

function todayShort(){

return ["SUN","MON","TUE","WED","THU","FRI","SAT"][new Date().getDay()];

}

/* ---------------- EXPORT ---------------- */

function exportData(){

return DB.attendance.map(a=>({
StudentNo:a.no,
Name:a.name,
Seat:a.seat,
Subject:a.subject,
Day:a.day,
Time:a.time,
Status:a.status
}));

}

function exportCSV(){

const data=exportData();

if(!data.length)return alert("No data");

const header=Object.keys(data[0]).join(",");
const body=data.map(r=>Object.values(r).join(",")).join("\n");

const blob=new Blob([header+"\n"+body],{type:"text/csv"});

const link=document.createElement("a");

link.href=URL.createObjectURL(blob);
link.download="attendance.csv";
link.click();

}

function exportExcel(){

if(!window.XLSX)return alert("Loading Excel...");

const ws=XLSX.utils.json_to_sheet(exportData());
const wb=XLSX.utils.book_new();

XLSX.utils.book_append_sheet(wb,ws,"Attendance");

XLSX.writeFile(wb,"attendance.xlsx");

}

function exportPDF(){

if(!window.jspdf)return alert("Loading PDF...");

const{jsPDF}=window.jspdf;

const doc=new jsPDF();

let y=10;

doc.text("Attendance Report",10,y);

y+=10;

exportData().forEach(r=>{
doc.text(`${r.StudentNo} ${r.Name} ${r.Subject} ${r.Status}`,10,y);
y+=7;
});

doc.save("attendance.pdf");

}

/* ---------------- LOGIN ---------------- */

function loginUI(){

app.innerHTML=headerClock()+`

<div class="card">

<h2>Login</h2>

<input id="lu" placeholder="Username">

<input id="lp" type="password" placeholder="Password">

<button onclick="login()">Login</button>

<p>admin / 123</p>

</div>
`;

startClock();

}

function login(){

const u=lu.value.trim();
const p=lp.value.trim();

const admin=DB.users.find(x=>x.u===u&&x.p===p);

if(admin){currentUser=admin;registrarUI();return;}

const prof=DB.professors.find(x=>x.u===u&&x.p===p);

if(prof){currentUser=prof;professorUI();return;}

const student=DB.students.find(x=>x.no===u);

if(student){currentUser=student;studentUI(student);return;}

alert("Invalid");

}

/* ---------------- REGISTRAR ---------------- */

function registrarUI(tab="students"){

app.innerHTML=headerClock()+`

<div class="card">

<h2>Registrar Panel</h2>

<button onclick="registrarUI('students')">Students</button>
<button onclick="registrarUI('subjects')">Subjects</button>
<button onclick="registrarUI('professors')">Professors</button>

<button onclick="exportExcel()">Export Excel</button>
<button onclick="exportCSV()">Export CSV</button>
<button onclick="exportPDF()">Export PDF</button>

<button onclick="logout()">Logout</button>

<div id="content"></div>

</div>
`;

startClock();

if(tab==="students")studentsUI();
if(tab==="subjects")subjectsUI();
if(tab==="professors")professorsUI();

}

/* ---------------- PROFESSOR PANEL ---------------- */

function professorUI(){

const day=todayShort();

const todaySubjects=DB.subjects.filter(s=>s.day===day);

app.innerHTML=headerClock()+`

<div class="card">

<h2>Professor Panel</h2>

<div style="display:flex;gap:10px">

<input id="scan" placeholder="Scan RFID">

<select id="psub">
${todaySubjects.map(s=>`<option value="${s.code}">${s.code} (${s.time})</option>`).join("")}
</select>

</div>

<div style="margin-top:10px">

<button onclick="exportExcel()">Export Excel</button>
<button onclick="exportCSV()">Export CSV</button>
<button onclick="exportPDF()">Export PDF</button>

<button onclick="logout()">Logout</button>

</div>

<table class="table">

<thead>

<tr>
<th>Name</th>
<th>Seat</th>
<th>Time</th>
<th>Subject</th>
<th>Status</th>
</tr>

</thead>

<tbody id="log"></tbody>

</table>

</div>
`;

startClock();

scan.focus();

scan.addEventListener("keydown",function(e){

if(e.key==="Enter"){

takeAttendance(scan.value.trim());

scan.value="";
scan.focus();

}

});

}

/* ---------------- ATTENDANCE ---------------- */

function takeAttendance(no){

const student=DB.students.find(s=>s.no===no);

if(!student){alert("Student not found");return;}

const subjectCode=psub.value;

const subject=DB.subjects.find(s=>s.code===subjectCode);

const now=new Date();

const scanMin=hmToMin(nowHM());

const allowed=hmToMin(subject.time)+subject.grace;

const status=scanMin<=allowed?"PRESENT":"LATE";

const record={
no:student.no,
name:student.name,
seat:student.seat,
time:now.toLocaleTimeString(),
subject:subject.code,
day:todayShort(),
status
};

DB.attendance.push(record);

saveDB();

/* display immediately */

log.innerHTML=`

<tr>

<td>${record.name}</td>
<td>${record.seat}</td>
<td>${record.time}</td>
<td>${record.subject}</td>
<td>${record.status}</td>

</tr>

`+log.innerHTML;

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
</tr>`).join("")}

</table>
`;

}

function addStudent(){

DB.students.push({
no:sno.value,
name:sname.value,
seat:sseat.value,
subjects:[]
});

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
</tr>`).join("")}

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
<tr><td>${p.u}</td></tr>`).join("")}

</table>
`;

}

function addProf(){

DB.professors.push({u:pu.value,p:pp.value});

saveDB();
professorsUI();

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

loginUI();

}

/* ---------------- INIT ---------------- */

loginUI();
