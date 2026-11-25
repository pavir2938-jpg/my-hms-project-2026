const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const loginScreen=$('#loginScreen'), app=$('#app');

$('#loginForm').addEventListener('submit',e=>{
  e.preventDefault();
  if($('#username').value==='admin'&&$('#password').value==='admin123'){
    loginScreen.classList.add('hidden'); app.classList.remove('hidden');
  } else $('#loginError').textContent='Invalid demo username or password.';
});

function showPage(name){
  $$('.page').forEach(p=>p.classList.toggle('active-page',p.id===`page-${name}`));
  $$('.nav-item[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===name));
  $('#pageHeading').textContent=name[0].toUpperCase()+name.slice(1);
  $('.sidebar').classList.remove('open');
}
$('#navigation').addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(b)showPage(b.dataset.page)});
$$('[data-go]').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.go)));
$('#mobileMenu').addEventListener('click',()=>$('.sidebar').classList.toggle('open'));
$('#logoutBtn').addEventListener('click',()=>{app.classList.add('hidden');loginScreen.classList.remove('hidden')});

function openModal(id){$('#'+id).classList.add('open')}
function closeModal(id){$('#'+id).classList.remove('open')}
$$('.modal-backdrop').forEach(back=>back.addEventListener('click',e=>{if(e.target===back)back.classList.remove('open')}));

const defaultPatients=[
  ['PT-1048','Ananya Sharma','22 / Female','9876543210','B+'],
  ['PT-1047','Rohan Kumar','35 / Male','9876501234','O+'],
  ['PT-1046','Sneha Iyer','28 / Female','9988776655','A+']
];
let patients=loadStore('careplus_patients',defaultPatients);
const defaultAppointments=[
  {id:'AP-2001',patient:'Ananya Sharma',doctor:'Dr. Priya Nair',date:'2026-11-27',time:'10:00 AM',status:'Confirmed'},
  {id:'AP-2002',patient:'Rohan Kumar',doctor:'Dr. Rahul Mehta',date:'2026-11-28',time:'11:00 AM',status:'Confirmed'},
  {id:'AP-2003',patient:'Sneha Iyer',doctor:'Dr. Sneha Iyer',date:'2026-11-25',time:'02:00 PM',status:'Completed'}
];
let appointments=loadStore('careplus_appointments',defaultAppointments);

function loadStore(key,fallback){
  try{
    const saved=localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  }catch(error){return fallback;}
}
function saveStore(){
  try{
    localStorage.setItem('careplus_patients',JSON.stringify(patients));
    localStorage.setItem('careplus_appointments',JSON.stringify(appointments));
  }catch(error){toast('Browser storage is unavailable; changes may not persist after refresh.');}
}
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function displayDate(iso){
  if(!iso) return '';
  const d=new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
}
function toast(msg){
  const t=$('#toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(window.careplusToastTimer);
  window.careplusToastTimer=setTimeout(()=>t.classList.remove('show'),2600);
}
function statusClass(status){
  if(status==='Cancelled') return 'yellow-pill';
  if(status==='Completed') return 'green-pill';
  return 'blue-pill';
}
function renderPatients(){
  const body=$('#patientsTable');
  if(body) body.innerHTML=patients.map(p=>`<tr>${p.map(v=>`<td>${escapeHtml(v)}</td>`).join('')}<td><span class="pill green-pill">Active</span></td></tr>`).join('');
  const count=$('#patientCount'); if(count) count.textContent=`${patients.length} patients`;
}
function renderAppointments(){
  const body=$('#appointmentsTable');
  if(body){
    const query=($('#appointmentSearch')?.value||'').trim().toLowerCase();
    const filter=$('#appointmentStatusFilter')?.value||'All';
    const visible=appointments.filter(a=>{
      const matchesQuery=[a.id,a.patient,a.doctor,a.date,a.time,a.status].join(' ').toLowerCase().includes(query);
      return matchesQuery && (filter==='All'||a.status===filter);
    });
    body.innerHTML=visible.length ? visible.map(a=>{
      const actions=a.status==='Confirmed'
        ? `<button class="text-btn" onclick="openReschedule('${a.id}')">Reschedule</button><button class="text-btn danger-text" onclick="cancelAppointment('${a.id}')">Cancel</button>`
        : `<span class="muted">No actions</span>`;
      return `<tr><td>${escapeHtml(a.id)}</td><td>${escapeHtml(a.patient)}</td><td>${escapeHtml(a.doctor)}</td><td>${escapeHtml(displayDate(a.date))}</td><td>${escapeHtml(a.time)}</td><td><span class="pill ${statusClass(a.status)}">${escapeHtml(a.status)}</span></td><td><div class="appointment-actions">${actions}</div></td></tr>`;
    }).join('') : '<tr><td colspan="7" class="empty-state">No appointments match your search.</td></tr>';
  }
  const recent=$('#recentAppointments');
  if(recent) recent.innerHTML=appointments.slice().reverse().slice(0,4).map(a=>`<tr><td>${escapeHtml(a.patient)}</td><td>${escapeHtml(a.doctor)}</td><td>${escapeHtml(displayDate(a.date))} · ${escapeHtml(a.time)}</td><td>General</td><td><span class="pill ${statusClass(a.status)}">${escapeHtml(a.status)}</span></td></tr>`).join('');
  const count=(status)=>appointments.filter(a=>a.status===status).length;
  if($('#totalAppointments')) $('#totalAppointments').textContent=appointments.length;
  if($('#confirmedAppointments')) $('#confirmedAppointments').textContent=count('Confirmed');
  if($('#completedAppointments')) $('#completedAppointments').textContent=count('Completed');
  if($('#cancelledAppointments')) $('#cancelledAppointments').textContent=count('Cancelled');
}
function cancelAppointment(id){
  const appointment=appointments.find(a=>a.id===id);
  if(!appointment||appointment.status!=='Confirmed') return;
  if(!window.confirm(`Cancel appointment ${id} for ${appointment.patient}?`)) return;
  appointment.status='Cancelled';
  saveStore(); renderAppointments(); toast(`Appointment ${id} cancelled.`);
}
function openReschedule(id){
  const appointment=appointments.find(a=>a.id===id);
  if(!appointment||appointment.status!=='Confirmed') return;
  const form=$('#rescheduleForm');
  form.elements.id.value=appointment.id;
  form.elements.patient.value=appointment.patient;
  form.elements.doctor.value=appointment.doctor;
  form.elements.date.value=appointment.date;
  form.elements.time.value=appointment.time;
  openModal('rescheduleModal');
}
window.cancelAppointment=cancelAppointment;
window.openReschedule=openReschedule;
window.openModal=openModal;
window.closeModal=closeModal;
window.toast=toast;

$$('.modal:not(#rescheduleForm)').forEach(form=>form.addEventListener('submit',e=>{
  e.preventDefault();
  const data=Object.fromEntries(new FormData(form));
  switch(form.dataset.kind){
    case'patient':
      patients.unshift([`PT-${1050+patients.length}`,data.name,`${data.age} / ${data.gender}`,data.phone,data.blood]);
      renderPatients(); saveStore(); toast('Patient registered successfully'); break;
    case'appointment':
      appointments.unshift({id:`AP-${2001+appointments.length}`,patient:data.patient,doctor:data.doctor,date:data.date,time:data.time,status:'Confirmed'});
      renderAppointments(); saveStore(); toast('Appointment booked successfully'); break;
    case'doctor': toast('Doctor details saved in this demo session'); break;
    case'bill': toast('Bill generated in this demo session'); break;
    case'medicine': toast('Medicine added in this demo session'); break;
    case'lab': toast('Laboratory test added in this demo session'); break;
    case'admission': toast('Patient admission recorded in this demo session'); break;
  }
  form.reset(); form.closest('.modal-backdrop').classList.remove('open');
}));
$('#rescheduleForm').addEventListener('submit',e=>{
  e.preventDefault();
  const data=Object.fromEntries(new FormData(e.currentTarget));
  const appointment=appointments.find(a=>a.id===data.id);
  if(!appointment||appointment.status!=='Confirmed') return;
  appointment.doctor=data.doctor; appointment.date=data.date; appointment.time=data.time;
  saveStore(); renderAppointments(); closeModal('rescheduleModal'); toast(`Appointment ${appointment.id} rescheduled.`);
});
$('#appointmentSearch').addEventListener('input',renderAppointments);
$('#appointmentStatusFilter').addEventListener('change',renderAppointments);
const patientSearch=$('#patientSearch');
if(patientSearch) patientSearch.addEventListener('input',()=>{
  $$('#patientsTable tr').forEach(row=>row.hidden=!row.textContent.toLowerCase().includes(patientSearch.value.toLowerCase()));
});
renderPatients(); renderAppointments();
