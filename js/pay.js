(function () {
  const cfg = () => window.OBUTE_CONFIG || {};
  const PKG_ART = {
    portraits: "assets/bayc-AlmkeHN6AHmTlQeo.png",
    "half-body": "assets/rtfkt-oVvI7tODtLYfU550.png",
    "full-body": "assets/comission-2a-IP8hCoMn7YdR4XL8.png"
  };

  function formatUsd(n) {
    return "$" + Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function walletList() {
    return Object.values(cfg().wallets || {});
  }

  function preferredWallet() {
    const list = walletList();
    return list.find((w) => w.preferred) || list[0] || null;
  }

  function isDemoAddress(addr) {
    return /demo|replaceme/i.test(addr || "");
  }

  function qrUrl(data) {
    return (
      "https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=" +
      encodeURIComponent(data)
    );
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } finally {
      document.body.removeChild(ta);
    }
    return Promise.resolve();
  }

  function toast(msg) {
    let el = document.querySelector(".cart-toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "cart-toast";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("show"), 2200);
  }

  function packageFromQuery() {
    const id = new URLSearchParams(location.search).get("package") || "portraits";
    const p = (cfg().products || {})[id];
    return p || (cfg().products || {}).portraits;
  }

  function setStep(name) {
    document.querySelectorAll("[data-step-label]").forEach((s) => {
      s.classList.toggle("active", s.getAttribute("data-step-label") === name);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const pkg = packageFromQuery();
    if (!pkg) {
      location.href = "index.html";
      return;
    }

    const root = document.querySelector("[data-pay-root]");
    const main = root.querySelector("[data-pay-main]");
    const success = root.querySelector("[data-pay-success]");
    const form = root.querySelector("[data-buyer-form]");
    const coinEl = root.querySelector("[data-coin-options]");
    const addrEl = root.querySelector("[data-wallet-address]");
    const networkEl = root.querySelector("[data-wallet-network]");
    const noteEl = root.querySelector("[data-wallet-note]");
    const qrImg = root.querySelector("[data-wallet-qr]");
    const demoBanner = root.querySelector("[data-demo-wallet]");

    document.querySelector("[data-pkg-name]").textContent = pkg.name;
    document.querySelector("[data-pkg-price]").textContent = formatUsd(pkg.priceUsd);
    document.querySelector("[data-pkg-desc]").textContent = pkg.description || "";
    const img = document.querySelector("[data-pkg-img]");
    img.src = PKG_ART[pkg.id] || PKG_ART.portraits;
    img.alt = pkg.name;

    let selectedWalletId = (preferredWallet() || {}).id;

    function selectedWallet() {
      return walletList().find((w) => w.id === selectedWalletId) || preferredWallet();
    }

    function renderWalletPanel() {
      const w = selectedWallet();
      if (!w) return;
      if (addrEl) addrEl.textContent = w.address;
      if (networkEl) networkEl.textContent = w.network;
      if (noteEl) noteEl.textContent = w.note || "";
      if (qrImg) {
        qrImg.src = qrUrl(w.address);
        qrImg.alt = "QR code for " + w.symbol + " " + w.network;
      }
      if (demoBanner) demoBanner.hidden = !isDemoAddress(w.address);
    }

    function renderCoins() {
      coinEl.innerHTML = walletList()
        .map((w) => {
          const active = w.id === selectedWalletId ? " active" : "";
          const pref = w.preferred ? '<span class="coin-pref">Recommended</span>' : "";
          return (
            '<button type="button" class="coin-option' +
            active +
            '" data-wallet-id="' +
            escapeHtml(w.id) +
            '">' +
            '<span class="coin-symbol">' +
            escapeHtml(w.symbol) +
            "</span>" +
            '<span class="coin-meta"><strong>' +
            escapeHtml(w.name) +
            "</strong><small>" +
            escapeHtml(w.network) +
            "</small></span>" +
            pref +
            "</button>"
          );
        })
        .join("");
      coinEl.querySelectorAll("[data-wallet-id]").forEach((btn) => {
        btn.addEventListener("click", () => {
          selectedWalletId = btn.getAttribute("data-wallet-id");
          renderCoins();
          renderWalletPanel();
        });
      });
    }

    root.querySelector("[data-copy-address]").addEventListener("click", () => {
      const w = selectedWallet();
      if (!w) return;
      copyText(w.address).then(() => toast("Address copied"));
    });

    root.querySelector("[data-confirm-paid]").addEventListener("click", () => {
      const email = (form.querySelector('[name="email"]').value || "").trim();
      if (!email) {
        toast("Email is required");
        form.querySelector('[name="email"]').focus();
        return;
      }
      const buyer = {
        name: (form.querySelector('[name="name"]').value || "").trim(),
        email,
        notes: (form.querySelector('[name="notes"]').value || "").trim()
      };
      const txHash = (root.querySelector('[name="txHash"]').value || "").trim();
      const w = selectedWallet();

      const detail = root.querySelector("[data-success-detail]");
      detail.textContent =
        pkg.name +
        " · " +
        formatUsd(pkg.priceUsd) +
        " via " +
        (w ? w.symbol + " on " + w.network : "crypto") +
        (txHash ? ". Ref: " + txHash : ".") +
        " Daniel will confirm once the transfer arrives.";

      root.querySelector("[data-mailto-order]").onclick = () => {
        const emailTo = cfg().artistEmail || "danielobute21@gmail.com";
        const body = [
          "Crypto commission payment",
          "",
          "Buyer: " + (buyer.name || "—"),
          "Email: " + buyer.email,
          "Notes: " + (buyer.notes || "—"),
          "",
          "Package: " + pkg.name,
          "Amount: " + formatUsd(pkg.priceUsd) + " USD",
          "Paid with: " + (w ? w.symbol + " · " + w.network : "—"),
          "Wallet: " + (w ? w.address : "—"),
          "Tx hash / ref: " + (txHash || "—"),
          "",
          "From Services crypto-pay demo."
        ].join("\n");
        location.href =
          "mailto:" +
          emailTo +
          "?subject=" +
          encodeURIComponent("Crypto payment — " + pkg.name + " " + formatUsd(pkg.priceUsd)) +
          "&body=" +
          encodeURIComponent(body);
      };

      main.hidden = true;
      success.hidden = false;
      setStep("done");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    setStep("pay");
    renderCoins();
    renderWalletPanel();
  });
})();
