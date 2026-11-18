(() => {
  "use strict";

  const API_KEY = "ba4a1151ae9246a28092ffa541ec75e1";
  const PAGE_SIZE = 8;
  const QUERY =
    '("satwa langka" OR "flora langka" OR "spesies langka" OR "terancam punah" OR "critically endangered" OR "endangered species" OR orangutan OR "badak sumatra" OR "harimau sumatra" OR "komodo dragon" OR rafflesia OR cenderawasih OR maleo OR bekantan) AND (Indonesia OR Sumatra OR Kalimantan OR Papua OR Sulawesi OR Jawa OR Borneo OR Bali)';

  const PLACE =
    /indonesia|sumatra|kalimantan|borneo|papua|sulawesi|jawa|\bjava\b|bali|maluku/i;
  const RARE =
    /langka|terancam|punah|endangered|critically|threatened|iucn|red list|orangutan|badak|harimau|rafflesia|cenderawasih|bird of paradise|maleo|bekantan|proboscis|komodo dragon|anoa|babirusa|jalak bali|bali myna|penyu|sea turtle|gajah sumatra|sumatran/i;
  const JUNK = /camera|cinema|xbox|steam|puzzle|\bps[45]\b|promo|diskon|harga/i;
  const CATEGORIES = [
    { id: "semua", label: "Kategori", test: () => true },
    {
      id: "flora",
      label: "Flora",
      test: (text) =>
        /flora|tumbuhan|tanaman|rafflesia|bunga|orchid|anggrek|pohon|plant|kantong semar/.test(
          text,
        ),
    },
    {
      id: "fauna",
      label: "Fauna",
      test: (text) =>
        /fauna|satwa|hewan|orangutan|wildlife|animal|harimau|badak|bird|turtle|primate|maleo|bekantan|tiger|rhino/.test(
          text,
        ),
    },
    {
      id: "satwa",
      label: "Satwa",
      test: (text) =>
        /satwa|hewan|wildlife|orangutan|harimau|badak|maleo|bekantan|tiger|rhino|animal/.test(
          text,
        ),
    },
    {
      id: "konservasi",
      label: "Konservasi",
      test: (text) =>
        /konservasi|conservation|rescue|lindung|protected|habitat|diselamatkan/.test(
          text,
        ),
    },
  ];

  const grid = document.getElementById("artikelGrid");
  const statusEl = document.getElementById("artikelStatus");
  const pagesEl = document.getElementById("artikelPages");
  const categoryEl = document.getElementById("artikelCategory");
  const form = document.getElementById("artikelSearch");
  const queryEl = document.getElementById("artikelQuery");

  const ARROW = {
    prev: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    next: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };

  let source = [];
  let page = 1;
  let searchTimer;

  categoryEl.innerHTML = CATEGORIES.map(
    (cat) => `<option value="${cat.id}">${cat.label}</option>`,
  ).join("");

  grid.addEventListener(
    "error",
    (event) => {
      if (event.target.tagName === "IMG") event.target.remove();
    },
    true,
  );

  const setStatus = (message) => {
    statusEl.hidden = !message;
    statusEl.textContent = message || "";
  };

  const skeletons = () => {
    grid.innerHTML = Array.from({ length: 4 }, () => {
      return `<article class="artikel__card is-skeleton" aria-hidden="true">
        <div class="artikel__thumb"></div>
        <div class="artikel__line"></div>
        <div class="artikel__line artikel__line--title"></div>
      </article>`;
    }).join("");
    pagesEl.innerHTML = "";
  };

  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");

  const escapeAttr = (value) => escapeHtml(value).replaceAll("'", "&#39;");

  const clean = (value) => (value || "").replace(/\s+/g, " ").trim();

  const titleOf = (article) => {
    const title = clean(article.title);
    const sourceName = article.source?.name;
    if (sourceName && title.endsWith(` - ${sourceName}`)) {
      return title.slice(0, -(sourceName.length + 3));
    }
    return title;
  };

  const authorOf = (article) => {
    const author = clean(article.author);
    if (author && author.toLowerCase() !== "null") return author;
    return article.source?.name || "Suaka";
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const relevant = (article) => {
    if (!article.title || article.title === "[Removed]" || !article.url) {
      return false;
    }
    const text = `${article.title} ${article.description || ""} ${article.content || ""}`;
    if (JUNK.test(article.title) && !RARE.test(text)) return false;
    return PLACE.test(text) && RARE.test(text);
  };

  const card = (article) => {
    const title = titleOf(article);
    const author = authorOf(article);
    const sourceName = article.source?.name || "Berita";
    const image = article.urlToImage
      ? `<img src="${escapeAttr(article.urlToImage)}" alt="" loading="lazy" decoding="async" />`
      : "";

    return `<a class="artikel__card" href="${escapeAttr(article.url)}" target="_blank" rel="noopener noreferrer">
      <div class="artikel__thumb">${image}</div>
      <div class="artikel__meta">
        <span>${escapeHtml(sourceName)}</span>
        <span>${escapeHtml(formatDate(article.publishedAt))}</span>
      </div>
      <h2 class="artikel__title">${escapeHtml(title)}</h2>
      <div class="artikel__author">
        <span class="artikel__avatar" aria-hidden="true">${escapeHtml(author.charAt(0).toUpperCase() || "S")}</span>
        <span>${escapeHtml(author)}</span>
      </div>
    </a>`;
  };

  const currentList = () => {
    const category =
      CATEGORIES.find((cat) => cat.id === categoryEl.value) || CATEGORIES[0];
    const words = queryEl.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return source.filter((article) => {
      if (!category.test(article._text)) return false;
      return words.every((word) => article._text.includes(word));
    });
  };

  const renderPages = (pageCount) => {
    if (!pageCount) {
      pagesEl.innerHTML = "";
      return;
    }
    const start = Math.max(1, Math.min(page, pageCount) - 2);
    const end = Math.min(pageCount, start + 4);
    const from = Math.max(1, end - 4);
    const dots = Array.from({ length: end - from + 1 }, (_, index) => {
      const n = from + index;
      const current = n === page ? ' aria-current="page"' : "";
      return `<button type="button" data-page="${n}"${current} aria-label="Halaman ${n}"></button>`;
    }).join("");

    pagesEl.innerHTML = `<button class="artikel__arrow" type="button" data-dir="prev" aria-label="Halaman sebelumnya"${page <= 1 ? " disabled" : ""}>${ARROW.prev}</button>${dots}<button class="artikel__arrow" type="button" data-dir="next" aria-label="Halaman berikutnya"${page >= pageCount ? " disabled" : ""}>${ARROW.next}</button>`;
  };

  const show = (nextPage = 1) => {
    const list = currentList();
    const pageCount = Math.ceil(list.length / PAGE_SIZE);
    page = Math.min(Math.max(1, nextPage), Math.max(pageCount, 1));
    const slice = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    grid.innerHTML = slice.map(card).join("");
    setStatus(list.length ? "" : "Tidak ada artikel untuk pencarian ini.");
    renderPages(pageCount);
  };

  const load = async () => {
    skeletons();
    setStatus("");
    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set("q", QUERY);
    url.searchParams.set("sortBy", "publishedAt");
    url.searchParams.set("pageSize", "100");
    url.searchParams.set("apiKey", API_KEY);

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok || data.status !== "ok") {
        throw new Error(data.message || "Gagal memuat berita");
      }
      source = (data.articles || []).filter(relevant);
      source.forEach((article) => {
        article._text =
          `${article.title} ${article.description || ""} ${article.content || ""}`.toLowerCase();
      });
      show(1);
    } catch (error) {
      grid.innerHTML = "";
      pagesEl.innerHTML = "";
      setStatus(
        "Berita tidak bisa dimuat. Buka halaman ini lewat server lokal, lalu coba lagi.",
      );
      console.error(error);
    }
  };

  categoryEl.addEventListener("change", () => show(1));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    show(1);
  });
  queryEl.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => show(1), 250);
  });
  pagesEl.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button || button.disabled) return;
    if (button.dataset.dir === "prev") show(page - 1);
    else if (button.dataset.dir === "next") show(page + 1);
    else if (button.dataset.page) show(Number(button.dataset.page));
    else return;
    document.querySelector(".artikel__tools")?.scrollIntoView({ block: "start" });
  });

  load();
})();
