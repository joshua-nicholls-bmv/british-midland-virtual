document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch("assets/data/news.json");
        const articles = await response.json();

        renderFeatured(articles);
        renderNewsCards(articles);

    } catch (error) {
        console.error("Failed to load news:", error);
    }
});

function renderFeatured(articles) {

    const featured = articles.find(article => article.featured);

    if (!featured) return;

    document.getElementById("featured-news").innerHTML = `
        <div class="featured-card">

            <img src="${featured.image}" alt="${featured.title}">

            <div class="featured-content">

                <span class="category">${featured.category}</span>

                <h2>${featured.title}</h2>

                <p>${featured.summary}</p>

                <button>Read Article</button>

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

                <img src="${article.image}" alt="${article.title}">

                <div class="news-content">

                    <span class="category">${article.category}</span>

                    <h3>${article.title}</h3>

                    <p>${article.summary}</p>

                    <button>Read More</button>

                </div>

            </article>

            `;

        });

}
