/* ==========================================================
   BRITISH MIDLAND VIRTUAL
   NETWORK ENGINE
   OUTBOUND NETWORK VERSION
   ==========================================================

   NETWORK STRUCTURE

   BEATING HEART CLASS
   -------------------
   30 current outbound routes from Birmingham (BHX)

   PIONEER CLASS
   -------------
   5 current outbound long-haul routes from Birmingham (BHX)

   FOUNDRY CLASS
   -------------
   Not displayed here.
   Foundry remains a future / coming-soon operation.

   ========================================================== */


/* ==========================================================
   GLOBAL
========================================================== */

let map;


/* ==========================================================
   BIRMINGHAM HUB
========================================================== */

const BHX = [52.4539, -1.7480];


/* ==========================================================
   BRAND COLOURS
========================================================== */

const colours = {

    A319: "#2E6FA3",

    A320: "#D02823",

    A321: "#C9A227",

    A350: "#8A8F98",

    hub: "#001A3A"

};


/* ==========================================================
   BEATING HEART CLASS
   OUTBOUND ROUTES ONLY
========================================================== */

const beatingHeartRoutes = [

    {
        flight: "BMA201",
        city: "Amsterdam",
        iata: "AMS",
        icao: "EHAM",
        aircraft: "A320",
        time: "1:15",
        lat: 52.3086,
        lon: 4.7639
    },

    {
        flight: "BMA211",
        city: "Dublin",
        iata: "DUB",
        icao: "EIDW",
        aircraft: "A319",
        time: "1:10",
        lat: 53.4213,
        lon: -6.2701
    },

    {
        flight: "BMA221",
        city: "Paris CDG",
        iata: "CDG",
        icao: "LFPG",
        aircraft: "A320",
        time: "1:30",
        lat: 49.0097,
        lon: 2.5479
    },

    {
        flight: "BMA231",
        city: "Düsseldorf",
        iata: "DUS",
        icao: "EDDL",
        aircraft: "A319",
        time: "1:20",
        lat: 51.2895,
        lon: 6.7668
    },

    {
        flight: "BMA241",
        city: "Frankfurt",
        iata: "FRA",
        icao: "EDDF",
        aircraft: "A320",
        time: "1:30",
        lat: 50.0379,
        lon: 8.5622
    },

    {
        flight: "BMA251",
        city: "Munich",
        iata: "MUC",
        icao: "EDDM",
        aircraft: "A320",
        time: "1:40",
        lat: 48.3538,
        lon: 11.7861
    },

    {
        flight: "BMA261",
        city: "Brussels",
        iata: "BRU",
        icao: "EBBR",
        aircraft: "A319",
        time: "1:15",
        lat: 50.9014,
        lon: 4.4844
    },

    {
        flight: "BMA271",
        city: "Zurich",
        iata: "ZRH",
        icao: "LSZH",
        aircraft: "A320",
        time: "1:45",
        lat: 47.4581,
        lon: 8.5555
    },

    {
        flight: "BMA281",
        city: "Copenhagen",
        iata: "CPH",
        icao: "EKCH",
        aircraft: "A320",
        time: "1:50",
        lat: 55.6180,
        lon: 12.6508
    },

    {
        flight: "BMA291",
        city: "Stockholm ARN",
        iata: "ARN",
        icao: "ESSA",
        aircraft: "A320",
        time: "2:20",
        lat: 59.6519,
        lon: 17.9186
    },

    {
        flight: "BMA301",
        city: "Oslo OSL",
        iata: "OSL",
        icao: "ENGM",
        aircraft: "A320",
        time: "2:00",
        lat: 60.1939,
        lon: 11.1004
    },

    {
        flight: "BMA311",
        city: "Vienna",
        iata: "VIE",
        icao: "LOWW",
        aircraft: "A320",
        time: "1:55",
        lat: 48.1103,
        lon: 16.5697
    },

    {
        flight: "BMA321",
        city: "Madrid",
        iata: "MAD",
        icao: "LEMD",
        aircraft: "A320",
        time: "2:35",
        lat: 40.4983,
        lon: -3.5676
    },

    {
        flight: "BMA331",
        city: "Barcelona",
        iata: "BCN",
        icao: "LEBL",
        aircraft: "A320",
        time: "2:20",
        lat: 41.2974,
        lon: 2.0833
    },

    {
        flight: "BMA341",
        city: "Milan MXP",
        iata: "MXP",
        icao: "LIMC",
        aircraft: "A320",
        time: "1:50",
        lat: 45.6306,
        lon: 8.7281
    },

    {
        flight: "BMA351",
        city: "Rome FCO",
        iata: "FCO",
        icao: "LIRF",
        aircraft: "A321neo",
        time: "2:25",
        lat: 41.8003,
        lon: 12.2389
    },

    {
        flight: "BMA361",
        city: "Prague",
        iata: "PRG",
        icao: "LKPR",
        aircraft: "A319",
        time: "1:55",
        lat: 50.1008,
        lon: 14.2632
    },

    {
        flight: "BMA371",
        city: "Innsbruck",
        iata: "INN",
        icao: "LOWI",
        aircraft: "A319",
        time: "2:00",
        lat: 47.2602,
        lon: 11.3440
    },

    {
        flight: "BMA381",
        city: "Geneva",
        iata: "GVA",
        icao: "LSGG",
        aircraft: "A319",
        time: "1:50",
        lat: 46.2381,
        lon: 6.1089
    },

    {
        flight: "BMA391",
        city: "Alicante",
        iata: "ALC",
        icao: "LEAL",
        aircraft: "A321neo",
        time: "2:45",
        lat: 38.2822,
        lon: -0.5582
    },

    {
        flight: "BMA401",
        city: "Málaga",
        iata: "AGP",
        icao: "LEMG",
        aircraft: "A321neo",
        time: "3:10",
        lat: 36.6749,
        lon: -4.4991
    },

    {
        flight: "BMA411",
        city: "Tenerife South",
        iata: "TFS",
        icao: "GCTS",
        aircraft: "A321neo",
        time: "4:40",
        lat: 28.0445,
        lon: -16.5725
    },

    {
        flight: "BMA421",
        city: "Gran Canaria",
        iata: "LPA",
        icao: "GCLP",
        aircraft: "A321neo",
        time: "4:35",
        lat: 27.9319,
        lon: -15.3866
    },

    {
        flight: "BMA431",
        city: "Lanzarote",
        iata: "ACE",
        icao: "GCRR",
        aircraft: "A321neo",
        time: "4:40",
        lat: 28.9455,
        lon: -13.6052
    },

    {
        flight: "BMA441",
        city: "Lisbon",
        iata: "LIS",
        icao: "LPPT",
        aircraft: "A321neo",
        time: "2:55",
        lat: 38.7742,
        lon: -9.1342
    },

    {
        flight: "BMA451",
        city: "Warsaw",
        iata: "WAW",
        icao: "EPWA",
        aircraft: "A320",
        time: "2:45",
        lat: 52.1657,
        lon: 20.9671
    },

    {
        flight: "BMA461",
        city: "Ibiza",
        iata: "IBZ",
        icao: "LEIB",
        aircraft: "A321neo",
        time: "2:25",
        lat: 38.8729,
        lon: 1.3731
    },

    {
        flight: "BMA471",
        city: "Gibraltar",
        iata: "GIB",
        icao: "LXGB",
        aircraft: "A320",
        time: "2:20",
        lat: 36.1512,
        lon: -5.3497,
        captainsOnly: true
    },

    {
        flight: "BMA481",
        city: "Ajaccio",
        iata: "AJA",
        icao: "LFKJ",
        aircraft: "A320",
        time: "2:05",
        lat: 41.9236,
        lon: 8.8029
    },

    {
        flight: "BMA491",
        city: "Olbia",
        iata: "OLB",
        icao: "LIEO",
        aircraft: "A320",
        time: "2:15",
        lat: 40.8987,
        lon: 9.5176
    }

];


/* ==========================================================
   PIONEER CLASS
   OUTBOUND ROUTES ONLY
========================================================== */

const pioneerRoutes = [

    {
        flight: "BMA901",
        city: "New York JFK",
        iata: "JFK",
        icao: "KJFK",
        aircraft: "A350-1000",
        displayAircraft: "A35K",
        time: "7:45",
        lat: 40.6413,
        lon: -73.7781
    },

    {
        flight: "BMA911",
        city: "Punta Cana",
        iata: "PUJ",
        icao: "MDPC",
        aircraft: "A350-1000",
        displayAircraft: "A35K",
        time: "9:30",
        lat: 18.5674,
        lon: -68.3634
    },

    {
        flight: "BMA921",
        city: "Cancún",
        iata: "CUN",
        icao: "MMUN",
        aircraft: "A350-1000",
        displayAircraft: "A35K",
        time: "10:05",
        lat: 21.0365,
        lon: -86.8771
    },

    {
        flight: "BMA931",
        city: "Orlando",
        iata: "MCO",
        icao: "KMCO",
        aircraft: "A350-1000",
        displayAircraft: "A35K",
        time: "8:45",
        lat: 28.4312,
        lon: -81.3081
    },

    {
        flight: "BMA941",
        city: "Chicago",
        iata: "ORD",
        icao: "KORD",
        aircraft: "A350-1000",
        displayAircraft: "A35K",
        time: "8:40",
        lat: 41.9742,
        lon: -87.9073
    }

];


/* ==========================================================
   COMBINE NETWORK DATA
========================================================== */

const allRoutes = [

    ...beatingHeartRoutes,

    ...pioneerRoutes

];


/* ==========================================================
   AIRCRAFT COLOUR
========================================================== */

function getAircraftColour(route) {

    switch (route.aircraft) {

        case "A319":
            return colours.A319;

        case "A320":
            return colours.A320;

        case "A321neo":
            return colours.A321;

        case "A350-1000":
            return colours.A350;

        default:
            return colours.A320;

    }

}


/* ==========================================================
   ROUTE WEIGHT
========================================================== */

function getRouteWeight(route) {

    switch (route.aircraft) {

        case "A319":
            return 2.5;

        case "A320":
            return 3;

        case "A321neo":
            return 3.5;

        case "A350-1000":
            return 4;

        default:
            return 3;

    }

}


/* ==========================================================
   CURVE STRENGTH
========================================================== */

function getCurveStrength(route) {

    if (route.aircraft === "A350-1000") {

        return 0.16;

    }

    return 0.07;

}


/* ==========================================================
   MAP INITIALISATION
========================================================== */

function initialiseMap() {

    map = L.map("network-map", {

        zoomControl: true,

        scrollWheelZoom: true,

        attributionControl: false,

        center: [48, -15],

        zoom: 4,

        minZoom: 2,

        maxZoom: 18

    });


    L.tileLayer(

        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",

        {

            maxZoom: 18,

            noWrap: true

        }

    ).addTo(map);


    createHub();


    setTimeout(() => {

        map.invalidateSize();

    }, 100);

}


/* ==========================================================
   BIRMINGHAM HUB
========================================================== */

function createHub() {

    const hub = L.circleMarker(

        BHX,

        {

            radius: 12,

            color: "#ffffff",

            weight: 4,

            fillColor: colours.A320,

            fillOpacity: 1

        }

    ).addTo(map);


    hub.bindTooltip(

        "<strong>BHX</strong><br>British Midland Hub",

        {

            permanent: true,

            direction: "top",

            offset: [0, -15],

            className: "hub-label"

        }

    );


    L.circle(

        BHX,

        {

            radius: 25000,

            color: colours.A320,

            fillColor: colours.A320,

            fillOpacity: 0.08,

            weight: 2

        }

    ).addTo(map);

}


/* ==========================================================
   DRAW ALL ROUTES
========================================================== */

function drawRoutes() {

    allRoutes.forEach(route => {

        createAirport(route);

        createRoute(route);

    });

}


/* ==========================================================
   AIRPORT MARKER
========================================================== */

function createAirport(route) {

    const marker = L.circleMarker(

        [

            route.lat,

            route.lon

        ],

        {

            radius: 6,

            color: "#ffffff",

            weight: 1.8,

            fillColor: getAircraftColour(route),

            fillOpacity: 1

        }

    ).addTo(map);


    marker.bindTooltip(

        `<strong>${route.city}</strong><br>${route.iata} • ${route.flight}`,

        {

            direction: "top"

        }

    );


    marker.on("click", () => {

        const card = document.getElementById(

            `card-${route.flight}`

        );

        if (!card) return;


        card.scrollIntoView({

            behavior: "smooth",

            block: "center"

        });


        document

            .querySelectorAll(".destination-card")

            .forEach(card => {

                card.classList.remove("selected");

            });


        card.classList.add("selected");

    });

}


/* ==========================================================
   ROUTE LINE
========================================================== */

function createRoute(route) {

    const start = L.latLng(

        BHX[0],

        BHX[1]

    );


    const end = L.latLng(

        route.lat,

        route.lon

    );


    const latMid =

        (start.lat + end.lat) / 2;


    const lngMid =

        (start.lng + end.lng) / 2;


    const curve =

        getCurveStrength(route);


    const control = L.latLng(

        latMid +

            (end.lng - start.lng) * curve,

        lngMid -

            (end.lat - start.lat) * curve

    );


    const points = [];


    for (

        let t = 0;

        t <= 1;

        t += 0.025

    ) {

        const lat =

            Math.pow(1 - t, 2) * start.lat +

            2 *

            (1 - t) *

            t *

            control.lat +

            Math.pow(t, 2) *

            end.lat;


        const lng =

            Math.pow(1 - t, 2) * start.lng +

            2 *

            (1 - t) *

            t *

            control.lng +

            Math.pow(t, 2) *

            end.lng;


        points.push([

            lat,

            lng

        ]);

    }


    L.polyline(

        points,

        {

            color: getAircraftColour(route),

            weight: getRouteWeight(route),

            opacity: route.aircraft === "A350-1000"

                ? 0.85

                : 0.75,

            dashArray: route.aircraft === "A350-1000"

                ? "10 8"

                : null,

            lineCap: "round",

            lineJoin: "round"

        }

    ).addTo(map);

}


/* ==========================================================
   AIRCRAFT BADGE
========================================================== */

function getAircraftBadge(route) {

    const aircraft =

        route.displayAircraft ||

        route.aircraft;


    let className = "badge-a320";


    switch (route.aircraft) {

        case "A319":

            className = "badge-a319";

            break;

        case "A320":

            className = "badge-a320";

            break;

        case "A321neo":

            className = "badge-a321";

            break;

        case "A350-1000":

            className = "badge-a350";

            break;

    }


    return `

        <span class="${className}">

            ${aircraft}

        </span>

    `;

}


/* ==========================================================
   DESTINATION DESCRIPTIONS
========================================================== */

const descriptions = {

    AMS:
        "A vibrant European capital renowned for its canals, museums and rich history.",

    DUB:
        "A short hop across the Irish Sea to Ireland's welcoming capital.",

    CDG:
        "The gateway to Paris, combining world-famous landmarks with international business.",

    DUS:
        "Germany's stylish business city on the Rhine with excellent international connections.",

    FRA:
        "Europe's financial powerhouse and one of the continent's busiest aviation hubs.",

    MUC:
        "Bavaria's capital, combining world-class engineering, culture and Alpine charm.",

    BRU:
        "The political capital of Europe and an important destination for business travel.",

    ZRH:
        "Switzerland's financial centre surrounded by stunning Alpine scenery.",

    CPH:
        "A modern Scandinavian capital famous for design, culture and waterfront living.",

    ARN:
        "Sweden's elegant capital, built across islands and known for Scandinavian design.",

    OSL:
        "Norway's modern capital and gateway to spectacular fjords.",

    VIE:
        "Austria's imperial capital, famous for classical music, cafés and history.",

    MAD:
        "Spain's vibrant capital offering exceptional food, culture and architecture.",

    BCN:
        "Barcelona combines Mediterranean character, architecture and a vibrant city culture.",

    MXP:
        "Northern Italy's gateway to fashion, business and the beautiful Italian Lakes.",

    FCO:
        "The Eternal City, offering thousands of years of history and Italian culture.",

    PRG:
        "The Czech capital, celebrated for its medieval Old Town and rich history.",

    INN:
        "An Alpine gateway surrounded by mountains and one of Europe's premier ski destinations.",

    GVA:
        "An international city on the shores of Lake Geneva, home to diplomacy and finance.",

    ALC:
        "A popular Mediterranean destination on Spain's Costa Blanca.",

    AGP:
        "Gateway to Spain's Costa del Sol, renowned for sunshine and beaches.",

    TFS:
        "The southern gateway to Tenerife and the Canary Islands.",

    LPA:
        "Gran Canaria's principal airport serving one of Europe's favourite winter destinations.",

    ACE:
        "Lanzarote's volcanic landscapes make it one of Spain's most unique holiday islands.",

    LIS:
        "Portugal's colourful coastal capital overlooking the Atlantic Ocean.",

    WAW:
        "Poland's dynamic capital blending historic architecture with a modern skyline.",

    IBZ:
        "A Mediterranean island destination known for beaches, scenery and summer atmosphere.",

    GIB:
        "A distinctive Mediterranean gateway at the entrance to the Strait of Gibraltar.",

    AJA:
        "Corsica's capital, offering a spectacular Mediterranean setting and mountain scenery.",

    OLB:
        "A gateway to Sardinia's famous Costa Smeralda and Mediterranean coastline.",

    JFK:
        "New York becomes the flagship gateway of British Midland's Pioneer Class network.",

    PUJ:
        "A tropical Caribbean destination on the Dominican Republic's eastern coastline.",

    CUN:
        "A major Caribbean gateway serving Cancún and the Riviera Maya.",

    MCO:
        "Florida's home of sunshine, entertainment and world-famous attractions.",

    ORD:
        "Chicago provides a major North American gateway for Pioneer Class operations."

};


/* ==========================================================
   BUILD ROUTE CARD
========================================================== */

function buildRouteCard(route, className) {

    const card = document.createElement("article");


    card.className =

        "destination-card " +

        className;


    card.id =

        `card-${route.flight}`;


    const description =

        descriptions[route.iata] ||

        "A British Midland Virtual destination from Birmingham Airport.";


    const captainsOnly = route.captainsOnly

        ? `

            <span class="route-note">

                * CAPTAINS ONLY

            </span>

        `

        : "";


    card.innerHTML = `

        <div class="destination-status active">

            ACTIVE

        </div>


        <div class="route-card-flight">

            ${route.flight}

        </div>


        <h3>

            ${route.city}

        </h3>


        <p class="airport">

            BHX → ${route.iata}

        </p>


        <p class="destination-description">

            ${description}

        </p>


        <div class="destination-info">


            <div>

                <span>

                    Aircraft

                </span>

                <strong>

                    ${getAircraftBadge(route)}

                </strong>

            </div>


            <div>

                <span>

                    Block Time

                </span>

                <strong>

                    ${route.time}

                </strong>

            </div>


        </div>


        ${captainsOnly}

    `;


    card.addEventListener(

        "click",

        () => {

            document

                .querySelectorAll(".destination-card")

                .forEach(card => {

                    card.classList.remove(

                        "selected"

                    );

                });


            card.classList.add(

                "selected"

            );

        }

    );


    return card;

}


/* ==========================================================
   BUILD BEATING HEART CLASS
========================================================== */

function buildBeatingHeartCards() {

    const grid =

        document.getElementById(

            "beating-heart-grid"

        );


    if (!grid) return;


    grid.innerHTML = "";


    beatingHeartRoutes.forEach(route => {

        grid.appendChild(

            buildRouteCard(

                route,

                "beating-heart-card"

            )

        );

    });

}


/* ==========================================================
   BUILD PIONEER CLASS
========================================================== */

function buildPioneerCards() {

    const grid =

        document.getElementById(

            "pioneer-grid"

        );


    if (!grid) return;


    grid.innerHTML = "";


    pioneerRoutes.forEach(route => {

        grid.appendChild(

            buildRouteCard(

                route,

                "pioneer-card"

            )

        );

    });

}


/* ==========================================================
   BUILD NETWORK
========================================================== */

function buildNetwork() {

    initialiseMap();

    drawRoutes();

    buildBeatingHeartCards();

    buildPioneerCards();

}


/* ==========================================================
   INITIALISE
========================================================== */

document.addEventListener(

    "DOMContentLoaded",

    () => {

        buildNetwork();

    }

);
