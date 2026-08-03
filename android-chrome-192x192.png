// ============================================================
// BRITISH MIDLAND VIRTUAL
// OPERATIONS CONTROL - INDIVIDUAL PILOT RECORD
// ============================================================


// ------------------------------------------------------------
// SUPABASE
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


const pilotName =
    document.getElementById("pilotName");

const pilotNumber =
    document.getElementById("pilotNumber");

const pilotRole =
    document.getElementById("pilotRole");

const pilotStatus =
    document.getElementById("pilotStatus");

const pilotJoined =
    document.getElementById("pilotJoined");


const totalFlights =
    document.getElementById("totalFlights");

const totalFlightTime =
    document.getElementById("totalFlightTime");

const averageLanding =
    document.getElementById("averageLanding");

const bestLanding =
    document.getElementById("bestLanding");

const totalLandings =
    document.getElementById("totalLandings");

const totalGoArounds =
    document.getElementById("totalGoArounds");

const lastFlight =
    document.getElementById("lastFlight");

const memberSince =
    document.getElementById("memberSince");

const flightHistory =
    document.getElementById("flightHistory");


// ============================================================
// HELPERS
// ============================================================

function redirectToLogin() {

    window.location.replace(
        "/management/"
    );

}


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


function formatMinutes(value) {

    const minutes =
        Number(value) || 0;

    const hours =
        Math.floor(minutes / 60);

    const remaining =
        minutes % 60;

    return `${hours}h ${remaining}m`;

}


function formatLanding(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "—";

    }

    return `${Number(value)} fpm`;

}


function formatDate(value) {

    if (!value) {

        return "—";

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


function getRequestedPilotId() {

    const parameters =
        new URLSearchParams(
            window.location.search
        );

    return parameters
        .get("id")
        ?.trim()
        .toUpperCase();

}


// ============================================================
// MANAGEMENT AUTHORISATION
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
// LOAD PILOT
// ============================================================

async function getPilot(pilotId) {

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
            .eq(
                "pilot_id",
                pilotId
            )
            .maybeSingle();


    if (error) {

        console.error(
            "Unable to retrieve pilot:",
            error
        );

        throw error;

    }


    return data;

}


// ============================================================
// GET INTERNAL PILOT UUID
// ============================================================

async function getPilotDatabaseRecord(pilotId) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("pilots")
            .select(
                "id, pilot_id"
            )
            .eq(
                "pilot_id",
                pilotId
            )
            .maybeSingle();


    if (error) {

        console.error(
            "Unable to retrieve pilot database record:",
            error
        );

        throw error;

    }


    return data;

}


// ============================================================
// LOAD PIREPS
// ============================================================

async function getPilotPireps(pilotUuid) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("pireps")
            .select(`
                id,
                flight_number,
                departure,
                arrival,
                aircraft,
                registration,
                block_minutes,
                landing_rate_fpm,
                go_arounds,
                submitted_at,
                flight_score,
                flight_grade,
                requires_review,
                status
            `)
            .eq(
                "pilot_id",
                pilotUuid
            )
            .order(
                "submitted_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Unable to retrieve pilot PIREPs:",
            error
        );

        throw error;

    }


    return data || [];

}


// ============================================================
// RENDER PILOT
// ============================================================

function renderPilot(pilot) {

    const nickname =
        pilot.nickname?.trim()
            ? pilot.nickname.trim()
            : "Unnamed Pilot";


    pilotName.textContent =
        nickname;

    pilotNumber.textContent =
        pilot.pilot_id;

    pilotRole.textContent =
        pilot.role || "Pilot";

    pilotStatus.textContent =
        pilot.status || "Unknown";


    pilotStatus.className =
        "profile-status";


    if (
        String(
            pilot.status
        ).toLowerCase() === "active"
    ) {

        pilotStatus.classList.add(
            "active"
        );

    }


    const joinedText =
        formatDate(
            pilot.joined_at
        );


    pilotJoined.textContent =
        `Joined ${joinedText}`;

    memberSince.textContent =
        joinedText;


    totalFlights.textContent =
        Number(
            pilot.total_flights
        ) || 0;


    totalFlightTime.textContent =
        formatMinutes(
            pilot.total_minutes
        );


    averageLanding.textContent =
        formatLanding(
            pilot.average_landing_rate_fpm
        );


    bestLanding.textContent =
        formatLanding(
            pilot.best_landing_rate_fpm
        );


    totalLandings.textContent =
        Number(
            pilot.total_landings
        ) || 0;


    totalGoArounds.textContent =
        Number(
            pilot.total_go_arounds
        ) || 0;


    lastFlight.textContent =
        pilot.last_flight_at
            ? formatDate(
                pilot.last_flight_at
            )
            : "No flights yet";


    document.title =
        `${pilot.pilot_id} ${nickname} | British Midland Virtual`;

}


// ============================================================
// RENDER FLIGHT HISTORY
// ============================================================

function renderPireps(rows) {

    if (!rows.length) {

        flightHistory.innerHTML =
            `
            <div class="history-empty">
                No ACARS flights have been submitted by this pilot.
            </div>
            `;

        return;

    }


    flightHistory.innerHTML =
        rows
            .map(
                pirep => {

                    const route =
                        `${pirep.departure} → ${pirep.arrival}`;


                    const aircraft =
                        pirep.registration
                            ? `${pirep.aircraft || "—"} / ${pirep.registration}`
                            : (
                                pirep.aircraft ||
                                "—"
                            );


                    const score =
                        pirep.flight_score !== null &&
                        pirep.flight_score !== undefined
                            ? `${pirep.flight_score}${pirep.flight_grade ? ` / ${pirep.flight_grade}` : ""}`
                            : "—";


                    const review =
                        pirep.requires_review
                            ? `<span class="review-flag">REVIEW</span>`
                            : "";


                    return `
                        <div class="flight-row">

                            <span class="flight-number">

                                <strong>
                                    ${escapeHtml(pirep.flight_number)}
                                </strong>

                                ${review}

                            </span>


                            <span>
                                ${escapeHtml(route)}
                            </span>


                            <span>
                                ${escapeHtml(aircraft)}
                            </span>


                            <span>
                                ${escapeHtml(
                                    formatMinutes(
                                        pirep.block_minutes
                                    )
                                )}
                            </span>


                            <span>
                                ${escapeHtml(
                                    formatLanding(
                                        pirep.landing_rate_fpm
                                    )
                                )}
                            </span>


                            <span>
                                ${escapeHtml(score)}
                            </span>


                            <span>
                                ${escapeHtml(
                                    formatDate(
                                        pirep.submitted_at
                                    )
                                )}
                            </span>

                        </div>
                    `;

                }
            )
            .join("");

}


// ============================================================
// ERROR DISPLAY
// ============================================================

function showPilotError(message) {

    pilotName.textContent =
        "Pilot record unavailable";

    pilotNumber.textContent =
        "—";

    pilotRole.textContent =
        message;

    pilotStatus.textContent =
        "ERROR";

    pilotStatus.className =
        "profile-status error";


    flightHistory.innerHTML =
        `
        <div class="history-empty">
            ${escapeHtml(message)}
        </div>
        `;

}


// ============================================================
// INITIALISE
// ============================================================

async function initialisePilotProfile() {

    try {

        // ----------------------------------------------------
        // SESSION
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

            redirectToLogin();

            return;

        }


        // ----------------------------------------------------
        // MANAGEMENT ACCESS
        // ----------------------------------------------------

        const manager =
            await getManagementUser(
                sessionData.session.user.id
            );


        if (!manager) {

            await supabaseClient
                .auth
                .signOut();

            redirectToLogin();

            return;

        }


        managementName.textContent =
            manager.display_name;

        managementRole.textContent =
            manager.role;


        // ----------------------------------------------------
        // PILOT ID
        // ----------------------------------------------------

        const requestedPilot =
            getRequestedPilotId();


        if (!requestedPilot) {

            showPilotError(
                "No pilot number was supplied."
            );

            revealPage();

            return;

        }


        console.log(
            "Loading pilot profile:",
            requestedPilot
        );


        // ----------------------------------------------------
        // PILOT STATISTICS
        // ----------------------------------------------------

        const pilot =
            await getPilot(
                requestedPilot
            );


        if (!pilot) {

            showPilotError(
                `Pilot ${requestedPilot} could not be found.`
            );

            revealPage();

            return;

        }


        renderPilot(
            pilot
        );


        // ----------------------------------------------------
        // DATABASE UUID
        // ----------------------------------------------------

        const pilotRecord =
            await getPilotDatabaseRecord(
                requestedPilot
            );


        if (!pilotRecord) {

            flightHistory.innerHTML =
                `
                <div class="history-empty">
                    No ACARS database record exists for this pilot.
                </div>
                `;

            revealPage();

            return;

        }


        // ----------------------------------------------------
        // PIREPS
        // ----------------------------------------------------

        const pireps =
            await getPilotPireps(
                pilotRecord.id
            );


        console.log(
            "Pilot PIREPs loaded:",
            pireps.length
        );


        renderPireps(
            pireps
        );


        revealPage();

    }
    catch (error) {

        console.error(
            "Pilot profile initialisation failed:",
            error
        );


        showPilotError(
            "Unable to load this pilot record."
        );


        revealPage();

    }

}


// ============================================================
// REVEAL PAGE
// ============================================================

function revealPage() {

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
    finally {

        redirectToLogin();

    }

}


// ============================================================
// EVENTS
// ============================================================

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
// START
// ============================================================

initialisePilotProfile();
