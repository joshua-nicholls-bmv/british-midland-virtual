const SUPABASE_URL =
    "https://eqbaezhcwnjlcnvtfxho.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable__JTXMIQDaruQdmjEmf9t6w_T23MXelW";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


const loginForm =
    document.getElementById("loginForm");

const loginButton =
    document.getElementById("loginButton");

const loginMessage =
    document.getElementById("loginMessage");


function showMessage(message, type = "") {

    loginMessage.textContent =
        message;

    loginMessage.className =
        "login-message";

    if (type) {
        loginMessage.classList.add(type);
    }

}


function setLoading(loading) {

    loginButton.disabled =
        loading;

    loginButton.textContent =
        loading
            ? "AUTHENTICATING..."
            : "SIGN IN";

}


async function verifyManagementAccess(userId) {

    const { data, error } =
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


async function handleLogin(event) {

    event.preventDefault();

    showMessage("");

    setLoading(true);


    const email =
        document
            .getElementById("email")
            .value
            .trim();


    const password =
        document
            .getElementById("password")
            .value;


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .signInWithPassword({
                    email,
                    password
                });


        if (error) {

            showMessage(
                "Email or password is incorrect.",
                "error"
            );

            return;

        }


        if (!data.user) {

            showMessage(
                "Authentication failed.",
                "error"
            );

            return;

        }


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


        showMessage(
            `Access granted. Welcome, ${managementUser.display_name}.`,
            "success"
        );


        /*
         * Dashboard does not exist yet.
         *
         * In Step 6 this becomes:
         *
         * window.location.href = "dashboard.html";
         */

        console.log(
            "Management authentication successful:",
            {
                displayName:
                    managementUser.display_name,

                role:
                    managementUser.role
            }
        );

    }
    catch (error) {

        console.error(
            "Login error:",
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


loginForm.addEventListener(
    "submit",
    handleLogin
);
