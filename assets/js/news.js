document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch("assets/data/news.json");

        if (!response.ok) {
            throw new Error(`Failed to load news.json (${response.status})`);
        }

        const articles = await response.json();

        // Sort newest first
        articles.sort((a, b) => new Date(b.published) - new Date(a.published));

        renderFeatured(articles);
        renderNewsCards(articles);

    } catch (error) {
        console.error("News loading error:", error);

        document.getElementById("featured-news").innerHTML = `
            <div class="featured-card">
                <div class="featured-content">
                    <h2>Unable to load news</h2>
                    <p>Please try again later.</p>
                </div>
            </div>
        `;
    }
});

function renderFeatured(articles) {

    const featured = articles.find(article => article.featured);

    if (!featured) return;

    document.getElementById("featured-news").innerHTML = `

        <div class="featured-card">

            <img
                src="${featured.image}?v=${Date.now()}"
                alt="${featured.title}"
            >

            <div class="featured-content">

                <span class="category">
                    ${featured.category}
                </span>

                <h2>
                    ${featured.title}
                </h2>

                <p>
                    ${featured.summary}
                </p>

                <a
                    class="btn"
                    href="article.html?id=${featured.id}"
                >
                    Read Article →
                </a>

            </div>

        </div>

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
                        src="${article.image}?v=${Date.now()}"
                        alt="${article.title}"
                    >

                    <div class="news-content">

                        <span class="category">
                            ${article.category}
                        </span>

                        <h3>
                            ${article.title}
                        </h3>

                        <p>
                            ${article.summary}
                        </p>

                        <a
                            class="btn"
                            href="article.html?id=${article.id}"
                        >
                            Read More →
                        </a>

                    </div>

                </article>

            `;

        });

}
