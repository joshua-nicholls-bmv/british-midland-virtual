/* ==========================================================
   BRITISH MIDLAND VIRTUAL
   NEWS PAGE
   News Loading & Category Filtering
========================================================== */

document.addEventListener("DOMContentLoaded", async () => {

    try {

        const response = await fetch("assets/data/news.json");

        if (!response.ok) {
            throw new Error(
                `Failed to load news.json (${response.status})`
            );
        }

        const articles = await response.json();

        /*
         * Only publicly visible articles are allowed
         * onto the News page.
         *
         * Articles marked:
         *
         * "hidden": true
         *
         * remain available in the JSON but are not displayed.
         */

        const visibleArticles = articles.filter(
            article => article.hidden !== true
        );


        /*
         * Set up the category filter.
         */

        setupFilters(visibleArticles);


        /*
         * Check whether a category was supplied
         * in the URL.
         *
         * Example:
         *
         * news.html?category=fleet
         */

        const params = new URLSearchParams(
            window.location.search
        );

        const requestedCategory =
            params.get("category");


        /*
         * Validate the requested category.
         *
         * If the category doesn't exist, default to all.
         */

        const validCategories = [
            "all",
            "group",
            "fleet",
            "operations",
            "partnership",
            "community",
            "development"
        ];


        const startingCategory =
            requestedCategory &&
            validCategories.includes(
                requestedCategory.toLowerCase()
            )
                ? requestedCategory.toLowerCase()
                : "all";


        /*
         * Render the initial page.
         */

        setActiveFilter(startingCategory);

        renderNews(
            visibleArticles,
            startingCategory
        );


    } catch (error) {

        console.error(
            "News loading error:",
            error
        );


        const featured =
            document.getElementById(
                "featured-news"
            );

        const grid =
            document.getElementById(
                "news-grid"
            );


        if (featured) {

            featured.innerHTML = `

                <div class="featured-card">

                    <div class="featured-content">

                        <span class="badge">
                            Error
                        </span>

                        <h2>
                            Unable to load news
                        </h2>

                        <p>
                            Please try again later.
                        </p>

                    </div>

                </div>

            `;

        }


        if (grid) {
            grid.innerHTML = "";
        }

    }

});


/* ==========================================================
   CATEGORY FILTER SETUP
========================================================== */

function setupFilters(articles) {

    const buttons =
        document.querySelectorAll(
            ".news-filter-button"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const category =
                    button.dataset.category ||
                    "all";


                /*
                 * Update active button.
                 */

                setActiveFilter(category);


                /*
                 * Render matching articles.
                 */

                renderNews(
                    articles,
                    category
                );


                /*
                 * Update the URL without
                 * reloading the page.
                 */

                updateCategoryUrl(
                    category
                );

            }
        );

    });

}


/* ==========================================================
   SET ACTIVE FILTER
========================================================== */

function setActiveFilter(category) {

    const buttons =
        document.querySelectorAll(
            ".news-filter-button"
        );


    buttons.forEach(button => {

        const buttonCategory =
            button.dataset.category;


        button.classList.toggle(
            "active",
            buttonCategory === category
        );

    });

}


/* ==========================================================
   UPDATE URL
========================================================== */

function updateCategoryUrl(category) {

    const url =
        new URL(
            window.location.href
        );


    if (category === "all") {

        url.searchParams.delete(
            "category"
        );

    } else {

        url.searchParams.set(
            "category",
            category
        );

    }


    window.history.replaceState(
        {},
        "",
        url
    );

}


/* ==========================================================
   RENDER NEWS
========================================================== */

function renderNews(
    articles,
    category
) {

    /*
     * Filter by category.
     *
     * "group" is displayed publicly
     * as "Corporate".
     */

    let filteredArticles;


    if (category === "all") {

        filteredArticles =
            [...articles];

    } else {

        filteredArticles =
            articles.filter(
                article =>
                    article.category &&
                    article.category.toLowerCase() ===
                    category
            );

    }


    /*
     * Featured article.
     *
     * On ALL NEWS we use the article explicitly
     * marked as featured.
     *
     * On category pages we use the most recent
     * article in that category.
     */

    let featured;


    if (category === "all") {

        featured =
            filteredArticles.find(
                article => article.featured
            );

    } else {

        featured =
            getMostRecent(
                filteredArticles
            );

    }


    /*
     * Render featured story.
     */

    renderFeatured(
        featured
    );


    /*
     * Do not duplicate the featured article
     * in the card grid.
     */

    const gridArticles =
        featured
            ? filteredArticles.filter(
                article =>
                    article.id !== featured.id
            )
            : filteredArticles;


    /*
     * Render cards.
     */

    renderNewsCards(
        gridArticles
    );


    /*
     * Empty state.
     */

    renderEmptyState(
        filteredArticles
    );

}


/* ==========================================================
   GET MOST RECENT ARTICLE
========================================================== */

function getMostRecent(articles) {

    if (!articles.length) {
        return null;
    }


    return [...articles].sort(
        (a, b) =>
            new Date(b.published) -
            new Date(a.published)
    )[0];

}


/* ==========================================================
   FEATURED ARTICLE
========================================================== */

function renderFeatured(article) {

    const container =
        document.getElementById(
            "featured-news"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (!article) {
        return;
    }


    container.innerHTML = `

        <article class="featured-card">

            <img
                src="${article.image}"
                alt="${article.title}"
                loading="eager"
            >

            <div class="featured-content">

                <span class="badge">
                    ${getDisplayCategory(
                        article.category
                    )}
                </span>

                <h2>
                    ${article.title}
                </h2>

                <p>
                    ${article.summary}
                </p>

                <a
                    class="read-button"
                    href="article.html?id=${article.id}"
                >
                    Read Article →
                </a>

            </div>

        </article>

    `;

}


/* ==========================================================
   NEWS CARDS
========================================================== */

function renderNewsCards(articles) {

    const grid =
        document.getElementById(
            "news-grid"
        );


    if (!grid) {
        return;
    }


    grid.innerHTML = "";


    articles.forEach(article => {

        grid.innerHTML += `

            <article class="news-card">

                <img
                    src="${article.image}"
                    alt="${article.title}"
                    loading="lazy"
                >

                <div class="news-card-content">

                    <span class="badge">
                        ${getDisplayCategory(
                            article.category
                        )}
                    </span>

                    <h3>
                        ${article.title}
                    </h3>

                    <p>
                        ${article.summary}
                    </p>

                    <a
                        href="article.html?id=${article.id}"
                    >
                        Read More →
                    </a>

                </div>

            </article>

        `;

    });

}


/* ==========================================================
   EMPTY STATE
========================================================== */

function renderEmptyState(articles) {

    const empty =
        document.getElementById(
            "news-empty"
        );


    if (!empty) {
        return;
    }


    if (articles.length === 0) {

        empty.hidden = false;

    } else {

        empty.hidden = true;

    }

}


/* ==========================================================
   DISPLAY CATEGORY
========================================================== */

function getDisplayCategory(category) {

    if (!category) {
        return "";
    }


    const categoryNames = {

        "Group":
            "Corporate",

        "Fleet":
            "Fleet",

        "Operations":
            "Operations",

        "Partnership":
            "Partnerships",

        "Community":
            "Community",

        "Development":
            "Development"

    };


    return (
        categoryNames[category] ||
        category
    );

}


/* ==========================================================
   END OF NEWS.JS
========================================================== */
