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


function getPilotName(pilot) {

    const nickname =
        pilot.nickname?.trim();


    if (!nickname) {

        return "Unnamed Pilot";

    }


    return nickname;

}


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
