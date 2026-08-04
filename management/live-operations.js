const SUPABASE_URL =
    "https://eqbaezhcwnjlcnvtfxho.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable__JTXMIQDaruQdmjEmf9t6w_T23MXelW";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


/* ============================================================
   ELEMENTS
   ============================================================ */

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

const liveConnection =
    document.getElementById("liveConnection");

const liveConnectionText =
    document.getElementById("liveConnectionText");

const activeFlightCount =
    document.getElementById("activeFlightCount");

const airborneCount =
    document.getElementById("airborneCount");

const groundCount =
    document.getElementById("groundCount");

const staleCount =
    document.getElementById("staleCount");

const mapFlightCount =
    document.getElementById("mapFlightCount");

const mapEmptyState =
    document.getElementById("mapEmptyState");

const fitFlightsButton =
    document.getElementById("fitFlightsButton");

const flightDetail =
    document.getElementById("flightDetail");

const activeFlightRows =
    document.getElementById("activeFlightRows");

const lastRefresh =
    document.getElementById("lastRefresh");


/* ============================================================
   STATE
   ============================================================ */

let map = null;

let aircraftLayer = null;

let trackLayer = null;

let liveFlights = [];

let selectedFlightId = null;

const aircraftMarkers =
    new Map();

const REFRESH_INTERVAL_MS =
    10000;

const STALE_AFTER_MS =
    60000;


/* ============================================================
   AIRCRAFT SVG
   ============================================================ */

const aircraftSvg = `
<svg
    viewBox="0 0 64 64"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
>
    <path
        d="
        M32 3
        C29.8 3 28.5 5.2 28.1 8
        L25.9 25
        L8.5 34.5
        C7.2 35.2 6.5 36.5 6.8 37.8
        L7.4 40.2
        L27.1 35.7
        L28.1 50
        L20.8 55
        L21.5 58
        L32 55
        L42.5 58
        L43.2 55
        L35.9 50
        L36.9 35.7
        L56.6 40.2
        L57.2 37.8
        C57.5 36.5 56.8 35.2 55.5 34.5
        L38.1 25
        L35.9 8
        C35.5 5.2 34.2 3 32 3
        Z
        "
    />
</svg>
`;


/* ============================================================
   HELPERS
   ============================================================ */

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


function safeNumber(
    value,
    fallback = null
) {

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;

}


function formatAltitude(value) {

    const number =
        safeNumber(value);

    if (number === null) {

        return "—";

    }

    if (number >= 18000) {

        return `FL${Math.round(number / 100)}`;

    }

    return (
        `${Math.round(number)
            .toLocaleString("en-GB")} FT`
    );

}


function formatSpeed(value) {

    const number =
        safeNumber(value);

    if (number === null) {

        return "—";

    }

    return `${Math.round(number)} KT`;

}


function formatVerticalSpeed(value) {

    const number =
        safeNumber(value);

    if (number === null) {

        return "—";

    }

    const sign =
        number > 0
            ? "+"
            : "";

    return (
        `${sign}${Math.round(number)
            .toLocaleString("en-GB")} FPM`
    );

}


function formatHeading(value) {

    const number =
        safeNumber(value);

    if (number === null) {

        return "—";

    }

    const heading =
        (
            (
                Math.round(number) % 360
            ) + 360
        ) % 360;

    return (
        `${String(heading)
            .padStart(3, "0")}°`
    );

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
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }
    ).format(date);

}


function secondsSince(value) {

    if (!value) {

        return null;

    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;

    }

    return Math.max(
        0,
        Math.floor(
            (
                Date.now() -
                date.getTime()
            ) / 1000
        )
    );

}


function formatHeartbeat(value) {

    const seconds =
        secondsSince(value);

    if (seconds === null) {

        return "UNKNOWN";

    }

    if (seconds < 10) {

        return "NOW";

    }

    if (seconds < 60) {

        return `${seconds}s AGO`;

    }

    const minutes =
        Math.floor(
            seconds / 60
        );

    if (minutes < 60) {

        return `${minutes}m AGO`;

    }

    return (
        `${Math.floor(minutes / 60)}h AGO`
    );

}


function isStale(flight) {

    const seconds =
        secondsSince(
            flight.last_heartbeat ||
            flight.updated_at
        );

    return (
        seconds === null ||
        (
            seconds * 1000
        ) >= STALE_AFTER_MS
    );

}


function isAirborne(flight) {

    const altitude =
        safeNumber(
            flight.altitude,
            0
        );

    const speed =
        safeNumber(
            flight.ground_speed,
            0
        );

    const phase =
        String(
            flight.flight_phase || ""
        )
            .trim()
            .toUpperCase();

    const groundPhases =
        new Set([
            "PREFLIGHT",
            "BOARDING",
            "PUSHBACK",
            "TAXI",
            "TAXI OUT",
            "TAXI IN",
            "PARKED",
            "SHUTDOWN"
        ]);

    return (
        !groundPhases.has(phase) &&
        (
            altitude > 500 ||
            speed > 80
        )
    );

}


function validPosition(flight) {

    const latitude =
        safeNumber(
            flight.latitude
        );

    const longitude =
        safeNumber(
            flight.longitude
        );

    return (
        latitude !== null &&
        longitude !== null &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180
    );

}


/* ============================================================
   CONNECTION STATUS
   ============================================================ */

function setConnectionState(
    state,
    text
) {

    liveConnection.classList.remove(
        "connecting",
        "connected",
        "error"
    );

    liveConnection.classList.add(
        state
    );

    liveConnectionText.textContent =
        text;

}


/* ============================================================
   AUTH
   ============================================================ */

async function getManagementUser(
    userId
) {

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


async function signOut() {

    if (signOutButton) {

        signOutButton.disabled =
            true;

    }

    try {

        await supabaseClient.auth
            .signOut();

    }
    finally {

        redirectToLogin();

    }

}


/* ============================================================
   MAP
   ============================================================ */

function initialiseMap() {

    map =
        L.map(
            "liveMap",
            {
                zoomControl: true,
                attributionControl: true
            }
        )
        .setView(
            [
                52.2,
                -1.5
            ],
            5
        );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 18,
            attribution:
                "&copy; OpenStreetMap contributors"
        }
    )
    .addTo(map);


    trackLayer =
        L.layerGroup()
            .addTo(map);


    aircraftLayer =
        L.layerGroup()
            .addTo(map);

}


/* ============================================================
   AIRCRAFT ICON
   ============================================================ */

function createAircraftIcon(flight) {

    const heading =
        safeNumber(
            flight.heading,
            0
        );

    const stale =
        isStale(flight)
            ? " stale"
            : "";

    const selected =
        selectedFlightId ===
        flight.flight_id
            ? " selected"
            : "";

    return L.divIcon({

        className:
            "aircraft-marker-wrapper",

        html: `
            <div
                class="aircraft-marker${stale}${selected}"
                style="transform:rotate(${heading}deg);"
            >
                ${aircraftSvg}
            </div>
        `,

        iconSize: [
            32,
            32
        ],

        iconAnchor: [
            16,
            16
        ]

    });

}


/* ============================================================
   TRACK
   ============================================================ */

async function loadTrackForFlight(
    flight
) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "flight_track_points"
            )
            .select(
                "latitude,longitude,recorded_at"
            )
            .eq(
                "active_flight_id",
                flight.flight_id
            )
            .order(
                "recorded_at",
                {
                    ascending: true
                }
            );

    if (error) {

        console.error(
            "Track load failed:",
            error
        );

        return [];

    }


    return (
        data || []
    )
    .map(
        point => [
            safeNumber(
                point.latitude
            ),
            safeNumber(
                point.longitude
            )
        ]
    )
    .filter(
        point =>
            point[0] !== null &&
            point[1] !== null
    );

}


/* ============================================================
   RENDER MAP
   ============================================================ */

async function renderMap() {

    aircraftMarkers.clear();

    aircraftLayer.clearLayers();

    trackLayer.clearLayers();


    const flights =
        liveFlights.filter(
            validPosition
        );


    mapFlightCount.textContent =
        `${flights.length} AIRCRAFT`;


    mapEmptyState.classList.toggle(
        "hidden",
        flights.length > 0
    );


    for (
        const flight
        of flights
    ) {

        const position = [
            Number(
                flight.latitude
            ),
            Number(
                flight.longitude
            )
        ];


        const track =
            await loadTrackForFlight(
                flight
            );


        if (
            track.length >= 2
        ) {

            L.polyline(
                track,
                {
                    color:
                        "#d02823",

                    weight:
                        selectedFlightId ===
                        flight.flight_id
                            ? 3
                            : 2,

                    opacity:
                        selectedFlightId ===
                        flight.flight_id
                            ? .92
                            : .52
                }
            )
            .addTo(
                trackLayer
            );

        }


        const marker =
            L.marker(
                position,
                {
                    icon:
                        createAircraftIcon(
                            flight
                        ),

                    riseOnHover:
                        true
                }
            );


        marker.bindTooltip(
            escapeHtml(
                flight.flight_number ||
                "BM FLIGHT"
            ),
            {
                permanent:
                    true,

                direction:
                    "top",

                offset: [
                    0,
                    -18
                ],

                className:
                    "aircraft-label"
            }
        );


        marker.on(
            "click",
            () =>
                selectFlight(
                    flight.flight_id
                )
        );


        marker.addTo(
            aircraftLayer
        );


        aircraftMarkers.set(
            flight.flight_id,
            marker
        );

    }

}


/* ============================================================
   FIT ALL FLIGHTS
   ============================================================ */

function fitFlights() {

    const positions =
        liveFlights
            .filter(
                validPosition
            )
            .map(
                flight => [
                    Number(
                        flight.latitude
                    ),
                    Number(
                        flight.longitude
                    )
                ]
            );


    if (
        positions.length === 0
    ) {

        map.setView(
            [
                52.2,
                -1.5
            ],
            5
        );

        return;

    }


    if (
        positions.length === 1
    ) {

        map.setView(
            positions[0],
            7
        );

        return;

    }


    map.fitBounds(
        L.latLngBounds(
            positions
        ),
        {
            padding: [
                60,
                60
            ],

            maxZoom:
                8
        }
    );

}


/* ============================================================
   EMPTY SELECTED FLIGHT
   ============================================================ */

function renderEmptyFlightDetail() {

    flightDetail.innerHTML = `

        <div class="flight-detail-empty">

            <div class="detail-aircraft-symbol">
                ✈
            </div>

            <strong>
                SELECT AN AIRCRAFT
            </strong>

            <span>
                Choose an aircraft on the map or
                from the active flight list.
            </span>

        </div>

    `;

}


/* ============================================================
   FLIGHT DETAIL
   ============================================================ */

function renderFlightDetail(
    flight
) {

    if (!flight) {

        renderEmptyFlightDetail();

        return;

    }


    const stale =
        isStale(
            flight
        );


    flightDetail.innerHTML = `

        <div class="detail-content">

            <span class="detail-flight-number">

                ${escapeHtml(
                    flight.flight_number ||
                    "—"
                )}

            </span>


            <h4 class="detail-route">

                ${escapeHtml(
                    flight.departure ||
                    "—"
                )}

                →

                ${escapeHtml(
                    flight.arrival ||
                    "—"
                )}

            </h4>


            <div class="detail-aircraft">

                ${escapeHtml(
                    flight.aircraft ||
                    "—"
                )}

                ${
                    flight.registration
                        ? ` · ${escapeHtml(
                            flight.registration
                        )}`
                        : ""
                }

            </div>


            <div
                class="detail-phase${stale ? " stale" : ""}"
            >

                <span>
                    FLIGHT PHASE
                </span>

                <strong>

                    ${
                        stale
                            ? "STALE CONNECTION"
                            : escapeHtml(
                                String(
                                    flight.flight_phase ||
                                    "UNKNOWN"
                                )
                                .toUpperCase()
                            )
                    }

                </strong>

            </div>


            <div class="detail-grid">

                <div class="detail-stat">

                    <span>
                        ALTITUDE
                    </span>

                    <strong>
                        ${escapeHtml(
                            formatAltitude(
                                flight.altitude
                            )
                        )}
                    </strong>

                </div>


                <div class="detail-stat">

                    <span>
                        GROUND SPEED
                    </span>

                    <strong>
                        ${escapeHtml(
                            formatSpeed(
                                flight.ground_speed
                            )
                        )}
                    </strong>

                </div>


                <div class="detail-stat">

                    <span>
                        VERTICAL SPEED
                    </span>

                    <strong>
                        ${escapeHtml(
                            formatVerticalSpeed(
                                flight.vertical_speed
                            )
                        )}
                    </strong>

                </div>


                <div class="detail-stat">

                    <span>
                        HEADING
                    </span>

                    <strong>
                        ${escapeHtml(
                            formatHeading(
                                flight.heading
                            )
                        )}
                    </strong>

                </div>

            </div>


            <div class="detail-meta">

                <div class="detail-meta-row">

                    <span>
                        PILOT ID
                    </span>

                    <strong>
                        ${escapeHtml(
                            flight.pilot_id ||
                            "—"
                        )}
                    </strong>

                </div>


                <div class="detail-meta-row">

                    <span>
                        STATUS
                    </span>

                    <strong>

                        ${
                            stale
                                ? "STALE"
                                : escapeHtml(
                                    flight.status ||
                                    "ACTIVE"
                                )
                        }

                    </strong>

                </div>


                <div class="detail-meta-row">

                    <span>
                        STARTED
                    </span>

                    <strong>
                        ${escapeHtml(
                            formatDateTime(
                                flight.started_at
                            )
                        )}
                    </strong>

                </div>


                <div class="detail-meta-row">

                    <span>
                        LAST HEARTBEAT
                    </span>

                    <strong>
                        ${escapeHtml(
                            formatHeartbeat(
                                flight.last_heartbeat ||
                                flight.updated_at
                            )
                        )}
                    </strong>

                </div>


                <div class="detail-meta-row">

                    <span>
                        POSITION
                    </span>

                    <strong>

                        ${
                            validPosition(
                                flight
                            )
                                ? `${Number(
                                    flight.latitude
                                ).toFixed(4)}, ${Number(
                                    flight.longitude
                                ).toFixed(4)}`
                                : "—"
                        }

                    </strong>

                </div>

            </div>

        </div>

    `;

}


/* ============================================================
   SELECT FLIGHT
   ============================================================ */

async function selectFlight(
    flightId
) {

    selectedFlightId =
        flightId;


    const flight =
        liveFlights.find(
            item =>
                item.flight_id ===
                flightId
        );


    if (!flight) {

        selectedFlightId =
            null;

        renderEmptyFlightDetail();

        await renderMap();

        renderTable();

        return;

    }


    renderFlightDetail(
        flight
    );


    renderTable();


    /*
     * Re-render markers so the selected aircraft
     * receives its white/red selection halo.
     *
     * We intentionally DO NOT pan or recenter the
     * map here. Management remains in control of
     * the map position.
     */

    await renderMap();

}


/* ============================================================
   ACTIVE FLIGHT TABLE
   ============================================================ */

function renderTable() {

    if (
        !liveFlights.length
    ) {

        activeFlightRows.innerHTML = `

            <div class="live-table-empty">

                No active ACARS flights.

            </div>

        `;

        return;

    }


    activeFlightRows.innerHTML =
        liveFlights
            .map(
                flight => {

                    const stale =
                        isStale(
                            flight
                        );


                    return `

                        <div
                            class="active-flight-row${
                                selectedFlightId ===
                                flight.flight_id
                                    ? " selected"
                                    : ""
                            }"
                            data-flight-id="${escapeHtml(
                                flight.flight_id
                            )}"
                        >

                            <span>

                                <strong>
                                    ${escapeHtml(
                                        flight.flight_number ||
                                        "—"
                                    )}
                                </strong>

                            </span>


                            <span>

                                ${escapeHtml(
                                    flight.departure ||
                                    "—"
                                )}

                                →

                                ${escapeHtml(
                                    flight.arrival ||
                                    "—"
                                )}

                            </span>


                            <span>

                                ${escapeHtml(
                                    flight.aircraft ||
                                    "—"
                                )}

                                ${
                                    flight.registration
                                        ? ` · ${escapeHtml(
                                            flight.registration
                                        )}`
                                        : ""
                                }

                            </span>


                            <span>

                                <span
                                    class="flight-phase-pill${
                                        stale
                                            ? " stale"
                                            : ""
                                    }"
                                >

                                    ${
                                        stale
                                            ? "STALE"
                                            : escapeHtml(
                                                String(
                                                    flight.flight_phase ||
                                                    "UNKNOWN"
                                                )
                                                .toUpperCase()
                                            )
                                    }

                                </span>

                            </span>


                            <span>

                                ${escapeHtml(
                                    formatAltitude(
                                        flight.altitude
                                    )
                                )}

                            </span>


                            <span>

                                ${escapeHtml(
                                    formatSpeed(
                                        flight.ground_speed
                                    )
                                )}

                            </span>


                            <span
                                class="${
                                    stale
                                        ? "heartbeat-stale"
                                        : "heartbeat-good"
                                }"
                            >

                                ${escapeHtml(
                                    formatHeartbeat(
                                        flight.last_heartbeat ||
                                        flight.updated_at
                                    )
                                )}

                            </span>

                        </div>

                    `;

                }
            )
            .join("");


    document
        .querySelectorAll(
            ".active-flight-row"
        )
        .forEach(
            row => {

                row.addEventListener(
                    "click",
                    () =>
                        selectFlight(
                            row.dataset.flightId
                        )
                );

            }
        );

}


/* ============================================================
   SUMMARY
   ============================================================ */

function renderSummary() {

    const active =
        liveFlights.length;


    const airborne =
        liveFlights.filter(
            isAirborne
        ).length;


    const stale =
        liveFlights.filter(
            isStale
        ).length;


    activeFlightCount.textContent =
        active;


    airborneCount.textContent =
        airborne;


    groundCount.textContent =
        active - airborne;


    staleCount.textContent =
        stale;

}


/* ============================================================
   LOAD LIVE OPERATIONS
   ============================================================ */

async function loadLiveOperations(
    initial = false
) {

    try {

        if (initial) {

            setConnectionState(
                "connecting",
                "CONNECTING"
            );

        }


        const {
            data,
            error
        } =
            await supabaseClient
                .from(
                    "live_operations"
                )
                .select(
                    `
                    flight_id,
                    pilot_id,
                    flight_number,
                    departure,
                    arrival,
                    aircraft,
                    registration,
                    latitude,
                    longitude,
                    altitude,
                    ground_speed,
                    vertical_speed,
                    heading,
                    flight_phase,
                    status,
                    started_at,
                    last_heartbeat,
                    updated_at
                    `
                )
                .order(
                    "started_at",
                    {
                        ascending: true
                    }
                );


        if (error) {

            throw error;

        }


        liveFlights =
            data || [];


        /*
         * IMPORTANT:
         *
         * If the selected flight has ended or has
         * disappeared from live_operations, clear it.
         *
         * This prevents old flight information remaining
         * in Selected Flight after ACARS has ended.
         */

        if (
            selectedFlightId &&
            !liveFlights.some(
                flight =>
                    flight.flight_id ===
                    selectedFlightId
            )
        ) {

            selectedFlightId =
                null;

            renderEmptyFlightDetail();

        }


        renderSummary();

        renderTable();

        await renderMap();


        if (
            selectedFlightId
        ) {

            const selectedFlight =
                liveFlights.find(
                    flight =>
                        flight.flight_id ===
                        selectedFlightId
                );


            renderFlightDetail(
                selectedFlight
            );

        }
        else {

            renderEmptyFlightDetail();

        }


        setConnectionState(
            "connected",
            "OPERATIONAL"
        );


        lastRefresh.textContent =
            `UPDATED ${
                new Intl.DateTimeFormat(
                    "en-GB",
                    {
                        hour:
                            "2-digit",

                        minute:
                            "2-digit",

                        second:
                            "2-digit"
                    }
                )
                .format(
                    new Date()
                )
            }`;


        /*
         * Fit aircraft only when the page first loads.
         *
         * Refreshes will NOT move the map.
         */

        if (initial) {

            fitFlights();

        }

    }
    catch (error) {

        console.error(
            "Unable to load live operations:",
            error
        );


        setConnectionState(
            "error",
            "DATA UNAVAILABLE"
        );


        activeFlightRows.innerHTML = `

            <div class="live-table-empty">

                Unable to load live ACARS operations.

            </div>

        `;


        lastRefresh.textContent =
            "LIVE DATA ERROR";

    }

}


/* ============================================================
   INITIALISE
   ============================================================ */

async function initialiseLiveOperations() {

    try {

        const {
            data: sessionData,
            error: sessionError
        } =
            await supabaseClient.auth
                .getSession();


        if (
            sessionError ||
            !sessionData.session
        ) {

            redirectToLogin();

            return;

        }


        const manager =
            await getManagementUser(
                sessionData.session.user.id
            );


        if (!manager) {

            await supabaseClient.auth
                .signOut();

            redirectToLogin();

            return;

        }


        managementName.textContent =
            manager.display_name;


        managementRole.textContent =
            manager.role;


        initialiseMap();


        authGate.classList.add(
            "hidden"
        );


        dashboardApp.classList.remove(
            "hidden"
        );


        setTimeout(
            () =>
                map.invalidateSize(),
            50
        );


        await loadLiveOperations(
            true
        );


        window.setInterval(
            () =>
                loadLiveOperations(
                    false
                ),
            REFRESH_INTERVAL_MS
        );

    }
    catch (error) {

        console.error(
            "Live Operations initialisation failed:",
            error
        );

        redirectToLogin();

    }

}


/* ============================================================
   EVENTS
   ============================================================ */

if (fitFlightsButton) {

    fitFlightsButton.addEventListener(
        "click",
        fitFlights
    );

}


if (signOutButton) {

    signOutButton.addEventListener(
        "click",
        signOut
    );

}


supabaseClient.auth
    .onAuthStateChange(
        event => {

            if (
                event ===
                "SIGNED_OUT"
            ) {

                redirectToLogin();

            }

        }
    );


initialiseLiveOperations();
