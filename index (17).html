// ============================================================
// BRITISH MIDLAND VIRTUAL
// OPERATIONS CONTROL - INDIVIDUAL PIREP
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

const reportReference =
    document.getElementById("reportReference");

const reportError =
    document.getElementById("reportError");


const flightNumber =
    document.getElementById("flightNumber");

const flightStatus =
    document.getElementById("flightStatus");

const departure =
    document.getElementById("departure");

const arrival =
    document.getElementById("arrival");


const pilotNumber =
    document.getElementById("pilotNumber");

const pilotName =
    document.getElementById("pilotName");

const blockTime =
    document.getElementById("blockTime");

const landingRate =
    document.getElementById("landingRate");

const landingAssessment =
    document.getElementById("landingAssessment");

const flightScore =
    document.getElementById("flightScore");

const flightGrade =
    document.getElementById("flightGrade");


const aircraft =
    document.getElementById("aircraft");

const registration =
    document.getElementById("registration");

const airborneTime =
    document.getElementById("airborneTime");

const fuelUsed =
    document.getElementById("fuelUsed");

const maxAltitude =
    document.getElementById("maxAltitude");

const maxGroundSpeed =
    document.getElementById("maxGroundSpeed");


const performanceRating =
    document.getElementById("performanceRating");

const assessmentDetail =
    document.getElementById("assessmentDetail");

const scoreDeduction =
    document.getElementById("scoreDeduction");

const goArounds =
    document.getElementById("goArounds");


const offBlocks =
    document.getElementById("offBlocks");

const takeoff =
    document.getElementById("takeoff");

const landing =
    document.getElementById("landing");

const stand =
    document.getElementById("stand");


const takeoffs =
    document.getElementById("takeoffs");

const landings =
    document.getElementById("landings");

const movementGoArounds =
    document.getElementById("movementGoArounds");

const submittedAt =
    document.getElementById("submittedAt");


const reviewIndicator =
    document.getElementById("reviewIndicator");

const reviewTitle =
    document.getElementById("reviewTitle");

const reviewSubtitle =
    document.getElementById("reviewSubtitle");


// ============================================================
// NAVIGATION
// ============================================================

function redirectToLogin() {

    window.location.replace(
        "/management/"
    );

}


// ============================================================
// URL
// ============================================================

function getPirepId() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    return params
        .get("id")
        ?.trim();

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
// FORMATTERS
// ============================================================

function formatMinutes(value) {

    const minutes =
        Number(value) || 0;


    const hours =
        Math.floor(
            minutes / 60
        );


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


function formatFuel(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "—";

    }


    const fuel =
        Number(value);


    if (
        Number.isNaN(fuel)
    ) {

        return "—";

    }


    return `${fuel.toLocaleString("en-GB")} lb`;

}


function formatAltitude(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "—";

    }


    return `${Number(value).toLocaleString("en-GB")} ft`;

}


function formatSpeed(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "—";

    }


    return `${Number(value).toLocaleString("en-GB")} kt`;

}


function formatDateTime(value) {

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
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }
    ).format(date);

}


function formatTime(value) {

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
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }
    ).format(date);

}


// ============================================================
// LOAD PIREP
// ============================================================

async function getPirep(id) {

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
                off_blocks,
                takeoff,
                landing,
                stand,
                block_minutes,
                airborne_minutes,
                fuel_used_lb,
                landing_rate_fpm,
                takeoffs,
                landings,
                go_arounds,
                max_altitude_ft,
                max_ground_speed_kt,
                status,
                submitted_at,
                created_at,
                flight_score,
                flight_grade,
                performance_rating,
                landing_assessment,
                score_deduction,
                requires_review
            `)
            .eq(
                "id",
                id
            )
            .maybeSingle();


    if (error) {

        console.error(
            "Unable to retrieve PIREP:",
            error
        );

        throw error;

    }


    return data;

}


// ============================================================
// LOAD PILOT
// ============================================================

async function getPilot(pilotUuid) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("pilots")
            .select(
                "id, pilot_id, nickname"
            )
            .eq(
                "id",
                pilotUuid
            )
            .maybeSingle();


    if (error) {

        console.error(
            "Unable to retrieve pilot:",
            error
        );

        return null;

    }


    return data;

}


// ============================================================
// RENDER REVIEW STATUS
// ============================================================

function renderReviewStatus(
    requiresReview
) {

    if (requiresReview === true) {

        reviewIndicator.className =
            "review-indicator review";


        reviewTitle.textContent =
            "REVIEW REQUIRED";


        reviewSubtitle.textContent =
            "MANAGEMENT ATTENTION";


        return;

    }


    reviewIndicator.className =
        "review-indicator clear";


    reviewTitle.textContent =
        "RECORD CLEAR";


    reviewSubtitle.textContent =
        "NO REVIEW REQUIRED";

}


// ============================================================
// RENDER PIREP
// ============================================================

function renderPirep(
    pirep,
    pilot
) {

    const flight =
        pirep.flight_number ||
        "Unknown Flight";


    const status =
        pirep.status ||
        "Submitted";


    flightNumber.textContent =
        flight;


    flightStatus.textContent =
        status;


    departure.textContent =
        pirep.departure ||
        "—";


    arrival.textContent =
        pirep.arrival ||
        "—";


    // --------------------------------------------------------
    // PILOT
    // --------------------------------------------------------

    if (pilot) {

        pilotNumber.textContent =
            pilot.pilot_id ||
            "—";


        pilotName.textContent =
            pilot.nickname?.trim() ||
            "Unnamed Pilot";

    }
    else {

        pilotNumber.textContent =
            "Unknown";


        pilotName.textContent =
            "Pilot record unavailable";

    }


    // --------------------------------------------------------
    // PRIMARY STATS
    // --------------------------------------------------------

    blockTime.textContent =
        formatMinutes(
            pirep.block_minutes
        );


    landingRate.textContent =
        formatLanding(
            pirep.landing_rate_fpm
        );


    landingAssessment.textContent =
        pirep.landing_assessment ||
        "No assessment";


    if (
        pirep.flight_score !== null &&
        pirep.flight_score !== undefined
    ) {

        flightScore.textContent =
            pirep.flight_score;

    }
    else {

        flightScore.textContent =
            "—";

    }


    flightGrade.textContent =
        pirep.flight_grade
            ? `GRADE ${pirep.flight_grade}`
            : "No grade";


    // --------------------------------------------------------
    // AIRCRAFT
    // --------------------------------------------------------

    aircraft.textContent =
        pirep.aircraft ||
        "—";


    registration.textContent =
        pirep.registration ||
        "—";


    airborneTime.textContent =
        formatMinutes(
            pirep.airborne_minutes
        );


    fuelUsed.textContent =
        formatFuel(
            pirep.fuel_used_lb
        );


    maxAltitude.textContent =
        formatAltitude(
            pirep.max_altitude_ft
        );


    maxGroundSpeed.textContent =
        formatSpeed(
            pirep.max_ground_speed_kt
        );


    // --------------------------------------------------------
    // PERFORMANCE
    // --------------------------------------------------------

    performanceRating.textContent =
        pirep.performance_rating ||
        "—";


    assessmentDetail.textContent =
        pirep.landing_assessment ||
        "—";


    if (
        pirep.score_deduction !== null &&
        pirep.score_deduction !== undefined
    ) {

        scoreDeduction.textContent =
            `${pirep.score_deduction} pts`;

    }
    else {

        scoreDeduction.textContent =
            "—";

    }


    goArounds.textContent =
        Number(
            pirep.go_arounds
        ) || 0;


    // --------------------------------------------------------
    // TIMELINE
    // --------------------------------------------------------

    offBlocks.textContent =
        formatTime(
            pirep.off_blocks
        );


    takeoff.textContent =
        formatTime(
            pirep.takeoff
        );


    landing.textContent =
        formatTime(
            pirep.landing
        );


    stand.textContent =
        formatTime(
            pirep.stand
        );


    // --------------------------------------------------------
    // MOVEMENT
    // --------------------------------------------------------

    takeoffs.textContent =
        Number(
            pirep.takeoffs
        ) || 0;


    landings.textContent =
        Number(
            pirep.landings
        ) || 0;


    movementGoArounds.textContent =
        Number(
            pirep.go_arounds
        ) || 0;


    submittedAt.textContent =
        formatDateTime(
            pirep.submitted_at
        );


    // --------------------------------------------------------
    // REVIEW
    // --------------------------------------------------------

    renderReviewStatus(
        pirep.requires_review
    );


    // --------------------------------------------------------
    // REFERENCE
    // --------------------------------------------------------

    reportReference.textContent =
        `PIREP ${String(pirep.id).slice(0, 8).toUpperCase()}`;


    document.title =
        `${flight} | British Midland Virtual`;

}


// ============================================================
// ERROR
// ============================================================

function showError(message) {

    reportError.textContent =
        message;


    reportError.classList.remove(
        "hidden"
    );


    flightNumber.textContent =
        "Report unavailable";


    flightStatus.textContent =
        "ERROR";

}


// ============================================================
// REVEAL
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
// INITIALISE
// ============================================================

async function initialisePirep() {

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
        // PIREP ID
        // ----------------------------------------------------

        const pirepId =
            getPirepId();


        if (!pirepId) {

            showError(
                "No PIREP reference was supplied."
            );


            revealPage();

            return;

        }


        console.log(
            "Loading PIREP:",
            pirepId
        );


        // ----------------------------------------------------
        // PIREP
        // ----------------------------------------------------

        const pirep =
            await getPirep(
                pirepId
            );


        if (!pirep) {

            showError(
                "The requested PIREP could not be found."
            );


            revealPage();

            return;

        }


        // ----------------------------------------------------
        // PILOT
        // ----------------------------------------------------

        const pilot =
            await getPilot(
                pirep.pilot_id
            );


        // ----------------------------------------------------
        // RENDER
        // ----------------------------------------------------

        renderPirep(
            pirep,
            pilot
        );


        console.log(
            "PIREP loaded successfully:",
            {
                flight:
                    pirep.flight_number,

                pilot:
                    pilot?.pilot_id,

                review:
                    pirep.requires_review
            }
        );


        revealPage();

    }
    catch (error) {

        console.error(
            "PIREP initialisation failed:",
            error
        );


        showError(
            "Unable to load this ACARS flight report."
        );


        revealPage();

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

initialisePirep();
