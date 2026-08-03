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

const activePilotCount =
    document.getElementById("activePilotCount");

const flyingPilotCount =
    document.getElementById("flyingPilotCount");

const pilotTotalFlights =
    document.getElementById("pilotTotalFlights");

const pilotTotalTime =
    document.getElementById("pilotTotalTime");


// ------------------------------------------------------------
// LOCAL DATA
// ------------------------------------------------------------

let rosterData = [];


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


function formatMinutes(minutes) {

    const total =
        Number(minutes) || 0;


    const hours =
        Math.floor(
            total / 60
        );


    const remainingMinutes =
        total % 60;


    return `${hours}h ${remainingMinutes}m`;

}


function formatLanding(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "—";

    }


    const rate =
        Number(value);


    if (
        Number.isNaN(rate)
    ) {

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


    return new Intl.DateTimeFormat(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    ).format(date);

}


// ============================================================
// SUMMARY CARDS
// ============================================================

function updateSummary(rows) {

    const active =
        rows.filter(
            pilot =>
                String(
                    pilot.status || ""
                ).toLowerCase() === "active"
        ).length;


    const flying =
        rows.filter(
            pilot =>
                (
                    Number(
                        pilot.total_flights
                    ) || 0
                ) > 0
        ).length;


    const flights =
        rows.reduce(
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


    const minutes =
        rows.reduce(
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
            active;

    }


    if (flyingPilotCount) {

        flyingPilotCount.textContent =
            flying;

    }


    if (pilotTotalFlights) {

        pilotTotalFlights.textContent =
            flights;

    }


    if (pilotTotalTime) {

        pilotTotalTime.textContent =
            formatMinutes(
                minutes
            );

    }

}


// ============================================================
// PILOT ROSTER
// ============================================================

function renderRoster(rows) {

    if (!pilotRoster) {

        console.error(
            "pilotRoster element was not found."
        );

        return;

    }


    if (!rows.length) {

        pilotRoster.innerHTML =
            `
            <div class="pilot-loading">
                No pilots match this search.
            </div>
            `;

        return;

    }


    pilotRoster.innerHTML =
        rows
            .map(
                pilot => {

                    const pilotId =
                        pilot.pilot_id || "—";


                    const pilotName =
                        pilot.nickname?.trim()
                            ? pilot.nickname.trim()
                            : "Unnamed Pilot";


                    const status =
                        pilot.status || "Unknown";


                    const statusClass =
                        String(status)
                            .toLowerCase() === "active"
                            ? "active"
                            : "inactive";


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


                    return `
                        <div
                            class="pilot-row"
                            data-pilot="${escapeHtml(pilotId)}"
                            tabindex="0"
                            role="link"
                            aria-label="Open ${escapeHtml(pilotId)} ${escapeHtml(pilotName)}"
                        >

                            <span class="pilot-identity">

                                <strong>
                                    ${escapeHtml(pilotId)}
                                </strong>

                                <small>
                                    ${escapeHtml(pilotName)}
                                </small>

                            </span>


                            <span>

                                <span class="pilot-status ${statusClass}">
                                    ${escapeHtml(status)}
                                </span>

                            </span>


                            <span class="numeric">
                                ${totalFlights}
                            </span>


                            <span>
                                ${escapeHtml(
                                    formatMinutes(
                                        totalMinutes
                                    )
                                )}
                            </span>


                            <span>
                                ${escapeHtml(
                                    formatLanding(
                                        pilot.average_landing_rate_fpm
                                    )
                                )}
                            </span>


                            <span>
                                ${escapeHtml(
                                    formatLanding(
                                        pilot.best_landing_rate_fpm
                                    )
                                )}
                            </span>


                            <span class="numeric">
                                ${totalGoArounds}
                            </span>


                            <span>
                                ${escapeHtml(
                                    formatDate(
                                        pilot.last_flight_at
                                    )
                                )}
                            </span>

                        </div>
                    `;

                }
            )
            .join("");


    // --------------------------------------------------------
    // MAKE PILOT ROWS CLICKABLE
    // --------------------------------------------------------

    document
        .querySelectorAll(".pilot-row")
        .forEach(
            row => {

                const openPilot =
                    () => {

                        const pilotId =
                            row.dataset.pilot;


                        if (!pilotId) {

                            return;

                        }


                        window.location.href =
                            `/management/pilot.html?id=${encodeURIComponent(pilotId)}`;

                    };


                row.addEventListener(
                    "click",
                    openPilot
                );


                row.addEventListener(
                    "keydown",
                    event => {

                        if (
                            event.key === "Enter" ||
                            event.key === " "
                        ) {

                            event.preventDefault();

                            openPilot();

                        }

                    }
                );

            }
        );

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


    rosterData =
        data || [];


    console.log(
        "Pilot statistics loaded:",
        rosterData.length
    );


    updateSummary(
        rosterData
    );


    renderRoster(
        rosterData
    );

}


// ============================================================
// SEARCH
// ============================================================

function filterRoster() {

    if (!pilotSearch) {

        return;

    }


    const searchTerm =
        pilotSearch.value
            .trim()
            .toLowerCase();


    if (!searchTerm) {

        renderRoster(
            rosterData
        );

        return;

    }


    const filteredPilots =
        rosterData.filter(
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


    renderRoster(
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


        if (dashboardApp) {

            dashboardApp.classList.remove(
                "hidden"
            );

        }

    }
    catch (error) {

        console.error(
            "Pilot Management initialisation failed:",
            error
        );


        /*
         * Don't leave the portal stuck on
         * AUTHENTICATING if pilot data fails.
         */

        if (authGate) {

            authGate.classList.add(
                "hidden"
            );

        }


        if (dashboardApp) {

            dashboardApp.classList.remove(
                "hidden"
            );

        }


        if (pilotRoster) {

            pilotRoster.innerHTML =
                `
                <div class="pilot-loading">
                    Unable to load the pilot roster.
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
    event => {

        if (
            event === "SIGNED_OUT"
        ) {

            redirectToLogin();

        }

    }
);


// ============================================================
// START PILOT MANAGEMENT
// ============================================================

initialisePilots();
