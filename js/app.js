console.log("FINAL SYSTEM 11:35 LOADED");

const KEY="ATT_SYS_1135";
const app=document.getElementById("app");

let DB=JSON.parse(localStorage.getItem(KEY))||{
  admin:{u:"admin",p:"123"},
  professors:[],
  subjects:[],
  students:[],
  room:{r:5,c:8},
  attendance:[],
  session:null
};
function save(){localStorage.setItem(KEY,JSON.stringify(DB));}

/* LOGIN */
function loginUI(){
  app.innerHTML=`
  <div class="login-wrap">
    <div class="card" style="max-width:420px">
      <h2>Login</h2>
      <input id="u" placeholder="Username / Student No">
      <input id="p" type="password" placeholder="Password (blank for student)">
      <button class="btn-blue" onclick="login()">Login</button>
      <p style="font-size:13px;color:#555;margin-top:10px">admin / 123</p>
    </div>
  </div>`;
}

function login(){
  const u=uInput.value=uInput||document.getElementById("u").value.trim();
  const p=document.getElementById("p").value.trim();

  if(u===DB.admin.u && p===DB.admin.p) return registrarUI();
  const prof=DB.professors.find(x=>x.user===u&&x.pass===p);
  if(prof) return professorUI(prof);
  const st=DB.students.find(x=>x.no===u && p==="");
  if(st) return studentUI(st);
  alert("Invalid login");
}

/* REGISTRAR */
function registrarUI(){
  app.innerHTML=`
  <div class="card">
    <h2>Registrar Panel</h2>
    <div class="nav">
      <button class="btn-blue" onclick="enrollUI()">Enroll</button>
      <button class="btn-purple" onclick="recordsUI()">Student Records</button>
      <button class="btn-green" onclick="roomUI()">Room</button>
      <button class="btn-gray" onclick="usersUI()">Users</button>
      <button class="btn-gray" onclick="loginUI()">Logout</button>
    </div>
    <div id="content"></div>
  </div>`;
  enrollUI();
}

function enrollUI(){
  content.innerHTML=`
  <h3>Enroll Student</h3>
  <input id="sno" placeholder="Student Number (UID)">
  <input id="sname" placeholder="Name">
  <input id="scode" placeholder="Subject Code">
  <input id="prof" placeholder="Professor Username">
  <select id="day"><option>MON</option><option>TUE</option><option>WED</option><option>THU</option><option>FRI</option></select>
  <input id="time" type="time" value="08:00">
  <button class="btn-green" onclick="saveEnroll()">Save</button>`;
}

function saveEnroll(){
  let s=DB.students.find(x=>x.no===sno.value);
  if(!s){s={no:sno.value,name:sname.value,seat:null,subjects:[]};DB.students.push(s);}
  s.subjects.push({code:scode.value,prof:prof.value,day:day.value,time:time.value});
  save(); alert("Saved");
}

function recordsUI(){
  content.innerHTML=`
  <h3>Student Records</h3>
  <table class="table">
    <tr><th>No</th><th>Name</th><th>Subjects</th></tr>
    ${DB.students.map(s=>`
      <tr>
        <td>${s.no}</td>
        <td>${s.name}</td>
        <td>${s.subjects.map(x=>x.code).join(", ")}</td>
      </tr>`).join("")}
  </table>`;
}

function roomUI(){
  content.innerHTML=`
  <h3>Room (Cinema Style)</h3>
  <input id="rr" type="number" value="${DB.room.r}">
  <input id="cc" type="number" value="${DB.room.c}">
  <button class="btn-green" onclick="saveRoom()">Save</button>
  <div class="seats" style="grid-template-columns:repeat(${DB.room.c},1fr)">
    ${Array.from({length:DB.room.r*DB.room.c},(_,i)=>{
      const taken=DB.students.find(s=>s.seat===i+1);
      return `<div class="seat ${taken?'taken':'free'}">${i+1}</div>`;
    }).join("")}
  </div>`;
}

function saveRoom(){
  DB.room={r:+rr.value,c:+cc.value};
  save(); roomUI();
}

function usersUI(){
  content.innerHTML=`
  <h3>Professors</h3>
  <input id="pu" placeholder="Username">
  <input id="pp" placeholder="Password">
  <button class="btn-green" onclick="addProf()">Add</button>
  <ul>${DB.professors.map(p=>`<li>${p.user}</li>`).join("")}</ul>`;
}

function addProf(){
  DB.professors.push({user:pu.value,pass:pp.value});
  save(); usersUI();
}

/* PROFESSOR */
function professorUI(p){
  app.innerHTML=`
  <div class="card">
    <h2>Professor Panel</h2>
    <input id="scan" placeholder="RFID / Student No">
    <div id="att"></div>
    <button class="btn-gray" onclick="loginUI()">Logout</button>
  </div>`;
  scan.addEventListener("keydown",e=>{
    if(e.key==="Enter"){
      DB.attendance.push({no:scan.value,time:new Date().toLocaleTimeString(),status:"PRESENT"});
      save();
      att.innerHTML+=`<p>${scan.value} - PRESENT</p>`;
      scan.value="";
    }
  });
}

/* STUDENT */
function studentUI(s){
  app.innerHTML=`
  <div class="card">
    <h2>Student Portal</h2>
    ${s.subjects.map(x=>`<p>${x.code} | ${x.day} ${x.time}</p>`).join("")}
    <button class="btn-gray" onclick="loginUI()">Logout</button>
  </div>`;
}

loginUI();
