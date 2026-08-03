// ============================================================
// BRITISH MIDLAND VIRTUAL
// PUBLIC OPERATIONS CENTRE
// LIVE ACARS DATA
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

const activePilots =
    document.getElementById("activePilots");

const totalFlights =
    document.getElementById("totalFlights");

const totalFlightTime =
    document.getElementById("totalFlightTime");

const totalLandings =
    document.getElementById("totalLandings");

const averageLanding =
    document.getElementById("averageLanding");

const bestLanding =
    document.getElementById("bestLanding");

const totalGoArounds =
    document.getElementById("totalGoArounds");

const lastOperation =
    document.getElementById("lastOperation");

const operationsStatus =
    document.getElementById("operationsStatus");

const recentOperations =
    document.getElementById("recentOperations");


// ACARS preview

const acarsPilotCount =
    document.getElementById("acarsPilotCount");

const acarsFlightCount =
    document.getElementById("acarsFlightCount");

const acarsFlightTime =
    document.getElementById("acarsFlightTime");

const acarsLastSubmission =
    document.getElementById("acarsLastSubmission");


// Status container

const liveStatusBar =
    document.querySelector(".live-status-bar");


// ------------------------------------------------------------
// FORMAT NUMBERS
// ------------------------------------------------------------

function formatNumber(value) {

    const number =
        Number(value);


    if (!Number.isFinite(number)) {

        return "—";

    }


    return number.toLocaleString(
        "en-GB"
    );

}


// ------------------------------------------------------------
// FORMAT FLIGHT TIME
// ------------------------------------------------------------

function formatFlightTime(
    hours,
    remainingMinutes
) {

    const safeHours =
        Number(hours) || 0;

    const safeMinutes =
        Number(remainingMinutes) || 0;


    return (
        `${safeHours}h ` +
        `${String(safeMinutes).padStart(2, "0")}m`
    );

}


// ------------------------------------------------------------
// FORMAT BLOCK TIME
// ------------------------------------------------------------

function formatBlockTime(minutes) {

    const totalMinutes =
        Number(minutes);


    if (!Number.isFinite(totalMinutes)) {

        return "—";

    }


    const hours =
        Math.floor(
            totalMinutes / 60
        );


    const mins =
        totalMinutes % 60;


    if (hours === 0) {

        return `${mins}m`;

    }


    return (
        `${hours}h ` +
        `${String(mins).padStart(2, "0")}m`
    );

}


// ------------------------------------------------------------
// FORMAT LANDING RATE
// ------------------------------------------------------------

function formatLandingRate(value) {

    const landingRate =
        Number(value);


    if (!Number.isFinite(landingRate)) {

        return "—";

    }


    return (
        `${landingRate.toLocaleString("en-GB")}`
    );

}


// ------------------------------------------------------------
// LANDING RATE CLASS
// ------------------------------------------------------------

function getLandingClass(value) {

    const rate =
        Math.abs(
            Number(value)
        );


    if (!Number.isFinite(rate)) {

        return "";

    }


    if (rate <= 300) {

        return "landing-good";

    }


    if (rate <= 600) {

        return "landing-medium";

    }


    return "landing-hard";

}


// ------------------------------------------------------------
// SCORE CLASS
// ------------------------------------------------------------

function getScoreClass(score) {

    const value =
        Number(score);


    if (!Number.isFinite(value)) {

        return "";

    }


    if (value >= 90) {

        return "";

    }


    if (value >= 75) {

        return "score-medium";

    }


    return "score-low";

}


// ------------------------------------------------------------
// FORMAT DATE / TIME
// ------------------------------------------------------------

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
            minute: "2-digit"
        }
    ).format(date);

}


// ------------------------------------------------------------
// FORMAT SHORT DATE
// ------------------------------------------------------------

function formatShortDate(value) {

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
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(date);

}


// ------------------------------------------------------------
// ESCAPE HTML
// ------------------------------------------------------------

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


// ------------------------------------------------------------
// NORMALISE AIRCRAFT NAME
// ------------------------------------------------------------

function formatAircraftName(value) {

    if (!value) {

        return "—";

    }


    const aircraft =
        String(value);


    /*
     * ACARS currently receives simulator-specific
     * aircraft names such as:
     *
     * FenixA319 CFM SL HD
     * FenixA320 CFM SL
     * Airbus A320neo british midland
     *
     * Make those slightly cleaner for the public site
     * without changing the stored database value.
     */


    if (
        aircraft
            .toLowerCase()
            .includes("a319")
    ) {

        return "Airbus A319";

    }


    if (
        aircraft
            .toLowerCase()
            .includes("a320neo")
    ) {

        return "Airbus A320neo";

    }


    if (
        aircraft
            .toLowerCase()
            .includes("a320")
    ) {

        return "Airbus A320";

    }


    if (
        aircraft
            .toLowerCase()
            .includes("a321")
    ) {

        return "Airbus A321";

    }


    if (
        aircraft
            .toLowerCase()
            .includes("a350")
    ) {

        return "Airbus A350";

    }


    return aircraft;

}


// ------------------------------------------------------------
// SET ACARS CONNECTION STATUS
// ------------------------------------------------------------

function setConnectionStatus(
    state,
    message
) {

    if (operationsStatus) {

        operationsStatus.textContent =
            message;

    }


    if (!liveStatusBar) {

        return;

    }


    liveStatusBar.classList.remove(
        "connected",
        "error"
    );


    if (state === "connected") {

        liveStatusBar.classList.add(
            "connected"
        );

    }


    if (state === "error") {

        liveStatusBar.classList.add(
            "error"
        );

    }

}


// ------------------------------------------------------------
// LOAD PUBLIC OPERATIONS STATISTICS
// ------------------------------------------------------------

async function loadOperationsStatistics() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "public_operations_statistics"
            )
            .select("*")
            .maybeSingle();


    if (error) {

        throw new Error(
            `Statistics request failed: ${error.message}`
        );

    }


    if (!data) {

        throw new Error(
            "No public operations statistics were returned."
        );

    }


    // --------------------------------------------------------
    // MAIN OPERATIONS STATISTICS
    // --------------------------------------------------------

    if (activePilots) {

        activePilots.textContent =
            formatNumber(
                data.active_pilots
            );

    }


    if (totalFlights) {

        totalFlights.textContent =
            formatNumber(
                data.total_flights
            );

    }


    const flightTime =
        formatFlightTime(
            data.total_hours,
            data.remaining_minutes
        );


    if (totalFlightTime) {

        totalFlightTime.textContent =
            flightTime;

    }


    if (totalLandings) {

        totalLandings.textContent =
            formatNumber(
                data.total_landings
            );

    }


    if (averageLanding) {

        averageLanding.textContent =
            formatLandingRate(
                data.average_landing_rate_fpm
            );

    }


    if (bestLanding) {

        bestLanding.textContent =
            formatLandingRate(
                data.best_landing_rate_fpm
            );

    }


    if (totalGoArounds) {

        totalGoArounds.textContent =
            formatNumber(
                data.total_go_arounds
            );

    }


    if (lastOperation) {

        lastOperation.textContent =
            formatDateTime(
                data.last_operation_at
            );

    }


    // --------------------------------------------------------
    // ACARS PREVIEW WINDOW
    // --------------------------------------------------------

    if (acarsPilotCount) {

        acarsPilotCount.textContent =
            formatNumber(
                data.active_pilots
            );

    }


    if (acarsFlightCount) {

        acarsFlightCount.textContent =
            formatNumber(
                data.total_flights
            );

    }


    if (acarsFlightTime) {

        acarsFlightTime.textContent =
            flightTime;

    }


    if (acarsLastSubmission) {

        acarsLastSubmission.textContent =
            formatShortDate(
                data.last_operation_at
            );

    }


    return data;

}


// ------------------------------------------------------------
// BUILD RECENT OPERATION ROW
// ------------------------------------------------------------

function createOperationRow(operation) {

    const landingClass =
        getLandingClass(
            operation.landing_rate_fpm
        );


    const scoreClass =
        getScoreClass(
            operation.flight_score
        );


    const score =
        operation.flight_score !== null &&
        operation.flight_score !== undefined
            ? operation.flight_score
            : "—";


    const grade =
        operation.flight_grade
            ? ` ${escapeHtml(operation.flight_grade)}`
            : "";


    return `
        <tr>

            <td class="flight-number">
                ${escapeHtml(operation.flight_number || "—")}
            </td>

            <td>

                <div class="pilot-cell">

                    <strong>
                        ${escapeHtml(operation.pilot_name || operation.pilot_id || "—")}
                    </strong>

                    <small>
                        ${escapeHtml(operation.pilot_id || "")}
                    </small>

                </div>

            </td>

            <td class="route-cell">

                ${escapeHtml(operation.departure || "—")}

                <span class="route-arrow">
                    →
                </span>

                ${escapeHtml(operation.arrival || "—")}

            </td>

            <td
                class="aircraft-cell"
                title="${escapeHtml(operation.aircraft || "")}"
            >
                ${escapeHtml(formatAircraftName(operation.aircraft))}
            </td>

            <td class="registration-cell">
                ${escapeHtml(operation.registration || "—")}
            </td>

            <td>
                ${escapeHtml(formatBlockTime(operation.block_minutes))}
            </td>

            <td class="${landingClass}">

                ${
                    operation.landing_rate_fpm !== null &&
                    operation.landing_rate_fpm !== undefined
                        ? `${escapeHtml(formatLandingRate(operation.landing_rate_fpm))} fpm`
                        : "—"
                }

            </td>

            <td>

                <span class="score-pill ${scoreClass}">

                    ${escapeHtml(score)}${grade}

                </span>

            </td>

        </tr>
    `;

}


// ------------------------------------------------------------
// LOAD RECENT OPERATIONS
// ------------------------------------------------------------

async function loadRecentOperations() {

    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "public_recent_operations"
            )
            .select(
                `
                pirep_id,
                pilot_id,
                pilot_name,
                flight_number,
                departure,
                arrival,
                aircraft,
                registration,
                block_minutes,
                airborne_minutes,
                landing_rate_fpm,
                flight_score,
                flight_grade,
                submitted_at
                `
            )
            .order(
                "submitted_at",
                {
                    ascending: false
                }
            )
            .limit(10);


    if (error) {

        throw new Error(
            `Recent operations request failed: ${error.message}`
        );

    }


    if (!recentOperations) {

        return data;

    }


    if (
        !data ||
        data.length === 0
    ) {

        recentOperations.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="operations-empty"
                >
                    NO COMPLETED ACARS OPERATIONS RECORDED
                </td>

            </tr>

        `;


        return [];

    }


    recentOperations.innerHTML =
        data
            .map(
                createOperationRow
            )
            .join("");


    return data;

}


// ------------------------------------------------------------
// DISPLAY CONNECTION ERROR
// ------------------------------------------------------------

function displayOperationsError(error) {

    console.error(
        "British Midland public operations error:",
        error
    );


    setConnectionStatus(
        "error",
        "DATA UNAVAILABLE"
    );


    if (recentOperations) {

        recentOperations.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="operations-error"
                >
                    ACARS DATA TEMPORARILY UNAVAILABLE
                </td>

            </tr>

        `;

    }

}


// ------------------------------------------------------------
// INITIALISE OPERATIONS CENTRE
// ------------------------------------------------------------

async function initialiseOperations() {

    console.log(
        "British Midland Operations Centre loading..."
    );


    setConnectionStatus(
        "connecting",
        "CONNECTING"
    );


    try {

        await Promise.all([
            loadOperationsStatistics(),
            loadRecentOperations()
        ]);


        setConnectionStatus(
            "connected",
            "OPERATIONAL"
        );


        console.log(
            "British Midland public ACARS data loaded successfully."
        );

    }
    catch (error) {

        displayOperationsError(
            error
        );

    }

}


// ------------------------------------------------------------
// START
// ------------------------------------------------------------

document.addEventListener(
    "DOMContentLoaded",
    initialiseOperations
);
