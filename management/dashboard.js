const SUPABASE_URL =
    "https://eqbaezhcwnjlcnvtfxho.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable__JTXMIQDaruQdmjEmf9t6w_T23MXelW";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


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


function redirectToLogin() {

    window.location.replace("index.html");

}


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


async function initialiseDashboard() {

    try {

        /*
         * First check whether Supabase has
         * an authenticated browser session.
         */

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


        const user =
            sessionData.session.user;


        /*
         * Authentication alone is NOT enough.
         *
         * We now independently verify that
         * this UUID belongs to an active
         * management user.
         */

        const manager =
            await getManagementUser(
                user.id
            );


        if (!manager) {

            await supabaseClient
                .auth
                .signOut();


            redirectToLogin();

            return;

        }


        /*
         * Management session confirmed.
         */

        managementName.textContent =
            manager.display_name;


        managementRole.textContent =
            manager.role;


        setGreeting(
            manager.display_name
        );


        /*
         * Only reveal dashboard after
         * authentication AND management
         * authorisation have succeeded.
         */

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


signOutButton.addEventListener(
    "click",
    signOut
);


supabaseClient.auth.onAuthStateChange(
    (event) => {

        if (event === "SIGNED_OUT") {

            redirectToLogin();

        }

    }
);


initialiseDashboard();
