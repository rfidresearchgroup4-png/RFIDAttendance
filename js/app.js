console.log("ATTENDANCE SYSTEM FINAL FIX LOADED");

const app = document.getElementById("app");

/* ---------- LOGIN ---------- */
function loginUI(){
  app.innerHTML = `
    <div class="card" style="max-width:420px;margin:auto">
      <h2>Login</h2>
      <input id="user" placeholder="Username / Student No">
      <input id="pass" type="password" placeholder="Password (blank for student)">
      <button class="btn-blue" onclick="login()">Login</button>
      <p style="font-size:12px;color:#666;margin-top:10px">
        Admin: <b>admin / 123</b>
      </p>
    </div>
  `;
}

function login(){
  const u = document.getElementById("user").value.trim();
  const p = document.getElementById("pass").value.trim();

  if(u === "admin" && p === "123"){
    registrarUI();
    return;
  }

  if(u.startsWith("prof") && p !== ""){
    professorUI(u);
    return;
  }

  if(u !== "" && p === ""){
    studentUI(u);
    return;
  }

  alert("Invalid login");
}

/* ---------- REGISTRAR ---------- */
function registrarUI(){
  app.innerHTML = `
    <div class="card">
      <h2>Registrar Panel</h2>
      <div class="nav">
        <button class="btn-blue">Enroll</button>
        <button class="btn-purple">Student Records</button>
        <button class="btn-green">Room</button>
        <button class="btn-gray" onclick="loginUI()">Logout</button>
      </div>
      <p><b>Status:</b> UI loaded correctly ✔</p>
    </div>
  `;
}

/* ---------- PROFESSOR ---------- */
function professorUI(name){
  app.innerHTML = `
    <div class="card">
      <h2>Professor Panel</h2>
      <p>Welcome, ${name}</p>
      <input placeholder="RFID / Student No">
      <button class="btn-green">Start Session</button>
      <button class="btn-gray" onclick="loginUI()">Logout</button>
    </div>
  `;
}

/* ---------- STUDENT ---------- */
function studentUI(no){
  app.innerHTML = `
    <div class="card">
      <h2>Student Portal</h2>
      <p>Student No: <b>${no}</b></p>
      <p>No records yet.</p>
      <button class="btn-gray" onclick="loginUI()">Logout</button>
    </div>
  `;
}

loginUI();
