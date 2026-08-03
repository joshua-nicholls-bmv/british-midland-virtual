// ============================================================
// BRITISH MIDLAND VIRTUAL
// OPERATIONS CONTROL - REVIEW CENTRE
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


const awaitingReview =
    document.getElementById("awaitingReview");

const flaggedPilots =
    document.getElementById("flaggedPilots");

const reviewAverageScore =
    document.getElementById("reviewAverageScore");

const reviewAverageLanding =
    document.getElementById("reviewAverageLanding");


const sidebarReviewCount =
    document.getElementById("sidebarReviewCount");

const queueIndicator =
    document.getElementById("queueIndicator");

const queueStatus =
    document.getElementById("queueStatus");

const queueStatusDetail =
    document.getElementById("queueStatusDetail");


const reviewSearch =
    document.getElementById("reviewSearch");

const reviewSort =
    document.getElementById("reviewSort");

const refreshReviews =
    document.getElementById("refreshReviews");

const reviewResultCount =
    document.getElementById("reviewResultCount");

const reviewQueue =
    document.getElementById("reviewQueue");


// ------------------------------------------------------------
// LOCAL DATA
// ------------------------------------------------------------

let reviewData = [];

let pilotLookup = new Map();


// ============================================================
// NAVIGATION
// ============================================================

function redirectToLogin() {

    window.location.replace(
        "/management/"
    );

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


function formatLanding(value) {

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


function formatScore(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "—";

    }


    return String(value);

}


function formatDeduction(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "—";

    }


    const deduction =
        Number(value);


    if (Number.isNaN(deduction)) {

        return "—";

    }


    if (deduction === 0) {

        return "0 pts";

    }


    return `${deduction} pts`;

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
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }
    ).format(date);

}


// ============================================================
// PILOT LOOKUP
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
            "Unable to load pilots:",
            error
        );

        throw error;

    }


    pilotLookup =
        new Map();


    for (
        const pilot of data || []
    ) {

        pilotLookup.set(
            pilot.id,
            {
                pilotId:
                    pilot.pilot_id ||
                    "Unknown",

                nickname:
                    pilot.nickname?.trim() ||
                    "Unnamed Pilot"
            }
        );

    }


    console.log(
        "Review Centre pilot lookup loaded:",
        pilotLookup.size
    );

}


function getPilotDetails(
    pilotUuid
) {

    return (
        pilotLookup.get(
            pilotUuid
        ) ||
        {
            pilotId:
                "Unknown",

            nickname:
                "Unknown Pilot"
        }
    );

}


// ============================================================
// LOAD REVIEW QUEUE
// ============================================================

async function loadReviews() {

    if (refreshReviews) {

        refreshReviews.disabled =
            true;


        refreshReviews.textContent =
            "REFRESHING...";

    }


    if (reviewResultCount) {

        reviewResultCount.textContent =
            "Loading review queue...";

    }


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
                    go_arounds,
                    status,
                    submitted_at,
                    flight_score,
                    flight_grade,
                    performance_rating,
                    landing_assessment,
                    score_deduction,
                    requires_review
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
                );


        if (error) {

            console.error(
                "Unable to load review queue:",
                error
            );

            throw error;

        }


        reviewData =
            data || [];


        console.log(
            "Review queue loaded:",
            reviewData.length
        );


        updateReviewSummary();

        applyReviewFilters();

    }
    catch (error) {

        console.error(
            "Review queue failed:",
            error
        );


        if (reviewQueue) {

            reviewQueue.innerHTML =
                `
                <div class="review-empty review-error">
                    Unable to load the management review queue.
                </div>
                `;

        }


        if (reviewResultCount) {

            reviewResultCount.textContent =
                "Unable to load review queue";

        }

    }
    finally {

        if (refreshReviews) {

            refreshReviews.disabled =
                false;


            refreshReviews.textContent =
                "REFRESH QUEUE";

        }

    }

}


// ============================================================
// SUMMARY
// ============================================================

function updateReviewSummary() {

    const count =
        reviewData.length;


    // --------------------------------------------------------
    // UNIQUE PILOTS
    // --------------------------------------------------------

    const pilotIds =
        new Set(
            reviewData
                .map(
                    pirep =>
                        pirep.pilot_id
                )
                .filter(Boolean)
        );


    // --------------------------------------------------------
    // AVERAGE SCORE
    // --------------------------------------------------------

    const scores =
        reviewData
            .map(
                pirep =>
                    pirep.flight_score
            )
            .filter(
                value =>
                    value !== null &&
                    value !== undefined &&
                    !Number.isNaN(
                        Number(value)
                    )
            )
            .map(Number);


    let averageScore =
        null;


    if (scores.length) {

        averageScore =
            Math.round(
                scores.reduce(
                    (total, value) =>
                        total + value,
                    0
                ) /
                scores.length
            );

    }


    // --------------------------------------------------------
    // AVERAGE LANDING
    // --------------------------------------------------------

    const landings =
        reviewData
            .map(
                pirep =>
                    pirep.landing_rate_fpm
            )
            .filter(
                value =>
                    value !== null &&
                    value !== undefined &&
                    !Number.isNaN(
                        Number(value)
                    )
            )
            .map(Number);


    let averageLanding =
        null;


    if (landings.length) {

        averageLanding =
            Math.round(
                landings.reduce(
                    (total, value) =>
                        total + value,
                    0
                ) /
                landings.length
            );

    }


    // --------------------------------------------------------
    // OUTPUT
    // --------------------------------------------------------

    awaitingReview.textContent =
        count;


    flaggedPilots.textContent =
        pilotIds.size;


    reviewAverageScore.textContent =
        averageScore === null
            ? "—"
            : averageScore;


    reviewAverageLanding.textContent =
        averageLanding === null
            ? "—"
            : `${averageLanding} fpm`;


    // --------------------------------------------------------
    // SIDEBAR BADGE
    // --------------------------------------------------------

    if (count > 0) {

        sidebarReviewCount.textContent =
            count;


        sidebarReviewCount.classList.remove(
            "hidden"
        );

    }
    else {

        sidebarReviewCount.classList.add(
            "hidden"
        );

    }


    // --------------------------------------------------------
    // QUEUE STATUS
    // --------------------------------------------------------

    if (count > 0) {

        queueIndicator.className =
            "queue-indicator attention";


        queueStatus.textContent =
            "ACTION REQUIRED";


        queueStatusDetail.textContent =
            `${count} ${
                count === 1
                    ? "PIREP"
                    : "PIREPs"
            } AWAITING REVIEW`;

    }
    else {

        queueIndicator.className =
            "queue-indicator clear";


        queueStatus.textContent =
            "QUEUE CLEAR";


        queueStatusDetail.textContent =
            "NO REVIEWS OUTSTANDING";

    }

}


// ============================================================
// FILTER / SORT
// ============================================================

function applyReviewFilters() {

    const search =
        reviewSearch
            ? reviewSearch.value
                .trim()
                .toLowerCase()
            : "";


    const sort =
        reviewSort
            ? reviewSort.value
            : "newest";


    let filtered =
        reviewData.filter(
            pirep => {

                if (!search) {

                    return true;

                }


                const pilot =
                    getPilotDetails(
                        pirep.pilot_id
                    );


                const searchable =
                    [
                        pirep.flight_number,
                        pirep.departure,
                        pirep.arrival,
                        pirep.aircraft,
                        pirep.registration,
                        pirep.flight_grade,
                        pirep.performance_rating,
                        pirep.landing_assessment,
                        pilot.pilotId,
                        pilot.nickname
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                return searchable.includes(
                    search
                );

            }
        );


    // --------------------------------------------------------
    // SORT
    // --------------------------------------------------------

    filtered =
        [...filtered];


    switch (sort) {


        case "oldest":

            filtered.sort(
                (a, b) =>
                    new Date(
                        a.submitted_at || 0
                    ) -
                    new Date(
                        b.submitted_at || 0
                    )
            );

            break;


        case "score-low":

            filtered.sort(
                (a, b) => {

                    const aScore =
                        a.flight_score === null ||
                        a.flight_score === undefined
                            ? Infinity
                            : Number(
                                a.flight_score
                            );


                    const bScore =
                        b.flight_score === null ||
                        b.flight_score === undefined
                            ? Infinity
                            : Number(
                                b.flight_score
                            );


                    return (
                        aScore -
                        bScore
                    );

                }
            );

            break;


        case "landing":

            filtered.sort(
                (a, b) => {

                    const aLanding =
                        a.landing_rate_fpm === null ||
                        a.landing_rate_fpm === undefined
                            ? Infinity
                            : Number(
                                a.landing_rate_fpm
                            );


                    const bLanding =
                        b.landing_rate_fpm === null ||
                        b.landing_rate_fpm === undefined
                            ? Infinity
                            : Number(
                                b.landing_rate_fpm
                            );


                    /*
                     * More negative landing rate first.
                     */

                    return (
                        aLanding -
                        bLanding
                    );

                }
            );

            break;


        case "newest":
        default:

            filtered.sort(
                (a, b) =>
                    new Date(
                        b.submitted_at || 0
                    ) -
                    new Date(
                        a.submitted_at || 0
                    )
            );

            break;

    }


    renderReviewQueue(
        filtered
    );


    if (reviewResultCount) {

        reviewResultCount.textContent =
            `${filtered.length} ${
                filtered.length === 1
                    ? "PIREP"
                    : "PIREPs"
            } awaiting review`;

    }

}


// ============================================================
// ASSESSMENT DISPLAY
// ============================================================

function getAssessmentText(
    pirep
) {

    if (
        pirep.landing_assessment
    ) {

        return pirep.landing_assessment;

    }


    if (
        pirep.performance_rating
    ) {

        return pirep.performance_rating;

    }


    if (
        Number(
            pirep.go_arounds
        ) > 0
    ) {

        return `${
            Number(
                pirep.go_arounds
            )
        } go-around${
            Number(
                pirep.go_arounds
            ) === 1
                ? ""
                : "s"
        } recorded`;

    }


    return "Review required";

}


// ============================================================
// RENDER QUEUE
// ============================================================

function renderReviewQueue(rows) {

    if (!reviewQueue) {

        return;

    }


    if (!rows.length) {

        reviewQueue.innerHTML =
            `
            <div class="review-empty">

                <div class="queue-clear-mark">
                    ✓
                </div>

                <strong>
                    REVIEW QUEUE CLEAR
                </strong>

                <span>
                    No PIREPs currently match the review queue.
                </span>

            </div>
            `;

        return;

    }


    reviewQueue.innerHTML =
        rows
            .map(
                pirep => {

                    const pilot =
                        getPilotDetails(
                            pirep.pilot_id
                        );


                    const route =
                        `${pirep.departure || "—"} → ${pirep.arrival || "—"}`;


                    const assessment =
                        getAssessmentText(
                            pirep
                        );


                    return `
                        <div
                            class="review-row"
                            data-pirep="${escapeHtml(
                                pirep.id
                            )}"
                        >

                            <span class="review-flight">

                                <strong>
                                    ${escapeHtml(
                                        pirep.flight_number ||
                                        "—"
                                    )}
                                </strong>

                                <small>
                                    ${escapeHtml(
                                        pirep.flight_grade
                                            ? `GRADE ${pirep.flight_grade}`
                                            : "FLAGGED"
                                    )}
                                </small>

                            </span>


                            <span class="review-pilot">

                                <strong>
                                    ${escapeHtml(
                                        pilot.pilotId
                                    )}
                                </strong>

                                <small>
                                    ${escapeHtml(
                                        pilot.nickname
                                    )}
                                </small>

                            </span>


                            <span class="review-route">
                                ${escapeHtml(route)}
                            </span>


                            <span class="review-score">
                                ${escapeHtml(
                                    formatScore(
                                        pirep.flight_score
                                    )
                                )}
                            </span>


                            <span class="review-landing">
                                ${escapeHtml(
                                    formatLanding(
                                        pirep.landing_rate_fpm
                                    )
                                )}
                            </span>


                            <span class="review-deduction">
                                ${escapeHtml(
                                    formatDeduction(
                                        pirep.score_deduction
                                    )
                                )}
                            </span>


                            <span class="review-assessment">

                                <strong>
                                    ${escapeHtml(
                                        assessment
                                    )}
                                </strong>

                                <small>
                                    ${escapeHtml(
                                        pirep.performance_rating ||
                                        "ACARS FLAG"
                                    )}
                                </small>

                            </span>


                            <span class="review-date">
                                ${escapeHtml(
                                    formatDate(
                                        pirep.submitted_at
                                    )
                                )}
                            </span>


                            <span>

                                <button
                                    class="open-review-button"
                                    type="button"
                                    data-pirep="${escapeHtml(
                                        pirep.id
                                    )}"
                                >
                                    REVIEW
                                </button>

                            </span>

                        </div>
                    `;

                }
            )
            .join("");


    // --------------------------------------------------------
    // REVIEW BUTTONS
    // --------------------------------------------------------

    document
        .querySelectorAll(
            ".open-review-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();


                        openPirep(
                            button.dataset.pirep
                        );

                    }
                );

            }
        );


    // --------------------------------------------------------
    // CLICKABLE ROWS
    // --------------------------------------------------------

    document
        .querySelectorAll(
            ".review-row"
        )
        .forEach(
            row => {

                row.addEventListener(
                    "click",
                    () => {

                        openPirep(
                            row.dataset.pirep
                        );

                    }
                );

            }
        );

}


// ============================================================
// OPEN PIREP
// ============================================================

function openPirep(id) {

    if (!id) {

        return;

    }


    window.location.href =
        `/management/pirep.html?id=${encodeURIComponent(id)}`;

}


// ============================================================
// INITIALISE
// ============================================================

async function initialiseReviewCentre() {

    try {

        // ----------------------------------------------------
        // AUTH SESSION
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
        // MANAGEMENT AUTHORISATION
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


        console.log(
            "Review Centre access granted:",
            {
                displayName:
                    manager.display_name,

                role:
                    manager.role
            }
        );


        // ----------------------------------------------------
        // DATA
        // ----------------------------------------------------

        await loadPilotLookup();

        await loadReviews();


        // ----------------------------------------------------
        // REVEAL
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
            "Review Centre initialisation failed:",
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


        if (reviewQueue) {

            reviewQueue.innerHTML =
                `
                <div class="review-empty review-error">
                    Unable to initialise the Review Centre.
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
    finally {

        redirectToLogin();

    }

}


// ============================================================
// EVENTS
// ============================================================

if (reviewSearch) {

    reviewSearch.addEventListener(
        "input",
        applyReviewFilters
    );

}


if (reviewSort) {

    reviewSort.addEventListener(
        "change",
        applyReviewFilters
    );

}


if (refreshReviews) {

    refreshReviews.addEventListener(
        "click",
        loadReviews
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
// START
// ============================================================

initialiseReviewCentre();
