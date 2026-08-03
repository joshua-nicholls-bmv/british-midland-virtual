// ============================================================
// BRITISH MIDLAND VIRTUAL
// OPERATIONS CONTROL - FLIGHT REVIEW
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


const reviewIndicator =
    document.getElementById("reviewIndicator");

const reviewIndicatorTitle =
    document.getElementById("reviewIndicatorTitle");

const reviewIndicatorDetail =
    document.getElementById("reviewIndicatorDetail");


const reviewAlert =
    document.getElementById("reviewAlert");

const reviewReason =
    document.getElementById("reviewReason");

const alertScore =
    document.getElementById("alertScore");


const pilotNumber =
    document.getElementById("pilotNumber");

const pilotName =
    document.getElementById("pilotName");

const blockTime =
    document.getElementById("blockTime");

const landingRate =
    document.getElementById("landingRate");

const landingSummary =
    document.getElementById("landingSummary");

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

const landingAssessment =
    document.getElementById("landingAssessment");

const scoreDeduction =
    document.getElementById("scoreDeduction");

const assessmentReviewStatus =
    document.getElementById("assessmentReviewStatus");


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

const goArounds =
    document.getElementById("goArounds");

const submittedAt =
    document.getElementById("submittedAt");


const managementReviewBadge =
    document.getElementById("managementReviewBadge");

const reviewPerformance =
    document.getElementById("reviewPerformance");

const reviewLanding =
    document.getElementById("reviewLanding");

const reviewDeduction =
    document.getElementById("reviewDeduction");

const reviewGrade =
    document.getElementById("reviewGrade");


// ============================================================
// NAVIGATION
// ============================================================

function redirectToLogin() {

    window.location.replace(
        "/management/"
    );

}


// ============================================================
// ROLE DISPLAY
// ============================================================

function formatRole(role) {

    if (!role) {
        return "MANAGEMENT";
    }


    return role
        .replace(/_/g, " ")
        .toUpperCase();

}


// ============================================================
// PIREP ID
// ============================================================

function getPirepId() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const id =
        params.get("id");


    return id
        ? id.trim()
        : null;

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

    if (
        value === null ||
        value === undefined
    ) {

        return "—";

    }


    const total =
        Number(value);


    if (Number.isNaN(total)) {
        return "—";
    }


    const hours =
        Math.floor(
            total / 60
        );


    const minutes =
        total % 60;


    return `${hours}h ${minutes}m`;

}


function formatLandingRate(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "—";

    }


    const number =
        Number(value);


    if (Number.isNaN(number)) {
        return "—";
    }


    return `${number} fpm`;

}


function formatFuel(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "—";

    }


    const number =
        Number(value);


    if (Number.isNaN(number)) {
        return "—";
    }


    return `${number.toLocaleString("en-GB")} lb`;

}


function formatAltitude(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "—";

    }


    const number =
        Number(value);


    if (Number.isNaN(number)) {
        return "—";
    }


    return `${number.toLocaleString("en-GB")} ft`;

}


function formatSpeed(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "—";

    }


    const number =
        Number(value);


    if (Number.isNaN(number)) {
        return "—";
    }


    return `${number.toLocaleString("en-GB")} kt`;

}


function formatScore(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "—";

    }


    return `${value}%`;

}


function formatDeduction(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "—";

    }


    const number =
        Number(value);


    if (Number.isNaN(number)) {
        return "—";
    }


    return `${number} pts`;

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
            hour12: false,
            timeZone: "UTC"
        }
    ).format(date) + "Z";

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


// ============================================================
// LOAD PIREP
// ============================================================

async function loadPirep(pirepId) {

    console.log(
        "Loading flight review:",
        pirepId
    );


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
                pirepId
            )
            .maybeSingle();


    if (error) {

        console.error(
            "Unable to load PIREP:",
            error
        );


        throw error;

    }


    return data;

}


// ============================================================
// LOAD PILOT
// ============================================================

async function loadPilot(pilotUuid) {

    if (!pilotUuid) {
        return null;
    }


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
                "id",
                pilotUuid
            )
            .maybeSingle();


    if (error) {

        console.error(
            "Unable to load pilot:",
            error
        );


        return null;

    }


    return data;

}


// ============================================================
// REVIEW REASON
// ============================================================

function buildReviewReason(pirep) {

    const reasons = [];


    if (pirep.performance_rating) {

        reasons.push(
            pirep.performance_rating
        );

    }


    if (pirep.landing_assessment) {

        reasons.push(
            pirep.landing_assessment
        );

    }


    if (
        Number(
            pirep.score_deduction
        ) > 0
    ) {

        reasons.push(
            `${pirep.score_deduction} point score deduction`
        );

    }


    if (
        Number(
            pirep.go_arounds
        ) > 0
    ) {

        const count =
            Number(
                pirep.go_arounds
            );


        reasons.push(
            `${count} go-around${count === 1 ? "" : "s"} recorded`
        );

    }


    if (!reasons.length) {

        return "This flight has been flagged by the ACARS assessment system.";

    }


    return reasons.join(" • ");

}


// ============================================================
// REVIEW STATUS
// ============================================================

function renderReviewStatus(pirep) {

    const requiresReview =
        pirep.requires_review === true;


    if (requiresReview) {

        reviewIndicator.className =
            "review-indicator review";


        reviewIndicatorTitle.textContent =
            "REVIEW REQUIRED";


        reviewIndicatorDetail.textContent =
            "MANAGEMENT ATTENTION";


        assessmentReviewStatus.textContent =
            "Requires Review";


        managementReviewBadge.textContent =
            "REVIEW REQUIRED";


        managementReviewBadge.className =
            "management-review-badge review";


        reviewAlert.classList.remove(
            "hidden"
        );


        reviewReason.textContent =
            buildReviewReason(
                pirep
            );


        alertScore.textContent =
            formatScore(
                pirep.flight_score
            );


        return;

    }


    reviewIndicator.className =
        "review-indicator clear";


    reviewIndicatorTitle.textContent =
        "RECORD CLEAR";


    reviewIndicatorDetail.textContent =
        "NO REVIEW REQUIRED";


    assessmentReviewStatus.textContent =
        "Clear";


    managementReviewBadge.textContent =
        "RECORD CLEAR";


    managementReviewBadge.className =
        "management-review-badge clear";


    reviewAlert.classList.add(
        "hidden"
    );

}


// ============================================================
// RENDER REPORT
// ============================================================

function renderReport(
    pirep,
    pilot
) {

    // --------------------------------------------------------
    // HEADER
    // --------------------------------------------------------

    flightNumber.textContent =
        pirep.flight_number ||
        "Unknown Flight";


    flightStatus.textContent =
        pirep.status ||
        "Submitted";


    departure.textContent =
        pirep.departure ||
        "—";


    arrival.textContent =
        pirep.arrival ||
        "—";


    reportReference.textContent =
        `PIREP ${String(
            pirep.id
        )
            .slice(0, 8)
            .toUpperCase()}`;


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
            "UNKNOWN";


        pilotName.textContent =
            "Pilot record unavailable";

    }


    // --------------------------------------------------------
    // PRIMARY STATISTICS
    // --------------------------------------------------------

    blockTime.textContent =
        formatMinutes(
            pirep.block_minutes
        );


    landingRate.textContent =
        formatLandingRate(
            pirep.landing_rate_fpm
        );


    landingSummary.textContent =
        pirep.landing_assessment ||
        "No landing assessment";


    flightScore.textContent =
        formatScore(
            pirep.flight_score
        );


    flightGrade.textContent =
        pirep.flight_grade
            ? `GRADE ${pirep.flight_grade}`
            : "No grade";


    // --------------------------------------------------------
    // OPERATIONAL RECORD
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
    // ASSESSMENT
    // --------------------------------------------------------

    performanceRating.textContent =
        pirep.performance_rating ||
        "—";


    landingAssessment.textContent =
        pirep.landing_assessment ||
        "—";


    scoreDeduction.textContent =
        formatDeduction(
            pirep.score_deduction
        );


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
    // MOVEMENT DATA
    // --------------------------------------------------------

    takeoffs.textContent =
        Number(
            pirep.takeoffs
        ) || 0;


    landings.textContent =
        Number(
            pirep.landings
        ) || 0;


    goArounds.textContent =
        Number(
            pirep.go_arounds
        ) || 0;


    submittedAt.textContent =
        formatDateTime(
            pirep.submitted_at
        );


    // --------------------------------------------------------
    // MANAGEMENT REVIEW
    // --------------------------------------------------------

    reviewPerformance.textContent =
        pirep.performance_rating ||
        "—";


    reviewLanding.textContent =
        pirep.landing_assessment ||
        formatLandingRate(
            pirep.landing_rate_fpm
        );


    reviewDeduction.textContent =
        formatDeduction(
            pirep.score_deduction
        );


    reviewGrade.textContent =
        pirep.flight_grade
            ? `Grade ${pirep.flight_grade}`
            : "—";


    renderReviewStatus(
        pirep
    );


    // --------------------------------------------------------
    // DOCUMENT TITLE
    // --------------------------------------------------------

    document.title =
        `${pirep.flight_number || "Flight"} Review | British Midland Virtual`;

}


// ============================================================
// ERROR
// ============================================================

function showError(message) {

    if (reportError) {

        reportError.textContent =
            message;


        reportError.classList.remove(
            "hidden"
        );

    }

}


// ============================================================
// REVEAL APPLICATION
// ============================================================

function revealApplication() {

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
// INITIALISE REPORT
// ============================================================

async function initialiseReport() {

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
            formatRole(
                manager.role
            );


        // ----------------------------------------------------
        // PIREP REFERENCE
        // ----------------------------------------------------

        const pirepId =
            getPirepId();


        if (!pirepId) {

            revealApplication();


            showError(
                "No PIREP reference was supplied. Return to the Review Centre and select a flight."
            );


            flightNumber.textContent =
                "Report unavailable";


            return;

        }


        // ----------------------------------------------------
        // LOAD PIREP
        // ----------------------------------------------------

        const pirep =
            await loadPirep(
                pirepId
            );


        if (!pirep) {

            revealApplication();


            showError(
                "The requested PIREP could not be found."
            );


            flightNumber.textContent =
                "Report unavailable";


            return;

        }


        // ----------------------------------------------------
        // LOAD PILOT
        // ----------------------------------------------------

        const pilot =
            await loadPilot(
                pirep.pilot_id
            );


        // ----------------------------------------------------
        // RENDER
        // ----------------------------------------------------

        renderReport(
            pirep,
            pilot
        );


        console.log(
            "Flight review loaded:",
            {
                pirep:
                    pirep.id,

                flight:
                    pirep.flight_number,

                pilot:
                    pilot?.pilot_id,

                requiresReview:
                    pirep.requires_review
            }
        );


        revealApplication();

    }
    catch (error) {

        console.error(
            "Flight Review initialisation failed:",
            error
        );


        revealApplication();


        showError(
            "Operations Control could not load this flight report."
        );


        flightNumber.textContent =
            "Report unavailable";

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

initialiseReport();
