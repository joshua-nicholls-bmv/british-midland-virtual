const SUPABASE_URL = "https://eqbaezhcwnjlcnvtfxho.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable__JTXMIQDaruQdmjEmf9t6w_T23MXelW";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const authGate = document.getElementById("authGate");
const dashboardApp = document.getElementById("dashboardApp");
const managementName = document.getElementById("managementName");
const managementRole = document.getElementById("managementRole");
const signOutButton = document.getElementById("signOutButton");
const activePilotCount = document.getElementById("activePilotCount");
const flyingPilotCount = document.getElementById("flyingPilotCount");
const pilotTotalFlights = document.getElementById("pilotTotalFlights");
const pilotTotalTime = document.getElementById("pilotTotalTime");
const pilotRoster = document.getElementById("pilotRoster");
const pilotSearch = document.getElementById("pilotSearch");
let rosterData = [];

function redirectToLogin() { window.location.replace("/management/"); }
function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
function formatMinutes(minutes) {
    const total = Number(minutes) || 0;
    return `${Math.floor(total / 60)}h ${total % 60}m`;
}
function formatLanding(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
    return `${Number(value)} fpm`;
}
function formatDate(value) {
    if (!value) return "No flights yet";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}
async function getManagementUser(userId) {
    const { data, error } = await supabaseClient.from("management_users").select("display_name, role, active").eq("user_id", userId).eq("active", true).maybeSingle();
    if (error) { console.error("Management verification failed:", error); return null; }
    return data;
}
function renderRoster(rows) {
    if (!rows.length) { pilotRoster.innerHTML = '<div class="pilot-loading">No pilots match this search.</div>'; return; }
    pilotRoster.innerHTML = rows.map(pilot => {
        const name = pilot.nickname || "Unnamed Pilot";
        const statusClass = String(pilot.status || "").toLowerCase() === "active" ? "active" : "inactive";
        return `<div class="pilot-row" data-pilot="${escapeHtml(pilot.pilot_id)}" tabindex="0" role="link" aria-label="Open ${escapeHtml(pilot.pilot_id)} ${escapeHtml(name)}"><span class="pilot-identity"><strong>${escapeHtml(pilot.pilot_id)}</strong><small>${escapeHtml(name)}</small></span><span><span class="pilot-status ${statusClass}">${escapeHtml(pilot.status || "Unknown")}</span></span><span class="numeric">${Number(pilot.total_flights) || 0}</span><span>${escapeHtml(formatMinutes(pilot.total_minutes))}</span><span>${escapeHtml(formatLanding(pilot.average_landing_rate_fpm))}</span><span>${escapeHtml(formatLanding(pilot.best_landing_rate_fpm))}</span><span class="numeric">${Number(pilot.total_go_arounds) || 0}</span><span>${escapeHtml(formatDate(pilot.last_flight_at))}</span></div>`;
    }).join("");
    document.querySelectorAll(".pilot-row").forEach(row => {
        const openPilot = () => { const id = row.dataset.pilot; if (id) window.location.href = `/management/pilot.html?id=${encodeURIComponent(id)}`; };
        row.addEventListener("click", openPilot);
        row.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openPilot(); } });
    });
}
function updateSummary(rows) {
    const active = rows.filter(p => String(p.status || "").toLowerCase() === "active").length;
    const flying = rows.filter(p => (Number(p.total_flights) || 0) > 0).length;
    const flights = rows.reduce((sum,p) => sum + (Number(p.total_flights) || 0), 0);
    const minutes = rows.reduce((sum,p) => sum + (Number(p.total_minutes) || 0), 0);
    activePilotCount.textContent = active;
    flyingPilotCount.textContent = flying;
    pilotTotalFlights.textContent = flights;
    pilotTotalTime.textContent = formatMinutes(minutes);
}
async function loadPilots() {
    const { data, error } = await supabaseClient.from("pilot_statistics").select("pilot_id,nickname,role,status,joined_at,total_minutes,total_hours,remaining_minutes,total_flights,total_landings,total_go_arounds,average_landing_rate_fpm,best_landing_rate_fpm,last_flight_at").order("pilot_id", { ascending: true });
    if (error) throw error;
    rosterData = data || [];
    updateSummary(rosterData);
    renderRoster(rosterData);
}
function filterRoster() {
    const term = pilotSearch.value.trim().toLowerCase();
    if (!term) { renderRoster(rosterData); return; }
    renderRoster(rosterData.filter(p => String(p.pilot_id || "").toLowerCase().includes(term) || String(p.nickname || "").toLowerCase().includes(term)));
}
async function initialisePilots() {
    try {
        const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
        if (sessionError || !sessionData.session) { redirectToLogin(); return; }
        const manager = await getManagementUser(sessionData.session.user.id);
        if (!manager) { await supabaseClient.auth.signOut(); redirectToLogin(); return; }
        managementName.textContent = manager.display_name;
        managementRole.textContent = manager.role;
        await loadPilots();
        authGate.classList.add("hidden");
        dashboardApp.classList.remove("hidden");
    } catch (error) {
        console.error("Pilot Management initialisation failed:", error);
        if (pilotRoster) pilotRoster.innerHTML = '<div class="pilot-loading error">Unable to load the pilot roster.</div>';
        authGate.classList.add("hidden");
        dashboardApp.classList.remove("hidden");
    }
}
async function signOut() {
    if (signOutButton) signOutButton.disabled = true;
    try { await supabaseClient.auth.signOut(); }
    finally { redirectToLogin(); }
}
if (pilotSearch) pilotSearch.addEventListener("input", filterRoster);
if (signOutButton) signOutButton.addEventListener("click", signOut);
supabaseClient.auth.onAuthStateChange(event => { if (event === "SIGNED_OUT") redirectToLogin(); });
initialisePilots();


