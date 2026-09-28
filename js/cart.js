(function () {
  const STORAGE_KEY = "obute_cart_v1";
  const cfg = () => window.OBUTE_CONFIG || {};

  function readCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeCart(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    updateBadges();
    window.dispatchEvent(new CustomEvent("obute:cart-changed", { detail: { items } }));
  }

  function countItems(items) {
    return items.reduce((n, it) => n + (it.qty || 1), 0);
  }

  function cartTotalUsd(items) {
    return items.reduce((sum, it) => sum + (it.priceUsd || 0) * (it.qty || 1), 0);
  }

  function formatUsd(n) {
    return "$" + Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
  }

  function formatNgn(usd) {
    const rate = cfg().ngnPerUsd || 1600;
    return "₦" + Math.round(usd * rate).toLocaleString("en-NG");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function addProduct(productId, qty) {
    const p = (cfg().products || {})[productId];
    if (!p) return;
    const items = readCart();
    const existing = items.find((it) => it.id === p.id);
    if (existing) existing.qty = (existing.qty || 1) + (qty || 1);
    else {
      items.push({
        id: p.id,
        name: p.name,
        tier: p.tier,
        priceUsd: p.priceUsd,
        description: p.description,
        qty: qty || 1
      });
    }
    writeCart(items);
    toast(p.name + " added to cart");
  }

  function removeItem(id) {
    writeCart(readCart().filter((it) => it.id !== id));
  }

  function setQty(id, qty) {
    const items = readCart();
    const it = items.find((x) => x.id === id);
    if (!it) return;
    it.qty = Math.max(1, Math.min(10, Number(qty) || 1));
    writeCart(items);
  }

  function clearCart() {
    writeCart([]);
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

  function updateBadges() {
    const n = countItems(readCart());
    document.querySelectorAll("[data-cart-count]").forEach((el) => {
      el.textContent = String(n);
      el.hidden = n === 0;
      el.classList.toggle("has-items", n > 0);
    });
  }

  function ensureNavCart() {
    document.querySelectorAll(".nav-inner").forEach((nav) => {
      if (nav.querySelector(".nav-cart")) return;
      const cta = nav.querySelector(".nav-cta");
      const link = document.createElement("a");
      link.href = "cart.html";
      link.className = "nav-cart";
      link.setAttribute("aria-label", "Cart");
      link.innerHTML =
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M6 6h15l-1.5 9h-12z"/><path d="M6 6l-1-3H2"/><circle cx="9" cy="20" r="1.25"/><circle cx="18" cy="20" r="1.25"/></svg><span class="cart-count" data-cart-count hidden>0</span>';
      if (cta) nav.insertBefore(link, cta);
      else nav.appendChild(link);
    });
    document.querySelectorAll(".mobile-nav-panel").forEach((panel) => {
      if (panel.querySelector(".mobile-cart")) return;
      const cta = panel.querySelector(".mobile-cta");
      const a = document.createElement("a");
      a.href = "cart.html";
      a.className = "mobile-cart";
      a.innerHTML = 'Cart <span data-cart-count hidden>0</span>';
      if (cta) panel.insertBefore(a, cta);
      else panel.appendChild(a);
    });
  }

  function bindAddButtons() {
    document.querySelectorAll("[data-add-to-cart]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const id = btn.getAttribute("data-add-to-cart");
        const go = btn.getAttribute("data-go-checkout") === "true";
        addProduct(id, 1);
        if (go) window.location.href = "cart.html";
      });
    });
  }

  function walletList() {
    const w = cfg().wallets || {};
    return Object.values(w);
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

  function orderMailto(buyer, items, wallet, txHash) {
    const email = cfg().artistEmail || "danielobute21@gmail.com";
    const total = cartTotalUsd(items);
    const lines = items.map(
      (it) => "• " + it.name + " × " + it.qty + " — " + formatUsd(it.priceUsd * it.qty)
    );
    const body = [
      "Crypto commission payment",
      "",
      "Buyer: " + (buyer.name || "—"),
      "Email: " + (buyer.email || "—"),
      "Notes: " + (buyer.notes || "—"),
      "",
      "Items:",
      ...lines,
      "",
      "Total due: " + formatUsd(total) + " USD",
      "Paid with: " + (wallet ? wallet.symbol + " · " + wallet.network : "—"),
      "Wallet: " + (wallet ? wallet.address : "—"),
      "Tx hash / ref: " + (txHash || "—"),
      "",
      "From portfolio redesign demo cart."
    ].join("\n");
    window.location.href =
      "mailto:" +
      email +
      "?subject=" +
      encodeURIComponent("Crypto payment — " + formatUsd(total)) +
      "&body=" +
      encodeURIComponent(body);
  }

  function renderCartPage() {
    const root = document.querySelector("[data-cart-page]");
    if (!root) return;

    const emptyEl = root.querySelector("[data-cart-empty]");
    const reviewEl = root.querySelector("[data-cart-review]");
    const payEl = root.querySelector("[data-crypto-pay]");
    const successEl = root.querySelector("[data-checkout-success]");
    const listEl = root.querySelector("[data-cart-list]");
    const totalUsdEl = root.querySelector("[data-cart-total-usd]");
    const totalNgnEl = root.querySelector("[data-cart-total-ngn]");
    const payTotalEl = root.querySelector("[data-pay-total-usd]");
    const payNgnEl = root.querySelector("[data-pay-total-ngn]");
    const coinEl = root.querySelector("[data-coin-options]");
    const addrEl = root.querySelector("[data-wallet-address]");
    const networkEl = root.querySelector("[data-wallet-network]");
    const noteEl = root.querySelector("[data-wallet-note]");
    const qrImg = root.querySelector("[data-wallet-qr]");
    const demoBanner = root.querySelector("[data-demo-wallet]");
    const form = root.querySelector("[data-checkout-form]");
    const steps = root.querySelectorAll("[data-step]");

    let selectedWalletId = (preferredWallet() || {}).id;

    function setStep(name) {
      steps.forEach((s) => {
        s.classList.toggle("active", s.getAttribute("data-step") === name);
      });
    }

    function show(view) {
      if (emptyEl) emptyEl.hidden = view !== "empty";
      if (reviewEl) reviewEl.hidden = view !== "review";
      if (payEl) payEl.hidden = view !== "pay";
      if (successEl) successEl.hidden = view !== "success";
      if (view === "review") setStep("cart");
      if (view === "pay") setStep("pay");
      if (view === "success") setStep("done");
    }

    function selectedWallet() {
      return walletList().find((w) => w.id === selectedWalletId) || preferredWallet();
    }

    function renderCoins() {
      if (!coinEl) return;
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
      if (demoBanner) {
        const demo = isDemoAddress(w.address);
        demoBanner.hidden = !demo;
      }
    }

    function refreshReview() {
      const items = readCart();
      if (!items.length) {
        show("empty");
        return;
      }
      // Don't override pay/success mid-flow unless coming back
      if (payEl && !payEl.hidden) return;
      if (successEl && !successEl.hidden) return;

      show("review");
      const total = cartTotalUsd(items);
      if (totalUsdEl) totalUsdEl.textContent = formatUsd(total);
      if (totalNgnEl) totalNgnEl.textContent = "≈ " + formatNgn(total);
      if (listEl) {
        listEl.innerHTML = items
          .map(
            (it) =>
              '<article class="cart-line" data-id="' +
              escapeHtml(it.id) +
              '">' +
              '<div class="cart-line-info">' +
              '<span class="tier">' +
              escapeHtml(it.tier || "") +
              "</span>" +
              "<h3>" +
              escapeHtml(it.name) +
              "</h3>" +
              "<p>" +
              escapeHtml(it.description || "") +
              "</p>" +
              "</div>" +
              '<div class="cart-line-meta">' +
              '<div class="qty-control">' +
              '<button type="button" data-qty-dec aria-label="Decrease">−</button>' +
              '<input type="number" min="1" max="10" value="' +
              it.qty +
              '" data-qty-input aria-label="Quantity" />' +
              '<button type="button" data-qty-inc aria-label="Increase">+</button>' +
              "</div>" +
              '<div class="cart-line-price">' +
              formatUsd(it.priceUsd * it.qty) +
              "</div>" +
              '<button type="button" class="cart-remove" data-remove>Remove</button>' +
              "</div>" +
              "</article>"
          )
          .join("");

        listEl.querySelectorAll(".cart-line").forEach((row) => {
          const id = row.getAttribute("data-id");
          row.querySelector("[data-remove]")?.addEventListener("click", () => removeItem(id));
          row.querySelector("[data-qty-dec]")?.addEventListener("click", () => {
            const it = readCart().find((x) => x.id === id);
            if (it) setQty(id, (it.qty || 1) - 1);
          });
          row.querySelector("[data-qty-inc]")?.addEventListener("click", () => {
            const it = readCart().find((x) => x.id === id);
            if (it) setQty(id, (it.qty || 1) + 1);
          });
          row.querySelector("[data-qty-input]")?.addEventListener("change", (e) => {
            setQty(id, e.target.value);
          });
        });
      }
    }

    function enterPay() {
      const items = readCart();
      if (!items.length) {
        show("empty");
        return;
      }
      const fd = form ? new FormData(form) : null;
      const email = fd ? (fd.get("email") || "").toString().trim() : "";
      if (form && !email) {
        toast("Email is required");
        form.querySelector('[name="email"]')?.focus();
        return;
      }
      const total = cartTotalUsd(items);
      if (payTotalEl) payTotalEl.textContent = formatUsd(total);
      if (payNgnEl) payNgnEl.textContent = "≈ " + formatNgn(total) + " reference";
      renderCoins();
      renderWalletPanel();
      show("pay");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    root.querySelector("[data-proceed-pay]")?.addEventListener("click", (e) => {
      e.preventDefault();
      enterPay();
    });

    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      enterPay();
    });

    root.querySelector("[data-back-cart]")?.addEventListener("click", () => {
      show("review");
      refreshReview();
    });

    root.querySelector("[data-copy-address]")?.addEventListener("click", () => {
      const w = selectedWallet();
      if (!w) return;
      copyText(w.address).then(() => toast("Address copied"));
    });

    root.querySelector("[data-confirm-paid]")?.addEventListener("click", () => {
      const items = readCart();
      if (!items.length) {
        show("empty");
        return;
      }
      const fd = form ? new FormData(form) : new FormData();
      const buyer = {
        name: (fd.get("name") || "").toString().trim(),
        email: (fd.get("email") || "").toString().trim(),
        notes: (fd.get("notes") || "").toString().trim()
      };
      const txHash = (root.querySelector('[name="txHash"]')?.value || "").trim();
      const w = selectedWallet();

      const detail = successEl?.querySelector("[data-success-detail]");
      if (detail) {
        detail.textContent =
          "You selected " +
          (w ? w.symbol + " on " + w.network : "crypto") +
          (txHash ? ". Ref: " + txHash : ".") +
          " Daniel will confirm once the transfer arrives.";
      }

      const mailtoBtn = successEl?.querySelector("[data-mailto-order]");
      if (mailtoBtn) {
        mailtoBtn.onclick = () => orderMailto(buyer, items, w, txHash);
      }

      clearCart();
      show("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("obute:cart-changed", () => {
      if (payEl && !payEl.hidden) {
        const items = readCart();
        if (!items.length) show("empty");
        else {
          const total = cartTotalUsd(items);
          if (payTotalEl) payTotalEl.textContent = formatUsd(total);
          if (payNgnEl) payNgnEl.textContent = "≈ " + formatNgn(total) + " reference";
        }
        return;
      }
      if (successEl && !successEl.hidden) return;
      refreshReview();
    });

    refreshReview();
  }

  window.ObuteCart = {
    add: addProduct,
    remove: removeItem,
    clear: clearCart,
    items: readCart,
    total: () => cartTotalUsd(readCart()),
    formatUsd,
    formatNgn
  };

  document.addEventListener("DOMContentLoaded", () => {
    ensureNavCart();
    updateBadges();
    bindAddButtons();
    renderCartPage();
  });
})();
