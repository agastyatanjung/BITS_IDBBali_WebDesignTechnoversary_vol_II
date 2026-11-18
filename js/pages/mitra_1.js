(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const RESPONSE_DAYS = "[N]";

  const form = $("#partnerForm");
  const card = $("#card");
  const steps = $$(".step", card);
  const backBtn = $("#backBtn");
  const submitBtn = $("#submitBtn");
  const val = (n) => form.elements[n].value.trim();

  const RULES = {
    first: () => (val("first") ? "" : "Nama depan wajib diisi"),
    phone: () =>
      /^\+?[\d\s-]{8,18}$/.test(val("phone"))
        ? ""
        : "Masukkan nomor telepon yang valid",
    email: () =>
      !val("email")
        ? "Email wajib diisi"
        : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val("email"))
          ? ""
          : "Format email belum benar",
    org: () => (val("org") ? "" : "Nama instansi wajib diisi"),
    type: () => (val("type") ? "" : "Pilih jenis instansi"),
    social: () => (val("social").length <= 100 ? "" : "Maksimal 100 karakter"),
    support: () => (val("support") ? "" : "Pilih jenis dukungan"),
    program: () => (val("program") ? "" : "Pilih program yang diminati"),
    scale: () =>
      val("scale").length >= 2 ? "" : "Isi perkiraan skala dukungan",
    duration: () => (val("duration") ? "" : "Isi perkiraan jangka waktu"),
    message: () =>
      val("message").length >= 10
        ? ""
        : "Ceritakan tujuanmu (minimal 10 karakter)",
  };
  const STEP_FIELDS = [
    ["first", "last", "phone", "email", "org", "type", "social"],
    ["support", "program", "scale", "duration", "message"],
  ];

  const setError = (name, msg) => {
    const wrap = $(`[data-field="${name}"]`);
    if (!wrap) return;
    wrap.classList.toggle("has-error", Boolean(msg));
    $$("input,select,textarea", wrap).forEach((el) =>
      el.setAttribute("aria-invalid", String(Boolean(msg))),
    );
    $(".err", wrap).textContent = msg;
  };

  const validateStep = (i) => {
    let firstBad = null;
    STEP_FIELDS[i].forEach((name) => {
      if (!RULES[name]) return;
      const msg = RULES[name]();
      setError(name, msg);
      if (msg && !firstBad) firstBad = name;
    });
    if (firstBad)
      $(`[data-field="${firstBad}"] :is(input,select,textarea)`).focus();
    return !firstBad;
  };

  const check = (e) => {
    const n = e.target.name;
    if (RULES[n]) setError(n, RULES[n]());
  };
  form.addEventListener("focusout", check);
  form.addEventListener("change", check);
  form.addEventListener("input", (e) => {
    const n = e.target.name;
    if (RULES[n] && e.target.closest(".has-error")) setError(n, RULES[n]());
  });

  let cur = 0;
  const goTo = (n, dir = "next") => {
    cur = n;
    steps.forEach((s, k) => {
      s.hidden = k !== n;
      s.dataset.dir = dir;
    });
    form.hidden = n === 2;
    backBtn.hidden = n === 2;
    backBtn.setAttribute(
      "aria-label",
      n === 1 ? "Kembali ke langkah 1" : "Kembali ke halaman sebelumnya",
    );
    card.scrollIntoView({ behavior: "smooth", block: "start" });
    $(".sec", steps[n]).focus({ preventScroll: true });
  };

  $("[data-next]").addEventListener("click", () => {
    if (validateStep(0)) goTo(1);
  });

  backBtn.addEventListener("click", () => {
    if (cur === 1) {
      goTo(0, "back");
      return;
    }
    const sameSite =
      document.referrer &&
      new URL(document.referrer).origin === location.origin;
    if (sameSite) history.back();
    else location.assign("/support.html");
  });

  const makeId = () =>
    `KM7-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;

  const addGroup = (container, title, rows) => {
    const section = document.createElement("section");
    const h = document.createElement("h3");
    h.textContent = title;
    const dl = document.createElement("dl");
    rows.forEach(([label, value]) => {
      if (!value) return;
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = label;
      dd.textContent = value;
      dl.append(dt, dd);
    });
    section.append(h, dl);
    container.append(section);
  };

  const showConfirmation = (d) => {
    const fullName = [d.first, d.last].filter(Boolean).join(" ");
    const id = makeId();

    $("#outName").textContent = d.first;
    $("#outDays").textContent = RESPONSE_DAYS;
    $("#outId").textContent = id;

    const summary = $("#summary");
    summary.replaceChildren();
    addGroup(summary, "Data Pemohon", [
      ["Nama", fullName],
      ["Email", d.email],
      ["Nomor Telepon", d.phone],
    ]);
    addGroup(summary, "Instansi", [
      ["Nama Instansi", d.org],
      ["Jenis Instansi", d.type],
      ["Media Sosial", d.social],
    ]);
    addGroup(summary, "Rencana Dukungan", [
      ["Jenis Dukungan", d.support],
      ["Program", d.program],
      ["Skala Dukungan", d.scale],
      ["Jangka Waktu", d.duration],
      ["Pesan / Tujuan", d.message],
    ]);

    document.title = "Pengajuan terkirim — Suaka";
    goTo(2);
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (form.elements.website.value) return;
    if (cur === 0) {
      if (validateStep(0)) goTo(1);
      return;
    }
    if (!validateStep(1)) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Mengirim…";
    try {

      await new Promise((r) => setTimeout(r, 900));

      const data = {};
      new FormData(form).forEach((v, k) => {
        data[k] = String(v).trim();
      });
      showConfirmation(data);
    } catch {
      submitBtn.textContent = "Gagal, coba lagi";
      return;
    } finally {
      submitBtn.disabled = false;
    }
    submitBtn.textContent = "Kirim";
  });

  $("#copyId").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    try {
      await navigator.clipboard.writeText($("#outId").textContent);
      btn.textContent = "Tersalin ✓";
    } catch {
      btn.textContent = "Gagal menyalin";
    }
    setTimeout(() => (btn.textContent = "Salin ID"), 1800);
  });
  $("#printBtn").addEventListener("click", () => window.print());

  const SKEMA = {
    sponsorship: "Sponsorship Program",
    kolaborasi: "Kolaborasi Program",
    mitra: "Mitra Utama",
  };
  const skema = new URLSearchParams(location.search).get("skema");
  if (skema && Object.hasOwn(SKEMA, skema))
    form.elements.support.value = SKEMA[skema];
})();
