/* ============================================================
   SUPABASE INIT
============================================================ */

const supabaseUrl = "https://bxefyspalrreeatuvozi.supabase.co";
const supabaseKey = "sb_publishable_LTHEb0RCtRI8aH8tlZ5l0g_iU8eO4jq";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

/* ============================================================
   DOM ELEMENTS
============================================================ */

// Login
const loginScreen = document.getElementById("login-screen");
const appScreen = document.getElementById("app-screen");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");
const loginError = document.getElementById("login-error");
const logoutBtn = document.getElementById("logout-btn");

// Dashboard
const dashClients = document.getElementById("dash-clients");
const dashProspect = document.getElementById("dash-prospect");
const dashAppointments = document.getElementById("dash-next-appointments");
const dashTasks = document.getElementById("dash-tasks");

// Clienti
const clientForm = document.getElementById("client-form");
const clientList = document.getElementById("client-list");
const searchClientInput = document.getElementById("search-client");

// Appuntamenti
const appointmentForm = document.getElementById("appointment-form");
const appointmentClientSelect = document.getElementById("appointment-client");
const appointmentList = document.getElementById("appointment-list");

// Attività
const taskForm = document.getElementById("task-form");
const taskClientSelect = document.getElementById("task-client");
const taskList = document.getElementById("task-list");

// Pipeline
const kanbanColumns = {
  nuovo: document.getElementById("kanban-nuovo"),
  valutazione: document.getElementById("kanban-valutazione"),
  trattativa: document.getElementById("kanban-trattativa"),
  chiuso: document.getElementById("kanban-chiuso"),
};

// Modale scheda cliente
const modal = document.getElementById("client-card-modal");
const cardName = document.getElementById("card-name");
const cardWealth = document.getElementById("card-wealth");
const cardRisk = document.getElement
