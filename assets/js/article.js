document.addEventListener("DOMContentLoaded", async () => {

    const container = document.getElementById("article-page");

    try {

        const params = new URLSearchParams(window.location.search);
        const id = Number(params.get("id"));

        const response = await fetch("assets/data/news.json");
        const articles = await response.json();

        const article = articles.find(a => a.id === id);

        if (!article) {

            container.innerHTML = `
                <section class="article-not-found">
                    <div class="container">
                        <h1>Article not found</h1>
                        <p>The article you're looking for doesn't exist.</p>

                        <a href="news.html" class="back-link">
                            ← Back to News
                        </a>
                    </div>
                </section>
            `;

            return;

        }

        document.title = `${article.title} | British Midland Virtual`;

        const formattedDate = new Date(article.published).toLocaleDateString(
            "en-GB",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

        container.innerHTML = `

            <section class="article-hero">

                <img
                    class="hero-image"
                    src="${article.image}"
                    alt="${article.title}"
                >

                <div class="hero-overlay"></div>

                <div class="hero-content container">

                    <span class="article-category">
                        ${article.category}
                    </span>

                    <h1>
                        ${article.title}
                    </h1>

                    <p class="article-meta">
                        ${formattedDate}
                        &nbsp;&bull;&nbsp;
                        ${article.author}
                    </p>

                </div>

            </section>

            <section class="article-body">

                <div class="container narrow">

                    <a href="news.html" class="back-link">
                        ← Back to News
                    </a>

                    <p class="article-summary">
                        ${article.summary}
                    </p>

                    ${article.content.map(paragraph => `
                        <p>${paragraph}</p>
                    `).join("")}

                </div>

            </section>

        `;

    }
    catch (err) {

        console.error(err);

        container.innerHTML = `
            <section class="article-not-found">

                <div class="container">

                    <h1>Something went wrong</h1>

                    <p>
                        We couldn't load this article.
                    </p>

                    <a href="news.html" class="back-link">
                        ← Back to News
                    </a>

                </div>

            </section>
        `;

    }

});
