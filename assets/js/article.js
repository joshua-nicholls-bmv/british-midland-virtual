document.addEventListener("DOMContentLoaded", async () => {

    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get("id"));

    const response = await fetch("assets/data/news.json");
    const articles = await response.json();

    const article = articles.find(a => a.id === id);

    if (!article) {

        document.getElementById("article-container").innerHTML =
            "<h2>Article not found.</h2>";

        return;

    }

    document.title = article.title + " | British Midland Virtual";

    document.getElementById("article-container").innerHTML = `

        <img class="article-image"
             src="${article.image}"
             alt="${article.title}">

        <span class="category">
            ${article.category}
        </span>

        <h1>${article.title}</h1>

        <p class="article-date">

            ${article.published}

        </p>

        ${article.content.map(p => `<p>${p}</p>`).join("")}

    `;

});
