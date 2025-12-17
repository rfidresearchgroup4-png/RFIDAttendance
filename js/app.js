console.log("FINAL UI SYSTEM LOADED");

const KEY = "ATT_SYS_FINAL_UI";
const app = document.getElementById("app");

function loadDB(){
  return JSON.parse(localStorage.getItem(KEY)) || {
    admin:{u:"admin",p:"123"},
    profs:[],
    subs:[],
    students:[],
    room:{r:5,c:8},
    att:[],
    session:null
  };
}
let DB = loadDB();
function save(){ localStorage.setItem(KEY, JSON.stringify(DB)); }

/* ---------- LOGIN ---------- */
function loginUI(){
  app.innerHTML=`
  <div class="card" style="max-width:380px;margin:auto">
    <h2>Login</h2>
    <input id="u" placeholder="Username / Student No">
    <input id="p" type="password" placeholder="Password (blank for student)">
    <button class="btn-blue" onclick="login()">Login</button>
    <p style="font-size:12px;color:#666">admin / 123</p>
  </div>`;
}

function login(){
  const u=document.getElementById("u").value.trim();
  const p=document.getElementById("p").value.trim();

  if(u===DB.admin.u && p===DB.admin.p) return registrarUI();

  const prof=DB.profs.find(x=>x.u===u && x.p===p);
  if(prof) return professorUI(prof);

  const st=DB.students.find(x=>x.no===u && p==="");
  if(st) return studentUI(st);

  alert("Invalid login");
}

/* ---------- REGISTRAR ---------- */
function registrarUI(){
  app.innerHTML=`
  <div class="card">
    <h2>Registrar Panel</h2>
    <div class="nav">
      <button class="btn-blue" onclick="enrollUI()">Enroll</button>
      <button class="btn-purple" onclick="recordsUI()">Student Records</button>
      <button class="btn-green" onclick="roomUI()">Room</button>
      <button class="btn-gray" onclick="loginUI()">Logout</button>
    </div>
    <div id="content"></div>
  </div>`;
  enrollUI();
}

function enrollUI(){
  content.innerHTML=`
    <h3>Enroll / Add Subject to Student</h3>
    <input id="sno" placeholder="Student Number (UID)">
    <input id="sname" placeholder="Name (new student only)">
    <input id="sub" placeholder="Subject Code (ex: Math101)">
    <select id="day">
      <option>MON</option><option>TUE</option><option>WED</option>
      <option>THU</option><option>FRI</option>
    </select>
    <input id="time" type="time" value="08:00">
    <button class="btn-green" onclick="saveEnroll()">Save</button>`;
}

function saveEnroll(){
  let st=DB.students.find(s=>s.no===sno.value);
  if(!st){
    st={no:sno.value,name:sname.value,seat:null,sched:[]};
    DB.students.push(st);
  }
  st.sched.push({sub:sub.value,day:day.value,time:time.value});
  save(); alert("Saved");
}

/* ---------- STUDENT RECORDS ---------- */
function recordsUI(){
  content.innerHTML=`
    <h3>Student Records</h3>
    <table class="table">
      <tr><th>Student No</th><th>Name</th></tr>
      ${DB.students.map(s=>`
        <tr><td>${s.no}</td><td>${s.name}</td></tr>
      `).join("")}
    </table>`;
}

/* ---------- ROOM ---------- */
function roomUI(){
  content.innerHTML=`
    <h3>Room Configuration</h3>
    <input id="rr" type="number" value="${DB.room.r}">
    <input id="cc" type="number" value="${DB.room.c}">
    <button class="btn-green" onclick="saveRoom()">Save</button>`;
}
function saveRoom(){
  DB.room.r=+rr.value;
  DB.room.c=+cc.value;
  save(); alert("Room updated");
}

/* ---------- PROFESSOR ---------- */
function professorUI(p){
  app.innerHTML=`
  <div class="card">
    <h2>Professor</h2>
    <input id="scan" placeholder="RFID / Student No">
    <div id="att"></div>
    <button class="btn-gray" onclick="loginUI()">Logout</button>
  </div>`;
  scan.addEventListener("keydown",e=>{
    if(e.key==="Enter"){
      DB.att.push({no:scan.value,time:new Date().toLocaleTimeString(),status:"PRESENT"});
      save();
      att.innerHTML=`<p>${scan.value} - PRESENT</p>`;
      scan.value="";
    }
  });
}

/* ---------- STUDENT ---------- */
function studentUI(s){
  app.innerHTML=`
  <div class="card">
    <h2>Student Portal</h2>
    ${s.sched.map(x=>`<p>${x.sub} | ${x.day} | ${x.time}</p>`).join("")}
    <button class="btn-gray" onclick="loginUI()">Logout</button>
  </div>`;
}

loginUI();
