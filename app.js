// Placeholder Supabase (aggiungerai le tue chiavi qui)
const SUPABASE_URL = "";
const SUPABASE_KEY = "";
let supabaseClient = null;

if (SUPABASE_URL && SUPABASE_KEY) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

const loginScreen = document.getElementById("login-screen");
const appScreen = document.getElementById("app-screen");
const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");
const loginError = document.getElementById("login-error");

function fakeAuth() {
  // Per ora: finta autenticazione
  loginScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");
}

loginBtn.addEventListener("click", (e) => {
  e.preventDefault();
  fakeAuth();
});

signupBtn.addEventListener("click", (e) => {
  e.preventDefault();
  fakeAuth();
});
