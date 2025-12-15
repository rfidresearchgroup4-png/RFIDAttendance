let SESSION_ACTIVE = false;


// JTEN Final Complete Frontend (localStorage-based)
const STORAGE_KEY = "jten_final_complete_data";
function defaultData(){
  return {
    users: [{username:'admin',password:'123',role:'admin',display:'Administrator'}],
    students: [],
    subjects: [], // subject = {id, code, title, professor_id}

    rooms: [],
    seats: [],
    schedules: [],
    attendance: [],
    absences: []
  };
}
function loadData(){ const raw = localStorage.getItem(STORAGE_KEY); if(!raw){ const d=defaultData(); localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); return d;} try{return JSON.parse(raw);}catch(e){ const d=defaultData(); localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); return d;} }
function saveData(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(DATA)); }
let DATA = loadData();

async function nowISO(){ try{ const r = await fetch('https://worldtimeapi.org/api/timezone/Asia/Manila'); const j = await r.json(); return j.datetime; }catch(e){ return new Date().toISOString(); } }

// Render App
function renderApp(){
  const app = document.getElementById('app');
  const cur = JSON.parse(localStorage.getItem('jten_current_user')||'null');
  if(!cur) return renderLogin(app);
  renderLayout(app, cur);
}

// Login
function renderLogin(app){
  app.innerHTML = `<div class="min-h-screen flex items-center justify-center p-6"><div class="w-full max-w-md bg-white rounded-lg shadow p-6">
    <h2 class="text-2xl font-bold text-sky-700 text-center">JTEN RFID System</h2>
    <p class="text-center text-sm text-slate-600 mb-4">Login (Students use Student No)</p>
    <input id="login_user" class="w-full border rounded px-3 py-2 mb-2" placeholder="Student No or username"/>
    <input id="login_pass" type="password" class="w-full border rounded px-3 py-2 mb-4" placeholder="Password"/>
    <div class="flex gap-2"><button id="btnLogin" class="flex-1 bg-sky-600 text-white px-4 py-2 rounded">Login</button></div>
    <p id="login_msg" class="text-sm text-red-600 mt-2"></p>
  </div></div>`;
  document.getElementById('btnLogin').addEventListener('click', doLogin);
}
function doLogin(){
  const u = document.getElementById('login_user').value.trim();
  const p = document.getElementById('login_pass').value;
  const msg = document.getElementById('login_msg');
  if(!u||!p){ msg.innerText='Enter credentials'; return; }
  const user = DATA.users.find(x=>x.username===u && x.password===p);
  if(!user){ msg.innerText='Invalid credentials. Registrar/Admin must create your account.'; return; }
  if(user.role==='student' && !/^\d+$/.test(user.username)){ msg.innerText='Student username must be numeric (card UID).'; return; }
  localStorage.setItem('jten_current_user', JSON.stringify(user));
  renderApp();
}

// Layout and Menu
function renderLayout(app, user){
  app.innerHTML = `<div class="flex min-h-screen">
    <aside class="w-72 sidebar bg-sky-800 text-white p-4 flex flex-col">
      <div class="mb-4"><strong>MENU</strong></div>
      <div id="menu" class="flex-1 space-y-1"></div>
      <div class="mt-4 text-sm">Logged in: <b>${user.display||user.username}</b></div>
      <div class="mt-2"><button id="logoutBtn" class="w-full bg-sky-600 py-2 rounded">Logout</button></div>
    </aside>
    <main class="flex-1 p-6" id="mainArea"></main>
  </div>`;
  document.getElementById('logoutBtn').addEventListener('click', ()=>{ localStorage.removeItem('jten_current_user'); location.reload(); });
  buildMenu(user.role);
  // if student -> go straight to student page
  if(user.role==='student'){ navigate('student'); return; }
  navigate('dashboard');
}

function buildMenu(role){
  const menu = document.getElementById('menu'); menu.innerHTML='';
  const cur = JSON.parse(localStorage.getItem('jten_current_user')||'null');
  if(role==='student'){
    const b=document.createElement('button'); b.className='menu-btn bg-transparent hover:bg-sky-700 px-3 py-2 rounded w-full text-left'; b.innerText='My Profile'; b.onclick=()=>navigate('student'); menu.appendChild(b); return;
  }
  const items = [
    {id:'dashboard',label:'Dashboard',roles:['admin','registrar','professor']},
    {id:'admin_users',label:'User Access Management',roles:['admin']},
    {id:'registrar',label:'Registrar',roles:['admin','registrar']},
    {id:'professor',label:'Professor',roles:['admin','professor']},
    {id:'students',label:'Students',roles:['admin','registrar']},
    {id:'rooms',label:'Rooms',roles:['admin','registrar']},
    {id:'subjects',label:'Subjects',roles:['admin','registrar']},
    {id:'attendance',label:'Attendance Reports',roles:['admin','registrar','professor']}
  ];
  items.forEach(it=>{ if(it.roles.includes(role)){ const b=document.createElement('button'); b.className='menu-btn bg-transparent hover:bg-sky-700 px-3 py-2 rounded w-full text-left'; b.innerText=it.label; b.onclick=()=>navigate(it.id); menu.appendChild(b);} });
}

// Navigation
function navigate(page){
  const main = document.getElementById('mainArea'); main.innerHTML='';
  if(page==='dashboard') renderDashboard(main);
  if(page==='admin_users') renderAdminUsers(main);
  if(page==='registrar') renderRegistrar(main);
  if(page==='professor') renderProfessor(main);
  if(page==='students') renderStudents(main);
  if(page==='rooms') renderRooms(main);
  if(page==='subjects') renderSubjects(main);
  if(page==='attendance') renderReports(main);
  if(page==='student') renderStudent(main);
}

// Dashboard
function renderDashboard(el){
  el.innerHTML = `<div class="bg-white p-6 rounded shadow"><h2 class="text-xl font-bold">Dashboard</h2><div class="mt-4 grid grid-cols-3 gap-4">
    <div class="p-4 border rounded"><div class="text-sm">Students</div><div class="text-2xl">${DATA.students.length}</div></div>
    <div class="p-4 border rounded"><div class="text-sm">Rooms</div><div class="text-2xl">${DATA.rooms.length}</div></div>
    <div class="p-4 border rounded"><div class="text-sm">Attendance</div><div class="text-2xl">${DATA.attendance.length}</div></div>
  </div></div>`;
}

// Admin: User Access Management (create registrar/professor/admin)
function renderAdminUsers(el){
  el.innerHTML = `<div class="bg-white p-6 rounded shadow"><h2 class="text-lg font-bold">User Access Management</h2>
    <div class="mt-3 grid grid-cols-2 gap-2"><input id="new_usr" class="border rounded px-3 py-2" placeholder="Username"/>
    <input id="new_disp" class="border rounded px-3 py-2" placeholder="Display name"/>
    <select id="new_role" class="border rounded px-3 py-2"><option value="registrar">Registrar</option><option value="professor">Professor</option><option value="admin">Admin</option></select>
    <input id="new_pw" type="password" class="border rounded px-3 py-2" placeholder="Password"/>
    <div></div><button id="create_user" class="col-span-2 bg-sky-600 text-white px-4 py-2 rounded">Create User</button></div>
    <div id="users_list" class="mt-4 text-sm"></div></div>`;
  function refresh(){ const list = DATA.users.filter(u=>u.role!=='student').map(u=>`<div class="py-1 flex justify-between"><div>${u.username} — ${u.display} — ${u.role}</div><div><button class="deluser bg-red-500 text-white px-2 py-1 rounded" data-id="${'${'}u.username${'}'}">Delete</button></div></div>`).join('')||'<div>No users</div>'; document.getElementById('users_list').innerHTML = list; document.querySelectorAll('.deluser').forEach(b=> b.addEventListener('click', (e)=>{ const uname = e.target.dataset.id; if(!confirm('Delete user '+uname+'?')) return; DATA.users = DATA.users.filter(x=> x.username!==uname); saveData(); refresh(); })); }
  document.getElementById('create_user').addEventListener('click', ()=>{ const u=document.getElementById('new_usr').value.trim(); const disp=document.getElementById('new_disp').value.trim(); const role=document.getElementById('new_role').value; const pw=document.getElementById('new_pw').value; if(!u||!pw) return alert('Enter username and password'); if(DATA.users.find(x=>x.username===u)) return alert('Username exists'); DATA.users.push({username:u,password:pw,role:role,display:disp||u}); saveData(); refresh(); });
  refresh();
}

// Registrar module: Registration, Assign Subjects, Seat (cinema) and Scheduling Assistant
function renderRegistrar(el){
  el.innerHTML = `<div class="bg-white p-6 rounded shadow"><h2 class="text-lg font-bold">Registrar</h2>
    <div class="mt-3 space-y-4">
      <div class="flex gap-2"><button id="tab_reg" class="px-3 py-2 bg-sky-600 text-white rounded">Registration</button><button id="tab_assign" class="px-3 py-2 bg-sky-200 text-slate-800 rounded">Assign Subjects</button><button id="tab_seat" class="px-3 py-2 bg-sky-200 text-slate-800 rounded">Seat Assignment</button><button id="tab_prof" class="px-3 py-2 bg-sky-200 text-slate-800 rounded">Assign Professor</button>
      <button id="tab_sched" class="px-3 py-2 bg-sky-200 text-slate-800 rounded">Scheduling Assistant</button></div>
      <div id="tabContent" class="mt-4"></div>
    </div></div>`;

  function showRegistration(){ const content=document.getElementById('tabContent'); content.innerHTML = `
    <form id="createStudentForm" class="grid grid-cols-2 gap-3"><input id="stu_scan" class="border rounded px-3 py-2 col-span-2" placeholder="Tap card or type UID (Student No)"/><input id="stu_no" class="border rounded px-3 py-2" placeholder="Student No (optional if scan)"/><input id="stu_name" class="border rounded px-3 py-2" placeholder="Full name"/><input id="stu_section" class="border rounded px-3 py-2" placeholder="Section"/><input id="stu_pw" type="password" class="border rounded px-3 py-2" placeholder="Password"/><div></div><button class="col-span-2 bg-sky-600 text-white px-4 py-2 rounded" type="submit">Create Student</button></form><div id="reg_msg" class="mt-2 text-sm"></div>`;
    const scan=document.getElementById('stu_scan'); scan.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); document.getElementById('createStudentForm').dispatchEvent(new Event('submit')); } });
    document.getElementById('createStudentForm').addEventListener('submit', (e)=>{ e.preventDefault(); const sscan=document.getElementById('stu_scan').value.trim(); const stu_no=(sscan&&sscan.length>0)?sscan:document.getElementById('stu_no').value.trim(); const name=document.getElementById('stu_name').value.trim(); const section=document.getElementById('stu_section').value.trim(); const pw=document.getElementById('stu_pw').value; if(!stu_no||!name||!pw) return alert('Fill required'); if(DATA.students.find(x=>x.student_no===stu_no)) return alert('Student exists'); if(DATA.users.find(x=>x.username===stu_no)) return alert('User exists'); const id=DATA.students.length?Math.max(...DATA.students.map(s=>s.id))+1:1; DATA.students.push({id,student_no:stu_no,name,section,subjects:[],assigned_room:null,assigned_seat:null}); DATA.users.push({username:stu_no,password:pw,role:'student',display:name,student_id:id}); saveData(); document.getElementById('reg_msg').innerText='Student created.'; showRegistration(); }); }

  function showAssign(){
  function showAssigned(){
    const sid=parseInt(document.getElementById('as_student').value);
    if(!sid) return;
    const st=DATA.students.find(s=>s.id===sid);
    const list=(st.subjects||[]).map(id=>{
      const sub=DATA.subjects.find(s=>s.id===id);
      return sub?sub.code:'?';
    }).join(', ');
    document.getElementById('as_msg').innerText='Assigned Subjects: '+(list||'None');
  } const content=document.getElementById('tabContent'); if(DATA.students.length===0||DATA.subjects.length===0){ content.innerHTML=`<div class="p-4">No students or subjects. Create them first.</div>`; return; } content.innerHTML=`<div class="grid grid-cols-2 gap-3"><select id="as_student" class="border rounded px-3 py-2"><option value="">-- select student --</option>${DATA.students.map(s=>`<option value="${s.id}">${s.student_no} - ${s.name}</option>`).join('')}</select><select id="as_subject" class="border rounded px-3 py-2"><option value="">-- select subject --</option>${DATA.subjects.filter(s=>s.professor_id===JSON.parse(localStorage.getItem('jten_current_user')).username).map(s=>`<option value="${s.id}">${s.code} ${s.title}</option>`).join('')}</select><div class="col-span-2 flex gap-2"><button id="assignBtn" class="bg-sky-600 text-white px-4 py-2 rounded">Assign</button><button id="unassignBtn" class="bg-red-500 text-white px-4 py-2 rounded">Remove</button></div><div id="as_msg" class="col-span-2 text-sm"></div></div>`;
    document.getElementById('assignBtn').addEventListener('click', ()=>{ const sid=parseInt(document.getElementById('as_student').value); const sub=parseInt(document.getElementById('as_subject').value); if(!sid||!sub) return alert('Select'); const st=DATA.students.find(s=>s.id===sid); st.subjects=st.subjects||[]; if(!st.subjects.includes(sub)) st.subjects.push(sub); saveData(); document.getElementById('as_msg').innerText='Assigned';
showAssigned(); showAssign(); });
    document.getElementById('unassignBtn').addEventListener('click', ()=>{ const sid=parseInt(document.getElementById('as_student').value); const sub=parseInt(document.getElementById('as_subject').value); if(!sid||!sub) return alert('Select'); const st=DATA.students.find(s=>s.id===sid); st.subjects=(st.subjects||[]).filter(x=>x!==sub); saveData(); document.getElementById('as_msg').innerText='Removed'; showAssign(); });
  }

  function showSeat(){ const content=document.getElementById('tabContent'); if(DATA.rooms.length===0||DATA.students.length===0){ content.innerHTML=`<div class="p-4">Create rooms and students first.</div>`; return; } content.innerHTML=`<div class="grid grid-cols-2 gap-4"><div><select id="sa_student" class="border rounded px-3 py-2 mb-2"><option value="">-- select student --</option>${DATA.students.map(s=>`<option value="${s.id}">${s.student_no} - ${s.name}</option>`).join('')}</select><select id="sa_room" class="border rounded px-3 py-2 mb-2"><option value="">-- select room --</option>${DATA.rooms.map(r=>`<option value="${r.id}">${r.name} (cap ${r.capacity})</option>`).join('')}</select><div id="seat_map" class="mt-3"></div></div><div><div id="seat_info" class="p-4 bg-white rounded shadow text-sm">Select student and room.</div><div class="mt-4"><button id="auto_assign" class="bg-gray-200 px-3 py-2 rounded">Auto-assign next</button></div></div></div>`;
    const studentSel=document.getElementById('sa_student'); const roomSel=document.getElementById('sa_room'); const map=document.getElementById('seat_map'); const info=document.getElementById('seat_info');
    function buildMap(){ map.innerHTML=''; const rid=parseInt(roomSel.value); const sid=parseInt(studentSel.value); if(!rid) return; const room=DATA.rooms.find(r=>r.id===rid); const cols=room.cols||5; const rows=room.rows||Math.ceil((room.capacity||25)/cols); const existing=DATA.seats.filter(s=>s.room_id===rid); if(existing.length===0){ let seat_no=1; for(let r=0;r<rows;r++){ for(let c=0;c<cols;c++){ if(seat_no>(room.capacity||rows*cols)) break; DATA.seats.push({room_id:rid,row:r,col:c,seat_no:seat_no,occupied:false}); seat_no++; } } saveData(); } const seats=DATA.seats.filter(s=>s.room_id===rid).sort((a,b)=> (a.row-b.row)||(a.col-b.col)); const container=document.createElement('div'); container.style.display='grid'; container.style.gridTemplateColumns=`repeat(${cols},48px)`; container.style.gap='6px'; seats.forEach(seat=>{ const label=String.fromCharCode(65+(seat.row||0))+((seat.col||0)+1); const btn=document.createElement('button'); btn.className='p-2 rounded border menu-btn'; btn.style.width='44px'; btn.style.height='44px'; btn.innerText=label; const taken=DATA.students.find(s=>s.assigned_room===rid && s.assigned_seat===seat.seat_no); if(taken){ btn.style.background='#ef4444'; btn.style.color='white'; btn.disabled=true; btn.title='Taken by '+taken.name; } else { btn.style.background='#34d399'; btn.style.color='white'; btn.disabled=false; } btn.addEventListener('click', ()=>{ if(!sid) return alert('Select student'); const student=DATA.students.find(s=>s.id===sid); if(student.assigned_room&&student.assigned_seat){ const prev=DATA.seats.find(x=>x.room_id===student.assigned_room && x.seat_no===student.assigned_seat); if(prev) prev.occupied=false; } seat.occupied=true; student.assigned_room=rid; student.assigned_seat=seat.seat_no; saveData(); buildMap(); info.innerText=`Assigned ${label} to ${student.name}`; }); container.appendChild(btn); }); map.appendChild(container); }
    roomSel.addEventListener('change', buildMap); studentSel.addEventListener('change', ()=>{ const s=DATA.students.find(x=>x.id==parseInt(studentSel.value)); info.innerText = s?('Selected: '+s.name):'Select student'; buildMap(); }); document.getElementById('auto_assign').addEventListener('click', ()=>{ const sid=parseInt(studentSel.value); const rid=parseInt(roomSel.value); if(!sid||!rid) return alert('Select student and room'); const seats=DATA.seats.filter(s=>s.room_id===rid && !s.occupied); if(seats.length===0) return alert('No available seats'); const seat=seats[0]; const student=DATA.students.find(s=>s.id===sid); if(student.assigned_room&&student.assigned_seat){ const prev=DATA.seats.find(x=>x.room_id===student.assigned_room && x.seat_no===student.assigned_seat); if(prev) prev.occupied=false; } seat.occupied=true; student.assigned_room=rid; student.assigned_seat=seat.seat_no; saveData(); buildMap(); info.innerText='Auto-assigned'; }); if(DATA.rooms[0]) roomSel.value=DATA.rooms[0].id; buildMap(); }

  
  function showAssignProfessor(){
    const content=document.getElementById('tabContent');
    const profs = DATA.users.filter(u=>u.role==='professor');
    if(DATA.subjects.length===0||profs.length===0){
      content.innerHTML='<div class="p-4">Create subjects and professors first.</div>';
      return;
    }
    content.innerHTML=`<div class="grid grid-cols-2 gap-3">
      <select id="ap_subject" class="border rounded px-3 py-2">
        ${DATA.subjects.filter(s=>s.professor_id===JSON.parse(localStorage.getItem('jten_current_user')).username).map(s=>`<option value="${s.id}">${s.code} ${s.title}</option>`).join('')}
      </select>
      <select id="ap_prof" class="border rounded px-3 py-2">
        ${profs.map(p=>`<option value="${p.username}">${p.display}</option>`).join('')}
      </select>
      <div class="col-span-2">
        <button id="ap_btn" class="bg-sky-600 text-white px-4 py-2 rounded">Assign</button>
      </div>
    </div>`;
    document.getElementById('ap_btn').addEventListener('click',()=>{
      const sid=parseInt(document.getElementById('ap_subject').value);
      const pid=document.getElementById('ap_prof').value;
      const subj=DATA.subjects.find(s=>s.id===sid);
      subj.professor_id=pid;
      saveData();
      alert('Professor assigned');
    });
  }

function showScheduling(){ const content=document.getElementById('tabContent'); if(DATA.subjects.length===0||DATA.rooms.length===0){ content.innerHTML=`<div class="p-4">Create subjects and rooms first.</div>`; return; } content.innerHTML=`<form id="schedForm" class="grid grid-cols-2 gap-2"><select id="sched_sub" class="border rounded px-3 py-2">${DATA.subjects.filter(s=>s.professor_id===JSON.parse(localStorage.getItem('jten_current_user')).username).map(s=>`<option value="${s.id}">${s.code} ${s.title}</option>`).join('')}</select><select id="sched_room" class="border rounded px-3 py-2">${DATA.rooms.map(r=>`<option value="${r.id}">${r.name}</option>`).join('')}</select><select id="sched_day" class="border rounded px-3 py-2"><option>Mon</option><option>Tue</option><option>Wed</option><option>Thu</option><option>Fri</option></select><input id="sched_time" type="time" class="border rounded px-3 py-2"/><input id="sched_section" class="border rounded px-3 py-2" placeholder="Section"/><div></div><button class="col-span-2 bg-sky-600 text-white px-4 py-2 rounded">Create Schedule</button></form><div id="sched_list" class="mt-4 text-sm"></div>`;
    document.getElementById('schedForm').addEventListener('submit',(e)=>{ e.preventDefault(); const subj=parseInt(document.getElementById('sched_sub').value); const room=parseInt(document.getElementById('sched_room').value); const day=document.getElementById('sched_day').value; const time=document.getElementById('sched_time').value; const section=document.getElementById('sched_section').value.trim(); if(!subj||!room||!time||!section) return alert('Fill fields'); const id=DATA.schedules.length?Math.max(...DATA.schedules.map(s=>s.id))+1:1; DATA.schedules.push({id,subject_id:subj,room_id:room,day,time,section}); saveData(); renderRegistrar(el); }); const list = DATA.schedules.map(s=>{ const sub=DATA.subjects.find(x=>x.id===s.subject_id)||{}; const room=DATA.rooms.find(x=>x.id===s.room_id)||{}; return `<div class="py-1 border rounded p-2">${s.day} ${s.time} — ${sub.code||''} — ${room.name||''} — Section ${s.section}</div>`; }).join('')||'<div>No schedules</div>'; document.getElementById('sched_list').innerHTML = list; }

  document.getElementById('tab_reg').addEventListener('click', ()=>{ document.getElementById('tab_reg').classList.add('tab-active'); document.getElementById('tab_assign').classList.remove('tab-active'); document.getElementById('tab_seat').classList.remove('tab-active'); document.getElementById('tab_sched').classList.remove('tab-active'); showRegistration(); });
  document.getElementById('tab_assign').addEventListener('click', ()=>{ document.getElementById('tab_reg').classList.remove('tab-active'); document.getElementById('tab_assign').classList.add('tab-active'); document.getElementById('tab_seat').classList.remove('tab-active'); document.getElementById('tab_sched').classList.remove('tab-active'); showAssign(); });
  document.getElementById('tab_seat').addEventListener('click', ()=>{ document.getElementById('tab_reg').classList.remove('tab-active'); document.getElementById('tab_assign').classList.remove('tab-active'); document.getElementById('tab_seat').classList.add('tab-active'); document.getElementById('tab_sched').classList.remove('tab-active'); showSeat(); });
  document.getElementById('tab_sched').addEventListener('click', ()=>{ document.getElementById('tab_reg').classList.remove('tab-active'); document.getElementById('tab_assign').classList.remove('tab-active'); document.getElementById('tab_seat').classList.remove('tab-active'); document.getElementById('tab_sched').classList.add('tab-active'); showScheduling(); });

  showRegistration();
}

// Professor: Tap in/out, pending LOA approval, reports
function renderProfessor(el){
  el.innerHTML = `<div class="bg-white p-6 rounded shadow"><h2 class="text-lg font-bold">Professor</h2>
    <div class="mt-3 grid grid-cols-2 gap-3">
      <input id="prof_scan" class="border rounded px-3 py-2" placeholder="Focus and tap card (or type UID)"/>
      <select id="prof_subject" class="border rounded px-3 py-2">${DATA.subjects.filter(s=>s.professor_id===JSON.parse(localStorage.getItem('jten_current_user')).username).map(s=>`<option value="${s.id}">${s.code} ${s.title}</option>`).join('')}</select>
      <div class="col-span-2 flex gap-2"><button id="startSess" class="bg-green-600 text-white px-4 py-2 rounded">Start Session (focus input)</button><button id="btnIn" class="bg-sky-600 text-white px-4 py-2 rounded">Tap In</button><button id="btnOut" style="display:none" class="bg-orange-500 text-white px-4 py-2 rounded">Tap Out</button></div>
    </div>
    <div id="prof_msg" class="mt-3 text-sm"></div>
    <div class="mt-4 bg-white p-4 rounded shadow"><h3 class="font-semibold">Pending Leave Requests</h3><div id="pendingLoa" class="mt-2 text-sm"></div></div>
    <div class="mt-4 bg-white p-4 rounded shadow"><h3 class="font-semibold">Recent Attendance</h3><button onclick="exportCSV(DATA.attendance,'attendance.csv')" class="mt-2 bg-sky-600 text-white px-3 py-1 rounded">EXPORT CSV</button><div id="attList" class="mt-2 text-sm"></div></div>
  </div>`;
  document.getElementById('startSess').addEventListener('click', ()=>{ SESSION_ACTIVE=true; document.getElementById('prof_scan').focus(); document.getElementById('prof_msg').innerText='SESSION STARTED'; });
  
  const scanInput = document.getElementById('prof_scan');
  scanInput.addEventListener('keydown', async (e)=>{
    if(e.key === 'Enter'){
      e.preventDefault();
      if(!SESSION_ACTIVE) return alert('SESSION NOT STARTED');
      const uid = scanInput.value.trim();
      if(!uid) return;
      const subj = parseInt(document.getElementById('prof_subject').value);
      const student = DATA.students.find(s=>s.student_no===uid);
      if(!student) return alert('Unknown student');
      const ts = await nowISO();
      const t=new Date(ts);
      const status=(t.getHours()<8||(t.getHours()==8&&t.getMinutes()==0))?'PRESENT':'LATE';
      const id=DATA.attendance.length?Math.max(...DATA.attendance.map(x=>x.id))+1:1;
      DATA.attendance.push({id,student_id:student.id,subject_id:subj,timestamp:ts,action:'IN',status});
      saveData();
      scanInput.value='';
      renderProfessor(el);
    }
  });

  document.getElementById('btnIn').addEventListener('click', async ()=>{ const uid=document.getElementById('prof_scan').value.trim(); const subj=parseInt(document.getElementById('prof_subject').value); if(!SESSION_ACTIVE) return alert('SESSION NOT STARTED');
    if(!uid) return alert('Enter UID'); const student = DATA.students.find(s=>s.student_no===uid); if(!student) return alert('Unknown student'); const ts=await nowISO(); const id=DATA.attendance.length?Math.max(...DATA.attendance.map(x=>x.id))+1:1; const t=new Date(ts);
    const status=(t.getHours()<8||(t.getHours()==8&&t.getMinutes()==0))?'PRESENT':'LATE';
    DATA.attendance.push({id,student_id:student.id,subject_id:subj,timestamp:ts,action:'IN',status}); saveData(); document.getElementById('prof_scan').value=''; renderProfessor(el); });
  // TAP OUT REMOVED
// document.getElementById('btnOut').addEventListener('click', async ()=>{ const uid=document.getElementById('prof_scan').value.trim(); const subj=parseInt(document.getElementById('prof_subject').value); if(!SESSION_ACTIVE) return alert('SESSION NOT STARTED');
    if(!uid) return alert('Enter UID'); const student = DATA.students.find(s=>s.student_no===uid); if(!student) return alert('Unknown student'); const ts=await nowISO(); const id=DATA.attendance.length?Math.max(...DATA.attendance.map(x=>x.id))+1:1; DATA.attendance.push({id,student_id:student.id,subject_id:subj,timestamp:ts,action:'OUT'}); saveData(); document.getElementById('prof_scan').value=''; renderProfessor(el); });

  function refreshLoa(){ const pending=(DATA.absences||[]).filter(x=>x.status==='Pending'); const html=pending.map(r=>{ const s=DATA.students.find(st=>st.id===r.student_id)||{}; return `<div class="p-2 border rounded mb-2"><div><strong>${s.name||''}</strong> (${s.student_no||''})</div><div class="text-sm">${r.reason} — ${r.timestamp}</div><div class="mt-2"><button class="approveLoa bg-green-600 text-white px-3 py-1 rounded" data-id="${'${'}r.id${'}'}">Approve</button> <button class="rejectLoa bg-red-500 text-white px-3 py-1 rounded" data-id="${'${'}r.id${'}'}">Reject</button></div></div>`; }).join('')||'<div>No pending</div>'; document.getElementById('pendingLoa').innerHTML=html; document.querySelectorAll('.approveLoa').forEach(b=> b.addEventListener('click', (e)=>{ const id=parseInt(e.target.dataset.id); const req=(DATA.absences||[]).find(x=>x.id===id); if(!req) return; req.status='Approved'; saveData(); refreshLoa(); })); document.querySelectorAll('.rejectLoa').forEach(b=> b.addEventListener('click', (e)=>{ const id=parseInt(e.target.dataset.id); const req=(DATA.absences||[]).find(x=>x.id===id); if(!req) return; req.status='Rejected'; saveData(); refreshLoa(); })); }
  refreshLoa();

  const attHtml = DATA.attendance.slice().reverse().map(a=>{ const s=DATA.students.find(x=>x.id===a.student_id)||{}; const subj=DATA.subjects.find(x=>x.id===a.subject_id)||{}; return `<div class="py-1">${a.timestamp} — ${s.student_no||''} ${s.name||''} — ${subj.code||''} — ${a.action} <b>[${a.status||''}]</b></div>`; }).join('')||'<div>No records</div>'; document.getElementById('attList').innerHTML=attHtml;
}

// Students list for admin/registrar
function renderStudents(el){
  function renderStudentsTable(){
    if(!DATA.students || DATA.students.length===0){
      return '<div>No students</div>';
    }
    return `<table class="table-auto w-full border text-sm">
      <thead class="bg-slate-100">
        <tr>
          <th class="border px-2 py-1">Student No</th>
          <th class="border px-2 py-1">Name</th>
          <th class="border px-2 py-1">Section</th>
          <th class="border px-2 py-1">Subjects</th>
          <th class="border px-2 py-1">Seat</th>
        </tr>
      </thead>
      <tbody>
        ${DATA.students.map(s=>{
          const subs=(s.subjects||[]).map(i=>{
            const sub=DATA.subjects.find(x=>x.id===i);
            return sub?sub.code:'';
          }).join(', ');
          return `<tr>
            <td class="border px-2 py-1">${s.student_no}</td>
            <td class="border px-2 py-1">${s.name}</td>
            <td class="border px-2 py-1">${s.section||''}</td>
            <td class="border px-2 py-1">${subs}</td>
            <td class="border px-2 py-1">${s.assigned_seat||'-'}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
  }

  el.innerHTML = `<div class="bg-white p-6 rounded shadow"><h2 class="text-lg font-bold">Students</h2><div id="students_list" class="mt-4"></div></div>`;
  const container=document.getElementById('students_list'); if(!DATA.students||DATA.students.length===0){ container.innerHTML='<div>No students</div>'; return; }
  const rows = DATA.students.map(s=>{ const enrolled=(s.subjects&&s.subjects.length>0)?'Enrolled':'Not enrolled'; const room = s.assigned_room? (DATA.rooms.find(r=>r.id===s.assigned_room)||{}).name : '-'; const seat = s.assigned_seat? (()=>{ const seatObj = DATA.seats.find(x=>x.room_id===s.assigned_room && x.seat_no===s.assigned_seat); return seatObj? (String.fromCharCode(65 + (seatObj.row||0)) + ((seatObj.col||0)+1)) : s.assigned_seat; })() : '-'; return `<div class="p-3 border rounded mb-2 flex justify-between items-center"><div><strong>${s.student_no}</strong> — ${s.name}<br/><span class="text-sm text-slate-500">${enrolled} — Room: ${room} — Seat: ${seat}</span></div><div class="flex gap-2"><button class="btn-unassign bg-red-500 text-white px-2 py-1 rounded" data-id="${s.id}">Unassign Seat</button><button class="btn-view bg-gray-200 px-2 py-1 rounded" data-id="${s.id}">View</button></div></div>`; }).join('');
  container.innerHTML = renderStudentsTable(); document.querySelectorAll('.btn-unassign').forEach(b=> b.addEventListener('click',(e)=>{ const id=parseInt(e.target.dataset.id); const st=DATA.students.find(x=>x.id===id); if(!st) return; if(st.assigned_room && st.assigned_seat){ const prev=DATA.seats.find(s=>s.room_id===st.assigned_room && s.seat_no===st.assigned_seat); if(prev) prev.occupied=false; st.assigned_room=null; st.assigned_seat=null; saveData(); renderStudents(el);} else alert('No seat'); })); document.querySelectorAll('.btn-view').forEach(b=> b.addEventListener('click',(e)=>{ const id=parseInt(e.target.dataset.id); const st=DATA.students.find(x=>x.id===id); if(!st) return alert('Not found'); alert(`Student: ${st.name}\nStudent No: ${st.student_no}\nSection: ${st.section||'-'}\nSubjects: ${(st.subjects||[]).map(i=> (DATA.subjects.find(s=>s.id===i)||{}).code || i).join(', ')}`); }));
}

// Rooms management
function renderRooms(el){
  el.innerHTML = `<div class="bg-white p-6 rounded shadow"><h2 class="text-lg font-bold">Rooms</h2><form id="roomForm" class="mt-3 grid grid-cols-2 gap-2"><input id="room_name" class="border rounded px-3 py-2" placeholder="Room name"/><input id="room_cap" type="number" class="border rounded px-3 py-2" placeholder="Capacity"/><input id="room_cols" type="number" class="border rounded px-3 py-2" placeholder="Columns (optional)"/><div></div><button class="col-span-2 bg-sky-600 text-white px-4 py-2 rounded">Create Room</button></form><div id="roomsList" class="mt-4"></div></div>`;
  document.getElementById('roomForm').addEventListener('submit',(e)=>{ e.preventDefault(); const name=document.getElementById('room_name').value.trim(); const cap=parseInt(document.getElementById('room_cap').value); const cols=parseInt(document.getElementById('room_cols').value)||5; if(!name||!cap) return alert('Fill fields'); const id=DATA.rooms.length?Math.max(...DATA.rooms.map(r=>r.id))+1:1; DATA.rooms.push({id,name,capacity:cap,cols:cols,rows:Math.ceil(cap/cols)}); DATA.seats=DATA.seats.filter(s=>s.room_id!==id); let seat_no=1; for(let r=0;r<Math.ceil(cap/cols);r++){ for(let c=0;c<cols;c++){ if(seat_no>cap) break; DATA.seats.push({room_id:id,row:r,col:c,seat_no:seat_no,occupied:false}); seat_no++; } } saveData(); renderRooms(el); });
  const list = DATA.rooms.map(r=>`<div class="py-1 flex justify-between items-center"><div>${r.name} (cap ${r.capacity})</div><div><button class="del-room bg-red-500 text-white px-2 py-1 rounded" data-id="${r.id}">Delete</button></div></div>`).join('')||'<div>No rooms</div>'; document.getElementById('roomsList').innerHTML=list; document.querySelectorAll('.del-room').forEach(b=> b.addEventListener('click',(e)=>{ const id=parseInt(e.target.dataset.id); if(!confirm('Delete room?')) return; DATA.rooms=DATA.rooms.filter(x=>x.id!==id); DATA.seats=DATA.seats.filter(x=>x.room_id!==id); DATA.students.forEach(s=>{ if(s.assigned_room===id){ s.assigned_room=null; s.assigned_seat=null; }}); saveData(); renderRooms(el); }));
}

// Subjects management
function renderSubjects(el){
  el.innerHTML = `<div class="bg-white p-6 rounded shadow"><h2 class="text-lg font-bold">Subjects</h2><form id="subForm" class="mt-3 grid grid-cols-2 gap-2"><input id="sub_code" class="border rounded px-3 py-2" placeholder="Code"/><input id="sub_title" class="border rounded px-3 py-2" placeholder="Title"/><div></div><button class="col-span-2 bg-sky-600 text-white px-4 py-2 rounded">Create Subject</button></form><div id="subsList" class="mt-4"></div></div>`;
  document.getElementById('subForm').addEventListener('submit',(e)=>{ e.preventDefault(); const code=document.getElementById('sub_code').value.trim(); const title=document.getElementById('sub_title').value.trim(); if(!code||!title) return alert('Fill fields'); const id=DATA.subjects.length?Math.max(...DATA.subjects.map(s=>s.id))+1:1; DATA.subjects.push({id,code,title}); saveData(); renderSubjects(el); });
  document.getElementById('subsList').innerHTML = DATA.subjects.map(s=>`<div class="py-1 flex justify-between items-center"><div>${s.code} - ${s.title}</div><div><button class="del-sub bg-red-500 text-white px-2 py-1 rounded" data-id="${s.id}">Delete</button></div></div>`).join('')||'<div>No subjects</div>'; document.querySelectorAll('.del-sub').forEach(b=> b.addEventListener('click',(e)=>{ const id=parseInt(e.target.dataset.id); if(!confirm('Delete subject?')) return; DATA.subjects=DATA.subjects.filter(x=>x.id!==id); DATA.schedules=DATA.schedules.filter(x=>x.subject_id!==id); saveData(); renderSubjects(el); }));
}

// Reports & Attendance export
function renderReports(el){
  el.innerHTML=`<div class="bg-white p-6 rounded shadow"><h2 class="text-lg font-bold">Attendance & Reports</h2><div class="mt-3"><button id="expCSV" class="bg-sky-600 text-white px-4 py-2 rounded">Export CSV</button></div><div class="mt-4"><h3 class="font-semibold">Recent Attendance</h3><button onclick="exportCSV(DATA.attendance,'attendance.csv')" class="mt-2 bg-sky-600 text-white px-3 py-1 rounded">EXPORT CSV</button><div id="repList" class="mt-2 text-sm"></div></div></div>`;
  document.getElementById('expCSV').addEventListener('click', ()=>{ const rows=[['timestamp','student_no','name','subject','action']]; DATA.attendance.forEach(a=>{ const s=DATA.students.find(x=>x.id===a.student_id)||{}; const subj=DATA.subjects.find(x=>x.id===a.subject_id)||{}; rows.push([a.timestamp,s.student_no||'',s.name||'',subj.code||'',a.action]); }); const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n'); const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='attendance.csv'; a.click(); URL.revokeObjectURL(url); });
  document.getElementById('repList').innerHTML = DATA.attendance.slice().reverse().map(a=>{ const s=DATA.students.find(x=>x.id===a.student_id)||{}; const subj=DATA.subjects.find(x=>x.id===a.subject_id)||{}; return `<div class="py-1">${a.timestamp} — ${s.student_no||''} ${s.name||''} — ${subj.code||''} — ${a.action} <b>[${a.status||''}]</b></div>`; }).join('')||'<div>No attendance</div>';
}

// Student portal (S1): attendance table, LOA, schedule, seat info
function renderStudent(el){
  const cur = JSON.parse(localStorage.getItem('jten_current_user')||'null'); if(!cur){ el.innerHTML='<div>Please login</div>'; return; }
  const student = DATA.students.find(s=>s.student_no===cur.username || s.id===cur.student_id);
  el.innerHTML = `<div class="bg-white p-6 rounded shadow"><div class="flex justify-between items-center"><div><h2 class="text-lg font-bold">${student?student.name:'Student'}</h2><div class="text-sm text-slate-500">Student No: ${student?student.student_no:'-'}</div><div class="text-sm text-slate-500">Section: ${student?student.section||'-':'-'}</div></div><div class="text-right"><div class="text-sm">Room: <b>${student && student.assigned_room ? (DATA.rooms.find(r=>r.id===student.assigned_room)||{}).name : '-'}</b></div><div class="text-sm">Seat: <b>${student && student.assigned_seat ? (()=>{ const seatObj = DATA.seats.find(x=>x.room_id===student.assigned_room && x.seat_no===student.assigned_seat); return seatObj? (String.fromCharCode(65 + (seatObj.row||0)) + ((seatObj.col||0)+1)) : student.assigned_seat; })() : '-'}</b></div></div></div><div class="mt-4 grid grid-cols-3 gap-4"><div class="col-span-2"><h3 class="font-semibold">My Attendance</h3><div id="att_table" class="mt-2 text-sm"></div></div><div><h3 class="font-semibold">File Leave of Absence</h3><div class="mt-2"><select id="lo_reason" class="border rounded px-3 py-2 w-full"><option value="">-- Select Reason --</option><option value="Sickness">Sickness</option><option value="Family Matters">Family Matters</option><option value="Emergency">Emergency</option><option value="Other">Other</option></select><input id="lo_remarks" class="border rounded px-3 py-2 w-full mt-2" placeholder="Remarks (optional)"/><div class="mt-2"><button id="fileLoa" class="bg-orange-500 text-white px-3 py-2 rounded w-full">Submit Leave Request</button></div><div id="loa_msg" class="text-sm mt-2"></div><h4 class="font-semibold mt-4">My Leave Requests</h4><div id="myLoa" class="mt-2 text-sm"></div></div></div></div><div class="mt-4"><h3 class="font-semibold">My Schedule</h3><div id="mySchedule" class="mt-2 text-sm"></div></div></div>`;

  function renderAttendanceTable(){ const rows = (DATA.attendance||[]).filter(a=>a.student_id===student.id).map(a=>{ const subj = DATA.subjects.find(s=>s.id===a.subject_id)||{}; const d=new Date(a.timestamp); return {date:d.toISOString().split('T')[0], subject:subj.code||subj.title||'', action:a.action, time:d.toLocaleTimeString()}; }).reduce((acc,cur)=>{ const key=cur.date+'|'+cur.subject; acc[key]=acc[key]||{date:cur.date,subject:cur.subject,in:'',out:''}; if(cur.action==='IN') acc[key].in=cur.time; if(cur.action==='OUT') acc[key].out=cur.time; return acc; }, {}); const list=Object.values(rows).sort((a,b)=> b.date.localeCompare(a.date)); if(list.length===0){ document.getElementById('att_table').innerHTML='<div>No attendance records</div>'; return; } const table=document.createElement('table'); table.className='w-full text-sm'; table.innerHTML=`<tr class="text-left"><th class="px-2 py-1">Date</th><th class="px-2 py-1">Subject</th><th class="px-2 py-1">Tap-In</th><th class="px-2 py-1">Tap-Out</th><th class="px-2 py-1">Status</th></tr>`; list.forEach(r=>{ const status=(r.in&&r.out)?'Present':(r.in&&!r.out)?'Partial':'Absent'; const tr=document.createElement('tr'); tr.innerHTML=`<td class="px-2 py-1">${r.date}</td><td class="px-2 py-1">${r.subject}</td><td class="px-2 py-1">${r.in||'-'}</td><td class="px-2 py-1">${r.out||'-'}</td><td class="px-2 py-1">${status}</td>`; table.appendChild(tr); }); document.getElementById('att_table').innerHTML=''; document.getElementById('att_table').appendChild(table); }

  function renderMyLoa(){ const html=(DATA.absences||[]).filter(r=>r.student_id===student.id).slice().reverse().map(r=>`<div class="p-2 border rounded mb-2"><div><strong>${r.reason}</strong> — ${r.timestamp}</div><div class="text-sm">${r.remarks||''}</div><div class="text-sm">Status: <b>${r.status||'Pending'}</b></div></div>`).join('')||'<div>No leave requests</div>'; document.getElementById('myLoa').innerHTML=html; }

  function renderSchedule(){ const mysubs=(student.subjects||[]).map(id=> DATA.subjects.find(s=>s.id===id)).filter(Boolean); const rows=(DATA.schedules||[]).filter(sc=> mysubs.find(ms=>ms.id===sc.subject_id)); if(rows.length===0){ document.getElementById('mySchedule').innerHTML='<div>No schedule assigned</div>'; return; } document.getElementById('mySchedule').innerHTML = rows.map(r=>{ const sub=DATA.subjects.find(s=>s.id===r.subject_id)||{}; const room=DATA.rooms.find(rr=>rr.id===r.room_id)||{}; return `<div class="p-2 border rounded mb-2">${r.day} ${r.time} — ${sub.code||sub.title} — ${room.name||''} — Section ${r.section||''}</div>`; }).join(''); }

  renderAttendanceTable(); renderMyLoa(); renderSchedule();

  document.getElementById('fileLoa').addEventListener('click', async ()=>{ const reason=document.getElementById('lo_reason').value; const remarks=document.getElementById('lo_remarks').value.trim(); if(!reason) return document.getElementById('loa_msg').innerText='Select reason'; const ts=await nowISO(); const id=DATA.absences.length?Math.max(...DATA.absences.map(x=>x.id))+1:1; DATA.absences.push({id,student_id:student.id,reason,remarks,timestamp:ts,status:'Pending'}); saveData(); document.getElementById('loa_msg').innerText='Leave request submitted.'; renderMyLoa(); });
}

// Initialize
window.addEventListener('DOMContentLoaded', ()=>{ DATA = loadData(); renderApp(); });

function exportCSV(data, filename){
  const rows = data.map(a => ({
    student_id:a.student_id,
    subject_id:a.subject_id,
    time:a.timestamp,
    action:a.action,
    status:a.status
  }));
  const csv = Object.keys(rows[0]).join(",")+"\n"+rows.map(r=>Object.values(r).join(",")).join("\n");
  const blob = new Blob([csv],{type:'text/csv'});
  const aTag=document.createElement('a');
  aTag.href=URL.createObjectURL(blob);
  aTag.download=filename;
  aTag.click();
}
