document.addEventListener("DOMContentLoaded", async () => {
    try {

        const response = await fetch("assets/data/news.json");

        if (!response.ok) {
            throw new Error(`Failed to load news.json (${response.status})`);
        }

        const articles = await response.json();

        // Uses the order of the JSON file
        renderFeatured(articles);
        renderNewsCards(articles);

    } catch (error) {

        console.error("News loading error:", error);

        document.getElementById("featured-news").innerHTML = `

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
});


function renderFeatured(articles) {

    const featured = articles.find(article => article.featured);

    if (!featured) return;

    document.getElementById("featured-news").innerHTML = `

        <article class="featured-card">

            <img
                src="${featured.image}"
                alt="${featured.title}"
                loading="eager"
            >

            <div class="featured-content">

                <span class="badge">
                    ${featured.category}
                </span>

                <h2>
                    ${featured.title}
                </h2>

                <p>
                    ${featured.summary}
                </p>

                <a
                    class="read-button"
                    href="article.html?id=${featured.id}"
                >
                    Read Article →
                </a>

            </div>

        </article>

    `;

}


function renderNewsCards(articles) {

    const grid = document.getElementById("news-grid");

    grid.innerHTML = "";

    articles
        .filter(article => !article.featured)
        .forEach(article => {

            grid.innerHTML += `

                <article class="news-card">

                    <img
                        src="${article.image}"
                        alt="${article.title}"
                        loading="lazy"
                    >

                    <div class="news-card-content">

                        <span class="badge">
                            ${article.category}
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
