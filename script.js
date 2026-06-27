const API_KEY = "1bac347115a8d712afe3c89b066f1390";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

const movieGrid = document.getElementById("movieGrid");
const categorySelect = document.getElementById("categorySelect");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const loadingSpinner = document.getElementById("loadingSpinner");
const messageDisplay = document.getElementById("messageDisplay");

const apiPanel = document.getElementById("apiPanel");
const apiKeyInput = document.getElementById("apiKeyInput");
const saveKeyBtn = document.getElementById("saveKeyBtn");

const movieModal = document.getElementById("movieModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const modalPoster = document.getElementById("modalPoster");
const modalTitle = document.getElementById("modalTitle");
const modalTagline = document.getElementById("modalTagline");
const modalReleaseDate = document.getElementById("modalReleaseDate");
const modalRuntime = document.getElementById("modalRuntime");
const modalRating = document.getElementById("modalRating");
const modalGenres = document.getElementById("modalGenres");
const modalOverview = document.getElementById("modalOverview");
const trailerContainer = document.getElementById("trailerContainer");

function getApiKey() {
    return localStorage.getItem("tmdb_api_key") || API_KEY;
}

function checkApiKey() {
    const key = getApiKey();

    if (!key || key.trim() === "") {
        apiPanel.classList.remove("hidden");
        showMessage("API key not configured.");
        return false;
    }

    apiPanel.classList.add("hidden");
    return true;
}

function showLoading() {
    loadingSpinner.classList.remove("hidden");
    movieGrid.innerHTML = "";
    messageDisplay.classList.add("hidden");
}

function hideLoading() {
    loadingSpinner.classList.add("hidden");
}

function showMessage(message) {
    messageDisplay.textContent = message;
    messageDisplay.classList.remove("hidden");
}

function createMovieCard(movie) {
    const card = document.createElement("div");
    card.className = "movie-card";

    card.addEventListener("click", () => {
        getMovieDetails(movie.id);
    });

    const poster = document.createElement("img");
    poster.className = "movie-poster-anchor";
    poster.src = movie.poster_path
        ? `${IMAGE_BASE_URL}${movie.poster_path}`
        : "https://via.placeholder.com/500x750?text=No+Image";
    poster.alt = movie.title;

    const info = document.createElement("div");
    info.className = "movie-card-info";

    const title = document.createElement("h3");
    title.className = "movie-title-header";
    title.textContent = movie.title;

    const meta = document.createElement("div");
    meta.className = "movie-meta-row";

    const year = document.createElement("span");
    year.textContent = movie.release_date
        ? movie.release_date.substring(0, 4)
        : "N/A";

    const rating = document.createElement("span");
    rating.className = "rating-badge";
    rating.textContent = `★ ${movie.vote_average?.toFixed(1) || "0.0"}`;

    meta.appendChild(year);
    meta.appendChild(rating);

    const overview = document.createElement("p");
    overview.className = "movie-summary-trunc";
    overview.textContent =
        movie.overview || "No description available.";

    info.appendChild(title);
    info.appendChild(meta);
    info.appendChild(overview);

    card.appendChild(poster);
    card.appendChild(info);

    return card;
}

// Display Movies
function displayMovies(movies) {
    movieGrid.innerHTML = "";

    if (!movies || movies.length === 0) {
        showMessage("No movies found.");
        return;
    }

    movies.forEach(movie => {
        movieGrid.appendChild(createMovieCard(movie));
    });
}

// Load Movies by Category
async function loadCategoryMovies(category) {
    if (!checkApiKey()) return;

    showLoading();

    try {
        const response = await fetch(
            `${BASE_URL}/movie/${category}?api_key=${getApiKey()}`
        );

        if (!response.ok) {
            throw new Error("Failed to load movies");
        }

        const data = await response.json();
        displayMovies(data.results);

    } catch (error) {
        console.error(error);
        showMessage("Unable to load movies.");
    } finally {
        hideLoading();
    }
}

// Search Movies
async function searchMovies() {
    if (!checkApiKey()) return;

    const query = searchInput.value.trim();

    if (!query) {
        alert("Please enter a movie name.");
        return;
    }

    showLoading();

    try {
        const response = await fetch(
            `${BASE_URL}/search/movie?api_key=${getApiKey()}&query=${encodeURIComponent(query)}`
        );

        if (!response.ok) {
            throw new Error("Search failed");
        }

        const data = await response.json();
        displayMovies(data.results);

    } catch (error) {
        console.error(error);
        showMessage("Could not search movies.");
    } finally {
        hideLoading();
    }
}

// Get Movie Details
async function getMovieDetails(movieId) {
    try {
        const detailsResponse = await fetch(
            `${BASE_URL}/movie/${movieId}?api_key=${getApiKey()}`
        );

        const videosResponse = await fetch(
            `${BASE_URL}/movie/${movieId}/videos?api_key=${getApiKey()}`
        );

        if (!detailsResponse.ok || !videosResponse.ok) {
            throw new Error("Failed to fetch movie details");
        }

        const movie = await detailsResponse.json();
        const videos = await videosResponse.json();

        showMovieModal(movie, videos.results);

    } catch (error) {
        console.error(error);
        alert("Unable to load movie details.");
    }
}

// Show Modal
function showMovieModal(movie, videos) {
    modalPoster.src = movie.poster_path
        ? `${IMAGE_BASE_URL}${movie.poster_path}`
        : "https://via.placeholder.com/500x750?text=No+Poster";

    modalTitle.textContent = movie.title;
    modalTagline.textContent = movie.tagline || "";
    modalReleaseDate.textContent = `Release Date: ${movie.release_date || "N/A"}`;
    modalRuntime.textContent = `Runtime: ${movie.runtime || "N/A"} mins`;
    modalRating.textContent =
        `Rating: ★ ${movie.vote_average.toFixed(1)} (${movie.vote_count} votes)`;

    modalOverview.textContent =
        movie.overview || "No overview available.";

    modalGenres.innerHTML = "";

    movie.genres.forEach(genre => {
        const tag = document.createElement("span");
        tag.className = "genre-tag";
        tag.textContent = genre.name;
        modalGenres.appendChild(tag);
    });

    trailerContainer.innerHTML = "";

    const trailer = videos.find(video =>
        video.site === "YouTube" &&
        (video.type === "Trailer" || video.type === "Teaser")
    );

    if (trailer) {
        const iframe = document.createElement("iframe");
        iframe.src = `https://www.youtube.com/embed/${trailer.key}`;
        iframe.allowFullscreen = true;
        trailerContainer.appendChild(iframe);
    } else {
        trailerContainer.innerHTML =
            "<p style='padding:20px;'>Trailer not available.</p>";
    }

    movieModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function closeMovieModal() {
    movieModal.classList.add("hidden");
    trailerContainer.innerHTML = "";
    document.body.style.overflow = "auto";
}

searchButton.addEventListener("click", searchMovies);

searchInput.addEventListener("keypress", event => {
    if (event.key === "Enter") {
        searchMovies();
    }
});

categorySelect.addEventListener("change", () => {
    loadCategoryMovies(categorySelect.value);
});

closeModalBtn.addEventListener("click", closeMovieModal);

movieModal.addEventListener("click", event => {
    if (event.target === movieModal) {
        closeMovieModal();
    }
});

saveKeyBtn.addEventListener("click", () => {
    const key = apiKeyInput.value.trim();

    if (!key) {
        alert("Please enter a valid API key.");
        return;
    }

    localStorage.setItem("tmdb_api_key", key);
    apiPanel.classList.add("hidden");

    alert("API key saved successfully.");
    loadCategoryMovies("popular");
});

// Initial Load
window.addEventListener("DOMContentLoaded", () => {
    if (checkApiKey()) {
        loadCategoryMovies("popular");
    }
});

