// ============================================================
// BRITISH MIDLAND VIRTUAL
// MANAGEMENT PORTAL - LOGIN
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

const loginForm =
    document.getElementById("loginForm");

const loginButton =
    document.getElementById("loginButton");

const loginMessage =
    document.getElementById("loginMessage");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");


// ------------------------------------------------------------
// MESSAGE HANDLING
// ------------------------------------------------------------

function showMessage(message, type = "") {

    loginMessage.textContent =
        message;

    loginMessage.className =
        "login-message";


    if (type) {

        loginMessage.classList.add(
            type
        );

    }

}


// ------------------------------------------------------------
// LOGIN BUTTON STATE
// ------------------------------------------------------------

function setLoading(loading) {

    loginButton.disabled =
        loading;


    loginButton.textContent =
        loading
            ? "AUTHENTICATING..."
            : "SIGN IN";

}


// ------------------------------------------------------------
// VERIFY MANAGEMENT ACCESS
// ------------------------------------------------------------

async function verifyManagementAccess(userId) {

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
            "Management access check failed:",
            error
        );

        return null;

    }


    return data;

}


// ------------------------------------------------------------
// HANDLE LOGIN
// ------------------------------------------------------------

async function handleLogin(event) {

    event.preventDefault();


    showMessage("");

    setLoading(true);


    const email =
        emailInput.value.trim();


    const password =
        passwordInput.value;


    if (!email || !password) {

        showMessage(
            "Please enter your management email and password.",
            "error"
        );

        setLoading(false);

        return;

    }


    try {

        // ----------------------------------------------------
        // AUTHENTICATE WITH SUPABASE
        // ----------------------------------------------------

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .signInWithPassword({
                    email: email,
                    password: password
                });


        if (error) {

            console.error(
                "Authentication failed:",
                error.message
            );


            showMessage(
                "Email or password is incorrect.",
                "error"
            );

            return;

        }


        if (!data.user) {

            showMessage(
                "Authentication failed. Please try again.",
                "error"
            );

            return;

        }


        // ----------------------------------------------------
        // VERIFY THAT THE AUTHENTICATED USER IS MANAGEMENT
        // ----------------------------------------------------

        const managementUser =
            await verifyManagementAccess(
                data.user.id
            );


        if (!managementUser) {

            /*
             * The Supabase account exists but it is not
             * authorised in management_users.
             *
             * Immediately destroy the authenticated session.
             */

            await supabaseClient
                .auth
                .signOut();


            showMessage(
                "This account is not authorised for Management Operations.",
                "error"
            );

            return;

        }


        // ----------------------------------------------------
        // MANAGEMENT ACCESS GRANTED
        // ----------------------------------------------------

        showMessage(
            `Access granted. Welcome, ${managementUser.display_name}.`,
            "success"
        );


        console.log(
            "Management authentication successful:",
            {
                displayName:
                    managementUser.display_name,

                role:
                    managementUser.role
            }
        );


        // ----------------------------------------------------
        // REDIRECT TO OPERATIONS CONTROL
        // ----------------------------------------------------

        window.location.href =
            "dashboard.html";

    }
    catch (error) {

        console.error(
            "Management login error:",
            error
        );


        showMessage(
            "Unable to contact Operations Control. Please try again.",
            "error"
        );

    }
    finally {

        setLoading(false);

    }

}


// ------------------------------------------------------------
// EXISTING SESSION CHECK
// ------------------------------------------------------------

async function checkExistingSession() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .getSession();


        if (error) {

            console.error(
                "Unable to check existing session:",
                error
            );

            return;

        }


        if (!data.session) {

            return;

        }


        const user =
            data.session.user;


        const managementUser =
            await verifyManagementAccess(
                user.id
            );


        if (!managementUser) {

            /*
             * A Supabase session exists but the account
             * is no longer authorised for management.
             */

            await supabaseClient
                .auth
                .signOut();


            return;

        }


        /*
         * User is already authenticated AND remains an
         * active management user.
         *
         * Send them directly to Operations Control.
         */

        window.location.replace(
            "dashboard.html"
        );

    }
    catch (error) {

        console.error(
            "Existing session check failed:",
            error
        );

    }

}


// ------------------------------------------------------------
// EVENT LISTENERS
// ------------------------------------------------------------

loginForm.addEventListener(
    "submit",
    handleLogin
);


// ------------------------------------------------------------
// INITIALISE LOGIN PAGE
// ------------------------------------------------------------

checkExistingSession();
