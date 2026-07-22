document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch("assets/data/news.json");
        const articles = await response.json();

        console.log("News Loaded:", articles);

    } catch (error) {
        console.error("Failed to load news:", error);
    }
});
