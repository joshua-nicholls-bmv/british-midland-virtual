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
                <section style="padding:120px 20px;text-align:center;">
                    <h1>Article not found</h1>
                    <a href="news.html">Back to News</a>
                </section>
            `;

            return;

        }

        const formattedDate = new Date(article.published).toLocaleDateString(
            "en-GB",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

        container.innerHTML = `
            <section style="max-width:900px;margin:160px auto;padding:40px;">

                <img src="${article.image}"
                     style="width:100%;border-radius:16px;">

                <p style="color:#D02823;font-weight:700;margin-top:30px;">
                    ${article.category}
                </p>

                <h1 style="font-size:3rem;color:#001A3A;">
                    ${article.title}
                </h1>

                <p>
                    ${formattedDate} • ${article.author}
                </p>

                ${article.content.map(p => `<p>${p}</p>`).join("")}

                <br><br>

                <a href="news.html">
                    ← Back to News
                </a>

            </section>
        `;

    }
    catch(err){

        console.error(err);

        container.innerHTML = `
            <section style="padding:150px;text-align:center;">
                <h1>JavaScript Error</h1>
                <pre>${err}</pre>
            </section>
        `;

    }

});
