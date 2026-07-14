// ======================================================
// British Midland Virtual
// Network Engine v3.2
// Part 1 - Initialisation
// ======================================================

let map;
let networkData = null;

const BHX = [52.4539, -1.7480];

const colours = {

    active: "#d02823",

    future: "#8a8f98",

    hub: "#001a3a"

};

// ======================================================
// Load JSON
// ======================================================

async function loadNetwork() {

    try {

        const response = await fetch("assets/data/network.json");

        networkData = await response.json();

        initialiseMap();

        drawRoutes();

        buildDestinationCards();

    }

    catch (error) {

        console.error("Unable to load network.json");

        console.error(error);

    }

}

// ======================================================
// Leaflet Map
// ======================================================

function initialiseMap() {

    map = L.map("network-map", {

        zoomControl: true,

        scrollWheelZoom: false,

        attributionControl: false

    });

    map.setView(BHX, 5);

    L.tileLayer(

        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",

        {

            maxZoom: 18

        }

    ).addTo(map);

    createHub();

}

// ======================================================
// Birmingham Hub
// ======================================================

function createHub() {

    const hub = L.circleMarker(

        BHX,

        {

            radius:10,

            color:"#ffffff",

            weight:3,

            fillColor:colours.active,

            fillOpacity:1

        }

    );

    hub.addTo(map);

    hub.bindPopup(

        "<strong>Birmingham</strong><br>British Midland Hub"

    );

}
// ======================================================
// Airport Markers
// ======================================================

function drawRoutes() {

    networkData.destinations.forEach(destination => {

        createAirport(destination);

        createRoute(destination);

    });

}

// ======================================================
// Airport Marker
// ======================================================

function createAirport(destination) {

    const position = [

        destination.lat,

        destination.lon

    ];

    const active = destination.status === "active";

    const marker = L.circleMarker(

        position,

        {

            radius:7,

            color:"#ffffff",

            weight:2,

            fillColor:active
                ? colours.active
                : colours.future,

            fillOpacity:1

        }

    ).addTo(map);

 marker.on("click", () => {

    const card = document.getElementById(`card-${destination.iata}`);

    if (!card) return;

    card.scrollIntoView({

        behavior: "smooth",

        block: "center"

    });

    document
        .querySelectorAll(".destination-card")
        .forEach(c => c.classList.remove("selected"));

    card.classList.add("selected");

});

  } 

// ======================================================
// Route Line
// ======================================================

function createRoute(destination) {

    const active = destination.status === "active";

    const route = L.polyline(

        [

            BHX,

            [

                destination.lat,

                destination.lon

            ]

        ],

        {

            color:active
                ? colours.active
                : colours.future,

            weight:3,

            opacity:.9,

            dashArray:active
                ? null
                : "10 10"

        }

    );

    route.addTo(map);

}
// ======================================================
// Destination Cards
// ======================================================

function buildDestinationCards() {

    const grid = document.getElementById("destination-grid");

    if (!grid) return;

    grid.innerHTML = "";

    networkData.destinations.forEach(destination => {

        const card = document.createElement("div");

        card.className = "destination-card";

        card.id = `card-${destination.iata}`;

        card.innerHTML = `

            <div class="destination-status ${destination.status}">

                ${destination.status === "active"
                    ? "ACTIVE"
                    : "COMING SOON"}

            </div>

            <h3>

                ${destination.city}

            </h3>

            <p class="airport">

                ${destination.iata} • ${destination.icao}

            </p>

            <div class="destination-info">

                <div>

                    <span>Aircraft</span>

                    <strong>${destination.aircraft.join(" / ")}</strong>

                </div>

                <div>

                    <span>Status</span>

                    <strong>

                        ${destination.status === "active"
                            ? "Operating"
                            : "Future"}

                    </strong>

                </div>

            </div>

        `;

        grid.appendChild(card);

    });

}
    // ======================================================
// Destination Information
// ======================================================

const destinationInfo = {

    AMS: {
        flightTime: "1h 20m",
        description: "A vibrant European capital renowned for its canals, museums and rich history."
    },

    DUS: {
        flightTime: "1h 25m",
        description: "Germany's stylish business city on the Rhine with excellent international connections."
    },

    FRA: {
        flightTime: "1h 35m",
        description: "Europe's financial powerhouse and one of the continent's busiest aviation hubs."
    },

    CDG: {
        flightTime: "1h 20m",
        description: "The gateway to Paris, combining world-famous landmarks with international business."
    },

    DUB: {
        flightTime: "1h 00m",
        description: "A short hop across the Irish Sea to Ireland's welcoming capital."
    },

    BRU: {
        flightTime: "1h 15m",
        description: "The political capital of Europe and an important destination for business travel."
    },

    CPH: {
        flightTime: "1h 50m",
        description: "A modern Scandinavian capital famous for design, culture and waterfront living."
    },

    ZRH: {
        flightTime: "1h 45m",
        description: "Switzerland's financial centre surrounded by stunning Alpine scenery."
    },

    MAD: {
        flightTime: "2h 30m",
        description: "Spain's vibrant capital offering exceptional food, culture and architecture."
    },

    MXP: {
        flightTime: "2h 05m",
        description: "Northern Italy's gateway to fashion, business and the beautiful Italian Lakes."
    },

    JFK: {
        flightTime: "7h 30m",
        description: "Our future flagship transatlantic destination connecting Birmingham with New York."
    },

    MCO: {
        flightTime: "9h 10m",
        description: "Florida's home of sunshine, entertainment and world-famous attractions."
    },

    CUN: {
        flightTime: "10h 15m",
        description: "A future Caribbean gateway offering spectacular beaches and luxury resorts."
    },

    PUJ: {
        flightTime: "9h 20m",
        description: "A tropical paradise on the Dominican Republic's eastern coastline."
    }

};

// ======================================================
// Update Destination Cards
// ======================================================

function buildDestinationCards() {

    const grid = document.getElementById("destination-grid");

    if (!grid) return;

    grid.innerHTML = "";

    networkData.destinations.forEach(destination => {

        const info = destinationInfo[destination.iata];

        const card = document.createElement("div");

        card.className = "destination-card";

        card.id = `card-${destination.iata}`;

        card.innerHTML = `

            <div class="destination-status ${destination.status}">

                ${destination.status === "active"
                    ? "ACTIVE"
                    : "COMING SOON"}

            </div>

            <h3>${destination.city}</h3>

            <p class="airport">

                ${destination.iata} • ${destination.icao}

            </p>

            <p class="destination-description">

                ${info.description}

            </p>

            <div class="destination-info">

                <div>

                    <span>Flight Time</span>

                    <strong>${info.flightTime}</strong>

                </div>

                <div>

                    <span>Aircraft</span>

                    <strong>${destination.aircraft.join(" / ")}</strong>

                </div>

            </div>

        `;

        grid.appendChild(card);

    });

}

// ======================================================
// Initialise
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    loadNetwork();

});
