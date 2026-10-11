"use strict";

/* =========================================
   CHANTS POUR JÉHOVAH
   Créateur : KIBWE ZONGWE Israël
   ========================================= */

const SONGS = [
  "A ceci l'amour.mp3",
  "A Tes Côtés.mp3",
  "De Tout Mon Coeur.mp3",
  "Fidèle à Toi.mp3",
  "Guide mes pas.mp3",
  "Heureux les coeurs fidèles.mp3",
  "Je vis en toi.mp3",
  "Jusqu'à la fin.mp3",
  "Les choses anciennes.mp3",
  "Mon Refuge.mp3",
  "Par ta Parole.mp3",
  "Personne Comme Toi.mp3",
  "Plus de larmes.mp3",
  "Près de moi.mp3",
  "Ta Parole Pour Toujours.mp3",
  "Ton Amour Attend.mp3",
  "Toujours Debout.mp3",
  "Un Monde Nouveau.mp3",
  "Un nouveau ciel.mp3",
  "Vous êtes mes témoins.mp3"
];

const $ = (id) => document.getElementById(id);

const STORAGE_KEYS = {
  favorites: "chants_jehovah_favorites",
  darkMode: "chants_jehovah_dark",
  goldTheme: "chants_jehovah_gold",
  volume: "chants_jehovah_volume",
  textSize: "chants_jehovah_text_size"
};

let currentSongIndex = -1;
let currentPage = "homePage";
let previousPage = "libraryPage";
let favorites = loadFavorites();
let currentObjectUrl = null;

/* ---------- OUTILS ---------- */

function loadFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.favorites));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveFavorites() {
  localStorage.setItem(
    STORAGE_KEYS.favorites,
    JSON.stringify(favorites)
  );
}

function songTitle(filename) {
  return filename.replace(/\.mp3$/i, "");
}

function songUrl(index) {
  return "audio/" + encodeURIComponent(SONGS[index]);
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function showMessage(message) {
  let box = $("statusMessage");

  if (!box) {
    box = document.createElement("div");
    box.id = "statusMessage";
    box.setAttribute("role", "status");
    box.style.cssText =
      "position:fixed;left:12px;right:12px;bottom:85px;" +
      "z-index:9999;padding:13px;border-radius:12px;" +
      "background:#102642;color:white;text-align:center;" +
      "box-shadow:0 4px 15px #0004";
    document.body.appendChild(box);
  }

  box.textContent = message;
  box.hidden = false;

  clearTimeout(showMessage.timer);
  showMessage.timer = setTimeout(() => {
    box.hidden = true;
  }, 2800);
}

function getSongIndexFromButton(button) {
  return Number(button.dataset.songIndex);
}

/* ---------- NAVIGATION ---------- */

function showPage(pageId) {
  const page = $(pageId);

  if (!page || !page.classList.contains("page")) return;

  if (currentPage !== pageId) {
    previousPage = currentPage;
  }

  document.querySelectorAll(".page").forEach((section) => {
    section.classList.remove("active");
    section.hidden = true;
  });

  page.hidden = false;
  page.classList.add("active");

  currentPage = pageId;

  const backButton = $("backButton");
  if (backButton) {
    backButton.hidden = pageId === "homePage";
  }

  window.scrollTo({ top: 0, behavior: "smooth" });

  document.querySelectorAll("[data-page]").forEach((button) => {
    button.setAttribute(
      "aria-current",
      button.dataset.page === pageId ? "page" : "false"
    );
  });

  if (pageId === "favoritesPage") renderFavorites();
  if (pageId === "searchPage") renderSearch();
  if (pageId === "playerPage") renderPlayerSongList();
}

function goBack() {
  if (currentPage === "playerPage") {
    showPage(previousPage === "playerPage" ? "libraryPage" : previousPage);
    return;
  }

  if (currentPage !== "homePage") {
    showPage("homePage");
    return;
  }

  const shouldExit = window.confirm(
    "Voulez-vous quitter Chants pour Jéhovah ?"
  );

  if (shouldExit && window.Capacitor?.Plugins?.App?.exitApp) {
    window.Capacitor.Plugins.App.exitApp();
  }
}

/* ---------- AFFICHAGE DES CHANSONS ---------- */

function createSongCard(filename, index) {
  const card = document.createElement("article");
  card.className = "song-item";

  const number = document.createElement("span");
  number.className = "song-number";
  number.textContent = String(index + 1).padStart(2, "0");

  const info = document.createElement("div");
  info.className = "song-info";

  const title = document.createElement("strong");
  title.className = "song-title";
  title.textContent = songTitle(filename);

  const subtitle = document.createElement("span");
  subtitle.className = "song-subtitle";
  subtitle.textContent = "Chants pour Jéhovah";

  info.append(title, subtitle);

  const actions = document.createElement("div");
  actions.className = "song-trailing";

  const favoriteButton = document.createElement("button");
  favoriteButton.type = "button";
  favoriteButton.className = "icon-button";
  favoriteButton.textContent = favorites.includes(index) ? "❤️" : "♡";
  favoriteButton.setAttribute(
    "aria-label",
    favorites.includes(index)
      ? "Retirer des favoris"
      : "Ajouter aux favoris"
  );

  favoriteButton.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleFavorite(index);
  });

  const playButton = document.createElement("button");
  playButton.type = "button";
  playButton.className = "icon-button";
  playButton.textContent = "▶️";
  playButton.setAttribute("aria-label", "Écouter cette chanson");

  playButton.addEventListener("click", () => {
    playSong(index);
  });

  actions.append(favoriteButton, playButton);
  card.append(number, info, actions);

  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", "Écouter " + songTitle(filename));

  card.addEventListener("click", (event) => {
    if (!event.target.closest("button")) {
      playSong(index);
    }
  });

  card.addEventListener("keydown", (event) => {
    if (
      event.target === card &&
      (event.key === "Enter" || event.key === " ")
    ) {
      event.preventDefault();
      playSong(index);
    }
  });

  return card;
}

function renderSongList(containerId, indices) {
  const container = $(containerId);
  if (!container) return;

  container.replaceChildren();

  if (indices.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Aucune chanson à afficher pour le moment.";
    container.appendChild(empty);
    return;
  }

  indices.forEach((index) => {
    container.appendChild(createSongCard(SONGS[index], index));
  });
}

function renderLibrary() {
  renderSongList(
    "libraryList",
    SONGS.map((_, index) => index)
  );

  if ($("songCount")) {
    $("songCount").textContent = `${SONGS.length} chansons`;
  }
}

function renderFavorites() {
  renderSongList("favoritesList", favorites);
}

function renderSearch() {
  const input = $("searchInput");
  const query = (input?.value || "").trim().toLocaleLowerCase("fr");

  const results = SONGS
    .map((filename, index) => ({ filename, index }))
    .filter(({ filename }) =>
      songTitle(filename).toLocaleLowerCase("fr").includes(query)
    )
    .map(({ index }) => index);

  renderSongList("searchResults", results);
}

function renderPlayerSongList() {
  renderSongList(
    "playerSongList",
    SONGS.map((_, index) => index)
  );
}

/* ---------- FAVORIS ---------- */

function toggleFavorite(index) {
  if (favorites.includes(index)) {
    favorites = favorites.filter((item) => item !== index);
    showMessage("Chanson retirée de vos favoris.");
  } else {
    favorites.push(index);
    showMessage("Chanson ajoutée à vos favoris ❤️");
  }

  saveFavorites();
  renderLibrary();
  renderFavorites();
  renderSearch();
  renderPlayerSongList();
  updatePlayerFavoriteButton();
}

/* ---------- LECTEUR AUDIO ---------- */

function playSong(index) {
  if (index < 0 || index >= SONGS.length) return;

  const audio = $("audioPlayer");
  if (!audio) {
    showMessage("Le lecteur audio est introuvable.");
    return;
  }

  currentSongIndex = index;
  audio.src = songUrl(index);
  audio.load();

  if ($("playerSongTitle")) {
    $("playerSongTitle").textContent = songTitle(SONGS[index]);
  }

  if ($("playerSongNumber")) {
    $("playerSongNumber").textContent =
      `Chanson ${index + 1} sur ${SONGS.length}`;
  }

  if ($("progressControl")) $("progressControl").value = 0;
  if ($("currentTime")) $("currentTime").textContent = "0:00";
  if ($("durationTime")) $("durationTime").textContent = "0:00";

  updatePlayerFavoriteButton();
  showPage("playerPage");

  audio.play()
    .then(() => updatePlayButton())
    .catch(() => {
      updatePlayButton();
      showMessage(
        "Appuyez sur Lecture pour démarrer la chanson."
      );
    });
}

function updatePlayButton() {
  const audio = $("audioPlayer");
  const button = $("playPauseButton");

  if (!audio || !button) return;

  button.textContent = audio.paused ? "▶️" : "⏸️";
  button.setAttribute(
    "aria-label",
    audio.paused ? "Lire la chanson" : "Mettre en pause"
  );
}

function togglePlayPause() {
  const audio = $("audioPlayer");

  if (!audio || currentSongIndex < 0) {
    showMessage("Choisissez d'abord une chanson.");
    showPage("libraryPage");
    return;
  }

  if (audio.paused) {
    audio.play()
      .then(updatePlayButton)
      .catch(() => showMessage("Impossible de lire ce fichier audio."));
  } else {
    audio.pause();
  }
}

function playPrevious() {
  if (currentSongIndex < 0) return;

  const index = (currentSongIndex - 1 + SONGS.length) % SONGS.length;
  playSong(index);
}

function playNext() {
  if (currentSongIndex < 0) return;

  const index = (currentSongIndex + 1) % SONGS.length;
  playSong(index);
}

function updateProgress() {
  const audio = $("audioPlayer");
  if (!audio) return;

  if ($("currentTime")) {
    $("currentTime").textContent = formatTime(audio.currentTime);
  }

  if ($("durationTime")) {
    $("durationTime").textContent = formatTime(audio.duration);
  }

  const progress = $("progressControl");

  if (progress && Number.isFinite(audio.duration) && audio.duration > 0) {
    progress.value = Math.round(
      (audio.currentTime / audio.duration) * 100
    );
  }
}

function updatePlayerFavoriteButton() {
  const button = $("playerFavoriteButton");
  if (!button) return;

  const isFavorite = favorites.includes(currentSongIndex);

  button.textContent = isFavorite ? "❤️ Favori" : "♡ Favori";
  button.disabled = currentSongIndex < 0;
}

function seekAudio() {
  const audio = $("audioPlayer");
  const progress = $("progressControl");

  if (
    !audio ||
    !progress ||
    !Number.isFinite(audio.duration) ||
    audio.duration <= 0
  ) return;

  audio.currentTime = (Number(progress.value) / 100) * audio.duration;
}

/* ---------- PARTAGER ET ENREGISTRER ---------- */

async function shareCurrentSong() {
  if (currentSongIndex < 0) {
    showMessage("Choisissez d'abord une chanson.");
    return;
  }

  const filename = SONGS[currentSongIndex];
  const url = songUrl(currentSongIndex);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Fichier audio introuvable.");
    }

    const blob = await response.blob();
    const file = new File([blob], filename, { type: "audio/mpeg" });

    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        title: songTitle(filename),
        text: "Chants pour Jéhovah",
        files: [file]
      });
    } else {
      showMessage(
        "Le partage direct de fichiers n'est pas disponible sur ce navigateur."
      );
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      showMessage("Impossible de partager ce MP3 pour le moment.");
    }
  }
}

function saveCurrentSong() {
  if (currentSongIndex < 0) {
    showMessage("Choisissez d'abord une chanson.");
    return;
  }

  const link = document.createElement("a");
  link.href = songUrl(currentSongIndex);
  link.download = SONGS[currentSongIndex];
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  link.remove();

  showMessage(
    "Téléchargement demandé. Vérifiez le dossier Téléchargements de votre appareil."
  );
}

/* ---------- PARAMÈTRES ---------- */

function applySettings() {
  const darkToggle = $("darkModeToggle");
  const goldToggle = $("goldThemeToggle");
  const volumeControl = $("volumeControl");
  const volumeValue = $("volumeValue");
  const textSizeControl = $("textSizeControl");

  const darkMode = localStorage.getItem(STORAGE_KEYS.darkMode) !== "false";
  const goldTheme = localStorage.getItem(STORAGE_KEYS.goldTheme) !== "false";
  const volume = Number(localStorage.getItem(STORAGE_KEYS.volume) ?? 80);
  const textSize = localStorage.getItem(STORAGE_KEYS.textSize) ?? "1";

  if (darkToggle) darkToggle.checked = darkMode;
  if (goldToggle) goldToggle.checked = goldTheme;
  if (volumeControl) volumeControl.value = volume;
  if (volumeValue) volumeValue.textContent = `${volume} %`;
  if (textSizeControl) textSizeControl.value = textSize;

  document.body.classList.toggle("light-mode", !darkMode);
  document.body.classList.toggle("gold-theme", goldTheme);
  document.documentElement.style.setProperty("--text-size", textSize);

  const audio = $("audioPlayer");
  if (audio) audio.volume = Math.max(0, Math.min(1, volume / 100));
}

function setupSettings() {
  $("darkModeToggle")?.addEventListener("change", (event) => {
    localStorage.setItem(
      STORAGE_KEYS.darkMode,
      String(event.target.checked)
    );
    applySettings();
  });

  $("goldThemeToggle")?.addEventListener("change", (event) => {
    localStorage.setItem(
      STORAGE_KEYS.goldTheme,
      String(event.target.checked)
    );
    applySettings();
  });

  $("volumeControl")?.addEventListener("input", (event) => {
    const volume = Number(event.target.value);

    localStorage.setItem(STORAGE_KEYS.volume, String(volume));

    if ($("volumeValue")) {
      $("volumeValue").textContent = `${volume} %`;
    }

    const audio = $("audioPlayer");
    if (audio) audio.volume = volume / 100;
  });

  $("textSizeControl")?.addEventListener("change", (event) => {
    localStorage.setItem(STORAGE_KEYS.textSize, event.target.value);
    applySettings();
  });
}

/* ---------- INITIALISATION ---------- */

function setupNavigation() {
  document.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", () => {
      showPage(button.dataset.page);
    });
  });

  $("startButton")?.addEventListener("click", () => {
    showPage("libraryPage");
  });

  $("settingsButton")?.addEventListener("click", () => {
    showPage("settingsPage");
  });

  $("backButton")?.addEventListener("click", goBack);
}

function setupPlayer() {
  $("playPauseButton")?.addEventListener("click", togglePlayPause);
  $("previousButton")?.addEventListener("click", playPrevious);
  $("nextButton")?.addEventListener("click", playNext);
  $("progressControl")?.addEventListener("input", seekAudio);

  $("playerFavoriteButton")?.addEventListener("click", () => {
    if (currentSongIndex >= 0) {
      toggleFavorite(currentSongIndex);
    }
  });

  $("shareButton")?.addEventListener("click", shareCurrentSong);
  $("saveButton")?.addEventListener("click", saveCurrentSong);

  const audio = $("audioPlayer");

  if (audio) {
    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", updateProgress);
    audio.addEventListener("play", updatePlayButton);
    audio.addEventListener("pause", updatePlayButton);

    audio.addEventListener("ended", () => {
      if (currentSongIndex < SONGS.length - 1) {
        playSong(currentSongIndex + 1);
      } else {
        updatePlayButton();
        showMessage("Fin de la dernière chanson.");
      }
    });

    audio.addEventListener("error", () => {
      showMessage(
        "Impossible de lire ce fichier. Vérifiez son nom dans le dossier audio."
      );
    });
  }
}

function initialiseApp() {
  setupNavigation();
  setupPlayer();
  setupSettings();

  $("searchInput")?.addEventListener("input", renderSearch);

  document.querySelectorAll(".page").forEach((page) => {
    page.hidden = page.id !== "homePage";
    page.classList.toggle("active", page.id === "homePage");
  });

  renderLibrary();
  renderFavorites();
  renderSearch();
  applySettings();
  updatePlayerFavoriteButton();

  showPage("homePage");

  // Bouton Retour sur les appareils Android équipés de Capacitor.
  if (window.Capacitor?.Plugins?.App?.addListener) {
    window.Capacitor.Plugins.App.addListener(
      "backButton",
      () => goBack()
    );
  }

  console.log("Chants pour Jéhovah est prêt.");
}

document.addEventListener("DOMContentLoaded", initialiseApp);
