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

    loginMessage.textContent = message;
    loginMessage.className = "login-message";

    if (type) {
        loginMessage.classList.add(type);
    }

}


// ------------------------------------------------------------
// LOGIN BUTTON STATE
// ------------------------------------------------------------

function setLoading(loading) {

    loginButton.disabled = loading;

    loginButton.textContent =
        loading
            ? "AUTHENTICATING..."
            : "SIGN IN";

}


// ------------------------------------------------------------
// VERIFY MANAGEMENT ACCESS
// ------------------------------------------------------------

async function verifyManagementAccess(userId) {

    const { data, error } =
        await supabaseClient
            .from("management_users")
            .select("display_name, role, active")
            .eq("user_id", userId)
            .eq("active", true)
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

        // Authenticate with Supabase

        const { data, error } =
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


        // Verify management authorisation

        const managementUser =
            await verifyManagementAccess(
                data.user.id
            );


        if (!managementUser) {

            await supabaseClient
                .auth
                .signOut();


            showMessage(
                "This account is not authorised for Management Operations.",
                "error"
            );

            return;

        }


        // Management access granted

        console.log(
            "Management authentication successful:",
            {
                displayName: managementUser.display_name,
                role: managementUser.role
            }
        );


        showMessage(
            `Access granted. Welcome, ${managementUser.display_name}.`,
            "success"
        );


        // Redirect to Operations Control dashboard

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
// CHECK FOR EXISTING MANAGEMENT SESSION
// ------------------------------------------------------------

async function checkExistingSession() {

    try {

        const { data, error } =
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


        // A Supabase login alone does not grant management access.
        // Verify the account against management_users.

        const managementUser =
            await verifyManagementAccess(
                user.id
            );


        if (!managementUser) {

            await supabaseClient
                .auth
                .signOut();

            return;

        }


        console.log(
            "Existing management session confirmed:",
            managementUser.display_name
        );


        // Already authenticated and authorised.
        // Go directly to Operations Control.

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


// ------------------------------------------------------------
// INITIALISE MANAGEMENT LOGIN
// ------------------------------------------------------------

checkExistingSession();
