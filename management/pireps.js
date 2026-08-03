// ============================================================
// BRITISH MIDLAND VIRTUAL
// OPERATIONS CONTROL - PIREP CENTRE
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


const totalPireps =
    document.getElementById("totalPireps");

const totalBlockTime =
    document.getElementById("totalBlockTime");

const averageLanding =
    document.getElementById("averageLanding");

const reviewCount =
    document.getElementById("reviewCount");


const pirepSearch =
    document.getElementById("pirepSearch");

const reviewFilter =
    document.getElementById("reviewFilter");

const refreshButton =
    document.getElementById("refreshButton");

const resultCount =
    document.getElementById("resultCount");

const pirepRoster =
    document.getElementById("pirepRoster");


// ------------------------------------------------------------
// LOCAL DATA
// ------------------------------------------------------------

let pirepData = [];

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


function formatMinutes(value) {

    const totalMinutes =
        Number(value) || 0;


    const hours =
        Math.floor(
            totalMinutes / 60
        );


    const minutes =
        totalMinutes % 60;


    return `${hours}h ${minutes}m`;

}


function formatLanding(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "—";

    }


    const landing =
        Number(value);


    if (
        Number.isNaN(landing)
    ) {

        return "—";

    }


    return `${landing} fpm`;

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


function formatAircraft(
    aircraft,
    registration
) {

    const aircraftName =
        aircraft || "—";


    if (!registration) {

        return aircraftName;

    }


    return `${aircraftName} / ${registration}`;

}


function formatScore(
    score,
    grade
) {

    const hasScore =
        score !== null &&
        score !== undefined;


    if (
        !hasScore &&
        !grade
    ) {

        return "—";

    }


    if (
        hasScore &&
        grade
    ) {

        return `${score} / ${grade}`;

    }


    if (hasScore) {

        return String(score);

    }


    return String(grade);

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
            "Unable to load pilot lookup:",
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
                    pilot.pilot_id,

                nickname:
                    pilot.nickname?.trim() ||
                    "Unnamed Pilot"
            }
        );

    }


    console.log(
        "Pilot lookup loaded:",
        pilotLookup.size
    );

}


// ============================================================
// LOAD PIREPS
// ============================================================

async function loadPireps() {

    if (refreshButton) {

        refreshButton.disabled =
            true;

        refreshButton.textContent =
            "REFRESHING...";

    }


    if (resultCount) {

        resultCount.textContent =
            "Loading PIREPs...";

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
                    block_minutes,
                    airborne_minutes,
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
                .order(
                    "submitted_at",
                    {
                        ascending: false
                    }
                );


        if (error) {

            console.error(
                "Unable to load PIREPs:",
                error
            );

            throw error;

        }


        pirepData =
            data || [];


        console.log(
            "PIREP records loaded:",
            pirepData.length
        );


        updateSummary();

        applyFilters();

    }
    finally {

        if (refreshButton) {

            refreshButton.disabled =
                false;

            refreshButton.textContent =
                "REFRESH DATA";

        }

    }

}


// ============================================================
// SUMMARY STATISTICS
// ============================================================

function updateSummary() {

    const blockMinutes =
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


    const landingRates =
        pirepData
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


    let landingAverage =
        null;


    if (
        landingRates.length > 0
    ) {

        landingAverage =
            Math.round(
                landingRates.reduce(
                    (total, value) =>
                        total + value,
                    0
                ) /
                landingRates.length
            );

    }


    const reviews =
        pirepData.filter(
            pirep =>
                pirep.requires_review === true
        ).length;


    totalPireps.textContent =
        pirepData.length;


    totalBlockTime.textContent =
        formatMinutes(
            blockMinutes
        );


    averageLanding.textContent =
        landingAverage === null
            ? "—"
            : `${landingAverage} fpm`;


    reviewCount.textContent =
        reviews;

}


// ============================================================
// PILOT DISPLAY
// ============================================================

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
// FILTERING
// ============================================================

function applyFilters() {

    const search =
        pirepSearch
            ? pirepSearch.value
                .trim()
                .toLowerCase()
            : "";


    const filter =
        reviewFilter
            ? reviewFilter.value
            : "all";


    const filtered =
        pirepData.filter(
            pirep => {

                const pilot =
                    getPilotDetails(
                        pirep.pilot_id
                    );


                // --------------------------------------------
                // REVIEW FILTER
                // --------------------------------------------

                if (
                    filter === "review" &&
                    pirep.requires_review !== true
                ) {

                    return false;

                }


                if (
                    filter === "clear" &&
                    pirep.requires_review === true
                ) {

                    return false;

                }


                // --------------------------------------------
                // SEARCH
                // --------------------------------------------

                if (!search) {

                    return true;

                }


                const searchable =
                    [
                        pirep.flight_number,
                        pirep.departure,
                        pirep.arrival,
                        pirep.aircraft,
                        pirep.registration,
                        pirep.status,
                        pirep.flight_grade,
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


    renderPireps(
        filtered
    );


    if (resultCount) {

        resultCount.textContent =
            `${filtered.length} ${
                filtered.length === 1
                    ? "PIREP"
                    : "PIREPs"
            } shown`;

    }

}


// ============================================================
// RENDER PIREPS
// ============================================================

function renderPireps(rows) {

    if (!pirepRoster) {

        return;

    }


    if (!rows.length) {

        pirepRoster.innerHTML =
            `
            <div class="pirep-empty">
                No PIREPs match the current filters.
            </div>
            `;

        return;

    }


    pirepRoster.innerHTML =
        rows
            .map(
                pirep => {

                    const pilot =
                        getPilotDetails(
                            pirep.pilot_id
                        );


                    const route =
                        `${pirep.departure || "—"} → ${pirep.arrival || "—"}`;


                    const review =
                        pirep.requires_review === true;


                    const statusClass =
                        review
                            ? "review"
                            : "clear";


                    const statusText =
                        review
                            ? "REVIEW"
                            : (
                                pirep.status ||
                                "SUBMITTED"
                            );


                    return `
                        <div
                            class="pirep-row"
                            data-pirep="${escapeHtml(pirep.id)}"
                            tabindex="0"
                            role="link"
                        >

                            <span class="pirep-flight">

                                <strong>
                                    ${escapeHtml(
                                        pirep.flight_number ||
                                        "—"
                                    )}
                                </strong>

                            </span>


                            <span class="pirep-pilot">

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


                            <span>
                                ${escapeHtml(route)}
                            </span>


                            <span>
                                ${escapeHtml(
                                    formatAircraft(
                                        pirep.aircraft,
                                        pirep.registration
                                    )
                                )}
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


                            <span class="pirep-score">
                                ${escapeHtml(
                                    formatScore(
                                        pirep.flight_score,
                                        pirep.flight_grade
                                    )
                                )}
                            </span>


                            <span>

                                <span
                                    class="pirep-status ${statusClass}"
                                >
                                    ${escapeHtml(
                                        statusText
                                    )}
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


    // --------------------------------------------------------
    // PREPARE FOR STEP 9.2
    // --------------------------------------------------------

    document
        .querySelectorAll(
            ".pirep-row"
        )
        .forEach(
            row => {

                const openPirep =
                    () => {

                        const id =
                            row.dataset.pirep;


                        if (!id) {

                            return;

                        }


                        /*
                         * Step 9.2 will create this page.
                         */

                        window.location.href =
                            `/management/pirep.html?id=${encodeURIComponent(id)}`;

                    };


                row.addEventListener(
                    "click",
                    openPirep
                );


                row.addEventListener(
                    "keydown",
                    event => {

                        if (
                            event.key === "Enter" ||
                            event.key === " "
                        ) {

                            event.preventDefault();

                            openPirep();

                        }

                    }
                );

            }
        );

}


// ============================================================
// INITIALISE
// ============================================================

async function initialisePirepCentre() {

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


        console.log(
            "PIREP Centre access granted:",
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

        await loadPireps();


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
            "PIREP Centre initialisation failed:",
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


        if (pirepRoster) {

            pirepRoster.innerHTML =
                `
                <div class="pirep-empty">
                    Unable to load ACARS flight reports.
                </div>
                `;

        }


        if (resultCount) {

            resultCount.textContent =
                "Unable to load PIREPs";

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

if (pirepSearch) {

    pirepSearch.addEventListener(
        "input",
        applyFilters
    );

}


if (reviewFilter) {

    reviewFilter.addEventListener(
        "change",
        applyFilters
    );

}


if (refreshButton) {

    refreshButton.addEventListener(
        "click",
        loadPireps
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

initialisePirepCentre();
