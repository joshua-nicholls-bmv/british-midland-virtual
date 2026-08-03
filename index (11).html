const SUPABASE_URL = "https://eqbaezhcwnjlcnvtfxho.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable__JTXMIQDaruQdmjEmf9t6w_T23MXelW";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const authGate = document.getElementById("authGate");
const dashboardApp = document.getElementById("dashboardApp");
const managementName = document.getElementById("managementName");
const managementRole = document.getElementById("managementRole");
const welcomeHeading = document.getElementById("welcomeHeading");
const signOutButton = document.getElementById("signOutButton");
const activePilotsElement = document.getElementById("activePilots");
const totalFlightsElement = document.getElementById("totalFlights");
const flightHoursElement = document.getElementById("flightHours");
const reviewCountElement = document.getElementById("reviewCount");
const recentOperationsElement = document.getElementById("recentOperations");
const reviewQueueElement = document.getElementById("reviewQueue");

function redirectToLogin() { window.location.replace("/management/"); }
function setGreeting(name) {
    const hour = new Date().getHours();
    let greeting = "Good evening";
    if (hour < 12) greeting = "Good morning";
    else if (hour < 18) greeting = "Good afternoon";
    welcomeHeading.textContent = `${greeting}, ${name}.`;
}
function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
function formatLandingRate(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
    return `${Number(value)} fpm`;
}
function formatAircraft(aircraft, registration) {
    const type = aircraft || "—";
    return registration ? `${type} · ${registration}` : type;
}
function formatScore(score, grade) {
    if (score === null || score === undefined) return grade || "—";
    return grade ? `${score} ${grade}` : String(score);
}
function formatFlightTime(minutes) {
    const total = Number(minutes) || 0;
    return `${Math.floor(total / 60)}h ${total % 60}m`;
}
async function getManagementUser(userId) {
    const { data, error } = await supabaseClient.from("management_users").select("display_name, role, active").eq("user_id", userId).eq("active", true).maybeSingle();
    if (error) { console.error("Management verification failed:", error); return null; }
    return data;
}
async function loadPilotLookup() {
    const { data, error } = await supabaseClient.from("pilots").select("id, pilot_id, nickname");
    if (error) throw error;
    const lookup = new Map();
    for (const pilot of data || []) lookup.set(pilot.id, { pilotId: pilot.pilot_id || "—", nickname: pilot.nickname || "Unnamed Pilot" });
    return lookup;
}
async function loadDashboardStatistics() {
    try {
        const { count: pilotCount, error: pilotError } = await supabaseClient.from("pilots").select("*", { count: "exact", head: true }).eq("status", "Active");
        if (pilotError) throw pilotError;
        const { data: pireps, error: pirepError } = await supabaseClient.from("pireps").select("block_minutes, requires_review");
        if (pirepError) throw pirepError;
        const rows = pireps || [];
        const totalMinutes = rows.reduce((sum, row) => sum + (Number(row.block_minutes) || 0), 0);
        const reviews = rows.filter(row => row.requires_review === true).length;
        activePilotsElement.textContent = pilotCount ?? 0;
        totalFlightsElement.textContent = rows.length;
        flightHoursElement.textContent = formatFlightTime(totalMinutes);
        reviewCountElement.textContent = reviews;
    } catch (error) {
        console.error("Unable to load ACARS statistics:", error);
        activePilotsElement.textContent = "ERR";
        totalFlightsElement.textContent = "ERR";
        flightHoursElement.textContent = "ERR";
        reviewCountElement.textContent = "ERR";
    }
}
async function loadRecentOperations(pilotLookup) {
    try {
        const { data, error } = await supabaseClient.from("pireps").select("id,pilot_id,flight_number,departure,arrival,aircraft,registration,landing_rate_fpm,flight_score,flight_grade,submitted_at").order("submitted_at", { ascending: false }).limit(8);
        if (error) throw error;
        const rows = data || [];
        if (!rows.length) { recentOperationsElement.innerHTML = '<div class="empty-state">No submitted PIREPs found.</div>'; return; }
        recentOperationsElement.innerHTML = rows.map(pirep => {
            const pilot = pilotLookup.get(pirep.pilot_id) || { pilotId: "—", nickname: "Unknown Pilot" };
            return `<div class="table-row"><span><strong>${escapeHtml(pilot.pilotId)}</strong><br><span style="color:#697582;font-size:8px;">${escapeHtml(pilot.nickname)}</span></span><span><strong>${escapeHtml(pirep.flight_number)}</strong></span><span>${escapeHtml(pirep.departure)} → ${escapeHtml(pirep.arrival)}</span><span>${escapeHtml(formatAircraft(pirep.aircraft,pirep.registration))}</span><span>${escapeHtml(formatLandingRate(pirep.landing_rate_fpm))}</span><span><strong>${escapeHtml(formatScore(pirep.flight_score,pirep.flight_grade))}</strong></span></div>`;
        }).join("");
    } catch (error) {
        console.error("Unable to load Recent Operations:", error);
        recentOperationsElement.innerHTML = '<div class="empty-state">Unable to load recent operations.</div>';
    }
}
async function loadReviewQueue(pilotLookup) {
    try {
        const { data, error } = await supabaseClient.from("pireps").select("id,pilot_id,flight_number,departure,arrival,landing_rate_fpm,flight_score,flight_grade,submitted_at").eq("requires_review", true).order("submitted_at", { ascending: false }).limit(5);
        if (error) throw error;
        const rows = data || [];
        if (!rows.length) { reviewQueueElement.innerHTML = '<div class="review-zero"><strong>0</strong><span>No flights require review</span></div>'; return; }
        reviewQueueElement.innerHTML = `<div style="width:100%;">${rows.map(pirep => {
            const pilot = pilotLookup.get(pirep.pilot_id) || { pilotId: "—", nickname: "Unknown Pilot" };
            return `<div style="padding:16px 20px;border-bottom:1px solid #eeeeeb;"><div style="display:flex;justify-content:space-between;gap:15px;"><div><span style="color:#d02823;font-size:7px;font-weight:700;letter-spacing:1px;">REVIEW REQUIRED</span><strong style="display:block;margin-top:5px;font-size:12px;color:#001a3a;">${escapeHtml(pirep.flight_number)}</strong></div><strong style="font-size:12px;color:#d02823;">${escapeHtml(formatScore(pirep.flight_score,pirep.flight_grade))}</strong></div><div style="margin-top:10px;color:#697582;font-size:8px;line-height:1.6;">${escapeHtml(pilot.pilotId)} · ${escapeHtml(pilot.nickname)}<br>${escapeHtml(pirep.departure)} → ${escapeHtml(pirep.arrival)}<br>Landing: ${escapeHtml(formatLandingRate(pirep.landing_rate_fpm))}</div></div>`;
        }).join("")}</div>`;
    } catch (error) {
        console.error("Unable to load Review Queue:", error);
        reviewQueueElement.innerHTML = '<div class="review-zero"><strong>!</strong><span>Unable to load review queue</span></div>';
    }
}
async function loadOperationsData() {
    const pilotLookup = await loadPilotLookup();
    await Promise.all([loadDashboardStatistics(), loadRecentOperations(pilotLookup), loadReviewQueue(pilotLookup)]);
}
async function initialiseDashboard() {
    try {
        const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
        if (sessionError || !sessionData.session) { redirectToLogin(); return; }
        const manager = await getManagementUser(sessionData.session.user.id);
        if (!manager) { await supabaseClient.auth.signOut(); redirectToLogin(); return; }
        managementName.textContent = manager.display_name;
        managementRole.textContent = manager.role;
        setGreeting(manager.display_name);
        await loadOperationsData();
        authGate.classList.add("hidden");
        dashboardApp.classList.remove("hidden");
    } catch (error) { console.error("Dashboard initialisation failed:", error); redirectToLogin(); }
}
async function signOut() {
    if (signOutButton) signOutButton.disabled = true;
    try { await supabaseClient.auth.signOut(); }
    finally { redirectToLogin(); }
}
if (signOutButton) signOutButton.addEventListener("click", signOut);
supabaseClient.auth.onAuthStateChange(event => { if (event === "SIGNED_OUT") redirectToLogin(); });
initialiseDashboard();
