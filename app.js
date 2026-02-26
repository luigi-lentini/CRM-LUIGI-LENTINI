// CONFIGURAZIONE SUPABASE
const SUPABASE_URL = "https://btymuciczkgbdlymkfrb.supabase.co";
const SUPABASE_KEY = "sb_publishable_66FWKylcW7DOvSiZT94yeQ_mpMDeDge";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ELEMENTI BASE
const loginScreen = document.getElementById("login-screen");
const appScreen = document.getElementById("app-screen");
const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");
const logoutBtn = document.getElementById("logout-btn");
const loginError = document.getElementById("login-error");
const emailInput = document.getElementById("login-email");
const passwordInput = document.getElementById("login-password");

// Dashboard
const dashClients = document.getElementById("dash-clients");
const dashProspect = document.getElementById("dash-prospect");
const dashNextAppointments = document.getElementById("dash-next-appointments");
const dashTasks = document.getElementById("dash-tasks");

// Form e liste
const clientForm = document.getElementById("client-form");
const clientName = document.getElementById("client-name");
const clientEmail = document.getElementById("client-email");
const clientPhone = document.getElementById("client-phone");
const clientType = document.getElementById("client-type");
const clientNotes = document.getElementById("client-notes");
const clientList = document.getElementById("client-list");
const searchClient = document.getElementById("search-client");

const appointmentForm = document.getElementById("appointment-form");
const appointmentClient = document.getElementById("appointment-client");
const appointmentDatetime = document.getElementById("appointment-datetime");
const appointmentSubject = document.getElementById("appointment-subject");
const appointmentNotes = document.getElementById("appointment-notes");
const appointmentList = document.getElementById("appointment-list");

const taskForm = document.getElementById("task-form");
const taskTitle = document.getElementById("task-title");
const taskDeadline = document.getElementById("task-deadline");
const taskClient = document.getElementById("task-client");
const taskList = document.getElementById("task-list");

// Kanban colonne
const kanbanNuovo = document.getElementById("kanban-nuovo");
const kanbanValutazione = document.getElementById("kanban-valutazione");
const kanbanTrattativa = document.getElementById("kanban-trattativa");
const kanbanChiuso = document.getElementById("kanban-chiuso");

// Stato in memoria
let clientsCache = [];
let appointmentsCache = [];
let tasksCache = [];

// ====================== AUTENTICAZIONE ======================

async function handleLogin() {
  loginError.textContent = "";
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    loginError.textContent = "Inserisci email e password.";
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    loginError.textContent = error.message || "Errore di login.";
    return;
  }

  loginScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");
  await loadAllData();
}

async function handleSignup() {
  loginError.textContent = "";
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    loginError.textContent = "Inserisci email e password.";
    return;
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    loginError.textContent = error.message || "Errore in registrazione.";
    return;
  }

  loginError.textContent = "Registrato! Controlla la mail e poi effettua login.";
}

async function handleLogout() {
  await supabase.auth.signOut();
  appScreen.classList.add("hidden");
  loginScreen.classList.remove("hidden");
}

// Verifica sessione al load
async function checkSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    loginScreen.classList.add("hidden");
    appScreen.classList.remove("hidden");
    await loadAllData();
  } else {
    loginScreen.classList.remove("hidden");
    appScreen.classList.add("hidden");
  }
}

// ====================== CRUD CLIENTI ======================
// Tabelle attese:
// clients: id, name, email, phone, type, notes, stage ("nuovo", "valutazione", "trattativa", "chiuso")

async function loadClients() {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Errore caricamento clients:", error);
    return;
  }

  clientsCache = data || [];
  renderClients();
  fillClientSelects();
  updateDashboard();
  renderKanban();
}

function renderClients() {
  const term = (searchClient.value || "").toLowerCase();
  clientList.innerHTML = "";

  clientsCache
    .filter((c) => {
      const s = `${c.name || ""} ${c.email || ""} ${c.phone || ""}`.toLowerCase();
      return s.includes(term);
    })
    .forEach((c) => {
      const li = document.createElement("li");
      li.textContent = `${c.name} (${c.type || "?"}) – ${c.email || ""}`;
      clientList.appendChild(li);
    });
}

function fillClientSelects() {
  appointmentClient.innerHTML = "";
  taskClient.innerHTML = '<option value="">Nessuno</option>';

  clientsCache.forEach((c) => {
    const opt1 = document.createElement("option");
    opt1.value = c.id;
    opt1.textContent = c.name;
    appointmentClient.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = c.id;
    opt2.textContent = c.name;
    taskClient.appendChild(opt2);
  });
}

async function saveClient(e) {
  e.preventDefault();

  const payload = {
    name: clientName.value.trim(),
    email: clientEmail.value.trim() || null,
    phone: clientPhone.value.trim() || null,
    type: clientType.value,
    notes: clientNotes.value.trim() || null,
    stage: "nuovo",
  };

  const { data, error } = await supabase.from("clients").insert(payload).select();

  if (error) {
    alert("Errore salvataggio cliente: " + error.message);
    return;
  }

  clientForm.reset();
  await loadClients();
}

// ====================== APPUNTAMENTI ======================
// appointments: id, client_id, datetime, subject, notes

async function loadAppointments() {
  const { data, error } = await supabase
    .from("appointments")
    .select("*, clients(name)")
    .order("datetime", { ascending: true });

  if (error) {
    console.error("Errore appointments:", error);
    return;
  }

  appointmentsCache = data || [];
  renderAppointments();
  updateDashboard();
}

function renderAppointments() {
  appointmentList.innerHTML = "";

  appointmentsCache.forEach((a) => {
    const li = document.createElement("li");
    const date = a.datetime ? new Date(a.datetime) : null;
    const dateStr = date ? date.toLocaleString("it-IT") : "";
    const name = a.clients?.name || "Senza nome";

    li.textContent = `${dateStr} – ${name} – ${a.subject || ""}`;
    appointmentList.appendChild(li);
  });
}

async function saveAppointment(e) {
  e.preventDefault();

  const payload = {
    client_id: appointmentClient.value || null,
    datetime: appointmentDatetime.value || null,
    subject: appointmentSubject.value.trim(),
    notes: appointmentNotes.value.trim() || null,
  };

  const { data, error } = await supabase
    .from("appointments")
    .insert(payload)
    .select();

  if (error) {
    alert("Errore salvataggio appuntamento: " + error.message);
    return;
  }

  appointmentForm.reset();
  await loadAppointments();
}

// ====================== TASK / ATTIVITÀ ======================
// tasks: id, title, deadline, client_id, done (boolean)

async function loadTasks() {
  const { data, error } = await supabase
    .from("tasks")
    .select("*, clients(name)")
    .order("deadline", { ascending: true });

  if (error) {
    console.error("Errore tasks:", error);
    return;
  }

  tasksCache = data || [];
  renderTasks();
  updateDashboard();
}

function renderTasks() {
  taskList.innerHTML = "";

  tasksCache.forEach((t) => {
    const li = document.createElement("li");
    const dateStr = t.deadline ? new Date(t.deadline).toLocaleDateString("it-IT") : "";
    const name = t.clients?.name ? ` – ${t.clients.name}` : "";

    li.textContent = `${dateStr} – ${t.title}${name}`;
    taskList.appendChild(li);
  });
}

async function saveTask(e) {
  e.preventDefault();

  const payload = {
    title: taskTitle.value.trim(),
    deadline: taskDeadline.value || null,
    client_id: taskClient.value || null,
    done: false,
  };

  const { data, error } = await supabase.from("tasks").insert(payload).select();

  if (error) {
    alert("Errore salvataggio attività: " + error.message);
    return;
  }

  taskForm.reset();
  await loadTasks();
}

// ====================== KANBAN PIPELINE ======================

function renderKanban() {
  kanbanNuovo.innerHTML = "";
  kanbanValutazione.innerHTML = "";
  kanbanTrattativa.innerHTML = "";
  kanbanChiuso.innerHTML = "";

  clientsCache.forEach((c) => {
    const card = document.createElement("div");
    card.className = "kanban-card";
    card.textContent = c.name;

    switch (c.stage) {
      case "valutazione":
        kanbanValutazione.appendChild(card);
        break;
      case "trattativa":
        kanbanTrattativa.appendChild(card);
        break;
      case "chiuso":
        kanbanChiuso.appendChild(card);
        break;
      default:
        kanbanNuovo.appendChild(card);
    }
  });
}

// ====================== DASHBOARD ======================

function updateDashboard() {
  const clientsCount = clientsCache.filter((c) => c.type === "cliente").length;
  const prospectCount = clientsCache.filter((c) => c.type === "prospect").length;

  dashClients.textContent = clientsCount;
  dashProspect.textContent = prospectCount;
  dashTasks.textContent = tasksCache.length;

  const now = new Date();
  const upcoming = appointmentsCache.filter((a) => a.datetime && new Date(a.datetime) >= now);
  dashNextAppointments.textContent = upcoming.length;
}

// ====================== EVENT LISTENERS E AVVIO ======================

loginBtn.addEventListener("click", (e) => {
  e.preventDefault();
  handleLogin();
});

signupBtn.addEventListener("click", (e) => {
  e.preventDefault();
  handleSignup();
});

logoutBtn.addEventListener("click", (e) => {
  e.preventDefault();
  handleLogout();
});

clientForm.addEventListener("submit", saveClient);
appointmentForm.addEventListener("submit", saveAppointment);
taskForm.addEventListener("submit", saveTask);
searchClient.addEventListener("input", renderClients);

async function loadAllData() {
  await loadClients();
  await loadAppointments();
  await loadTasks();
}

checkSession();
