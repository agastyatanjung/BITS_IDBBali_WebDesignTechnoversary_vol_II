(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const CATALOG = {
    "satu-pohon": {
      nama: "Satu Pohon",
      nominal: 25000,
      ringkas: "1 pohon ditanam dan dirawat di area pemulihan",
    },
    "penjaga-hutan": {
      nama: "Penjaga Hutan",
      nominal: 50000,
      ringkas: "1 hari patroli ranger di area hutan",
    },
    "teman-satwa": {
      nama: "Teman Satwa",
      nominal: 100000,
      ringkas: "2 hari pakan dan perawatan satwa",
    },
    "sahabat-rimba": {
      nama: "Sahabat Rimba",
      nominal: 125000,
      ringkas: "5 pohon ditanam, atau 1 pemeriksaan kesehatan satwa",
    },
  };

  const params = new URLSearchParams(location.search);
  let saved = {};
  try {
    saved = JSON.parse(sessionStorage.getItem("suaka:bayar") || "{}");
  } catch {
    saved = {};
  }

  const paket = params.get("paket") || saved.paket || "satu-pohon";
  const base = CATALOG[paket] || CATALOG["satu-pohon"];
  const same = !params.get("paket") || saved.paket === params.get("paket");
  const order = {
    tipe: params.get("tipe") || (same && saved.tipe) || "sekali",
    paket,
    nama: params.get("nama") || (same && saved.nama) || base.nama,
    nominal: Number(params.get("nominal") || (same && saved.nominal) || base.nominal),
    alokasi: params.get("alokasi") || (same && saved.alokasi) || "",
    ringkas: (same && saved.ringkas) || base.ringkas,
  };

  const rupiah = (n) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n);

  const alokasiLabel =
    order.alokasi === "kesehatan"
      ? "1 pemeriksaan satwa"
      : order.alokasi === "pohon"
        ? "5 pohon"
        : "";
  const summary = [order.nama, alokasiLabel].filter(Boolean).join(" · ");

  $("#cardName").textContent = order.nama;
  $("#cardPrice").textContent = rupiah(order.nominal);
  $$("[data-card-line]").forEach((el) => {
    el.textContent = rupiah(order.nominal);
  });
  $("#productLine").textContent = `${summary} — ${order.ringkas}`;
  $("#total").textContent = rupiah(order.nominal);
  $("#payBtn").textContent = `Pay ${rupiah(order.nominal)}`;

  const paintQr = () => {
    const qr = $("#qr");
    const seed = `${order.paket}:${order.nominal}:${order.alokasi}`;
    let n = 0;
    for (let i = 0; i < seed.length; i += 1) n = (n * 33 + seed.charCodeAt(i)) >>> 0;
    const cells = [];
    for (let y = 0; y < 21; y += 1) {
      for (let x = 0; x < 21; x += 1) {
        const finder =
          (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
        const ring =
          finder &&
          (x === 0 ||
            y === 0 ||
            x === 6 ||
            y === 6 ||
            x === 14 ||
            y === 14 ||
            x === 20 ||
            y === 20 ||
            (x > 1 && x < 5 && y > 1 && y < 5) ||
            (x > 15 && x < 19 && y > 1 && y < 5) ||
            (x > 1 && x < 5 && y > 15 && y < 19));
        n = (n * 1664525 + 1013904223) >>> 0;
        const on = ring || (!finder && n % 3 !== 0);
        cells.push(`<i class="${on ? "on" : "off"}"></i>`);
      }
    }
    qr.innerHTML = cells.join("");
  };
  paintQr();

  let method = "kartu";
  const showMethod = (next) => {
    method = next;
    $$(".methods button").forEach((btn) => {
      btn.classList.toggle("is-on", btn.dataset.method === next);
    });
    $$("[data-pane]").forEach((pane) => {
      pane.hidden = pane.dataset.pane !== next;
    });
    $("#orLine").hidden = next !== "kartu";
  };

  $$(".methods button").forEach((btn) => {
    btn.addEventListener("click", () => showMethod(btn.dataset.method));
  });
  $("#openQris").addEventListener("click", () => showMethod("qris"));

  const digits = (value) => value.replace(/\D/g, "");
  $("#cardNumber").addEventListener("input", (event) => {
    const raw = digits(event.target.value).slice(0, 16);
    event.target.value = raw.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  });
  $("#cardExpiry").addEventListener("input", (event) => {
    const raw = digits(event.target.value).slice(0, 4);
    event.target.value = raw.length > 2 ? `${raw.slice(0, 2)} / ${raw.slice(2)}` : raw;
  });
  $("#cardCvv").addEventListener("input", (event) => {
    event.target.value = digits(event.target.value).slice(0, 4);
  });

  const fail = (message) => {
    const box = $("#formError");
    box.hidden = !message;
    box.textContent = message || "";
  };

  const emailOk = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const cardOk = () => {
    const number = digits($("#cardNumber").value);
    const name = $("#cardNameInput").value.trim();
    const expiry = digits($("#cardExpiry").value);
    const cvv = digits($("#cardCvv").value);
    if (number.length !== 16) return "Nomor kartu harus 16 digit.";
    if (name.length < 2) return "Isi nama pemegang kartu.";
    if (expiry.length !== 4) return "Isi tanggal kedaluwarsa.";
    const month = Number(expiry.slice(0, 2));
    const year = 2000 + Number(expiry.slice(2));
    const now = new Date();
    const expired =
      month < 1 ||
      month > 12 ||
      year < now.getFullYear() ||
      (year === now.getFullYear() && month < now.getMonth() + 1);
    if (expired) return "Tanggal kartu tidak berlaku.";
    if (cvv.length < 3) return "Isi CVV kartu.";
    return "";
  };

  const loadRecords = () => {
    try {
      return JSON.parse(localStorage.getItem("suaka:pembayaran") || "[]");
    } catch {
      return [];
    }
  };

  const makeCode = () => {
    const year = new Date().getFullYear();
    const used = new Set(loadRecords().map((item) => item.code));
    let code = "";
    do {
      const n = crypto.getRandomValues(new Uint32Array(1))[0] % 10000;
      code = `SKA-${year}-${String(n).padStart(4, "0")}`;
    } while (used.has(code));
    return code;
  };

  const formatDate = (iso) =>
    new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));

  const shortDate = (iso) =>
    new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
    }).format(new Date(iso));

  const methodLabelOf = (record) =>
    record.method === "qris" ? "QRIS" : record.method === "kartu" ? "Kartu" : record.wallet;

  const esc = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const receiptText = (record) => {
    const jenis = record.tipe === "bulanan" ? "Donasi Bulanan" : "Sekali Donasi";
    const first = record.donor.split(" ")[0];
    return [
      "Suaka",
      "",
      `Terima kasih, ${first}!`,
      "Donasimu sudah kami terima.",
      `ID DONASI: ${record.code}`,
      "",
      "RINCIAN DONASI",
      `Jenis donasi    ${jenis}`,
      `Paket           ${record.nama}`,
      `Tanggal         ${formatDate(record.at)}`,
      `Metode          ${methodLabelOf(record)}`,
      "",
      `TOTAL DIBAYAR   ${rupiah(record.nominal)}`,
      "",
      "APA YANG TERJADI SELANJUTNYA",
      `1 Diterima        ${shortDate(record.at)}`,
      "2 Dialokasikan    ± [N] hari",
      "3 Disalurkan      ± [N] hari",
      "4 Laporan dampak  ± [N] hari",
      "",
      "Ke mana uangmu pergi: 80% / 15% / 5%",
      "Cara kami memberi kabar lewat email, bersama ID donasimu.",
      "",
      "Butuh bantuan? Simpan ID ini.",
    ].join("\n");
  };

  const receiptHtml = (record) => {
    const jenis = record.tipe === "bulanan" ? "Donasi Bulanan" : "Sekali Donasi";
    const first = esc(record.donor.split(" ")[0]);
    const track = `${location.origin}/Payments.html?kode=${encodeURIComponent(record.code)}`;
    const row = (label, value) =>
      `<tr><td style="padding:6px 0;color:#5f6b64;font-size:15px;">${label}</td><td style="padding:6px 0;text-align:right;font-weight:600;font-size:15px;">${esc(value)}</td></tr>`;
    return `<div style="margin:0;padding:24px;background:#f3f7f4;font-family:Arial,Helvetica,sans-serif;color:#14241c;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #d5e5da;border-radius:18px;">
<tr><td style="padding:22px 22px 8px;text-align:center;font-size:28px;font-weight:700;color:#145c32;">Suaka</td></tr>
<tr><td style="padding:18px 22px;border-top:1px solid #e3eee7;">
<p style="margin:0;font-size:22px;font-weight:700;color:#145c32;">✓ Terima kasih, ${first}!</p>
<p style="margin:8px 0 0;">Donasimu sudah kami terima.</p>
<p style="margin:10px 0 0;font-weight:700;">ID DONASI: ${esc(record.code)}</p>
</td></tr>
<tr><td style="padding:18px 22px;border-top:1px solid #e3eee7;">
<p style="margin:0 0 12px;font-size:12px;letter-spacing:0.06em;font-weight:700;">RINCIAN DONASI</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${row("Jenis donasi", jenis)}
${row("Paket", record.nama)}
${row("Tanggal", formatDate(record.at))}
${row("Metode", methodLabelOf(record))}
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;border-top:1px solid #d7e6dc;">
<tr>
<td style="padding-top:12px;font-weight:700;">TOTAL DIBAYAR</td>
<td style="padding-top:12px;text-align:right;font-weight:700;">${esc(rupiah(record.nominal))}</td>
</tr>
</table>
</td></tr>
<tr><td style="padding:18px 22px;border-top:1px solid #e3eee7;">
<p style="margin:0 0 12px;font-size:12px;letter-spacing:0.06em;font-weight:700;">APA YANG TERJADI SELANJUTNYA</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:7px 0;font-weight:600;">✓ 1 Diterima</td><td style="padding:7px 0;text-align:right;">${esc(shortDate(record.at))}</td></tr>
<tr><td style="padding:7px 0;color:#5f6b64;">○ 2 Dialokasikan</td><td style="padding:7px 0;text-align:right;color:#5f6b64;">± [N] hari</td></tr>
<tr><td style="padding:7px 0;color:#5f6b64;">○ 3 Disalurkan</td><td style="padding:7px 0;text-align:right;color:#5f6b64;">± [N] hari</td></tr>
<tr><td style="padding:7px 0;color:#5f6b64;">○ 4 Laporan dampak</td><td style="padding:7px 0;text-align:right;color:#5f6b64;">± [N] hari</td></tr>
</table>
<p style="margin:14px 0 0;text-align:center;"><a href="${esc(track)}" style="display:inline-block;padding:12px 28px;border:1px solid #1f7a46;border-radius:999px;color:#145c32;font-weight:700;text-decoration:none;">Lacak Donasiku</a></p>
</td></tr>
<tr><td style="padding:18px 22px;border-top:1px solid #e3eee7;">
<p style="margin:0 0 10px;font-weight:600;">Ke mana uangmu pergi</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e7f5ec;">
<tr>
<td width="80%" height="12" style="background:#1f7a46;font-size:0;line-height:12px;">&nbsp;</td>
<td width="15%" height="12" style="background:#7dcea0;font-size:0;line-height:12px;">&nbsp;</td>
<td width="5%" height="12" style="background:#d8f3e2;font-size:0;line-height:12px;">&nbsp;</td>
</tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;color:#5f6b64;font-size:13px;">
<tr><td width="80%">80%</td><td width="15%">15%</td><td width="5%">5%</td></tr>
</table>
<p style="margin:12px 0 0;">Cara kami memberi kabar lewat email, bersama ID donasimu.</p>
</td></tr>
<tr><td style="padding:16px 22px 20px;border-top:1px solid #e3eee7;color:#5f6b64;">Butuh bantuan? · Simpan ID ini: <strong style="color:#145c32;">${esc(record.code)}</strong></td></tr>
</table>
</div>`;
  };

  const sendReceipt = (record) => {
    if (!window.emailjs) return Promise.reject(new Error("emailjs"));
    const subject = `Kuitansi donasi Suaka ${record.code}`;
    const html = receiptHtml(record);
    const jenis = record.tipe === "bulanan" ? "Donasi Bulanan" : "Sekali Donasi";
    return window.emailjs.send(
      "service_ps20gqm",
      "template_rrimlrt",
      {
        to_email: record.email,
        email: record.email,
        user_email: record.email,
        reply_to: record.email,
        to_name: record.donor,
        from_name: "Suaka",
        name: record.donor,
        subject,
        code: record.code,
        jenis,
        paket: record.nama,
        tanggal: formatDate(record.at),
        metode: methodLabelOf(record),
        total: rupiah(record.nominal),
        message: receiptText(record),
        receipt_html: html,
      },
      { publicKey: "0sxBFTdWrXwLp3NR4" }
    );
  };

  const showReceipt = (record, mailNote) => {
    const first = record.donor.split(" ")[0];
    const jenis = record.tipe === "bulanan" ? "Donasi Bulanan" : "Sekali Donasi";
    $("#thanksLine").textContent = `Terima kasih, ${first}!`;
    $("#payCode").textContent = record.code;
    $("#rJenis").textContent = jenis;
    $("#rPaket").textContent = record.nama;
    $("#rTanggal").textContent = formatDate(record.at);
    $("#rMetode").textContent = methodLabelOf(record);
    $("#rTotal").textContent = rupiah(record.nominal);
    $("#rDateShort").textContent = shortDate(record.at);
    $("#trackBtn").href = `/Payments.html?kode=${encodeURIComponent(record.code)}`;
    $("#doneMail").textContent = mailNote;
    $("#payForm").hidden = true;
    $("#done").hidden = false;
    document.querySelector(".pay").classList.add("is-receipt");
    window.scrollTo(0, 0);
    $("#copyCode").onclick = async () => {
      try {
        await navigator.clipboard.writeText(record.code);
        $("#copyCode").textContent = "ID tersimpan";
      } catch {
        $("#copyCode").textContent = record.code;
      }
    };
  };

  const savedCode = params.get("kode");
  if (savedCode) {
    const found = loadRecords().find((item) => item.code === savedCode);
    if (found) {
      showReceipt(found, `Kuitansi ini dikirim ke ${found.email}.`);
    }
  }

  $("#payForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = $("#email").value.trim();
    const donor = $("#donorName").value.trim();
    if (donor.length < 2) {
      fail("Isi nama kamu untuk kuitansi.");
      $("#donorName").focus();
      return;
    }
    if (!emailOk(email)) {
      fail("Daftarkan email yang valid untuk menerima kuitansi.");
      $("#email").focus();
      return;
    }
    if (method === "kartu") {
      const problem = cardOk();
      if (problem) {
        fail(problem);
        return;
      }
    }
    if (method === "emoney" && digits($("#phone").value).length < 10) {
      fail("Isi nomor telepon dompet digital.");
      return;
    }

    const code = makeCode();
    const record = {
      code,
      email,
      donor,
      method,
      wallet: method === "emoney" ? $("#wallet").value : "",
      tipe: order.tipe,
      nama: order.nama,
      paket: order.paket,
      nominal: order.nominal,
      alokasi: order.alokasi,
      at: new Date().toISOString(),
    };
    const list = loadRecords();
    list.push(record);
    try {
      localStorage.setItem("suaka:pembayaran", JSON.stringify(list));
    } catch {}

    $("#cardNumber").value = "";
    $("#cardCvv").value = "";
    const payBtn = $("#payBtn");
    payBtn.disabled = true;
    showReceipt(record, `Mengirim kuitansi ke ${email}…`);
    try {
      await sendReceipt(record);
      $("#doneMail").textContent = `Kuitansi terkirim ke ${email}.`;
    } catch {
      $("#doneMail").textContent = `Kuitansi tampil di halaman ini. Email ke ${email} belum terkirim.`;
    }
    payBtn.disabled = false;
  });
})();
