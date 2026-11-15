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
        await Promise.all([loadOperationsData(), loadDailyActivity(), loadFlyingInsights()]);
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

// Determine London calendar boundaries independently of the manager's device timezone.
function londonDayBounds(now = new Date()) {
    const dateKey = date => new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
    const today = dateKey(now);
    let start = new Date(now); start.setUTCHours(0,0,0,0);
    while (dateKey(start) === today) start = new Date(start.getTime()-3600000);
    while (dateKey(start) !== today) start = new Date(start.getTime()+3600000);
    let end = new Date(start.getTime()+23*3600000);
    while (dateKey(end) === today) end = new Date(end.getTime()+3600000);
    return {start:start.toISOString(),end:end.toISOString()};
}
async function dailyRows(table, columns, field, bounds) {
    const rows=[];
    for(let offset=0;;offset+=500){
        const {data,error}=await supabaseClient.from(table).select(columns).gte(field,bounds.start).lt(field,bounds.end).order('id').range(offset,offset+499);
        if(error)throw error;
        rows.push(...data);
        if(data.length<500)return rows;
    }
}
async function loadDailyActivity(){
    const bounds=londonDayBounds();
    document.getElementById('dailyPeriod').textContent='Today · '+new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',dateStyle:'full'}).format(new Date())+' · UK time';
    await Promise.allSettled([
        (async()=>{try{const rows=await dailyRows('pireps','id,pilot_id','submitted_at',bounds);document.getElementById('dailyFlights').textContent=rows.length;document.getElementById('dailyPilots').textContent=new Set(rows.map(r=>r.pilot_id).filter(Boolean)).size;}catch{for(const id of ['dailyFlights','dailyPilots'])document.getElementById(id).textContent='Unavailable';}})(),
        (async()=>{try{const {data:sessionData}=await supabaseClient.auth.getSession();if(!sessionData.session)throw Error('Please sign in.');const response=await fetch(SUPABASE_URL+'/functions/v1/bmv-website-management?summary=daily',{headers:{Authorization:'Bearer '+sessionData.session.access_token,apikey:SUPABASE_PUBLISHABLE_KEY},signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('Summary unavailable');const data=await response.json();if(!data.daily)throw Error('Invalid summary');document.getElementById('dailyRecruitment').textContent=data.daily.applications;}catch{document.getElementById('dailyRecruitment').textContent='Unavailable';}})(),
        (async()=>{try{const [holds,releases]=await Promise.all([dailyRows('tech_hold_history','id','placed_on_hold_at',bounds),dailyRows('tech_hold_history','id','released_at',bounds)]);document.getElementById('dailyTech').textContent=holds.length+releases.length;document.getElementById('dailyTechDetail').textContent=holds.length+' holds placed · '+releases.length+' returned to service';}catch{document.getElementById('dailyTech').textContent='Unavailable';}})()
    ]);
}

// Count each direction separately, using submitted/completed reports only.
function summariseFavouriteRoute(rows) {
    const counts = new Map();
    for (const row of rows) {
        if (!['submitted', 'completed'].includes(String(row.status || '').trim().toLowerCase())) continue;
        const departure = String(row.departure || '').trim().toUpperCase();
        const arrival = String(row.arrival || '').trim().toUpperCase();
        if (!/^[A-Z]{4}$/.test(departure) || !/^[A-Z]{4}$/.test(arrival) || departure === arrival) continue;
        const route = `${departure} → ${arrival}`;
        counts.set(route, (counts.get(route) || 0) + 1);
    }
    const ranked = [...counts].sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0], 'en'));
    if (!ranked.length) return null;
    return {route: ranked[0][0], flights: ranked[0][1], ties: ranked.filter(item => item[1] === ranked[0][1]).length};
}
function rankInsightCounts(counts) {
    const ranked = [...counts].sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0], 'en'));
    return ranked.length ? {key: ranked[0][0], flights: ranked[0][1], ties: ranked.filter(item => item[1] === ranked[0][1]).length} : null;
}
function summariseFlyingInsights(rows) {
    const submitted = rows.filter(row => ['submitted','completed'].includes(String(row.status || '').trim().toLowerCase()));
    const aircraft = new Map(), pilots = new Map();
    let totalMinutes = 0, timedFlights = 0;
    for (const row of submitted) {
        const registration = String(row.registration || '').trim().toUpperCase();
        if (/^[A-Z0-9-]{2,12}$/.test(registration) && !['UNKNOWN','NONE','NIL'].includes(registration)) aircraft.set(registration, (aircraft.get(registration) || 0) + 1);
        if (row.pilot_id) pilots.set(row.pilot_id, (pilots.get(row.pilot_id) || 0) + 1);
        const minutes = Number(row.airborne_minutes);
        if (Number.isFinite(minutes) && minutes > 0) { totalMinutes += minutes; timedFlights++; }
    }
    return {route: summariseFavouriteRoute(submitted), aircraft: rankInsightCounts(aircraft), pilot: rankInsightCounts(pilots), averageMinutes: timedFlights ? Math.round(totalMinutes / timedFlights) : null, timedFlights};
}
async function loadFlyingInsights() {
    const set = (id, text) => { document.getElementById(id).textContent = text; };
    const countText = result => `${result.flights} submitted flight${result.flights === 1 ? '' : 's'}${result.ties > 1 ? ` · tied with ${result.ties - 1} other${result.ties > 2 ? 's' : ''}` : ''}`;
    try {
        const now = new Date();
        const bounds = {start: new Date(now.getTime() - 30 * 86400000).toISOString(), end: now.toISOString()};
        // Page through the full period rather than relying on the API's default row limit.
        const rows = await dailyRows('pireps', 'id,departure,arrival,status,registration,pilot_id,airborne_minutes', 'submitted_at', bounds);
        const insights = summariseFlyingInsights(rows);
        set('favouriteRoute', insights.route ? insights.route.route : 'No routes yet');
        set('favouriteRouteDetail', insights.route ? `${countText(insights.route)} · direction counted separately` : 'No valid routes recorded');
        set('busiestAircraft', insights.aircraft ? insights.aircraft.key : 'No aircraft yet');
        set('busiestAircraftDetail', insights.aircraft ? countText(insights.aircraft) : 'No registrations recorded');
        set('averageFlightDuration', insights.averageMinutes === null ? 'No timings yet' : formatFlightTime(insights.averageMinutes));
        set('averageFlightDurationDetail', insights.timedFlights ? `Airborne time · ${insights.timedFlights} timed flight${insights.timedFlights === 1 ? '' : 's'} · missing durations excluded` : 'No positive airborne durations recorded');
        set('mostActivePilot', insights.pilot ? 'Unknown pilot' : 'No pilots yet');
        set('mostActivePilotDetail', insights.pilot ? countText(insights.pilot) : 'No pilot-linked submissions');
        if (insights.pilot) {
            try {
                const {data, error} = await supabaseClient.from('pilots').select('pilot_id,nickname').eq('id', insights.pilot.key).maybeSingle();
                if (error) throw error;
                set('mostActivePilot', data?.pilot_id || 'Unknown pilot');
                set('mostActivePilotDetail', `${data?.nickname ? data.nickname + ' · ' : ''}${countText(insights.pilot)}`);
            } catch {
                set('mostActivePilot', 'Name unavailable');
            }
        }
    } catch (error) {
        console.error('Unable to load flying insights:', error);
        for (const id of ['favouriteRoute','busiestAircraft','mostActivePilot','averageFlightDuration']) {
            set(id, 'Unavailable');
            set(id + 'Detail', 'Flight activity could not be loaded');
        }
    }
}
