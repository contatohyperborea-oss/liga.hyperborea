const openButton = document.getElementById("openBookButton");
const intro = document.getElementById("bookIntro");
const stage = document.getElementById("bookStage");
const prevButton = document.getElementById("prevPage");
const nextButton = document.getElementById("nextPage");
const pageCounter = document.getElementById("pageCounter");
const bookElement = document.getElementById("pageFlipBook");

let pages = [];
let pageFlip = null;
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

function createBookPages() {
  bookElement.innerHTML = "";

  pages.forEach((page) => {
    const pageDiv = document.createElement("div");

    pageDiv.className = "page book-page";

    if (page.id === "capa") {
      pageDiv.classList.add("page-cover");
    }

    pageDiv.dataset.pageId = page.id || "";

    pageDiv.innerHTML = createPageHTML(page);

    bookElement.appendChild(pageDiv);
  });
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
    // Se o navegador bloquear áudio, segue sem som.
  }
}

function getCurrentPageIndex() {
  if (!pageFlip) {
    return 0;
  }

  if (typeof pageFlip.getCurrentPageIndex === "function") {
    return pageFlip.getCurrentPageIndex();
  }

  return 0;
}

function updateCounter() {
  const currentPage = getCurrentPageIndex() + 1;
  const totalPages = pages.length;

  pageCounter.textContent = `Página ${currentPage} de ${totalPages}`;

  prevButton.disabled = currentPage <= 1;
  nextButton.disabled = currentPage >= totalPages;
}

function getInitialPageIndexFromURL() {
  const params = new URLSearchParams(window.location.search);
  const chapterId = params.get("capitulo");

  if (!chapterId) {
    return 0;
  }

  const foundIndex = pages.findIndex((page) => page.id === chapterId);

  if (foundIndex === -1) {
    return 0;
  }

  return foundIndex;
}

function getBookSize() {
  if (isMobile()) {
    return {
      width: 360,
      height: 560,
      minWidth: 300,
      maxWidth: 440,
      minHeight: 460,
      maxHeight: 680
    };
  }

  return {
    width: 440,
    height: 620,
    minWidth: 320,
    maxWidth: 980,
    minHeight: 460,
    maxHeight: 720
  };
}

function destroyOldBook() {
  if (pageFlip && typeof pageFlip.destroy === "function") {
    pageFlip.destroy();
  }

  pageFlip = null;
}

function initializePageFlip() {
  if (!window.St || !window.St.PageFlip) {
    pageCounter.textContent =
      "Biblioteca page-flip não carregou. Verifique a internet/CDN.";
    return;
  }

  destroyOldBook();
  createBookPages();

  const size = getBookSize();

  pageFlip = new St.PageFlip(bookElement, {
    width: size.width,
    height: size.height,
    size: "stretch",
    minWidth: size.minWidth,
    maxWidth: size.maxWidth,
    minHeight: size.minHeight,
    maxHeight: size.maxHeight,

    showCover: true,
    usePortrait: true,
    drawShadow: true,
    flippingTime: 720,
    maxShadowOpacity: 0.35,
    mobileScrollSupport: false,
    startZIndex: 10,
    autoSize: true
  });

  pageFlip.loadFromHTML(
    document.querySelectorAll(".page")
  );

  pageFlip.on("flip", () => {
    playPageSound();
    updateCounter();
  });

  const initialPage = getInitialPageIndexFromURL();

  if (initialPage > 0 && typeof pageFlip.turnToPage === "function") {
    window.setTimeout(() => {
      pageFlip.turnToPage(initialPage);
      updateCounter();
    }, 120);
  }

  updateCounter();
}

async function loadPages() {
  const response = await fetch("./data/jornada-i08s28.json");
  pages = await response.json();
}

async function openBook() {
  intro.classList.add("hidden");
  stage.classList.remove("hidden");

  await loadPages();

  initializePageFlip();
  playPageSound();
}

function goNext() {
  if (!pageFlip) {
    return;
  }

  if (typeof pageFlip.flipNext === "function") {
    pageFlip.flipNext();
    return;
  }

  if (typeof pageFlip.turnToNextPage === "function") {
    pageFlip.turnToNextPage();
  }
}

function goPrev() {
  if (!pageFlip) {
    return;
  }

  if (typeof pageFlip.flipPrev === "function") {
    pageFlip.flipPrev();
    return;
  }

  if (typeof pageFlip.turnToPrevPage === "function") {
    pageFlip.turnToPrevPage();
  }
}

openButton.addEventListener("click", openBook);

nextButton.addEventListener("click", goNext);
prevButton.addEventListener("click", goPrev);

mobileQuery.addEventListener("change", () => {
  if (!stage.classList.contains("hidden") && pages.length) {
    initializePageFlip();
  }
});

window.addEventListener("resize", () => {
  if (!stage.classList.contains("hidden") && pages.length) {
    window.clearTimeout(window.__hyperboreaResizeTimer);

    window.__hyperboreaResizeTimer = window.setTimeout(() => {
      initializePageFlip();
    }, 220);
  }
});

document.addEventListener("pointerdown", (event) => {
  const link = event.target.closest("a");

  if (link && link.classList.contains("artifact-link")) {
    event.stopPropagation();
  }
});

document.addEventListener("click", (event) => {
  const link = event.target.closest("a");

  if (link && link.classList.contains("artifact-link")) {
    event.stopPropagation();
  }
});