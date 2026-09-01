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

    if (aircraft.toLowerCase().includes("a350"))
        return "Airbus A350";

    return aircraft;
}

function setConnectionStatus(state, message) {
    if (operationsStatus)
        operationsStatus.textContent = message;

    if (!liveStatusBar) return;

    liveStatusBar.classList.remove("connected", "error");

    if (state === "connected")
        liveStatusBar.classList.add("connected");

    if (state === "error")
        liveStatusBar.classList.add("error");
}

async function initialiseLiveMap() {
    if (!liveMapContainer) return;

    liveMap = L.map("liveMap", {
        zoomControl: true,
        attributionControl: false
    });

    liveMap.setView([52.4539, -1.7480], 6);

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 18
        }
    ).addTo(liveMap);
}

const aircraftSvg = `
<svg
    viewBox="0 0 64 64"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    width="28"
    height="28"
>
    <path
        fill="#d02823"
        stroke="#ffffff"
        stroke-width="1.2"
        stroke-linejoin="round"
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

function createAircraftIcon(heading = 0) {
    const hdg = Number(heading) || 0;

    return L.divIcon({
        className: "bm-aircraft",
        html: `
            <div style="
                width:32px;
                height:32px;
                display:flex;
                align-items:center;
                justify-content:center;
                transform:rotate(${hdg}deg);
                transform-origin:center center;
            ">
                ${aircraftSvg}
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });
}

async function loadFlightTracks() {
    if (!liveMap) return;

    const activeFlightIds = liveFlights
        .map(flight => flight.flight_id)
        .filter(Boolean);

    const visibleTrackIds = new Set(activeFlightIds);

    if (activeFlightIds.length === 0) {
        liveTracks.forEach(track => liveMap.removeLayer(track));
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
        .in("active_flight_id", activeFlightIds)
        .order("recorded_at", { ascending: true });

    if (error) throw error;

    const groupedTracks = new Map();

    (data || []).forEach(point => {
        if (
            point.latitude === null ||
            point.longitude === null
        ) {
            return;
        }

        if (!groupedTracks.has(point.active_flight_id)) {
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

        let track =
            liveTracks.get(flightId);

        const isSelected =
            flightId === selectedFlightId;

        const trackOptions = {
            color: "#d02823",
            weight: isSelected ? 4 : 2,
            opacity: isSelected ? 0.95 : 0.55,
            lineCap: "round",
            lineJoin: "round",
            interactive: false
        };

        if (points.length < 2) {
            if (track) {
                liveMap.removeLayer(track);
                liveTracks.delete(flightId);
            }
            return;
        }

        if (!track) {
            track = L.polyline(points, trackOptions);
            liveTracks.set(flightId, track);
        } else {
            track.setLatLngs(points);
            track.setStyle(trackOptions);
        }

    });

    liveTracks.forEach((track, flightId) => {
        if (!visibleTrackIds.has(flightId)) {
            liveMap.removeLayer(track);
            liveTracks.delete(flightId);
        }
    });
}

function highlightTrackForSelection() {
    liveTracks.forEach((track, flightId) => {
        const isSelected =
            selectedFlightId &&
            flightId === selectedFlightId;

        if (isSelected) {
            if (!liveMap.hasLayer(track)) {
                track.addTo(liveMap);
            }

            track.setStyle({
                color: "#d02823",
                weight: 4,
                opacity: 0.95,
                lineCap: "round",
                lineJoin: "round"
            });
        } else {
            if (liveMap.hasLayer(track)) {
                liveMap.removeLayer(track);
            }
        }
    });
}

function updateAircraftMarkers() {
    if (!liveMap) return;

    const visibleFlights = new Set();

    liveFlights.forEach(flight => {
        if (
            flight.latitude === null ||
            flight.longitude === null
        ) {
            return;
        }

        visibleFlights.add(flight.flight_id);

        let marker =
            liveMarkers.get(flight.flight_id);

        if (!marker) {
            marker = L.marker(
                [
                    flight.latitude,
                    flight.longitude
                ],
                {
                    icon:
                        createAircraftIcon(
                            Number(flight.heading)
                        )
                }
            );

            marker.addTo(liveMap);

            marker.on("click", () => {
                selectedFlightId =
                    flight.flight_id;

                renderSelectedFlight();
                highlightSelectedFlight();
                highlightTrackForSelection();
            });

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
                Number(flight.heading)
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

    liveMarkers.forEach((marker, id) => {
        if (!visibleFlights.has(id)) {
            liveMap.removeLayer(marker);
            liveMarkers.delete(id);
        }
    });

    if (
        firstMapLoad &&
        liveFlights.length > 0
    ) {
        const bounds =
            L.latLngBounds(
                liveFlights
                    .filter(
                        f =>
                            f.latitude !== null &&
                            f.longitude !== null
                    )
                    .map(
                        f => [
                            f.latitude,
                            f.longitude
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
        clearInterval(liveRefreshTimer);
    }

    liveRefreshTimer = setInterval(
        refreshLiveOperations,
        5000
    );
}

function stopLiveOperations() {
    if (!liveRefreshTimer) return;

    clearInterval(liveRefreshTimer);
    liveRefreshTimer = null;
}

window.addEventListener(
    "beforeunload",
    stopLiveOperations
);

async function loadLiveFlights() {
    const {
        data,
        error
    } = await supabaseClient
        .from("public_live_operations")
        .select("*")
        .order("flight_number");

    if (error) throw error;

    liveFlights = data || [];

    if (liveAircraftCount) {
        liveAircraftCount.textContent =
            liveFlights.length;
    }

    updateAircraftMarkers();

    // Track history is supplementary and must never interrupt ACARS.
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

function renderFlightSidebar() {
    if (!liveFlightList) return;

    if (liveFlights.length === 0) {
        liveFlightList.innerHTML = `
            <div class="loading-flights">
                No British Midland aircraft are currently online.
            </div>
        `;
        return;
    }

    liveFlightList.innerHTML =
        liveFlights.map(flight => `
            <div
                class="live-flight-card ${
                    selectedFlightId === flight.flight_id
                        ? "active"
                        : ""
                }"
                data-flight="${flight.flight_id}"
            >
                <div class="live-flight-header">
                    <div class="live-flight-number">
                        ${escapeHtml(
                            flight.flight_number
                        )}
                    </div>

                    <div class="live-flight-phase">
                        ${escapeHtml(
                            flight.flight_phase || "UNKNOWN"
                        )}
                    </div>
                </div>

                <div class="live-route">
                    ${escapeHtml(flight.departure)}
                    →
                    ${escapeHtml(flight.arrival)}
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
                            ${(flight.altitude || 0)
                                .toLocaleString()} ft
                        </span>
                    </div>

                    <div class="live-detail">
                        <label>Speed</label>
                        <span>
                            ${flight.ground_speed || 0} kt
                        </span>
                    </div>

                    <div class="live-detail">
                        <label>Heading</label>
                        <span>
                            ${flight.heading || 0}°
                        </span>
                    </div>
                </div>
            </div>
        `).join("");

    liveFlightList
        .querySelectorAll(".live-flight-card")
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

function highlightSelectedFlight() {
    if (!liveFlightList) return;

    liveFlightList
        .querySelectorAll(".live-flight-card")
        .forEach(card => {
            card.classList.toggle(
                "active",
                card.dataset.flight === selectedFlightId
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
            f =>
                f.flight_id ===
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
                        flight.flight_phase
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
                        ${(flight.altitude || 0)
                            .toLocaleString()} ft
                    </strong>
                </div>

                <div class="selected-item">
                    <label>Ground Speed</label>
                    <strong>
                        ${flight.ground_speed || 0} kt
                    </strong>
                </div>

                <div class="selected-item">
                    <label>Heading</label>
                    <strong>
                        ${flight.heading || 0}°
                    </strong>
                </div>

                <div class="selected-item">
                    <label>Vertical Speed</label>
                    <strong>
                        ${flight.vertical_speed || 0} fpm
                    </strong>
                </div>
            </div>
        </div>
    `;
}

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
            formatNumber(data.active_pilots);
    }

    if (totalFlights) {
        totalFlights.textContent =
            formatNumber(data.total_flights);
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
            formatNumber(data.total_landings);
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
            formatNumber(data.total_go_arounds);
    }

    if (lastOperation) {
        lastOperation.textContent =
            formatDateTime(
                data.last_operation_at
            );
    }

    if (acarsPilotCount) {
        acarsPilotCount.textContent =
            formatNumber(data.active_pilots);
    }

    if (acarsFlightCount) {
        acarsFlightCount.textContent =
            formatNumber(data.total_flights);
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
                    operation.flight_number || "—"
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
                            operation.pilot_id || ""
                        )}
                    </small>
                </div>
            </td>

            <td class="route-cell">
                ${escapeHtml(
                    operation.departure || "—"
                )}

                <span class="route-arrow">
                    →
                </span>

                ${escapeHtml(
                    operation.arrival || "—"
                )}
            </td>

            <td
                class="aircraft-cell"
                title="${escapeHtml(
                    operation.aircraft || ""
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
                    operation.registration || "—"
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
                <span class="score-pill ${scoreClass}">
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

    if (!data || data.length === 0) {
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
        displayOperationsError(error);
    }
}

document.addEventListener(
    "DOMContentLoaded",
    initialiseOperations
);
