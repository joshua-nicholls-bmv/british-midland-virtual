document.addEventListener("DOMContentLoaded", async () => {

    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get("id"));

    const response = await fetch("assets/data/news.json");
    const articles = await response.json();

    const article = articles.find(a => a.id === id);

    const container = document.getElementById("article-page");

    if (!article) {

        container.innerHTML = `
            <section class="article-not-found">
                <div class="container">
                    <h1>Article not found</h1>
                    <a href="news.html" class="read-button">
                        Back to News
                    </a>
                </div>
            </section>
        `;

        return;

    }

    document.title = `${article.title} | British Midland Virtual`;

    const date = new Date(article.published);

    const formattedDate = date.toLocaleDateString("en-GB", {

        day: "numeric",
        month: "long",
        year: "numeric"

    });

    const related = articles
        .filter(a => a.id !== article.id)
        .slice(0,3)
        .map(a => `

            <a class="related-card"
               href="article.html?id=${a.id}">

                <img src="${a.image}"
                     alt="${a.title}">

                <div class="related-content">

                    <span class="badge">
                        ${a.category}
                    </span>

                    <h3>${a.title}</h3>

                </div>

            </a>

        `).join("");

    container.innerHTML = `

<section class="article-hero">

    <img src="${article.image}"
         alt="${article.title}">

    <div class="hero-overlay"></div>

    <div class="hero-content container">

        <span class="badge">
            ${article.category}
        </span>

        <h1>${article.title}</h1>

        <p class="article-meta">

            ${formattedDate}

            •

            ${article.author}

        </p>

    </div>

</section>

<section class="article-content">

<div class="container">

<a href="news.html"
   class="back-link">

← Back to News

</a>

${article.content.map(paragraph=>`

<p>${paragraph}</p>

`).join("")}

</div>

</section>

<section class="related-news">

<div class="container">

<h2>

Related Articles

</h2>

<div class="related-grid">

${related}

</div>

</div>

</section>

`;

});
