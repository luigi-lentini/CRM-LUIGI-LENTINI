// CONFIGURAZIONE SUPABASE
const SUPABASE_URL = "https://btymuciczkgbdlymkfrb.supabase.co";
const SUPABASE_KEY = "sb_publishable_66FWKylcW7DOvSiZT94yeQ_mpMDeDge";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ELEMENTI BASE
const loginScreen = document.getElementById("login-screen");
const appScreen = document.getElementById("app-screen");
// All'avvio mostra il login, nascondi app
loginScreen.classList.remove("hidden");
appScreen.classList.add("hidden");
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
const dashTasks = document.getElementById("dash-tasks"); // lo useremo per contare eventi / attività

// Form e liste clienti
const clientForm = document.getElementById("client-form");
const clientName = document.getElementById("client-name");
const clientEmail = document.getElementById("client-email");
const clientPhone = document.getElementById("client-phone");
const clientType = document.getElementById("client-type");
const clientNotes = document.getElementById("client-notes");
const clientList = document.getElementById("client-list");
const searchClient = document.getElementById("search-client");

// Appuntamenti
const appointmentForm = document.getElementById("appointment-form");
const appointmentClient = document.getElementById("appointment-client");
const appointmentDatetime = document.getElementById("appointment-datetime");
const appointmentSubject = document.getElementById("appointment-subject");
const appointmentNotes = document.getElementById("appointment-notes");
const appointmentList = document.getElementById("appointment-list");

// Task (useremo activities più avanti, per ora solo contatore)
const taskForm = document.getElementById("task-form");
const taskTitle = document.getElementById("task-title");
const taskDeadline = document.getElementById("task-deadline");
const taskClient = document.getElementById("task-client");
const taskList = document.getElementById("task-list");

// Kanban colonne (deals)
const kanbanNuovo = document.getElementById("kanban-nuovo");
const kanbanValutazione = document.getElementById("kanban-valutazione");
const kanbanTrattativa = document.getElementById("kanban-trattativa");
const kanbanChiuso = document.getElementById("kanban-chiuso");

// Stato in memoria
let contactsCache = [];
let dealsCache = [];
let calendarCache = [];
let tasksCache = []; // per ora vuoto

// ====================== AUTENTICAZIONE ======================

async function handleLogin() {
  loginError.textContent = "";
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    loginError.textContent = "Inserisci email e password.";
    return;
  }

  const { error } = await supabase.auth.signInWithPassword({
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

  const { error } = await supabase.auth.signUp({
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

// ====================== CONTATTI (contacts) ======================
// contacts: id, name, company, email, phone, status, value, ...

async function loadContacts() {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Errore caricamento contacts:", error);
    return;
  }

  contactsCache = data || [];
  renderContacts();
  fillClientSelects();
  updateDashboard();
}

function renderContacts() {
  const term = (searchClient.value || "").toLowerCase();
  clientList.innerHTML = "";

  contactsCache
    .filter((c) => {
      const s = `${c.name || ""} ${c.email || ""} ${c.phone || ""} ${
        c.company || ""
      }`.toLowerCase();
      return s.includes(term);
    })
    .forEach((c) => {
      const li = document.createElement("li");
      const status = c.status || "";
      const value = c.value || "";
      li.textContent = `${c.name} (${status}) – ${c.email || ""} – ${value}`;
      clientList.appendChild(li);
    });
}

function fillClientSelects() {
  appointmentClient.innerHTML = "";
  taskClient.innerHTML = '<option value="">Nessuno</option>';

  contactsCache.forEach((c) => {
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

async function saveContact(e) {
  e.preventDefault();

  const payload = {
    name: clientName.value.trim(),
    email: clientEmail.value.trim() || null,
    phone: clientPhone.value.trim() || null,
    status: clientType.value === "cliente" ? "hot" : "warm", // mappiamo tipo → status
    value: null,
    company: null,
  };

  const { error } = await supabase.from("contacts").insert(payload);

  if (error) {
    alert("Errore salvataggio contatto: " + error.message);
    return;
  }

  clientForm.reset();
  await loadContacts();
}

// ====================== DEALS → KANBAN ======================
// deals: id, status (hot/warm/cold), value, tags[], created_by, created_at, updated_at

async function loadDeals() {
  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Errore caricamento deals:", error);
    return;
  }

  dealsCache = data || [];
  renderKanban();
}

function renderKanban() {
  kanbanNuovo.innerHTML = "";
  kanbanValutazione.innerHTML = "";
  kanbanTrattativa.innerHTML = "";
  kanbanChiuso.innerHTML = "";

  dealsCache.forEach((d) => {
    const card = document.createElement("div");
    card.className = "kanban-card";
    const value = d.value || "";
    card.textContent = `${d.status || ""} – ${value}`;

    // Mappiamo status alla colonna
    // ipotesi:
    // cold  -> "Nuovo contatto"
    // warm  -> "In valutazione"
    // hot   -> "In trattativa"
    // chiuso (se esistesse) -> "Chiuso"
    switch ((d.status || "").toLowerCase()) {
      case "cold":
        kanbanNuovo.appendChild(card);
        break;
      case "warm":
        kanbanValutazione.appendChild(card);
        break;
      case "hot":
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

// ====================== CALENDAR_EVENTS → AGENDA ======================
// calendar_events: id, title, description, event_type, contact_id, deal_id,
// start_time, end_time, location, created_by, created_at, updated_at

async function loadCalendarEvents() {
  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Errore caricamento calendar_events:", error);
    return;
  }

  calendarCache = data || [];
  renderAppointments();
  updateDashboard();
}

function renderAppointments() {
  appointmentList.innerHTML = "";

  calendarCache.forEach((ev) => {
    const date = ev.start_time ? new Date(ev.start_time) : null;
    const dateStr = date ? date.toLocaleString("it-IT") : "";
    const title = ev.title || "";
    const location = ev.location ? ` – ${ev.location}` : "";

    const li = document.createElement("li");
    li.textContent = `${dateStr} – ${title}${location}`;
    appointmentList.appendChild(li);
  });
}

async function saveAppointment(e) {
  e.preventDefault();

  const payload = {
    title: appointmentSubject.value.trim(),
    description: appointmentNotes.value.trim() || null,
    event_type: "meeting",
    contact_id: appointmentClient.value || null,
    deal_id: null,
    start_time: appointmentDatetime.value || null,
    end_time: null,
    location: null,
  };

  const { error } = await supabase.from("calendar_events").insert(payload);

  if (error) {
    alert("Errore salvataggio appuntamento: " + error.message);
    return;
  }

  appointmentForm.reset();
  await loadCalendarEvents();
}

// ====================== TASK / ATTIVITÀ ======================
// Per ora usiamo solo il form come "memo locale" (non salva su DB)

function renderTasks() {
  taskList.innerHTML = "";
  tasksCache.forEach((t) => {
    const li = document.createElement("li");
    const dateStr = t.deadline ? new Date(t.deadline).toLocaleDateString("it-IT") : "";
    const name = t.clientName ? ` – ${t.clientName}` : "";
    li.textContent = `${dateStr} – ${t.title}${name}`;
    taskList.appendChild(li);
  });
}

function saveTaskLocal(e) {
  e.preventDefault();
  const clientId = taskClient.value || null;
  const clientName = clientId
    ? (contactsCache.find((c) => String(c.id) === String(clientId))?.name || "")
    : "";

  tasksCache.push({
    title: taskTitle.value.trim(),
    deadline: taskDeadline.value || null,
    clientId,
    clientName,
  });

  taskForm.reset();
  renderTasks();
  updateDashboard();
}

// ====================== DASHBOARD ======================

function updateDashboard() {
  // Clienti = status hot, Prospect = warm + cold
  const clientsCount = contactsCache.filter((c) => c.status === "hot").length;
  const prospectCount = contactsCache.filter((c) =>
    ["warm", "cold"].includes((c.status || "").toLowerCase())
  ).length;

  dashClients.textContent = clientsCount;
  dashProspect.textContent = prospectCount;

  // Appuntamenti futuri
  const now = new Date();
  const upcoming = calendarCache.filter(
    (ev) => ev.start_time && new Date(ev.start_time) >= now
  );
  dashNextAppointments.textContent = upcoming.length;

  // Attività = tasks locali creati dal form
  dashTasks.textContent = tasksCache.length;
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

clientForm.addEventListener("submit", saveContact);
appointmentForm.addEventListener("submit", saveAppointment);
taskForm.addEventListener("submit", saveTaskLocal);
searchClient.addEventListener("input", renderContacts);

async function loadAllData() {
  await loadContacts();
  await loadDeals();
  await loadCalendarEvents();
}

// checkSession(); // per ora disattivato, forziamo login manuale
const SUPABASE_URL = "...";
const SUPABASE_KEY = "...";
