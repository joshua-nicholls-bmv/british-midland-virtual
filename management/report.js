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
// STATE
// ------------------------------------------------------------

let currentPirep = null;
let currentPilot = null;
let currentManager = null;
let currentAuthUser = null;
let existingReview = null;
let reviewSubmitting = false;


// ------------------------------------------------------------
// ELEMENTS
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

const reviewFormArea =
    document.getElementById("reviewFormArea");

const reviewerName =
    document.getElementById("reviewerName");

const managementNotes =
    document.getElementById("managementNotes");

const notesCounter =
    document.getElementById("notesCounter");

const reviewActionMessage =
    document.getElementById("reviewActionMessage");

const clearFlightButton =
    document.getElementById("clearFlightButton");

const advisoryButton =
    document.getElementById("advisoryButton");

const rejectButton =
    document.getElementById("rejectButton");

const completedReviewArea =
    document.getElementById("completedReviewArea");

const completedDecision =
    document.getElementById("completedDecision");

const completedReviewer =
    document.getElementById("completedReviewer");

const completedDate =
    document.getElementById("completedDate");

const completedDecisionDetail =
    document.getElementById("completedDecisionDetail");

const completedNotes =
    document.getElementById("completedNotes");


// ============================================================
// NAVIGATION
// ============================================================

function redirectToLogin() {

    window.location.replace(
        "/management/"
    );

}


// ============================================================
// GENERAL FORMATTERS
// ============================================================

function formatRole(role) {

    if (!role) {
        return "MANAGEMENT";
    }

    return role
        .replace(/_/g, " ")
        .toUpperCase();

}


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
        Math.floor(total / 60);

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
// REVIEW DECISION FORMATTER
// ============================================================

function formatDecision(decision) {

    switch (decision) {

        case "cleared":
            return "Flight Cleared";

        case "advisory":
            return "Pilot Advisory";

        case "rejected":
            return "PIREP Rejected";

        default:
            return "Management Review";

    }

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
// MANAGEMENT ACCESS
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
// LOAD PIREP
// ============================================================

async function loadPirep(pirepId) {

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
// LOAD EXISTING REVIEW
// ============================================================

async function loadExistingReview(pirepId) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("pirep_reviews")
            .select(`
                id,
                pirep_id,
                reviewer_id,
                decision,
                management_notes,
                created_at
            `)
            .eq(
                "pirep_id",
                pirepId
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            )
            .limit(1)
            .maybeSingle();

    if (error) {

        console.error(
            "Unable to load review history:",
            error
        );

        throw error;

    }

    return data;

}


// ============================================================
// LOAD REVIEWER NAME
// ============================================================

async function loadReviewerName(userId) {

    if (!userId) {
        return "Management";
    }

    const {
        data,
        error
    } =
        await supabaseClient
            .from("management_users")
            .select(
                "display_name"
            )
            .eq(
                "user_id",
                userId
            )
            .maybeSingle();

    if (
        error ||
        !data
    ) {
        return "Management";
    }

    return data.display_name ||
        "Management";

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
// RENDER REVIEW STATUS
// ============================================================

function renderReviewStatus(pirep) {

    if (
        pirep.requires_review === true
    ) {

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
        "REVIEW COMPLETE";

    reviewIndicatorDetail.textContent =
        "MANAGEMENT RESOLVED";

    assessmentReviewStatus.textContent =
        "Reviewed";

    managementReviewBadge.textContent =
        "REVIEW COMPLETE";

    managementReviewBadge.className =
        "management-review-badge clear";

    reviewAlert.classList.add(
        "hidden"
    );

}


// ============================================================
// RENDER FLIGHT
// ============================================================

function renderReport(
    pirep,
    pilot
) {

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


    document.title =
        `${pirep.flight_number || "Flight"} Review | British Midland Virtual`;

}


// ============================================================
// RENDER ACTIVE REVIEW FORM
// ============================================================

function renderActiveReviewForm() {

    reviewFormArea.classList.remove(
        "hidden"
    );

    completedReviewArea.classList.add(
        "hidden"
    );

    reviewerName.textContent =
        currentManager?.display_name ||
        "Management";

}


// ============================================================
// RENDER COMPLETED REVIEW
// ============================================================

async function renderCompletedReview(review) {

    reviewFormArea.classList.add(
        "hidden"
    );

    completedReviewArea.classList.remove(
        "hidden"
    );


    const reviewer =
        await loadReviewerName(
            review.reviewer_id
        );


    const decisionLabel =
        formatDecision(
            review.decision
        );


    completedDecision.textContent =
        decisionLabel;

    completedReviewer.textContent =
        reviewer;

    completedDate.textContent =
        formatDateTime(
            review.created_at
        );

    completedDecisionDetail.textContent =
        decisionLabel;

    completedNotes.textContent =
        review.management_notes?.trim() ||
        "No management notes were recorded.";

}


// ============================================================
// ACTION MESSAGE
// ============================================================

function showActionMessage(
    message,
    type = ""
) {

    reviewActionMessage.textContent =
        message;

    reviewActionMessage.className =
        "review-action-message";

    if (type) {

        reviewActionMessage.classList.add(
            type
        );

    }

}


function hideActionMessage() {

    reviewActionMessage.textContent =
        "";

    reviewActionMessage.className =
        "review-action-message hidden";

}


// ============================================================
// BUTTON STATE
// ============================================================

function setReviewButtonsDisabled(
    disabled
) {

    clearFlightButton.disabled =
        disabled;

    advisoryButton.disabled =
        disabled;

    rejectButton.disabled =
        disabled;

}


// ============================================================
// CONFIRMATION TEXT
// ============================================================

function getConfirmationText(
    decision
) {

    switch (decision) {

        case "cleared":

            return "Clear this flight and remove it from the active Review Centre queue?";

        case "advisory":

            return "Record a Pilot Advisory and resolve this flight review?";

        case "rejected":

            return "Reject this PIREP and resolve the management review?";

        default:

            return "Submit this management review?";

    }

}


// ============================================================
// VALIDATE REVIEW
// ============================================================

function validateReview(decision) {

    const notes =
        managementNotes.value.trim();


    if (
        decision === "advisory" &&
        !notes
    ) {

        showActionMessage(
            "Please enter management notes explaining the pilot advisory.",
            "error"
        );

        managementNotes.focus();

        return false;

    }


    if (
        decision === "rejected" &&
        !notes
    ) {

        showActionMessage(
            "Please enter management notes explaining why the PIREP is being rejected.",
            "error"
        );

        managementNotes.focus();

        return false;

    }


    return true;

}


// ============================================================
// CREATE REVIEW AUDIT RECORD
// ============================================================

async function createReviewRecord(
    decision,
    notes
) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("pirep_reviews")
            .insert({
                pirep_id:
                    currentPirep.id,

                reviewer_id:
                    currentAuthUser.id,

                decision:
                    decision,

                management_notes:
                    notes || null
            })
            .select(`
                id,
                pirep_id,
                reviewer_id,
                decision,
                management_notes,
                created_at
            `)
            .single();


    if (error) {

        console.error(
            "Unable to create review record:",
            error
        );

        throw error;

    }


    return data;

}


// ============================================================
// CLEAR ACTIVE REVIEW FLAG
// ============================================================

async function clearReviewFlag() {

    console.log(
        "Attempting to clear review flag for PIREP:",
        currentPirep.id
    );

    const { data, error } = await supabaseClient
        .from("pireps")
        .update({
            requires_review: false
        })
        .eq("id", currentPirep.id)
        .select("id, flight_number, requires_review");

    console.log(
        "Review flag update result:",
        {
            data,
            error
        }
    );

    if (error) {

        console.error(
            "Unable to clear requires_review:",
            error
        );

        throw error;
    }

    if (!data || data.length === 0) {

        throw new Error(
            "PIREP update completed but no row was returned. " +
            "PIREP ID: " +
            currentPirep.id
        );
    }

    if (data[0].requires_review !== false) {

        throw new Error(
            "PIREP was returned but requires_review was not cleared."
        );
    }

    currentPirep.requires_review = false;

    console.log(
        "Review flag successfully cleared:",
        data[0]
    );

    return data[0];
}
// ============================================================
// SUBMIT MANAGEMENT REVIEW
// ============================================================

async function submitReview(
    decision
) {

    if (
        reviewSubmitting ||
        !currentPirep ||
        !currentAuthUser
    ) {
        return;
    }


    hideActionMessage();


    if (
        !validateReview(
            decision
        )
    ) {
        return;
    }


    const confirmed =
        window.confirm(
            getConfirmationText(
                decision
            )
        );


    if (!confirmed) {
        return;
    }


    reviewSubmitting =
        true;


    setReviewButtonsDisabled(
        true
    );


    const notes =
        managementNotes.value.trim();


    let createdReview =
        null;


    try {

        showActionMessage(
            "Recording management review..."
        );


        // ----------------------------------------------------
        // STEP 1
        // CREATE PERMANENT AUDIT RECORD
        // ----------------------------------------------------

        createdReview =
            await createReviewRecord(
                decision,
                notes
            );


        console.log(
            "Management review recorded:",
            createdReview
        );


        // ----------------------------------------------------
        // STEP 2
        // REMOVE FROM ACTIVE REVIEW QUEUE
        // ----------------------------------------------------

        showActionMessage(
            "Review recorded. Resolving active Review Centre flag..."
        );


        await clearReviewFlag();


        // ----------------------------------------------------
        // LOCAL STATE
        // ----------------------------------------------------

        currentPirep.requires_review =
            false;


        existingReview =
            createdReview;


        // ----------------------------------------------------
        // UPDATE UI
        // ----------------------------------------------------

        renderReviewStatus(
            currentPirep
        );


        await renderCompletedReview(
            createdReview
        );


        showActionMessage(
            "Management review completed successfully.",
            "success"
        );


        console.log(
            "PIREP review completed:",
            {
                pirep:
                    currentPirep.id,

                decision:
                    decision,

                reviewer:
                    currentManager?.display_name
            }
        );

    }
    catch (error) {

        console.error(
            "Review submission failed:",
            error
        );


        if (createdReview) {

            /*
             * The permanent audit record was successfully
             * created, but the PIREP flag was not cleared.
             *
             * Do not pretend the entire operation failed.
             */

            existingReview =
                createdReview;


            await renderCompletedReview(
                createdReview
            );


            showActionMessage(
                "The management decision was recorded, but Operations Control could not remove the flight from the active review queue. Do not submit another decision. Check the PIREP update policy before continuing.",
                "error"
            );

        }
        else {

            showActionMessage(
                "Operations Control could not record this management review. No decision has been saved.",
                "error"
            );


            setReviewButtonsDisabled(
                false
            );

        }

    }
    finally {

        reviewSubmitting =
            false;

    }

}


// ============================================================
// NOTES COUNTER
// ============================================================

function updateNotesCounter() {

    const length =
        managementNotes.value.length;


    notesCounter.textContent =
        `${length} / 2000`;

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

}


// ============================================================
// REVEAL APPLICATION
// ============================================================

function revealApplication() {

    authGate.classList.add(
        "hidden"
    );

    dashboardApp.classList.remove(
        "hidden"
    );

}


// ============================================================
// INITIALISE
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


        currentAuthUser =
            sessionData.session.user;


        // ----------------------------------------------------
        // MANAGEMENT AUTHORISATION
        // ----------------------------------------------------

        currentManager =
            await getManagementUser(
                currentAuthUser.id
            );


        if (!currentManager) {

            await supabaseClient
                .auth
                .signOut();

            redirectToLogin();

            return;

        }


        managementName.textContent =
            currentManager.display_name;


        managementRole.textContent =
            formatRole(
                currentManager.role
            );


        reviewerName.textContent =
            currentManager.display_name;


        // ----------------------------------------------------
        // PIREP ID
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
        // LOAD FLIGHT
        // ----------------------------------------------------

        currentPirep =
            await loadPirep(
                pirepId
            );


        if (!currentPirep) {

            revealApplication();


            showError(
                "The requested PIREP could not be found."
            );


            flightNumber.textContent =
                "Report unavailable";


            return;

        }


        // ----------------------------------------------------
        // LOAD ASSOCIATED DATA
        // ----------------------------------------------------

        const [
            pilot,
            review
        ] =
            await Promise.all([
                loadPilot(
                    currentPirep.pilot_id
                ),

                loadExistingReview(
                    currentPirep.id
                )
            ]);


        currentPilot =
            pilot;


        existingReview =
            review;


        // ----------------------------------------------------
        // RENDER FLIGHT
        // ----------------------------------------------------

        renderReport(
            currentPirep,
            currentPilot
        );


        // ----------------------------------------------------
        // REVIEW UI
        // ----------------------------------------------------

        if (existingReview) {

            await renderCompletedReview(
                existingReview
            );

        }
        else if (
            currentPirep.requires_review === true
        ) {

            renderActiveReviewForm();

        }
        else {

            /*
             * Flight is not flagged and there is no
             * management audit record.
             */

            reviewFormArea.classList.add(
                "hidden"
            );

            completedReviewArea.classList.remove(
                "hidden"
            );

            completedDecision.textContent =
                "No management review required";

            completedReviewer.textContent =
                "—";

            completedDate.textContent =
                "—";

            completedDecisionDetail.textContent =
                "Record Clear";

            completedNotes.textContent =
                "This flight does not currently require management review.";

        }


        console.log(
            "Flight Review loaded:",
            {
                pirep:
                    currentPirep.id,

                flight:
                    currentPirep.flight_number,

                pilot:
                    currentPilot?.pilot_id,

                requiresReview:
                    currentPirep.requires_review,

                existingReview:
                    existingReview?.decision || null
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

    signOutButton.disabled =
        true;


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

managementNotes.addEventListener(
    "input",
    updateNotesCounter
);


clearFlightButton.addEventListener(
    "click",
    () => {

        submitReview(
            "cleared"
        );

    }
);


advisoryButton.addEventListener(
    "click",
    () => {

        submitReview(
            "advisory"
        );

    }
);


rejectButton.addEventListener(
    "click",
    () => {

        submitReview(
            "rejected"
        );

    }
);


signOutButton.addEventListener(
    "click",
    signOut
);


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
