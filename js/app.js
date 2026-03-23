/* ==================================================
   RFID ATTENDANCE SYSTEM (STABLE FINAL VERSION)
   ================================================== */

const app = document.getElementById("app");
let currentUser = null;

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

let exportFilters = {
subject:null
};

function saveDB(){
Object.keys(DB).forEach(k=>localStorage.setItem(k,JSON.stringify(DB[k])));
}

/* ---------------- CLOCK ---------------- */

function headerClock(){
return `
<div style="background:black;color:#00ff00;padding:10px;
display:flex;justify-content:space-between;font-weight:bold">
<div>RFID ATTENDANCE SYSTEM</div>
<div id="clock"></div>
</div>`;
}

function startClock(){
function update(){
const now=new Date();
clock.innerHTML=now.toLocaleDateString()+" "+now.toLocaleTimeString();
}
update();
setInterval(update,1000);
}

/* ---------------- HELPERS ---------------- */

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

function getDownloadTimestamp(){
const now=new Date();
return now.toLocaleDateString()+" "+now.toLocaleTimeString();
}

function getFileDate(){
return new Date().toISOString().split("T")[0];
}

/* ---------------- EXPORT DATA ---------------- */

function exportData(){
return DB.attendance
.filter(a=>{
if(exportFilters.subject && a.subject!==exportFilters.subject)return false;
return true;
})
.map(a=>({
StudentNo:a.no,
Name:a.name,
Seat:a.seat,
Subject:a.subject,
Day:a.day,
Time:a.time,
Status:a.status
}));
}

/* ---------------- EXPORT CSV ---------------- */

function exportCSV(){

const data=exportData();
if(!data.length)return alert("No data");

const timestamp=getDownloadTimestamp();
const user=currentUser?.u||currentUser?.name||"System";

const headerInfo=`Attendance Report
Downloaded:,${timestamp}
Exported By:,${user}

`;

const header=Object.keys(data[0]).join(",");
const body=data.map(r=>Object.values(r).join(",")).join("\n");

const blob=new Blob([headerInfo+header+"\n"+body],{type:"text/csv"});

const link=document.createElement("a");
link.href=URL.createObjectURL(blob);
link.download="attendance_"+getFileDate()+".csv";
link.click();
}

/* ---------------- EXPORT EXCEL ---------------- */

function exportExcel(){

if(!window.XLSX)return alert("Loading Excel...");

const data=exportData();
const timestamp=getDownloadTimestamp();
const user=currentUser?.u||currentUser?.name||"System";

const header=[
["Attendance Report"],
["Downloaded:",timestamp],
["Exported By:",user],
[]
];

const ws=XLSX.utils.aoa_to_sheet(header);
XLSX.utils.sheet_add_json(ws,data,{origin:"A4"});

const wb=XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb,ws,"Attendance");

XLSX.writeFile(wb,"attendance_"+getFileDate()+".xlsx");
}

/* ---------------- EXPORT PDF ---------------- */

function exportPDF(){

if(!window.jspdf)return alert("Loading PDF...");

const {jsPDF}=window.jspdf;
const doc=new jsPDF();

let y=10;

doc.text("Attendance Report",10,y); y+=8;
doc.text("Downloaded: "+getDownloadTimestamp(),10,y); y+=8;

const user=currentUser?.u||currentUser?.name||"System";
doc.text("Exported By: "+user,10,y); y+=10;

exportData().forEach(r=>{
doc.text(`${r.StudentNo} ${r.Name} ${r.Subject} ${r.Status}`,10,y);
y+=7;
});

doc.save("attendance_"+getFileDate()+".pdf");
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
</div>`;
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

alert("Invalid login");
}

/* ---------------- REGISTRAR ---------------- */

function registrarUI(){
app.innerHTML=headerClock()+`
<div class="card">

<h2>Registrar Panel</h2>

<button onclick="studentsUI()">Students</button>
<button onclick="subjectsUI()">Subjects</button>
<button onclick="professorsUI()">Professors</button>

<button onclick="exportExcel()">Excel</button>
<button onclick="exportCSV()">CSV</button>
<button onclick="exportPDF()">PDF</button>

<button onclick="logout()">Logout</button>

<div id="content"></div>

</div>`;
startClock();
studentsUI();
}

/* ---------------- PROFESSOR ---------------- */

function professorUI(){

app.innerHTML=headerClock()+`
<div class="card">

<h2>Professor Panel</h2>

<input id="scan" placeholder="Scan RFID">

<select id="filterSubject">
<option value="">All</option>
${DB.subjects.map(s=>`<option value="${s.code}">${s.code}</option>`).join("")}
</select>

<button onclick="applyFilters()">Apply Filter</button>

<div>
<button onclick="exportExcel()">Excel</button>
<button onclick="exportCSV()">CSV</button>
<button onclick="exportPDF()">PDF</button>
<button onclick="logout()">Logout</button>
</div>

<table>
<tbody id="log"></tbody>
</table>

</div>`;

startClock();

scan.focus();

scan.addEventListener("keydown",function(e){
if(e.key==="Enter"){
takeAttendance(scan.value.trim());
scan.value="";
}
});
}

/* ---------------- FILTER ---------------- */

function applyFilters(){
exportFilters.subject=filterSubject.value||null;
alert("Filter applied");
}

/* ---------------- ATTENDANCE ---------------- */

function takeAttendance(no){

const student=DB.students.find(s=>s.no===no);
if(!student){alert("Student not found");return;}

const subject=DB.subjects[0];
if(!subject){alert("No subject");return;}

const now=new Date();

const record={
no:student.no,
name:student.name,
seat:student.seat,
time:now.toLocaleTimeString(),
subject:subject.code,
day:todayShort(),
status:"PRESENT"
};

DB.attendance.push(record);
saveDB();

log.innerHTML=`<tr>
<td>${record.name}</td>
<td>${record.seat}</td>
<td>${record.time}</td>
<td>${record.subject}</td>
<td>${record.status}</td>
</tr>`+log.innerHTML;

}

/* ---------------- SIMPLE CRUD ---------------- */

function studentsUI(){
content.innerHTML=`
<h3>Students</h3>
<input id="sno" placeholder="No">
<input id="sname" placeholder="Name">
<input id="sseat" placeholder="Seat">
<button onclick="addStudent()">Add</button>
${DB.students.map(s=>`<div>${s.no} ${s.name}</div>`).join("")}
`;
}

function addStudent(){
DB.students.push({no:sno.value,name:sname.value,seat:sseat.value});
saveDB();
studentsUI();
}

function subjectsUI(){
content.innerHTML=`
<h3>Subjects</h3>
<input id="scode" placeholder="Code">
<button onclick="addSubject()">Add</button>
${DB.subjects.map(s=>`<div>${s.code}</div>`).join("")}
`;
}

function addSubject(){
DB.subjects.push({code:scode.value});
saveDB();
subjectsUI();
}

function professorsUI(){
content.innerHTML=`
<h3>Professors</h3>
<input id="pu"><input id="pp">
<button onclick="addProf()">Add</button>
`;
}

function addProf(){
DB.professors.push({u:pu.value,p:pp.value});
saveDB();
}

/* ---------------- STUDENT ---------------- */

function studentUI(s){
app.innerHTML=headerClock()+`
<div class="card">
<h2>${s.name}</h2>
<button onclick="logout()">Logout</button>
</div>`;
startClock();
}

/* ---------------- LOGOUT ---------------- */

function logout(){loginUI();}

/* ---------------- INIT ---------------- */

loginUI();
