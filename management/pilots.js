// ============================================================
// BRITISH MIDLAND VIRTUAL
// OPERATIONS CONTROL - INDIVIDUAL PILOT RECORD
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


// Pilot identity

const pilotName =
    document.getElementById("pilotName");

const pilotNumber =
    document.getElementById("pilotNumber");

const pilotStatus =
    document.getElementById("pilotStatus");

const pilotRole =
    document.getElementById("pilotRole");

const pilotJoined =
    document.getElementById("pilotJoined");

const pilotLastFlight =
    document.getElementById("pilotLastFlight");


// Main statistics

const pilotFlights =
    document.getElementById("pilotFlights");

const pilotFlightTime =
    document.getElementById("pilotFlightTime");

const pilotAverageLanding =
    document.getElementById("pilotAverageLanding");

const pilotBestLanding =
    document.getElementById("pilotBestLanding");


// Career record

const pilotLandings =
    document.getElementById("pilotLandings");

const pilotGoArounds =
    document.getElementById("pilotGoArounds");

const pilotReviewFlights =
    document.getElementById("pilotReviewFlights");

const pilotLatestScore =
    document.getElementById("pilotLatestScore");


// Account summary

const accountPilotNumber =
    document.getElementById("accountPilotNumber");

const accountPilotName =
    document.getElementById("accountPilotName");

const accountPilotStatus =
    document.getElementById("accountPilotStatus");


// History

const historyCount =
    document.getElementById("historyCount");

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


function redirectToPilots() {

    window.location.replace(
        "/management/pilots.html"
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


    return nickname ||
        "Unnamed Pilot";

}


function formatAircraft(
    aircraft,
    registration
) {

    const aircraftText =
        aircraft || "—";


    if (!registration) {

        return aircraftText;

    }


    return `${aircraftText} · ${registration}`;

}


function formatScore(
    score,
    grade
) {

    if (
        score === null ||
        score === undefined
    ) {

        return grade || "—";

    }


    if (grade) {

        return `${score} ${grade}`;

    }


    return String(score);

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
// LOAD PILOT STATISTICS
// ============================================================

async function loadPilotStatistics(
    requestedPilotId
) {

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
                total_flights,
                total_landings,
                total_go_arounds,
                average_landing_rate_fpm,
                best_landing_rate_fpm,
                last_flight_at
            `)
            .eq(
                "pilot_id",
                requestedPilotId
            )
            .maybeSingle();


    if (error) {

        console.error(
            "Unable to load pilot statistics:",
            error
        );

        throw error;

    }


    return data;

}


// ============================================================
// RESOLVE INTERNAL PILOT UUID
// ============================================================

async function getPilotDatabaseRecord(
    requestedPilotId
) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("pilots")
            .select(
                "id, pilot_id, nickname, role, status"
            )
            .eq(
                "pilot_id",
                requestedPilotId
            )
            .maybeSingle();


    if (error) {

        console.error(
            "Unable to resolve pilot database record:",
            error
        );

        throw error;

    }


    return data;

}


// ============================================================
// LOAD PILOT PIREPS
// ============================================================

async function loadPilotPireps(
    pilotUuid
) {

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
                status,
                submitted_at,
                flight_score,
                flight_grade,
                requires_review
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
            "Unable to load pilot PIREPs:",
            error
        );

        throw error;

    }


    return data || [];

}


// ============================================================
// RENDER PILOT PROFILE
// ============================================================

function renderPilotProfile(
    pilot,
    pireps
) {

    const name =
        getPilotName(
            pilot
        );


    const status =
        pilot.status || "Unknown";


    const statusClass =
        String(status)
            .toLowerCase() === "active"
            ? "active"
            : "inactive";


    pilotName.textContent =
        name;


    pilotNumber.textContent =
        pilot.pilot_id || "—";


    pilotStatus.textContent =
        status;


    pilotStatus.className =
        `profile-status ${statusClass}`;


    pilotRole.textContent =
        pilot.role || "—";


    pilotJoined.textContent =
        formatDate(
            pilot.joined_at
        );


    pilotLastFlight.textContent =
        pilot.last_flight_at
            ? formatDate(
                pilot.last_flight_at
            )
            : "No flights yet";


    pilotFlights.textContent =
        Number(
            pilot.total_flights
        ) || 0;


    pilotFlightTime.textContent =
        formatFlightTime(
            pilot.total_minutes
        );


    pilotAverageLanding.textContent =
        formatLandingRate(
            pilot.average_landing_rate_fpm
        );


    pilotBestLanding.textContent =
        formatLandingRate(
            pilot.best_landing_rate_fpm
        );


    pilotLandings.textContent =
        Number(
            pilot.total_landings
        ) || 0;


    pilotGoArounds.textContent =
        Number(
            pilot.total_go_arounds
        ) || 0;


    const reviewCount =
        pireps.filter(
            pirep =>
                pirep.requires_review === true
        ).length;


    pilotReviewFlights.textContent =
        reviewCount;


    const latestPirep =
        pireps.length > 0
            ? pireps[0]
            : null;


    pilotLatestScore.textContent =
        latestPirep
            ? formatScore(
                latestPirep.flight_score,
                latestPirep.flight_grade
            )
            : "—";


    accountPilotNumber.textContent =
        pilot.pilot_id || "—";


    accountPilotName.textContent =
        name;


    accountPilotStatus.textContent =
        status;

}


// ============================================================
// RENDER FLIGHT HISTORY
// ============================================================

function renderFlightHistory(
    pireps
) {

    historyCount.textContent =
        `${pireps.length} ${
            pireps.length === 1
                ? "PIREP"
                : "PIREPs"
        }`;


    if (pireps.length === 0) {

        flightHistory.innerHTML =
            `
            <div class="profile-empty">
                This pilot has not submitted any PIREPs yet.
            </div>
            `;

        return;

    }


    flightHistory.innerHTML =
        pireps
            .map(
                pirep => {

                    const route =
                        `${pirep.departure || "—"} → ${pirep.arrival || "—"}`;


                    const aircraft =
                        formatAircraft(
                            pirep.aircraft,
                            pirep.registration
                        );


                    const landing =
                        formatLandingRate(
                            pirep.landing_rate_fpm
                        );


                    const score =
                        formatScore(
                            pirep.flight_score,
                            pirep.flight_grade
                        );


                    const reviewClass =
                        pirep.requires_review === true
                            ? "review"
                            : "accepted";


                    const reviewText =
                        pirep.requires_review === true
                            ? "REVIEW"
                            : (
                                pirep.status ||
                                "SUBMITTED"
                            );


                    return `
                        <div class="history-row">

                            <span class="history-flight">
                                ${escapeHtml(
                                    pirep.flight_number || "—"
                                )}
                            </span>

                            <span>
                                ${escapeHtml(route)}
                            </span>

                            <span>
                                ${escapeHtml(aircraft)}
                            </span>

                            <span>
                                ${escapeHtml(
                                    formatFlightTime(
                                        pirep.block_minutes
                                    )
                                )}
                            </span>

                            <span>
                                ${escapeHtml(landing)}
                            </span>

                            <span class="history-score">
                                ${escapeHtml(score)}
                            </span>

                            <span>
                                <span
                                    class="history-status ${reviewClass}"
                                >
                                    ${escapeHtml(reviewText)}
                                </span>
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
// SHOW PROFILE ERROR
// ============================================================

function showProfileError(message) {

    if (pilotName) {

        pilotName.textContent =
            "Pilot record unavailable";

    }


    if (pilotNumber) {

        pilotNumber.textContent =
            message;

    }


    if (flightHistory) {

        flightHistory.innerHTML =
            `
            <div class="profile-empty">
                ${escapeHtml(message)}
            </div>
            `;

    }

}


// ============================================================
// INITIALISE PILOT PROFILE
// ============================================================

async function initialisePilotProfile() {

    try {

        // ----------------------------------------------------
        // AUTHENTICATION
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


        const user =
            sessionData.session.user;


        // ----------------------------------------------------
        // MANAGEMENT AUTHORISATION
        // ----------------------------------------------------

        const manager =
            await getManagementUser(
                user.id
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
        // READ REQUESTED BMA NUMBER
        // ----------------------------------------------------

        const parameters =
            new URLSearchParams(
                window.location.search
            );


        const requestedPilotId =
            (
                parameters.get("id") ||
                ""
            )
                .trim()
                .toUpperCase();


        if (!requestedPilotId) {

            console.warn(
                "Pilot profile opened without a pilot ID."
            );


            redirectToPilots();

            return;

        }


        console.log(
            "Loading pilot profile:",
            requestedPilotId
        );


        // ----------------------------------------------------
        // LOAD PILOT RECORDS
        // ----------------------------------------------------

        const [
            pilotStatistics,
            pilotDatabaseRecord
        ] =
            await Promise.all([
                loadPilotStatistics(
                    requestedPilotId
                ),
                getPilotDatabaseRecord(
                    requestedPilotId
                )
            ]);


        if (
            !pilotStatistics ||
            !pilotDatabaseRecord
        ) {

            showProfileError(
                `No pilot record was found for ${requestedPilotId}.`
            );


            authGate.classList.add(
                "hidden"
            );


            dashboardApp.classList.remove(
                "hidden"
            );


            return;

        }


        const pireps =
            await loadPilotPireps(
                pilotDatabaseRecord.id
            );


        // ----------------------------------------------------
        // RENDER
        // ----------------------------------------------------

        renderPilotProfile(
            pilotStatistics,
            pireps
        );


        renderFlightHistory(
            pireps
        );


        document.title =
            `${requestedPilotId} ${getPilotName(pilotStatistics)} | British Midland Virtual`;


        // ----------------------------------------------------
        // REVEAL PAGE
        // ----------------------------------------------------

        authGate.classList.add(
            "hidden"
        );


        dashboardApp.classList.remove(
            "hidden"
        );


        console.log(
            "Pilot profile loaded successfully:",
            {
                pilot:
                    requestedPilotId,

                pireps:
                    pireps.length
            }
        );

    }
    catch (error) {

        console.error(
            "Pilot profile initialisation failed:",
            error
        );


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


        showProfileError(
            "Unable to load this pilot record."
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
// START PILOT PROFILE
// ============================================================

initialisePilotProfile();

