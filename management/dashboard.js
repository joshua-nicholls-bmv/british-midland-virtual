// ============================================================
// BRITISH MIDLAND VIRTUAL
// OPERATIONS CONTROL DASHBOARD
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

const welcomeHeading =
    document.getElementById("welcomeHeading");

const signOutButton =
    document.getElementById("signOutButton");


// Dashboard statistics

const activePilotsElement =
    document.getElementById("activePilots");

const totalFlightsElement =
    document.getElementById("totalFlights");

const flightHoursElement =
    document.getElementById("flightHours");

const reviewCountElement =
    document.getElementById("reviewCount");


// ------------------------------------------------------------
// REDIRECT TO LOGIN
// ------------------------------------------------------------

function redirectToLogin() {

    window.location.replace(
        "/management/"
    );

}


// ------------------------------------------------------------
// GREETING
// ------------------------------------------------------------

function setGreeting(name) {

    const hour =
        new Date().getHours();


    let greeting =
        "Good evening";


    if (hour < 12) {

        greeting =
            "Good morning";

    }
    else if (hour < 18) {

        greeting =
            "Good afternoon";

    }


    welcomeHeading.textContent =
        `${greeting}, ${name}.`;

}


// ------------------------------------------------------------
// VERIFY MANAGEMENT USER
// ------------------------------------------------------------

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
// LOAD ACARS DASHBOARD STATISTICS
// ============================================================

async function loadDashboardStatistics() {

    console.log(
        "Loading British Midland ACARS statistics..."
    );


    try {

        // ----------------------------------------------------
        // ACTIVE PILOTS
        // ----------------------------------------------------

        const {
            count: pilotCount,
            error: pilotError
        } =
            await supabaseClient
                .from("pilots")
                .select(
                    "*",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .eq(
                    "status",
                    "active"
                );


        if (pilotError) {

            console.error(
                "Unable to load active pilots:",
                pilotError
            );

            throw pilotError;

        }


        // ----------------------------------------------------
        // LOAD PIREP SUMMARY DATA
        // ----------------------------------------------------

        const {
            data: pireps,
            error: pirepError
        } =
            await supabaseClient
                .from("pireps")
                .select(
                    "block_minutes, requires_review"
                );


        if (pirepError) {

            console.error(
                "Unable to load PIREP statistics:",
                pirepError
            );

            throw pirepError;

        }


        const pirepData =
            pireps || [];


        // ----------------------------------------------------
        // TOTAL FLIGHTS
        // ----------------------------------------------------

        const totalFlights =
            pirepData.length;


        // ----------------------------------------------------
        // TOTAL BLOCK TIME
        // ----------------------------------------------------

        const totalMinutes =
            pirepData.reduce(
                (total, pirep) => {

                    const blockMinutes =
                        Number(
                            pirep.block_minutes
                        ) || 0;


                    return (
                        total +
                        blockMinutes
                    );

                },
                0
            );


        const hours =
            Math.floor(
                totalMinutes / 60
            );


        const minutes =
            totalMinutes % 60;


        // ----------------------------------------------------
        // REQUIRES REVIEW
        // ----------------------------------------------------

        const reviewCount =
            pirepData.filter(
                pirep =>
                    pirep.requires_review === true
            ).length;


        // ----------------------------------------------------
        // UPDATE DASHBOARD
        // ----------------------------------------------------

        if (activePilotsElement) {

            activePilotsElement.textContent =
                pilotCount ?? 0;

        }


        if (totalFlightsElement) {

            totalFlightsElement.textContent =
                totalFlights;

        }


        if (flightHoursElement) {

            flightHoursElement.textContent =
                `${hours}h ${minutes}m`;

        }


        if (reviewCountElement) {

            reviewCountElement.textContent =
                reviewCount;

        }


        // ----------------------------------------------------
        // DIAGNOSTIC LOG
        // ----------------------------------------------------

        console.log(
            "ACARS dashboard statistics loaded successfully:",
            {
                activePilots:
                    pilotCount ?? 0,

                totalFlights:
                    totalFlights,

                totalMinutes:
                    totalMinutes,

                formattedFlightTime:
                    `${hours}h ${minutes}m`,

                requiresReview:
                    reviewCount
            }
        );

    }
    catch (error) {

        console.error(
            "Unable to load ACARS dashboard statistics:",
            error
        );


        /*
         * Authentication remains valid even if ACARS data
         * cannot be loaded.
         *
         * Show an error state instead of redirecting the
         * management user back to the login page.
         */

        if (activePilotsElement) {

            activePilotsElement.textContent =
                "ERR";

        }


        if (totalFlightsElement) {

            totalFlightsElement.textContent =
                "ERR";

        }


        if (flightHoursElement) {

            flightHoursElement.textContent =
                "ERR";

        }


        if (reviewCountElement) {

            reviewCountElement.textContent =
                "ERR";

        }

    }

}


// ============================================================
// INITIALISE OPERATIONS CONTROL
// ============================================================

async function initialiseDashboard() {

    try {

        // ----------------------------------------------------
        // CHECK AUTHENTICATED SESSION
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

            console.log(
                "No authenticated management session."
            );


            redirectToLogin();

            return;

        }


        const user =
            sessionData.session.user;


        // ----------------------------------------------------
        // VERIFY MANAGEMENT AUTHORISATION
        // ----------------------------------------------------

        const manager =
            await getManagementUser(
                user.id
            );


        if (!manager) {

            console.warn(
                "Authenticated user does not have management access."
            );


            await supabaseClient
                .auth
                .signOut();


            redirectToLogin();

            return;

        }


        // ----------------------------------------------------
        // MANAGEMENT SESSION CONFIRMED
        // ----------------------------------------------------

        managementName.textContent =
            manager.display_name;


        managementRole.textContent =
            manager.role;


        setGreeting(
            manager.display_name
        );


        console.log(
            "Management session confirmed:",
            {
                displayName:
                    manager.display_name,

                role:
                    manager.role
            }
        );


        // ----------------------------------------------------
        // LOAD LIVE ACARS DATA
        // ----------------------------------------------------

        await loadDashboardStatistics();


        // ----------------------------------------------------
        // REVEAL OPERATIONS CONTROL
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
            "Dashboard initialisation failed:",
            error
        );


        redirectToLogin();

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
    catch (error) {

        console.error(
            "Sign out failed:",
            error
        );

    }
    finally {

        redirectToLogin();

    }

}


// ------------------------------------------------------------
// SIGN OUT BUTTON
// ------------------------------------------------------------

if (signOutButton) {

    signOutButton.addEventListener(
        "click",
        signOut
    );

}


// ------------------------------------------------------------
// WATCH AUTHENTICATION STATE
// ------------------------------------------------------------

supabaseClient.auth.onAuthStateChange(
    (event) => {

        if (event === "SIGNED_OUT") {

            redirectToLogin();

        }

    }
);


// ============================================================
// START OPERATIONS CONTROL
// ============================================================

initialiseDashboard();
