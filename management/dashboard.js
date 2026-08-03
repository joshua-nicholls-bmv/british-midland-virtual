// ============================================================
// BRITISH MIDLAND VIRTUAL
// OPERATIONS CONTROL DASHBOARD
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

const welcomeHeading =
    document.getElementById("welcomeHeading");

const signOutButton =
    document.getElementById("signOutButton");


// Statistics

const activePilotsElement =
    document.getElementById("activePilots");

const totalFlightsElement =
    document.getElementById("totalFlights");

const flightHoursElement =
    document.getElementById("flightHours");

const reviewCountElement =
    document.getElementById("reviewCount");


// Operations

const recentOperationsElement =
    document.getElementById("recentOperations");

const reviewQueueElement =
    document.getElementById("reviewQueue");


// ------------------------------------------------------------
// REDIRECT
// ------------------------------------------------------------

function redirectToLogin() {

    window.location.replace(
        "/management/"
    );

}


// ------------------------------------------------------------
// GREETING
// ------------------------------------------------------------

function setGreeting(name) {

    const hour =
        new Date().getHours();

    let greeting =
        "Good evening";


    if (hour < 12) {

        greeting =
            "Good morning";

    }
    else if (hour < 18) {

        greeting =
            "Good afternoon";

    }


    welcomeHeading.textContent =
        `${greeting}, ${name}.`;

}


// ------------------------------------------------------------
// MANAGEMENT VERIFICATION
// ------------------------------------------------------------

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


// ============================================================
// LOAD PILOT LOOKUP
// ============================================================

async function loadPilotLookup() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("pilots")
            .select(
                "id, pilot_id, nickname"
            );


    if (error) {

        console.error(
            "Unable to load pilot lookup:",
            error
        );

        throw error;

    }


    const lookup =
        new Map();


    for (const pilot of data || []) {

        lookup.set(
            pilot.id,
            {
                pilotId:
                    pilot.pilot_id || "—",

                nickname:
                    pilot.nickname || "Unknown Pilot"
            }
        );

    }


    return lookup;

}


// ============================================================
// LOAD DASHBOARD STATISTICS
// ============================================================

async function loadDashboardStatistics() {

    console.log(
        "Loading British Midland ACARS statistics..."
    );


    try {

        // ----------------------------------------------------
        // ACTIVE PILOTS
        // ----------------------------------------------------

        const {
            count: pilotCount,
            error: pilotError
        } =
            await supabaseClient
                .from("pilots")
                .select(
                    "*",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .eq(
                    "status",
                    "active"
                );


        if (pilotError) {

            throw pilotError;

        }


        // ----------------------------------------------------
        // PIREP SUMMARY
        // ----------------------------------------------------

        const {
            data: pireps,
            error: pirepError
        } =
            await supabaseClient
                .from("pireps")
                .select(
                    "block_minutes, requires_review"
                );


        if (pirepError) {

            throw pirepError;

        }


        const pirepData =
            pireps || [];


        const totalFlights =
            pirepData.length;


        const totalMinutes =
            pirepData.reduce(
                (total, pirep) => {

                    return (
                        total +
                        (
                            Number(
                                pirep.block_minutes
                            ) || 0
                        )
                    );

                },
                0
            );


        const reviewCount =
            pirepData.filter(
                pirep =>
                    pirep.requires_review === true
            ).length;


        // ----------------------------------------------------
        // UPDATE CARDS
        // ----------------------------------------------------

        activePilotsElement.textContent =
            pilotCount ?? 0;


        totalFlightsElement.textContent =
            totalFlights;


        flightHoursElement.textContent =
            formatFlightTime(
                totalMinutes
            );


        reviewCountElement.textContent =
            reviewCount;


        console.log(
            "ACARS statistics loaded:",
            {
                activePilots:
                    pilotCount ?? 0,

                totalFlights:
                    totalFlights,

                totalMinutes:
                    totalMinutes,

                requiresReview:
                    reviewCount
            }
        );

    }
    catch (error) {

        console.error(
            "Unable to load ACARS statistics:",
            error
        );


        activePilotsElement.textContent =
            "ERR";

        totalFlightsElement.textContent =
            "ERR";

        flightHoursElement.textContent =
            "ERR";

        reviewCountElement.textContent =
            "ERR";

    }

}


// ============================================================
// RECENT OPERATIONS
// ============================================================

async function loadRecentOperations(
    pilotLookup
) {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("pireps")
                .select(`
                    id,
                    pilot_id,
                    flight_number,
                    departure,
                    arrival,
                    aircraft,
                    registration,
                    landing_rate_fpm,
                    flight_score,
                    flight_grade,
                    submitted_at
                `)
                .order(
                    "submitted_at",
                    {
                        ascending: false
                    }
                )
                .limit(8);


        if (error) {

            throw error;

        }


        const pireps =
            data || [];


        if (pireps.length === 0) {

            recentOperationsElement.innerHTML =
                `
                <div class="empty-state">
                    No submitted PIREPs found.
                </div>
                `;

            return;

        }


        recentOperationsElement.innerHTML =
            pireps
                .map(
                    pirep => {

                        const pilot =
                            pilotLookup.get(
                                pirep.pilot_id
                            );


                        const pilotId =
                            pilot
                                ? pilot.pilotId
                                : "—";


                        const nickname =
                            pilot
                                ? pilot.nickname
                                : "Unknown Pilot";


                        const pilotDisplay =
                            `
                            <strong>
                                ${escapeHtml(pilotId)}
                            </strong>
                            <br>
                            <span style="color:#697582;font-size:8px;">
                                ${escapeHtml(nickname)}
                            </span>
                            `;


                        const route =
                            `${escapeHtml(pirep.departure)} → ${escapeHtml(pirep.arrival)}`;


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


                        return `
                            <div class="table-row">

                                <span>
                                    ${pilotDisplay}
                                </span>

                                <span>
                                    <strong>
                                        ${escapeHtml(pirep.flight_number)}
                                    </strong>
                                </span>

                                <span>
                                    ${route}
                                </span>

                                <span>
                                    ${escapeHtml(aircraft)}
                                </span>

                                <span>
                                    ${escapeHtml(landing)}
                                </span>

                                <span>
                                    <strong>
                                        ${escapeHtml(score)}
                                    </strong>
                                </span>

                            </div>
                        `;

                    }
                )
                .join("");


        console.log(
            "Recent Operations loaded:",
            pireps.length
        );

    }
    catch (error) {

        console.error(
            "Unable to load Recent Operations:",
            error
        );


        recentOperationsElement.innerHTML =
            `
            <div class="empty-state">
                Unable to load recent operations.
            </div>
            `;

    }

}


// ============================================================
// REVIEW QUEUE
// ============================================================

async function loadReviewQueue(
    pilotLookup
) {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("pireps")
                .select(`
                    id,
                    pilot_id,
                    flight_number,
                    departure,
                    arrival,
                    landing_rate_fpm,
                    flight_score,
                    flight_grade,
                    performance_rating,
                    landing_assessment,
                    submitted_at
                `)
                .eq(
                    "requires_review",
                    true
                )
                .order(
                    "submitted_at",
                    {
                        ascending: false
                    }
                )
                .limit(5);


        if (error) {

            throw error;

        }


        const reviews =
            data || [];


        // ----------------------------------------------------
        // NO REVIEWS
        // ----------------------------------------------------

        if (reviews.length === 0) {

            reviewQueueElement.innerHTML =
                `
                <div class="review-zero">

                    <strong>0</strong>

                    <span>
                        No flights require review
                    </span>

                </div>
                `;

            return;

        }


        // ----------------------------------------------------
        // REVIEW FLIGHTS
        // ----------------------------------------------------

        reviewQueueElement.innerHTML =
            `
            <div style="width:100%;">

                ${reviews
                    .map(
                        pirep => {

                            const pilot =
                                pilotLookup.get(
                                    pirep.pilot_id
                                );


                            const pilotId =
                                pilot
                                    ? pilot.pilotId
                                    : "—";


                            const nickname =
                                pilot
                                    ? pilot.nickname
                                    : "Unknown Pilot";


                            const landing =
                                formatLandingRate(
                                    pirep.landing_rate_fpm
                                );


                            const score =
                                formatScore(
                                    pirep.flight_score,
                                    pirep.flight_grade
                                );


                            return `
                                <div
                                    style="
                                        padding:16px 20px;
                                        border-bottom:1px solid #eeeeeb;
                                    "
                                >

                                    <div
                                        style="
                                            display:flex;
                                            justify-content:space-between;
                                            gap:15px;
                                            align-items:flex-start;
                                        "
                                    >

                                        <div>

                                            <span
                                                style="
                                                    color:#d02823;
                                                    font-size:7px;
                                                    font-weight:700;
                                                    letter-spacing:1px;
                                                "
                                            >
                                                REVIEW REQUIRED
                                            </span>

                                            <strong
                                                style="
                                                    display:block;
                                                    margin-top:5px;
                                                    font-size:12px;
                                                    color:#001a3a;
                                                "
                                            >
                                                ${escapeHtml(pirep.flight_number)}
                                            </strong>

                                        </div>


                                        <strong
                                            style="
                                                font-size:12px;
                                                color:#d02823;
                                            "
                                        >
                                            ${escapeHtml(score)}
                                        </strong>

                                    </div>


                                    <div
                                        style="
                                            margin-top:10px;
                                            color:#697582;
                                            font-size:8px;
                                            line-height:1.6;
                                        "
                                    >

                                        ${escapeHtml(pilotId)}
                                        ·
                                        ${escapeHtml(nickname)}

                                        <br>

                                        ${escapeHtml(pirep.departure)}
                                        →
                                        ${escapeHtml(pirep.arrival)}

                                        <br>

                                        Landing:
                                        ${escapeHtml(landing)}

                                    </div>

                                </div>
                            `;

                        }
                    )
                    .join("")}

            </div>
            `;


        console.log(
            "Review Queue loaded:",
            reviews.length
        );

    }
    catch (error) {

        console.error(
            "Unable to load Review Queue:",
            error
        );


        reviewQueueElement.innerHTML =
            `
            <div class="review-zero">

                <strong>!</strong>

                <span>
                    Unable to load review queue
                </span>

            </div>
            `;

    }

}


// ============================================================
// LOAD OPERATIONS DATA
// ============================================================

async function loadOperationsData() {

    try {

        /*
         * Load pilots once and use the resulting lookup
         * for both Recent Operations and Review Queue.
         */

        const pilotLookup =
            await loadPilotLookup();


        await Promise.all([
            loadDashboardStatistics(),
            loadRecentOperations(
                pilotLookup
            ),
            loadReviewQueue(
                pilotLookup
            )
        ]);


        console.log(
            "Operations Control data loaded successfully."
        );

    }
    catch (error) {

        console.error(
            "Unable to initialise Operations data:",
            error
        );

    }

}


// ============================================================
// INITIALISE DASHBOARD
// ============================================================

async function initialiseDashboard() {

    try {

        // ----------------------------------------------------
        // AUTHENTICATED SESSION
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


        // ----------------------------------------------------
        // MANAGEMENT SESSION CONFIRMED
        // ----------------------------------------------------

        managementName.textContent =
            manager.display_name;


        managementRole.textContent =
            manager.role;


        setGreeting(
            manager.display_name
        );


        console.log(
            "Management session confirmed:",
            {
                displayName:
                    manager.display_name,

                role:
                    manager.role
            }
        );


        // ----------------------------------------------------
        // LOAD ACARS OPERATIONS
        // ----------------------------------------------------

        await loadOperationsData();


        // ----------------------------------------------------
        // REVEAL DASHBOARD
        // ----------------------------------------------------

        authGate.classList.add(
            "hidden"
        );


        dashboardApp.classList.remove(
            "hidden"
        );

    }
    catch (error) {

        console.error(
            "Dashboard initialisation failed:",
            error
        );


        redirectToLogin();

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


// ------------------------------------------------------------
// SIGN OUT BUTTON
// ------------------------------------------------------------

if (signOutButton) {

    signOutButton.addEventListener(
        "click",
        signOut
    );

}


// ------------------------------------------------------------
// AUTH STATE
// ------------------------------------------------------------

supabaseClient.auth.onAuthStateChange(
    (event) => {

        if (event === "SIGNED_OUT") {

            redirectToLogin();

        }

    }
);


// ============================================================
// START OPERATIONS CONTROL
// ============================================================

initialiseDashboard();
