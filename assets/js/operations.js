// ============================================================
// BRITISH MIDLAND VIRTUAL
// PUBLIC OPERATIONS CENTRE
// LIVE ACARS DATA
// ============================================================

const SUPABASE_URL =
    "https://eqbaezhcwnjlcnvtfxho.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable__JTXMIQDaruQdmjEmf9t6w_T23MXelW";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );

const activePilots = document.getElementById("activePilots");
const totalFlights = document.getElementById("totalFlights");
const totalFlightTime = document.getElementById("totalFlightTime");
const totalLandings = document.getElementById("totalLandings");
const averageLanding = document.getElementById("averageLanding");
const bestLanding = document.getElementById("bestLanding");
const totalGoArounds = document.getElementById("totalGoArounds");
const lastOperation = document.getElementById("lastOperation");
const operationsStatus = document.getElementById("operationsStatus");
const recentOperations = document.getElementById("recentOperations");

const acarsPilotCount = document.getElementById("acarsPilotCount");
const acarsFlightCount = document.getElementById("acarsFlightCount");
const acarsFlightTime = document.getElementById("acarsFlightTime");
const acarsLastSubmission = document.getElementById("acarsLastSubmission");

const liveStatusBar = document.querySelector(".live-status-bar");

const liveMapContainer = document.getElementById("liveMap");
const liveFlightList = document.getElementById("liveFlights");
const selectedFlightPanel = document.getElementById("selectedFlight");
const liveAircraftCount = document.getElementById("liveAircraftCount");

let liveMap = null;
let liveMarkers = new Map();
let liveTracks = new Map();
let liveFlights = [];
let selectedFlightId = null;
let liveRefreshTimer = null;
let firstMapLoad = true;


// ============================================================
// GENERAL HELPERS
// ============================================================

function formatNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "—";
    return number.toLocaleString("en-GB");
}

function formatFlightTime(hours, remainingMinutes) {
    const safeHours = Number(hours) || 0;
    const safeMinutes = Number(remainingMinutes) || 0;
    return `${safeHours}h ${String(safeMinutes).padStart(2, "0")}m`;
}

function formatBlockTime(minutes) {
    const totalMinutes = Number(minutes);
    if (!Number.isFinite(totalMinutes)) return "—";

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    if (hours === 0) return `${mins}m`;

    return `${hours}h ${String(mins).padStart(2, "0")}m`;
}

function formatLandingRate(value) {
    const landingRate = Number(value);
    if (!Number.isFinite(landingRate)) return "—";
    return `${landingRate.toLocaleString("en-GB")}`;
}

function getLandingClass(value) {
    const rate = Math.abs(Number(value));
    if (!Number.isFinite(rate)) return "";
    if (rate <= 300) return "landing-good";
    if (rate <= 600) return "landing-medium";
    return "landing-hard";
}

function getScoreClass(score) {
    const value = Number(score);
    if (!Number.isFinite(value)) return "";
    if (value >= 90) return "";
    if (value >= 75) return "score-medium";
    return "score-low";
}

function formatDateTime(value) {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }).format(date);
}

function formatShortDate(value) {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
    }).format(date);
}

function escapeHtml(value) {
    if (value === null || value === undefined) return "";

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatAircraftName(value) {
    if (!value) return "—";

    const aircraft = String(value);

    if (aircraft.toLowerCase().includes("a319"))
        return "Airbus A319";

    if (aircraft.toLowerCase().includes("a320neo"))
        return "Airbus A320neo";

    if (aircraft.toLowerCase().includes("a320"))
        return "Airbus A320";

    if (aircraft.toLowerCase().includes("a321"))
        return "Airbus A321";

    if (aircraft.toLowerCase().includes("a330"))
        return "Airbus A330";

    if (aircraft.toLowerCase().includes("a340"))
        return "Airbus A340";

    if (
        aircraft.toLowerCase().includes("atr") ||
        aircraft.toLowerCase().includes("dh8") ||
        aircraft.toLowerCase().includes("dash")
    )
        return "ATR 72";

    if (
        aircraft.toLowerCase().includes("f100") ||
        aircraft.toLowerCase().includes("fokker 100")
    )
        return "Fokker 100";

    return aircraft;
}


// ============================================================
// EUROPEAN CARGO / AIRCRAFT IDENTIFICATION
// ============================================================

function isEuropeanCargoFlight(flight) {
    if (!flight) return false;

    const flightNumber = String(
        flight.flight_number || ""
    ).toUpperCase();

    return flightNumber.startsWith("URO");
}

function getAircraftIconFile(flight) {
    if (isEuropeanCargoFlight(flight)) {
        return "a340.svg";
    }

    const aircraft = String(
        flight.aircraft || ""
    ).toLowerCase();

    // A319 / A320 / A321
    if (
        aircraft.includes("a319") ||
        aircraft.includes("a320") ||
        aircraft.includes("a321")
    ) {
        return "a320.svg";
    }

    // A330
    if (aircraft.includes("a330")) {
        return "a330.svg";
    }

    // ATR72 / turboprop
    if (
        aircraft.includes("atr") ||
        aircraft.includes("dh8") ||
        aircraft.includes("dash") ||
        aircraft.includes("turboprop")
    ) {
        return "dh8a.svg";
    }

    // Fokker 100
    if (
        aircraft.includes("f100") ||
        aircraft.includes("fokker 100")
    ) {
        return "f100.svg";
    }

    // Safe default
    return "a320.svg";
}

function getFlightColour(flight) {
    return isEuropeanCargoFlight(flight)
        ? "#8994A1"
        : "#d02823";
}


// ============================================================
// CONNECTION STATUS
// ============================================================

function setConnectionStatus(state, message) {
    if (operationsStatus)
        operationsStatus.textContent = message;

    if (!liveStatusBar) return;

    liveStatusBar.classList.remove(
        "connected",
        "error"
    );

    if (state === "connected")
        liveStatusBar.classList.add("connected");

    if (state === "error")
        liveStatusBar.classList.add("error");
}


// ============================================================
// LIVE MAP
// ============================================================

async function initialiseLiveMap() {
    if (!liveMapContainer) return;

    liveMap = L.map("liveMap", {
        zoomControl: true,
        attributionControl: false
    });

    liveMap.setView(
        [52.4539, -1.7480],
        6
    );

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 18
        }
    ).addTo(liveMap);
}


// ============================================================
// AIRCRAFT ICON
// ============================================================

function createAircraftIcon(flight) {
    const heading =
        Number(flight.heading) || 0;

    const iconFile =
        getAircraftIconFile(flight);

    return L.divIcon({
        className: "bm-aircraft",

        html: `
            <div style="
                width:32px;
                height:32px;
                display:flex;
                align-items:center;
                justify-content:center;
                transform:rotate(${heading}deg);
                transform-origin:center center;
            ">
                <img
                    src="/assets/images/aircraft/${iconFile}"
                    width="32"
                    height="32"
                    style="
                        display:block;
                        width:32px;
                        height:32px;
                    "
                    alt=""
                >
            </div>
        `,

        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });
}


// ============================================================
// FLIGHT TRACKS
//
// Tracks are supplementary.
// They are created for active flights but are only added
// to the map when that aircraft is selected.
//
// British Midland = red
// European Cargo (URO) = grey
// ============================================================

async function loadFlightTracks() {
    if (!liveMap) return;

    const activeFlightIds =
        liveFlights
            .map(flight => flight.flight_id)
            .filter(Boolean);

    const visibleTrackIds =
        new Set(activeFlightIds);

    if (activeFlightIds.length === 0) {
        liveTracks.forEach(track => {
            if (liveMap.hasLayer(track)) {
                liveMap.removeLayer(track);
            }
        });

        liveTracks.clear();
        return;
    }

    const {
        data,
        error
    } = await supabaseClient
        .from("flight_track_points")
        .select(`
            active_flight_id,
            latitude,
            longitude,
            recorded_at
        `)
        .in(
            "active_flight_id",
            activeFlightIds
        )
        .order(
            "recorded_at",
            {
                ascending: true
            }
        );

    if (error) throw error;

    const groupedTracks =
        new Map();

    (data || []).forEach(point => {
        if (
            point.latitude === null ||
            point.longitude === null
        ) {
            return;
        }

        if (
            !groupedTracks.has(
                point.active_flight_id
            )
        ) {
            groupedTracks.set(
                point.active_flight_id,
                []
            );
        }

        groupedTracks
            .get(point.active_flight_id)
            .push([
                Number(point.latitude),
                Number(point.longitude)
            ]);
    });

    activeFlightIds.forEach(flightId => {
        const points =
            groupedTracks.get(flightId) || [];

        const flight =
            liveFlights.find(
                item =>
                    item.flight_id === flightId
            );

        const isSelected =
            flightId === selectedFlightId;

        const trackColour =
            getFlightColour(flight);

        const trackOptions = {
            color: trackColour,
            weight: isSelected ? 4 : 2,
            opacity: isSelected ? 0.95 : 0.55,
            lineCap: "round",
            lineJoin: "round",
            interactive: false
        };

        let track =
            liveTracks.get(flightId);

        if (points.length < 2) {
            if (track) {
                if (liveMap.hasLayer(track)) {
                    liveMap.removeLayer(track);
                }

                liveTracks.delete(
                    flightId
                );
            }

            return;
        }

        if (!track) {
            track =
                L.polyline(
                    points,
                    trackOptions
                );

            liveTracks.set(
                flightId,
                track
            );

            // Do NOT add the track here.
            // It only appears when selected.
        }
        else {
            track.setLatLngs(points);
            track.setStyle(trackOptions);
        }

        // Make absolutely sure an unselected track
        // remains hidden.
        if (
            !isSelected &&
            liveMap.hasLayer(track)
        ) {
            liveMap.removeLayer(track);
        }

        // Selected track should be visible.
        if (
            isSelected &&
            !liveMap.hasLayer(track)
        ) {
            track.addTo(liveMap);
        }
    });

    liveTracks.forEach(
        (track, flightId) => {
            if (
                !visibleTrackIds.has(
                    flightId
                )
            ) {
                if (
                    liveMap.hasLayer(track)
                ) {
                    liveMap.removeLayer(track);
                }

                liveTracks.delete(
                    flightId
                );
            }
        }
    );
}


// ============================================================
// TRACK SELECTION / HIGHLIGHT
// ============================================================

function highlightTrackForSelection() {
    if (!liveMap) return;

    liveTracks.forEach(
        (track, flightId) => {
            const isSelected =
                selectedFlightId &&
                flightId === selectedFlightId;

            const flight =
                liveFlights.find(
                    item =>
                        item.flight_id ===
                        flightId
                );

            const trackColour =
                getFlightColour(flight);

            if (isSelected) {
                if (
                    !liveMap.hasLayer(track)
                ) {
                    track.addTo(liveMap);
                }

                track.setStyle({
                    color: trackColour,
                    weight: 4,
                    opacity: 0.95,
                    lineCap: "round",
                    lineJoin: "round"
                });
            }
            else {
                if (
                    liveMap.hasLayer(track)
                ) {
                    liveMap.removeLayer(track);
                }
            }
        }
    );
}


// ============================================================
// AIRCRAFT MARKERS
// ============================================================

function updateAircraftMarkers() {
    if (!liveMap) return;

    const visibleFlights =
        new Set();

    liveFlights.forEach(flight => {
        if (
            flight.latitude === null ||
            flight.longitude === null
        ) {
            return;
        }

        visibleFlights.add(
            flight.flight_id
        );

        let marker =
            liveMarkers.get(
                flight.flight_id
            );

        if (!marker) {
            marker =
                L.marker(
                    [
                        flight.latitude,
                        flight.longitude
                    ],
                    {
                        icon:
                            createAircraftIcon(
                                flight
                            )
                    }
                );

            marker.addTo(liveMap);

            marker.on(
                "click",
                () => {
                    selectedFlightId =
                        flight.flight_id;

                    renderSelectedFlight();
                    highlightSelectedFlight();
                    highlightTrackForSelection();
                }
            );

            liveMarkers.set(
                flight.flight_id,
                marker
            );
        }

        marker.setLatLng([
            flight.latitude,
            flight.longitude
        ]);

        marker.setIcon(
            createAircraftIcon(
                flight
            )
        );

        marker.bindPopup(`
            <div class="live-aircraft-popup">

                <strong>
                    ${escapeHtml(
                        flight.flight_number
                    )}
                </strong>

                <div>
                    ${escapeHtml(
                        flight.departure
                    )}
                    →
                    ${escapeHtml(
                        flight.arrival
                    )}
                </div>

                <div>
                    ${escapeHtml(
                        formatAircraftName(
                            flight.aircraft
                        )
                    )}
                </div>

                <div>
                    ${flight.ground_speed || 0} kt
                </div>

                <div>
                    FL ${Math.round(
                        (flight.altitude || 0) / 100
                    )}
                </div>

            </div>
        `);
    });

    liveMarkers.forEach(
        (marker, id) => {
            if (
                !visibleFlights.has(id)
            ) {
                liveMap.removeLayer(
                    marker
                );

                liveMarkers.delete(id);
            }
        }
    );

    if (
        firstMapLoad &&
        liveFlights.length > 0
    ) {
        const bounds =
            L.latLngBounds(
                liveFlights
                    .filter(
                        flight =>
                            flight.latitude !== null &&
                            flight.longitude !== null
                    )
                    .map(
                        flight => [
                            flight.latitude,
                            flight.longitude
                        ]
                    )
            );

        if (bounds.isValid()) {
            liveMap.fitBounds(
                bounds,
                {
                    padding: [60, 60]
                }
            );
        }

        firstMapLoad = false;
    }
}


// ============================================================
// LIVE OPERATIONS REFRESH
// ============================================================

async function refreshLiveOperations() {
    try {
        await loadLiveFlights();

        highlightSelectedFlight();
        highlightTrackForSelection();

        setConnectionStatus(
            "connected",
            "OPERATIONAL"
        );
    }
    catch (error) {
        console.error(
            "Live Operations refresh failed:",
            error
        );

        setConnectionStatus(
            "error",
            "LIVE DATA UNAVAILABLE"
        );
    }
}

function startLiveOperations() {
    if (liveRefreshTimer) {
        clearInterval(
            liveRefreshTimer
        );
    }

    liveRefreshTimer =
        setInterval(
            refreshLiveOperations,
            5000
        );
}

function stopLiveOperations() {
    if (!liveRefreshTimer) return;

    clearInterval(
        liveRefreshTimer
    );

    liveRefreshTimer = null;
}

window.addEventListener(
    "beforeunload",
    stopLiveOperations
);


// ============================================================
// LOAD LIVE FLIGHTS
// ============================================================

async function loadLiveFlights() {
    const {
        data,
        error
    } = await supabaseClient
        .from("public_live_operations")
        .select("*")
        .order(
            "flight_number"
        );

    if (error) throw error;

    liveFlights =
        data || [];

    if (liveAircraftCount) {
        liveAircraftCount.textContent =
            liveFlights.length;
    }

    updateAircraftMarkers();

    // Track history is supplementary and must never
    // interrupt live ACARS data.
    try {
        await loadFlightTracks();
    }
    catch (trackError) {
        console.error(
            "Track history failed (ACARS remains operational):",
            trackError
        );
    }

    renderFlightSidebar();
    renderSelectedFlight();
}


// ============================================================
// FLIGHT SIDEBAR
// ============================================================

function renderFlightSidebar() {
    if (!liveFlightList) return;

    if (liveFlights.length === 0) {
        liveFlightList.innerHTML = `
            <div class="loading-flights">
                No aircraft are currently online.
            </div>
        `;

        return;
    }

    liveFlightList.innerHTML =
        liveFlights
            .map(flight => `
                <div
                    class="live-flight-card ${
                        selectedFlightId ===
                        flight.flight_id
                            ? "active"
                            : ""
                    }"
                    data-flight="${
                        flight.flight_id
                    }"
                >

                    <div class="live-flight-header">

                        <div class="live-flight-number">
                            ${escapeHtml(
                                flight.flight_number
                            )}
                        </div>

                        <div class="live-flight-phase">
                            ${escapeHtml(
                                flight.flight_phase ||
                                "UNKNOWN"
                            )}
                        </div>

                    </div>

                    <div class="live-route">
                        ${escapeHtml(
                            flight.departure
                        )}
                        →
                        ${escapeHtml(
                            flight.arrival
                        )}
                    </div>

                    <div class="live-flight-details">

                        <div class="live-detail">
                            <label>Aircraft</label>
                            <span>
                                ${escapeHtml(
                                    formatAircraftName(
                                        flight.aircraft
                                    )
                                )}
                            </span>
                        </div>

                        <div class="live-detail">
                            <label>Altitude</label>
                            <span>
                                ${(
                                    flight.altitude ||
                                    0
                                ).toLocaleString()} ft
                            </span>
                        </div>

                        <div class="live-detail">
                            <label>Speed</label>
                            <span>
                                ${
                                    flight.ground_speed ||
                                    0
                                } kt
                            </span>
                        </div>

                        <div class="live-detail">
                            <label>Heading</label>
                            <span>
                                ${
                                    flight.heading ||
                                    0
                                }°
                            </span>
                        </div>

                    </div>

                </div>
            `)
            .join("");

    liveFlightList
        .querySelectorAll(
            ".live-flight-card"
        )
        .forEach(card => {
            card.addEventListener(
                "click",
                () => {
                    selectedFlightId =
                        card.dataset.flight;

                    renderSelectedFlight();
                    highlightSelectedFlight();
                    highlightTrackForSelection();
                }
            );
        });
}


// ============================================================
// SELECTED FLIGHT
// ============================================================

function highlightSelectedFlight() {
    if (!liveFlightList) return;

    liveFlightList
        .querySelectorAll(
            ".live-flight-card"
        )
        .forEach(card => {
            card.classList.toggle(
                "active",
                card.dataset.flight ===
                    selectedFlightId
            );
        });
}

function renderSelectedFlight() {
    if (!selectedFlightPanel) return;

    if (!selectedFlightId) {
        selectedFlightPanel.innerHTML = `
            Select an aircraft from the map or list
            to view live information.
        `;

        return;
    }

    const flight =
        liveFlights.find(
            item =>
                item.flight_id ===
                selectedFlightId
        );

    if (!flight) {
        return;
    }

    selectedFlightPanel.innerHTML = `
        <div class="selected-flight-content">

            <div class="selected-flight-title">

                <h3>
                    ${escapeHtml(
                        flight.flight_number
                    )}
                </h3>

                <span>
                    ${escapeHtml(
                        flight.flight_phase ||
                        "UNKNOWN"
                    )}
                </span>

            </div>

            <div class="selected-grid">

                <div class="selected-item">
                    <label>Route</label>
                    <strong>
                        ${escapeHtml(
                            flight.departure
                        )}
                        →
                        ${escapeHtml(
                            flight.arrival
                        )}
                    </strong>
                </div>

                <div class="selected-item">
                    <label>Aircraft</label>
                    <strong>
                        ${escapeHtml(
                            formatAircraftName(
                                flight.aircraft
                            )
                        )}
                    </strong>
                </div>

                <div class="selected-item">
                    <label>Altitude</label>
                    <strong>
                        ${(
                            flight.altitude ||
                            0
                        ).toLocaleString()} ft
                    </strong>
                </div>

                <div class="selected-item">
                    <label>Ground Speed</label>
                    <strong>
                        ${
                            flight.ground_speed ||
                            0
                        } kt
                    </strong>
                </div>

                <div class="selected-item">
                    <label>Heading</label>
                    <strong>
                        ${
                            flight.heading ||
                            0
                        }°
                    </strong>
                </div>

                <div class="selected-item">
                    <label>Vertical Speed</label>
                    <strong>
                        ${
                            flight.vertical_speed ||
                            0
                        } fpm
                    </strong>
                </div>

            </div>

        </div>
    `;
}


// ============================================================
// OPERATIONS STATISTICS
// ============================================================

async function loadOperationsStatistics() {
    const {
        data,
        error
    } = await supabaseClient
        .from("public_operations_statistics")
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


// ============================================================
// RECENT OPERATIONS
// ============================================================

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
            ? ` ${escapeHtml(
                operation.flight_grade
            )}`
            : "";

    return `
        <tr>

            <td class="flight-number">
                ${escapeHtml(
                    operation.flight_number ||
                    "—"
                )}
            </td>

            <td>
                <div class="pilot-cell">

                    <strong>
                        ${escapeHtml(
                            operation.pilot_name ||
                            operation.pilot_id ||
                            "—"
                        )}
                    </strong>

                    <small>
                        ${escapeHtml(
                            operation.pilot_id ||
                            ""
                        )}
                    </small>

                </div>
            </td>

            <td class="route-cell">
                ${escapeHtml(
                    operation.departure ||
                    "—"
                )}

                <span class="route-arrow">
                    →
                </span>

                ${escapeHtml(
                    operation.arrival ||
                    "—"
                )}
            </td>

            <td
                class="aircraft-cell"
                title="${escapeHtml(
                    operation.aircraft ||
                    ""
                )}"
            >
                ${escapeHtml(
                    formatAircraftName(
                        operation.aircraft
                    )
                )}
            </td>

            <td class="registration-cell">
                ${escapeHtml(
                    operation.registration ||
                    "—"
                )}
            </td>

            <td>
                ${escapeHtml(
                    formatBlockTime(
                        operation.block_minutes
                    )
                )}
            </td>

            <td class="${landingClass}">
                ${
                    operation.landing_rate_fpm !== null &&
                    operation.landing_rate_fpm !== undefined
                        ? `${escapeHtml(
                            formatLandingRate(
                                operation.landing_rate_fpm
                            )
                        )} fpm`
                        : "—"
                }
            </td>

            <td>
                <span
                    class="score-pill ${scoreClass}"
                >
                    ${escapeHtml(score)}${grade}
                </span>
            </td>

        </tr>
    `;
}

async function loadRecentOperations() {
    const {
        data,
        error
    } = await supabaseClient
        .from("public_recent_operations")
        .select(`
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
        `)
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
            .map(createOperationRow)
            .join("");

    return data;
}


// ============================================================
// ERROR HANDLING
// ============================================================

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


// ============================================================
// INITIALISE OPERATIONS CENTRE
// ============================================================

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
            loadRecentOperations(),
            initialiseLiveMap(),
            loadLiveFlights()
        ]);

        startLiveOperations();

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

document.addEventListener(
    "DOMContentLoaded",
    initialiseOperations
);
