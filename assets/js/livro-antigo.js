const openButton = document.getElementById("openBookButton");
const intro = document.getElementById("bookIntro");
const stage = document.getElementById("bookStage");
const leftPage = document.getElementById("leftPage");
const rightPage = document.getElementById("rightPage");
const prevButton = document.getElementById("prevPage");
const nextButton = document.getElementById("nextPage");
const pageCounter = document.getElementById("pageCounter");
const ancientBook = document.getElementById("ancientBook");

let pages = [];
let currentIndex = 0;
let audioContext = null;

const mobileQuery = window.matchMedia("(max-width: 760px)");

function isMobile() {
  return mobileQuery.matches;
}

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createPageHTML(page) {
  if (!page) {
    return "";
  }

  const links = (page.links || [])
    .map((link) => {
      const target = link.external ? "_blank" : "_self";

      return `
        <a
          class="artifact-link"
          href="${escapeHTML(link.href)}"
          target="${target}"
          rel="noopener noreferrer"
        >
          ${escapeHTML(link.label)}
        </a>
      `;
    })
    .join("");

  return `
    <p class="page-meta">
      ${escapeHTML(page.numero || "")} · ${escapeHTML(page.tipo || "registro")}
    </p>

    <h2>
      ${escapeHTML(page.titulo || "Página sem título")}
    </h2>

    <p>
      ${escapeHTML(page.texto || "").replaceAll("\n", "<br>")}
    </p>

    ${
      page.frase
        ? `<p class="page-quote">“${escapeHTML(page.frase)}”</p>`
        : ""
    }

    ${links}
  `;
}

function hasCoverPage() {
  return pages[0]?.id === "capa";
}

function getFirstMobileIndex() {
  return hasCoverPage() ? 1 : 0;
}

function normalizeIndexForMode() {
  if (!pages.length) {
    currentIndex = 0;
    return;
  }

  if (isMobile()) {
    if (currentIndex < getFirstMobileIndex()) {
      currentIndex = getFirstMobileIndex();
    }

    if (currentIndex > pages.length - 1) {
      currentIndex = pages.length - 1;
    }

    return;
  }

  if (currentIndex % 2 !== 0) {
    currentIndex -= 1;
  }

  if (currentIndex < 0) {
    currentIndex = 0;
  }

  if (currentIndex > pages.length - 1) {
    currentIndex = Math.max(0, pages.length - 2);
  }
}

function renderPages() {
  normalizeIndexForMode();

  if (isMobile()) {
    leftPage.innerHTML = "";
    rightPage.innerHTML = createPageHTML(pages[currentIndex]);

    const visibleTotal = hasCoverPage() ? pages.length - 1 : pages.length;
    const visibleNumber = hasCoverPage()
      ? currentIndex
      : currentIndex + 1;

    pageCounter.textContent = `Página ${visibleNumber} de ${visibleTotal}`;

    prevButton.disabled = currentIndex <= getFirstMobileIndex();
    nextButton.disabled = currentIndex >= pages.length - 1;

    return;
  }

  leftPage.innerHTML = createPageHTML(pages[currentIndex]);
  rightPage.innerHTML = createPageHTML(pages[currentIndex + 1]);

  const firstPageNumber = currentIndex + 1;
  const secondPageNumber = Math.min(currentIndex + 2, pages.length);

  pageCounter.textContent = `Páginas ${firstPageNumber}–${secondPageNumber}`;

  prevButton.disabled = currentIndex <= 0;
  nextButton.disabled = currentIndex + 2 >= pages.length;
}

function playPageSound() {
  try {
    audioContext =
      audioContext ||
      new (window.AudioContext || window.webkitAudioContext)();

    const duration = 0.12;
    const sampleRate = audioContext.sampleRate;
    const buffer = audioContext.createBuffer(
      1,
      sampleRate * duration,
      sampleRate
    );

    const output = buffer.getChannelData(0);

    for (let i = 0; i < output.length; i++) {
      const fade = 1 - i / output.length;
      output[i] = (Math.random() * 2 - 1) * fade * 0.13;
    }

    const noise = audioContext.createBufferSource();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();

    filter.type = "highpass";
    filter.frequency.value = 800;
    gain.gain.value = 0.65;

    noise.buffer = buffer;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);
    noise.start();
  } catch (error) {
    // Se o navegador bloquear áudio, apenas segue sem som.
  }
}

function animateFlip(direction) {
  ancientBook.classList.remove("flipping-next", "flipping-prev");

  // Força o navegador a reiniciar a animação.
  void ancientBook.offsetWidth;

  ancientBook.classList.add(
    direction === "next" ? "flipping-next" : "flipping-prev"
  );

  window.setTimeout(() => {
    ancientBook.classList.remove("flipping-next", "flipping-prev");
  }, 540);
}

function goNext() {
  if (!pages.length) {
    return;
  }

  if (isMobile()) {
    if (currentIndex >= pages.length - 1) {
      return;
    }

    currentIndex += 1;
  } else {
    if (currentIndex + 2 >= pages.length) {
      return;
    }

    currentIndex += 2;
  }

  playPageSound();
  animateFlip("next");
  renderPages();
}

function goPrev() {
  if (!pages.length) {
    return;
  }

  if (isMobile()) {
    if (currentIndex <= getFirstMobileIndex()) {
      return;
    }

    currentIndex -= 1;
  } else {
    if (currentIndex <= 0) {
      return;
    }

    currentIndex -= 2;
  }

  playPageSound();
  animateFlip("prev");
  renderPages();
}

function getInitialIndexFromURL() {
  const params = new URLSearchParams(window.location.search);
  const chapterId = params.get("capitulo");

  if (!chapterId) {
    return isMobile() ? getFirstMobileIndex() : 0;
  }

  const foundIndex = pages.findIndex((page) => page.id === chapterId);

  if (foundIndex === -1) {
    return isMobile() ? getFirstMobileIndex() : 0;
  }

  if (isMobile()) {
    return foundIndex;
  }

  return foundIndex % 2 === 0 ? foundIndex : foundIndex - 1;
}

async function loadPages() {
  const response = await fetch("./data/jornada-i08s28.json");
  pages = await response.json();

  currentIndex = getInitialIndexFromURL();
  renderPages();
}

openButton.addEventListener("click", async () => {
  intro.classList.add("hidden");
  stage.classList.remove("hidden");

  await loadPages();
  playPageSound();
});

nextButton.addEventListener("click", goNext);
prevButton.addEventListener("click", goPrev);

mobileQuery.addEventListener("change", () => {
  normalizeIndexForMode();
  renderPages();
});

// Swipe / touch / mouse drag
let pointerStartX = 0;
let pointerStartY = 0;
let pointerEndX = 0;
let pointerEndY = 0;
let isPointerDown = false;

ancientBook.addEventListener("pointerdown", (event) => {
  const clickedLink = event.target.closest("a");

  if (clickedLink) {
    return;
  }

  isPointerDown = true;
  pointerStartX = event.clientX;
  pointerStartY = event.clientY;
});

ancientBook.addEventListener("pointermove", (event) => {
  if (!isPointerDown) {
    return;
  }

  pointerEndX = event.clientX;
  pointerEndY = event.clientY;
});

ancientBook.addEventListener("pointerup", () => {
  if (!isPointerDown) {
    return;
  }

  isPointerDown = false;

  const deltaX = pointerEndX - pointerStartX;
  const deltaY = pointerEndY - pointerStartY;

  const horizontalSwipe = Math.abs(deltaX) > 55;
  const mostlyHorizontal = Math.abs(deltaX) > Math.abs(deltaY) * 1.4;

  if (!horizontalSwipe || !mostlyHorizontal) {
    return;
  }

  if (deltaX < 0) {
    goNext();
  } else {
    goPrev();
  }
});

ancientBook.addEventListener("pointercancel", () => {
  isPointerDown = false;
});

// Evita que clique em link vire página sem querer.
document.addEventListener("click", (event) => {
  const link = event.target.closest("a");

  if (link && link.classList.contains("artifact-link")) {
    event.stopPropagation();
  }
});
