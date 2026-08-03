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

const pilotIdInput =
    document.getElementById("pilotId");

const passwordInput =
    document.getElementById("password");


// ------------------------------------------------------------
// MESSAGE HANDLING
// ------------------------------------------------------------

function showMessage(message, type = "") {

    if (!loginMessage) {
        return;
    }


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

    if (!loginButton) {
        return;
    }


    loginButton.disabled =
        loading;


    loginButton.textContent =
        loading
            ? "AUTHENTICATING..."
            : "SIGN IN";

}


// ------------------------------------------------------------
// NORMALISE PILOT ID
// ------------------------------------------------------------

function normalisePilotId(value) {

    return value
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "");

}


// ------------------------------------------------------------
// VALIDATE PILOT ID
// ------------------------------------------------------------

function isValidPilotId(pilotId) {

    return /^BMA\d{4}$/.test(
        pilotId
    );

}


// ------------------------------------------------------------
// CONVERT PILOT ID TO INTERNAL AUTH EMAIL
// ------------------------------------------------------------

function pilotIdToAuthEmail(pilotId) {

    return (
        pilotId.toLowerCase() +
        "@auth.britishmidlandvirtual.internal"
    );

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


    const pilotId =
        normalisePilotId(
            pilotIdInput.value
        );


    const password =
        passwordInput.value;


    // --------------------------------------------------------
    // BASIC VALIDATION
    // --------------------------------------------------------

    if (!pilotId || !password) {

        showMessage(
            "Please enter your Pilot ID and password.",
            "error"
        );

        setLoading(false);

        return;

    }


    if (!isValidPilotId(pilotId)) {

        showMessage(
            "Please enter a valid British Midland Pilot ID, for example BMA0001.",
            "error"
        );

        setLoading(false);

        return;

    }


    /*
     * Keep the visible value normalised.
     *
     * For example:
     * bma0001 -> BMA0001
     */

    pilotIdInput.value =
        pilotId;


    /*
     * Supabase Auth uses the internal email address.
     *
     * The management user never needs to enter or know this.
     *
     * Example:
     *
     * BMA0001
     *
     * becomes:
     *
     * bma0001@auth.britishmidlandvirtual.internal
     */

    const authEmail =
        pilotIdToAuthEmail(
            pilotId
        );


    try {

        // ----------------------------------------------------
        // AUTHENTICATE USING EXISTING ACARS ACCOUNT
        // ----------------------------------------------------

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .signInWithPassword({
                    email: authEmail,
                    password: password
                });


        if (error) {

            console.error(
                "Authentication failed:",
                error.message
            );


            showMessage(
                "Pilot ID or password is incorrect.",
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
        // VERIFY MANAGEMENT AUTHORISATION
        // ----------------------------------------------------

        const managementUser =
            await verifyManagementAccess(
                data.user.id
            );


        if (!managementUser) {

            /*
             * The Pilot ID and password were valid,
             * but this pilot does not have active
             * Management Operations access.
             *
             * Destroy the authenticated browser session.
             */

            await supabaseClient
                .auth
                .signOut();


            showMessage(
                "This pilot is not authorised for Management Operations.",
                "error"
            );

            return;

        }


        // ----------------------------------------------------
        // MANAGEMENT ACCESS GRANTED
        // ----------------------------------------------------

        console.log(
            "Management authentication successful:",
            {
                pilotId:
                    pilotId,

                displayName:
                    managementUser.display_name,

                role:
                    managementUser.role
            }
        );


        showMessage(
            `Access granted. Welcome, ${managementUser.display_name}.`,
            "success"
        );


        // ----------------------------------------------------
        // REDIRECT TO OPERATIONS CONTROL
        // ----------------------------------------------------

        window.location.replace(
            "/management/dashboard.html"
        );

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
// PILOT ID INPUT FORMATTING
// ------------------------------------------------------------

function handlePilotIdInput() {

    if (!pilotIdInput) {
        return;
    }


    /*
     * Automatically convert the entered Pilot ID
     * to uppercase and remove spaces.
     */

    pilotIdInput.value =
        pilotIdInput.value
            .toUpperCase()
            .replace(/\s+/g, "");

}


// ------------------------------------------------------------
// CHECK FOR EXISTING MANAGEMENT SESSION
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


        /*
         * Having a valid Supabase/ACARS session does NOT
         * automatically grant Management Portal access.
         *
         * The authenticated UUID must also exist as an
         * active management_users record.
         */

        const managementUser =
            await verifyManagementAccess(
                user.id
            );


        if (!managementUser) {

            /*
             * Important:
             *
             * The current browser has a valid Supabase
             * session but the user isn't management.
             *
             * Sign the session out before leaving the
             * Management login page.
             */

            await supabaseClient
                .auth
                .signOut();


            return;

        }


        console.log(
            "Existing management session confirmed:",
            {
                displayName:
                    managementUser.display_name,

                role:
                    managementUser.role
            }
        );


        // ----------------------------------------------------
        // ALREADY AUTHENTICATED AND AUTHORISED
        // ----------------------------------------------------

        window.location.replace(
            "/management/dashboard.html"
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

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        handleLogin
    );

}


if (pilotIdInput) {

    pilotIdInput.addEventListener(
        "input",
        handlePilotIdInput
    );

}


// ------------------------------------------------------------
// INITIALISE MANAGEMENT LOGIN
// ------------------------------------------------------------

checkExistingSession();
