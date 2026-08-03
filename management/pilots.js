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
// ============================================================
// BRITISH MIDLAND VIRTUAL
// OPERATIONS CONTROL - PILOT MANAGEMENT
// ============================================================


// ------------------------------------------------------------
// SUPABASE CONFIGURATION
// ------------------------------------------------------------

const SUPABASE_URL =
    "https://eqbaezhcwnjlcnvtfxho.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable__JTXMIQDaruQdmjEmf9t6w_T23MXelW";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


// ------------------------------------------------------------
// PAGE ELEMENTS
// ------------------------------------------------------------

const authGate =
    document.getElementById("authGate");

const pilotsApp =
    document.getElementById("pilotsApp");

const dashboardApp =
    document.getElementById("dashboardApp");

const managementName =
    document.getElementById("managementName");

const managementRole =
    document.getElementById("managementRole");

const signOutButton =
    document.getElementById("signOutButton");

const pilotSearch =
    document.getElementById("pilotSearch");

const pilotRoster =
    document.getElementById("pilotRoster");


// Summary cards

const activePilotCount =
    document.getElementById("activePilotCount");

const flyingPilotCount =
    document.getElementById("flyingPilotCount");

const totalFlightCount =
    document.getElementById("totalFlightCount");

const totalFlightTime =
    document.getElementById("totalFlightTime");


// ------------------------------------------------------------
// LOCAL DATA
// ------------------------------------------------------------

let pilotData = [];


// ============================================================
// REDIRECT TO LOGIN
// ============================================================

function redirectToLogin() {

    window.location.replace(
        "/management/"
    );

}


// ============================================================
// MANAGEMENT VERIFICATION
// ============================================================

async function getManagementUser(userId) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("management_users")
            .select(
                "display_name, role, active"
            )
            .eq(
                "user_id",
                userId
            )
            .eq(
                "active",
                true
            )
            .maybeSingle();


    if (error) {

        console.error(
            "Management verification failed:",
            error
        );

        return null;

    }


    return data;

}


// ============================================================
// FORMATTERS
// ============================================================

function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}
function formatMinutes(minutes) {
    const total = Number(minutes) || 0;
    return `${Math.floor(total / 60)}h ${total % 60}m`;


function formatFlightTime(minutes) {

    const totalMinutes =
        Number(minutes) || 0;


    const hours =
        Math.floor(
            totalMinutes / 60
        );


    const remainingMinutes =
        totalMinutes % 60;


    return `${hours}h ${remainingMinutes}m`;

}
function formatLanding(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
    return `${Number(value)} fpm`;


function formatLandingRate(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "—";

    }


    const rate =
        Number(value);


    if (Number.isNaN(rate)) {

        return "—";

    }


    return `${rate} fpm`;

}


function formatDate(value) {
    if (!value) return "No flights yet";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);

    if (!value) {

        return "No flights yet";

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

    }


    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}
async function getManagementUser(userId) {
    const { data, error } = await supabaseClient.from("management_users").select("display_name, role, active").eq("user_id", userId).eq("active", true).maybeSingle();
    if (error) { console.error("Management verification failed:", error); return null; }
    return data;


function getPilotName(pilot) {

    const nickname =
        pilot.nickname?.trim();


    if (!nickname) {

        return "Unnamed Pilot";

    }


    return nickname;

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


// ============================================================
// LOAD PILOT STATISTICS
// ============================================================

async function loadPilots() {

    console.log(
        "Loading British Midland pilot statistics..."
    );


    const {
        data,
        error
    } =
        await supabaseClient
            .from("pilot_statistics")
            .select(`
                pilot_id,
                nickname,
                role,
                status,
                joined_at,
                total_minutes,
                total_hours,
                remaining_minutes,
                total_flights,
                total_landings,
                total_go_arounds,
                average_landing_rate_fpm,
                best_landing_rate_fpm,
                last_flight_at
            `)
            .order(
                "pilot_id",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Unable to load pilot statistics:",
            error
        );

        throw error;

    }


    pilotData =
        data || [];


    console.log(
        "Pilot statistics loaded:",
        pilotData.length
    );


    updateSummaryCards();

    renderPilotRoster(
        pilotData
    );

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


// ============================================================
// SUMMARY CARDS
// ============================================================

function updateSummaryCards() {

    const activePilots =
        pilotData.filter(
            pilot =>
                String(
                    pilot.status || ""
                ).toLowerCase() === "active"
        );


    const flyingPilots =
        pilotData.filter(
            pilot =>
                (
                    Number(
                        pilot.total_flights
                    ) || 0
                ) > 0
        );


    const totalFlights =
        pilotData.reduce(
            (total, pilot) => {

                return (
                    total +
                    (
                        Number(
                            pilot.total_flights
                        ) || 0
                    )
                );

            },
            0
        );


    const totalMinutes =
        pilotData.reduce(
            (total, pilot) => {

                return (
                    total +
                    (
                        Number(
                            pilot.total_minutes
                        ) || 0
                    )
                );

            },
            0
        );


    if (activePilotCount) {

        activePilotCount.textContent =
            activePilots.length;

    }


    if (flyingPilotCount) {

        flyingPilotCount.textContent =
            flyingPilots.length;

    }


    if (totalFlightCount) {

        totalFlightCount.textContent =
            totalFlights;

    }


    if (totalFlightTime) {

        totalFlightTime.textContent =
            formatFlightTime(
                totalMinutes
            );

    }

}
async function loadPilots() {
    const { data, error } = await supabaseClient.from("pilot_statistics").select("pilot_id,nickname,role,status,joined_at,total_minutes,total_hours,remaining_minutes,total_flights,total_landings,total_go_arounds,average_landing_rate_fpm,best_landing_rate_fpm,last_flight_at").order("pilot_id", { ascending: true });
    if (error) throw error;
    rosterData = data || [];
    updateSummary(rosterData);
    renderRoster(rosterData);


// ============================================================
// PILOT ROSTER
// ============================================================

function renderPilotRoster(pilots) {

    if (!pilotRoster) {

        console.error(
            "pilotRoster element was not found."
        );

        return;

    }


    if (!pilots.length) {

        pilotRoster.innerHTML =
            `
            <div class="pilot-empty">
                No pilots found.
            </div>
            `;

        return;

    }


    pilotRoster.innerHTML =
        pilots
            .map(
                pilot => {

                    const pilotId =
                        pilot.pilot_id || "—";


                    const pilotName =
                        getPilotName(
                            pilot
                        );


                    const status =
                        pilot.status || "Unknown";


                    const totalFlights =
                        Number(
                            pilot.total_flights
                        ) || 0;


                    const totalMinutes =
                        Number(
                            pilot.total_minutes
                        ) || 0;


                    const totalGoArounds =
                        Number(
                            pilot.total_go_arounds
                        ) || 0;


                    const averageLanding =
                        formatLandingRate(
                            pilot.average_landing_rate_fpm
                        );


                    const bestLanding =
                        formatLandingRate(
                            pilot.best_landing_rate_fpm
                        );


                    const lastFlight =
                        formatDate(
                            pilot.last_flight_at
                        );


                    const statusClass =
                        String(status)
                            .toLowerCase() === "active"
                            ? "active"
                            : "inactive";


                    return `
                        <a
                            class="pilot-row"
                            href="/management/pilot.html?id=${encodeURIComponent(pilotId)}"
                        >

                            <div class="pilot-identity">

                                <strong>
                                    ${escapeHtml(pilotId)}
                                </strong>

                                <span>
                                    ${escapeHtml(pilotName)}
                                </span>

                            </div>


                            <div>

                                <span
                                    class="pilot-status ${statusClass}"
                                >
                                    ${escapeHtml(status)}
                                </span>

                            </div>


                            <div class="pilot-number">
                                ${totalFlights}
                            </div>


                            <div class="pilot-number">
                                ${escapeHtml(
                                    formatFlightTime(
                                        totalMinutes
                                    )
                                )}
                            </div>


                            <div class="pilot-number">
                                ${escapeHtml(
                                    averageLanding
                                )}
                            </div>


                            <div class="pilot-number">
                                ${escapeHtml(
                                    bestLanding
                                )}
                            </div>


                            <div class="pilot-number">
                                ${totalGoArounds}
                            </div>


                            <div class="pilot-last-flight">
                                ${escapeHtml(lastFlight)}
                            </div>

                        </a>
                    `;

                }
            )
            .join("");

}


// ============================================================
// SEARCH
// ============================================================

function filterRoster() {
    const term = pilotSearch.value.trim().toLowerCase();
    if (!term) { renderRoster(rosterData); return; }
    renderRoster(rosterData.filter(p => String(p.pilot_id || "").toLowerCase().includes(term) || String(p.nickname || "").toLowerCase().includes(term)));

    const searchTerm =
        pilotSearch
            ? pilotSearch.value
                .trim()
                .toLowerCase()
            : "";


    if (!searchTerm) {

        renderPilotRoster(
            pilotData
        );

        return;

    }


    const filteredPilots =
        pilotData.filter(
            pilot => {

                const pilotId =
                    String(
                        pilot.pilot_id || ""
                    ).toLowerCase();


                const nickname =
                    String(
                        pilot.nickname || ""
                    ).toLowerCase();


                const role =
                    String(
                        pilot.role || ""
                    ).toLowerCase();


                const status =
                    String(
                        pilot.status || ""
                    ).toLowerCase();


                return (
                    pilotId.includes(
                        searchTerm
                    ) ||
                    nickname.includes(
                        searchTerm
                    ) ||
                    role.includes(
                        searchTerm
                    ) ||
                    status.includes(
                        searchTerm
                    )
                );

            }
        );


    renderPilotRoster(
        filteredPilots
    );

}


// ============================================================
// INITIALISE PILOT MANAGEMENT
// ============================================================

async function initialisePilots() {

try {
        const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
        if (sessionError || !sessionData.session) { redirectToLogin(); return; }
        const manager = await getManagementUser(sessionData.session.user.id);
        if (!manager) { await supabaseClient.auth.signOut(); redirectToLogin(); return; }
        managementName.textContent = manager.display_name;
        managementRole.textContent = manager.role;

        // ----------------------------------------------------
        // CHECK AUTHENTICATED SESSION
        // ----------------------------------------------------

        const {
            data: sessionData,
            error: sessionError
        } =
            await supabaseClient
                .auth
                .getSession();


        if (
            sessionError ||
            !sessionData.session
        ) {

            console.warn(
                "No authenticated management session."
            );


            redirectToLogin();

            return;

        }


        const user =
            sessionData.session.user;


        // ----------------------------------------------------
        // VERIFY MANAGEMENT AUTHORISATION
        // ----------------------------------------------------

        const manager =
            await getManagementUser(
                user.id
            );


        if (!manager) {

            console.warn(
                "Authenticated account does not have management access."
            );


            await supabaseClient
                .auth
                .signOut();


            redirectToLogin();

            return;

        }


        // ----------------------------------------------------
        // MANAGEMENT SESSION CONFIRMED
        // ----------------------------------------------------

        if (managementName) {

            managementName.textContent =
                manager.display_name;

        }


        if (managementRole) {

            managementRole.textContent =
                manager.role;

        }


        console.log(
            "Pilot Management access granted:",
            {
                displayName:
                    manager.display_name,

                role:
                    manager.role
            }
        );


        // ----------------------------------------------------
        // LOAD LIVE PILOT DATA
        // ----------------------------------------------------

await loadPilots();
        authGate.classList.add("hidden");
        dashboardApp.classList.remove("hidden");
    } catch (error) {
        console.error("Pilot Management initialisation failed:", error);
        if (pilotRoster) pilotRoster.innerHTML = '<div class="pilot-loading error">Unable to load the pilot roster.</div>';
        authGate.classList.add("hidden");
        dashboardApp.classList.remove("hidden");


        // ----------------------------------------------------
        // REVEAL PAGE
        // ----------------------------------------------------

        if (authGate) {

            authGate.classList.add(
                "hidden"
            );

        }


        /*
         * Support either ID so the file remains compatible
         * with the generated pilots.html structure.
         */

        const appElement =
            pilotsApp ||
            dashboardApp;


        if (appElement) {

            appElement.classList.remove(
                "hidden"
            );

        }
        else {

            console.error(
                "Unable to find pilotsApp or dashboardApp."
            );

        }

    }
    catch (error) {

        console.error(
            "Pilot Management initialisation failed:",
            error
        );


        /*
         * Don't leave management staring at the
         * authentication screen indefinitely if
         * pilot data itself fails.
         */

        if (authGate) {

            authGate.classList.add(
                "hidden"
            );

        }


        const appElement =
            pilotsApp ||
            dashboardApp;


        if (appElement) {

            appElement.classList.remove(
                "hidden"
            );

        }


        if (pilotRoster) {

            pilotRoster.innerHTML =
                `
                <div class="pilot-empty">
                    Unable to load pilot records.
                    Check the Operations Control console
                    for further information.
                </div>
                `;

        }

}

}


// ============================================================
// SIGN OUT
// ============================================================

async function signOut() {
    if (signOutButton) signOutButton.disabled = true;
    try { await supabaseClient.auth.signOut(); }
    finally { redirectToLogin(); }

    if (signOutButton) {

        signOutButton.disabled =
            true;

    }


    try {

        await supabaseClient
            .auth
            .signOut();

    }
    catch (error) {

        console.error(
            "Sign out failed:",
            error
        );

    }
    finally {

        redirectToLogin();

    }

}
if (pilotSearch) pilotSearch.addEventListener("input", filterRoster);
if (signOutButton) signOutButton.addEventListener("click", signOut);
supabaseClient.auth.onAuthStateChange(event => { if (event === "SIGNED_OUT") redirectToLogin(); });
initialisePilots();


// ============================================================
// EVENT LISTENERS
// ============================================================

if (pilotSearch) {

    pilotSearch.addEventListener(
        "input",
        filterRoster
    );

}


if (signOutButton) {

    signOutButton.addEventListener(
        "click",
        signOut
    );

}


supabaseClient.auth.onAuthStateChange(
    (event) => {

        if (event === "SIGNED_OUT") {

            redirectToLogin();

        }

    }
);


// ============================================================
// START PILOT MANAGEMENT
// ============================================================

initialisePilots();
