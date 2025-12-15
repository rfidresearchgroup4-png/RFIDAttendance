document.addEventListener("DOMContentLoaded", () => {
  init();
});

function init() {
  const app = document.getElementById("app");
  app.innerHTML = loginUI();
}

function loginUI() {
  return `
    <div class="bg-white rounded shadow p-6 max-w-md mx-auto">
      <h2 class="text-xl font-bold mb-4 text-center">Login</h2>

      <input id="user" placeholder="Username / Student No"
        class="w-full border px-3 py-2 mb-3 rounded"/>

      <input id="pass" type="password" placeholder="Password"
        class="w-full border px-3 py-2 mb-4 rounded"/>

      <button onclick="login()"
        class="w-full bg-sky-600 text-white py-2 rounded">
        Login
      </button>

      <p class="text-xs text-center mt-3 text-gray-500">
        admin / 123
      </p>
    </div>
  `;
}

function login() {
  const u = document.getElementById("user").value;
  const p = document.getElementById("pass").value;

  if (u === "admin" && p === "123") {
    adminUI();
  } else if (u) {
    professorUI();
  } else {
    alert("Invalid login");
  }
}

/* ---------- ADMIN ---------- */
function adminUI() {
  app.innerHTML = `
    <div class="bg-white p-6 rounded shadow">
      <h2 class="text-xl font-bold mb-4">Admin Dashboard</h2>
      <p>User access control only (demo).</p>
      <button onclick="init()"
        class="mt-4 bg-gray-500 text-white px-4 py-2 rounded">
        Logout
      </button>
    </div>
  `;
}

/* ---------- PROFESSOR ---------- */
let session = false;
let attendance = [];

function professorUI() {
  app.innerHTML = `
    <div class="bg-white p-6 rounded shadow">
      <h2 class="text-xl font-bold mb-4">Professor Attendance</h2>

      <button onclick="startSession()"
        class="bg-green-600 text-white px-4 py-2 rounded mb-3">
        Start Session
      </button>

      <input id="scan"
        placeholder="Tap RFID / Type Student No then ENTER"
        class="w-full border px-3 py-2 mb-4 rounded"/>

      <div id="list" class="text-sm"></div>

      <button onclick="init()"
        class="mt-4 bg-gray-500 text-white px-4 py-2 rounded">
        Logout
      </button>
    </div>
  `;

  document.getElementById("scan").addEventListener("keydown", e => {
    if (e.key === "Enter") autoTap();
  });
}

function startSession() {
  session = true;
  alert("SESSION STARTED");
}

function autoTap() {
  if (!session) return alert("Session not started");

  const uid = document.getElementById("scan").value.trim();
  if (!uid) return;

  const now = new Date();
  const status =
    now.getHours() < 8 || (now.getHours() === 8 && now.getMinutes() === 0)
      ? "PRESENT"
      : "LATE";

  attendance.unshift({
    uid,
    time: now.toLocaleTimeString(),
    status
  });

  renderAttendance();
  document.getElementById("scan").value = "";
}

function renderAttendance() {
  document.getElementById("list").innerHTML = `
    <table class="w-full border mt-3">
      <tr class="bg-slate-100">
        <th class="border px-2 py-1">Student No</th>
        <th class="border px-2 py-1">Time</th>
        <th class="border px-2 py-1">Status</th>
      </tr>
      ${attendance.map(a => `
        <tr>
          <td class="border px-2 py-1">${a.uid}</td>
          <td class="border px-2 py-1">${a.time}</td>
          <td class="border px-2 py-1 font-bold">${a.status}</td>
        </tr>
      `).join("")}
    </table>
  `;
}
