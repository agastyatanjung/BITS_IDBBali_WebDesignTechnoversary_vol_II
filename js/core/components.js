const loadPartial = async (id, url) => {
  const slot = document.getElementById(id);
  if (!slot) return;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

    const tpl = document.createElement("template");
    tpl.innerHTML = (await res.text()).trim();

    tpl.content.querySelectorAll("[data-year]").forEach((el) => {
      el.textContent = new Date().getFullYear();
    });

    slot.replaceWith(tpl.content);
  } catch (err) {
    console.error(`Gagal memuat ${url}:`, err);
  }
};

const footerUrl = new URL(
  "../../partials/footer.html",
  document.currentScript.src,
);

const start = () => loadPartial("site-footer", footerUrl);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
