/**
 * Mei - The Pure Essence chat widget
 *
 * Single-file, dependency-free widget. Add ONE script tag to your site
 * template (e.g. right before </body>) and it appears on every page:
 *
 *   <script
 *     src="/mei-widget/mei-widget.js"
 *     data-worker-url="https://mei-chat.YOUR-SUBDOMAIN.workers.dev"
 *     defer
 *   ></script>
 *
 * Optional data attributes on the same tag:
 *   data-avatar-url   - override the avatar image path
 *                        (defaults to mei-avatar-256.png next to this script)
 */

(function () {
  "use strict";

  var MEI_LINKS = {
    whatsapp: "https://wa.me/35797547727",
    booking: "https://store.lupapets.com/booking/dc18f3bf-2680-4529-8677-49463f0ae484",
  };

  var MEI_GREETING = {
    en: "Hi, I'm Mei - here if you have any questions!",
    el: "Geia, eimai i Mei - edo an exete aporeis!",
    tr: "Merhaba, ben Mei - herhangi bir sorunuz olursa buradayim!",
  };

  var MEI_UI = {
    en: {
      headerName: "Mei",
      headerSub: "The Pure Essence",
      disclosure: "Hi, I'm Mei, The Pure Essence's AI assistant 🌸 Just so you know: I'm here to help answer questions, but I'm not able to diagnose anything or give medical advice - for that, Linda's the one to speak with.",
      menuPrompt: "Hi! How can I help today?",
      menuBook: "Book an appointment",
      menuWhatsapp: "Message us on WhatsApp",
      menuAsk: "Ask a question",
      askVisited: "Have you visited us before?",
      yes: "Yes, I'm an existing client",
      no: "No, I'm new",
      namePlaceholder: "Your name",
      emailPlaceholder: "Your email",
      submit: "Continue",
      newClientClose: "Thanks {name}! Tap below to message us on WhatsApp and we'll get your first appointment sorted.",
      existingClientClose: "Great - tap below to book your appointment directly.",
      openWhatsapp: "Open WhatsApp",
      openBooking: "Open booking page",
      inputPlaceholder: "Type your question...",
      send: "Send",
      thinking: "Mei is typing...",
      closedNotice: "This conversation has been closed. You're welcome to reach out on WhatsApp any time.",
      errorNotice: "Mei is temporarily unavailable - please try WhatsApp instead.",
      backToMenu: "Back to menu",
    },
  };

  var currentScript =
    document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName("script");
      return scripts[scripts.length - 1];
    })();

  var WORKER_URL = (currentScript.getAttribute("data-worker-url") || "").replace(/\/$/, "");
  var scriptBase = currentScript.src.replace(/[^/]+$/, "");
  var AVATAR_URL = currentScript.getAttribute("data-avatar-url") || scriptBase + "assets/mei-avatar-256.png";

  if (!WORKER_URL && window.console) {
    console.warn("[Mei widget] data-worker-url is not set on the script tag - chat will not work.");
  }

  function browserLang() {
    var lang = (navigator.language || "en").slice(0, 2).toLowerCase();
    if (lang === "el" || lang === "tr") return lang;
    return "en";
  }

  var LANG = browserLang();
  var GREETING = MEI_GREETING[LANG] || MEI_GREETING.en;
  var UI = MEI_UI.en;

  // ---------------------------------------------------------------------
  // Fonts - match the main site (Cormorant Garamond for display, Mulish
  // for body/UI text)
  // ---------------------------------------------------------------------

  function injectFonts() {
    if (document.getElementById("mei-fonts")) return;
    var link = document.createElement("link");
    link.id = "mei-fonts";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Mulish:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }

  var STYLE = "\n" +
    ":root {\n" +
    "  --mei-sage: #7C9A82;\n" +
    "  --mei-sage-dark: #5E7A63;\n" +
    "  --mei-sage-light: #EAF0E8;\n" +
    "  --mei-gold: #C7A661;\n" +
    "  --mei-cream: #FBF9F4;\n" +
    "  --mei-text: #33392F;\n" +
    "  --mei-radius: 16px;\n" +
    "  --mei-font-display: 'Cormorant Garamond', 'Hoefler Text', Georgia, serif;\n" +
    "  --mei-font-body: 'Mulish', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;\n" +
    "}\n" +
    "#mei-root, #mei-root * { box-sizing: border-box; }\n" +
    "#mei-root { position: fixed; z-index: 999999; bottom: 20px; right: 20px; font-family: var(--mei-font-body); }\n" +
    "#mei-root button, #mei-root input { font-family: inherit; }\n" +
    "@keyframes mei-pulse { 0% { box-shadow: 0 6px 18px rgba(51,57,47,0.25), 0 0 0 0 rgba(199,166,97,0.55); } 70% { box-shadow: 0 6px 18px rgba(51,57,47,0.25), 0 0 0 12px rgba(199,166,97,0); } 100% { box-shadow: 0 6px 18px rgba(51,57,47,0.25), 0 0 0 0 rgba(199,166,97,0); } }\n" +
    "#mei-launcher { width: 64px; height: 64px; border-radius: 50%; background: var(--mei-sage); border: 3px solid var(--mei-gold); box-shadow: 0 6px 18px rgba(51,57,47,0.25); cursor: pointer; display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 0; }\n" +
    "#mei-launcher.mei-pulse { animation: mei-pulse 2.4s ease-out infinite; }\n" +
    "#mei-launcher img { width: 100%; height: 100%; object-fit: cover; }\n" +
    "#mei-bubble { position: absolute; bottom: 76px; right: 0; max-width: 220px; background: var(--mei-cream); color: var(--mei-text); border: 1px solid var(--mei-gold); border-radius: var(--mei-radius); padding: 10px 14px; font-family: var(--mei-font-display); font-size: 16px; font-weight: 500; box-shadow: 0 6px 18px rgba(51,57,47,0.18); display: flex; align-items: center; gap: 8px; cursor: pointer; }\n" +
    "#mei-bubble button { background: none; border: none; color: var(--mei-sage-dark); font-size: 16px; cursor: pointer; line-height: 1; padding: 0; font-family: var(--mei-font-body); }\n" +
    "#mei-panel { position: absolute; bottom: 76px; right: 0; width: 400px; max-width: calc(100vw - 40px); height: 600px; max-height: 78vh; background: var(--mei-cream); border-radius: var(--mei-radius); box-shadow: 0 12px 32px rgba(51,57,47,0.3); display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--mei-sage-light); opacity: 0; visibility: hidden; pointer-events: none; transform: translateY(18px) scale(0.97); transform-origin: bottom right; transition: opacity 0.28s ease, transform 0.32s cubic-bezier(0.34, 1.25, 0.64, 1), visibility 0.28s; }\n" +
    "#mei-panel.mei-open { opacity: 1; visibility: visible; pointer-events: auto; transform: translateY(0) scale(1); }\n" +
    "#mei-header { background: var(--mei-sage); color: #fff; display: flex; align-items: center; gap: 10px; padding: 12px 14px; flex-shrink: 0; }\n" +
    "#mei-header img { width: 36px; height: 36px; border-radius: 50%; border: 2px solid var(--mei-gold); object-fit: cover; }\n" +
    "#mei-header-text { flex: 1; min-width: 0; }\n" +
    "#mei-header-text .mei-name { font-family: var(--mei-font-display); font-weight: 600; font-size: 18px; letter-spacing: 0.2px; }\n" +
    "#mei-header-text .mei-sub { font-size: 11px; opacity: 0.85; }\n" +
    "#mei-restart, #mei-close { background: none; border: none; color: #fff; cursor: pointer; padding: 4px 8px; line-height: 1; opacity: 0.9; }\n" +
    "#mei-restart:hover, #mei-close:hover { opacity: 1; }\n" +
    "#mei-restart { font-size: 17px; }\n" +
    "#mei-close { font-size: 22px; font-weight: 700; }\n" +
    "#mei-body { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; background: var(--mei-cream); }\n" +
    ".mei-msg { max-width: 85%; padding: 9px 12px; border-radius: 14px; font-size: 14.5px; line-height: 1.45; white-space: pre-wrap; }\n" +
    ".mei-msg.mei-from-mei { align-self: flex-start; background: var(--mei-sage-light); color: var(--mei-text); border-bottom-left-radius: 4px; }\n" +
    ".mei-msg.mei-from-user { align-self: flex-end; background: var(--mei-sage); color: #fff; border-bottom-right-radius: 4px; }\n" +
    ".mei-options { display: flex; flex-direction: column; gap: 8px; align-self: stretch; }\n" +
    ".mei-btn { background: #fff; border: 1.5px solid var(--mei-sage); color: var(--mei-sage-dark); border-radius: 999px; padding: 9px 14px; font-size: 14px; cursor: pointer; text-align: center; text-decoration: none; display: block; }\n" +
    ".mei-btn:hover { background: var(--mei-sage-light); }\n" +
    ".mei-btn.mei-primary { background: var(--mei-gold); border-color: var(--mei-gold); color: #fff; }\n" +
    ".mei-form { display: flex; flex-direction: column; gap: 8px; align-self: stretch; }\n" +
    ".mei-form input { border: 1.5px solid var(--mei-sage-light); border-radius: 10px; padding: 9px 12px; font-size: 16px; }\n" +
    ".mei-form input:focus { outline: none; border-color: var(--mei-sage); }\n" +
    "#mei-footer { border-top: 1px solid var(--mei-sage-light); padding: 10px; display: flex; gap: 8px; background: #fff; flex-shrink: 0; }\n" +
    "#mei-input { flex: 1; min-width: 0; border: 1.5px solid var(--mei-sage-light); border-radius: 999px; padding: 9px 14px; font-size: 16px; }\n" +
    "#mei-input:focus { outline: none; border-color: var(--mei-sage); }\n" +
    "#mei-send { background: var(--mei-sage); color: #fff; border: none; border-radius: 999px; padding: 0 16px; font-size: 14px; cursor: pointer; flex-shrink: 0; }\n" +
    "#mei-send:disabled { opacity: 0.5; cursor: default; }\n" +
    ".mei-typing { font-size: 13px; color: var(--mei-sage-dark); font-style: italic; align-self: flex-start; }\n" +
    "@media (max-width: 640px) {\n" +
    "  #mei-root { bottom: 16px; right: 16px; }\n" +
    "  #mei-panel.mei-open { position: fixed; top: 0; left: 0; right: 0; bottom: 0; width: 100%; height: 100%; max-width: 100%; max-height: 100%; border-radius: 0; transform: none; }\n" +
    "  #mei-bubble { right: 0; }\n" +
    "}\n";

  function injectStyle() {
    var styleEl = document.createElement("style");
    styleEl.setAttribute("data-mei", "true");
    styleEl.textContent = STYLE;
    document.head.appendChild(styleEl);
  }

  var els = {};
  var chatHistory = [];
  var chatClosed = false;
  var disclosureShown = false;

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    attrs = attrs || {};
    for (var key in attrs) {
      if (key === "class") node.className = attrs[key];
      else if (key === "text") node.textContent = attrs[key];
      else node.setAttribute(key, attrs[key]);
    }
    (children || []).forEach(function (child) {
      if (child) node.appendChild(child);
    });
    return node;
  }

  function build() {
    var root = el("div", { id: "mei-root" });

    var launcherImg = el("img", { src: AVATAR_URL, alt: "Mei" });
    var launcher = el("button", { id: "mei-launcher", "aria-label": "Open chat with Mei" }, [launcherImg]);

    var bubbleDismiss = el("button", { "aria-label": "Dismiss" }, []);
    bubbleDismiss.textContent = "×";
    var bubbleText = el("span", { text: GREETING });
    var bubble = el("div", { id: "mei-bubble" }, [bubbleText, bubbleDismiss]);

    var headerImg = el("img", { src: AVATAR_URL, alt: "Mei" });
    var headerName = el("div", { class: "mei-name", text: UI.headerName });
    var headerSub = el("div", { class: "mei-sub", text: UI.headerSub });
    var headerText = el("div", { id: "mei-header-text" }, [headerName, headerSub]);

    var restartBtn = el("button", { id: "mei-restart", "aria-label": "Restart conversation", title: "Restart conversation" });
    restartBtn.textContent = "↺";

    var closeBtn = el("button", { id: "mei-close", "aria-label": "Minimize chat", title: "Minimize" });
    closeBtn.textContent = "−";

    var header = el("div", { id: "mei-header" }, [headerImg, headerText, restartBtn, closeBtn]);

    var body = el("div", { id: "mei-body" });

    var input = el("input", { id: "mei-input", type: "text", placeholder: UI.inputPlaceholder, autocomplete: "off" });
    var sendBtn = el("button", { id: "mei-send", text: UI.send });
    var footer = el("div", { id: "mei-footer" }, [input, sendBtn]);

    var panel = el("div", { id: "mei-panel" }, [header, body, footer]);

    root.appendChild(bubble);
    root.appendChild(panel);
    root.appendChild(launcher);
    document.body.appendChild(root);

    els.root = root;
    els.launcher = launcher;
    els.bubble = bubble;
    els.bubbleDismiss = bubbleDismiss;
    els.panel = panel;
    els.restartBtn = restartBtn;
    els.closeBtn = closeBtn;
    els.body = body;
    els.input = input;
    els.sendBtn = sendBtn;
    els.footer = footer;

    setFooterMode("hidden");
    wireEvents();
    wireViewportHandling();
    showBubbleAfterDelay();
  }

  function setFooterMode(mode) {
    els.footer.style.display = mode === "chat" ? "flex" : "none";
  }

  function showBubbleAfterDelay() {
    setTimeout(function () {
      if (!els.panel.classList.contains("mei-open")) {
        els.bubble.style.display = "flex";
      }
    }, 2500);
  }

  function hideBubble() {
    els.bubble.style.display = "none";
  }

  function scrollToBottom() {
    els.body.scrollTop = els.body.scrollHeight;
  }

  function addMessage(text, from) {
    var msg = el("div", { class: "mei-msg mei-from-" + from, text: text });
    els.body.appendChild(msg);
    scrollToBottom();
    return msg;
  }

  function addOptions(options) {
    var wrap = el("div", { class: "mei-options" });
    options.forEach(function (opt) {
      var btn = el("button", { class: "mei-btn" + (opt.primary ? " mei-primary" : ""), text: opt.label });
      btn.addEventListener("click", opt.onClick);
      wrap.appendChild(btn);
    });
    els.body.appendChild(wrap);
    scrollToBottom();
    return wrap;
  }

  function addLinkButton(label, href) {
    var a = el("a", { class: "mei-btn mei-primary", href: href, target: "_blank", rel: "noopener", text: label });
    els.body.appendChild(a);
    scrollToBottom();
    return a;
  }

  function clearBody() {
    els.body.innerHTML = "";
  }

  function showTyping() {
    var t = el("div", { class: "mei-typing", text: UI.thinking });
    t.setAttribute("data-mei-typing", "true");
    els.body.appendChild(t);
    scrollToBottom();
    return t;
  }

  function removeTyping() {
    var t = els.body.querySelector("[data-mei-typing]");
    if (t) t.remove();
  }

  function logEvent(event, detail) {
    if (!WORKER_URL) return;
    fetch(WORKER_URL + "/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: event, detail: detail || null }),
    }).catch(function () {});
  }

  function renderLinks(links) {
    if (!Array.isArray(links)) return;
    links.forEach(function (link) {
      if (link.type === "whatsapp") {
        var text = link.name && link.email
          ? "Hi, I'm " + link.name + " (" + link.email + ") and I'd like to book my first appointment."
          : null;
        var href = MEI_LINKS.whatsapp + (text ? "?text=" + encodeURIComponent(text) : "");
        addLinkButton(UI.openWhatsapp, href);
      } else if (link.type === "booking") {
        addLinkButton(UI.openBooking, MEI_LINKS.booking);
      }
    });
  }

  function showMenu() {
    clearBody();
    setFooterMode("hidden");
    if (!disclosureShown) {
      addMessage(UI.disclosure, "mei");
      disclosureShown = true;
    }
    addMessage(UI.menuPrompt, "mei");
    addOptions([
      { label: UI.menuBook, onClick: startBookingFlow },
      { label: UI.menuWhatsapp, onClick: startWhatsappDirect },
      { label: UI.menuAsk, onClick: startAskFlow, primary: true },
    ]);
  }

  function startWhatsappDirect() {
    logEvent("whatsapp", null);
    addMessage(UI.menuWhatsapp, "user");
    addLinkButton(UI.openWhatsapp, MEI_LINKS.whatsapp);
    addBackToMenu();
  }

  function startBookingFlow() {
    addMessage(UI.menuBook, "user");
    addMessage(UI.askVisited, "mei");
    addOptions([
      { label: UI.yes, onClick: bookExisting },
      { label: UI.no, onClick: bookNewForm },
    ]);
  }

  function bookExisting() {
    addMessage(UI.yes, "user");
    logEvent("booking_existing", null);
    addMessage(UI.existingClientClose, "mei");
    addLinkButton(UI.openBooking, MEI_LINKS.booking);
    addBackToMenu();
  }

  function bookNewForm() {
    addMessage(UI.no, "user");
    var nameInput = el("input", { type: "text", placeholder: UI.namePlaceholder });
    var emailInput = el("input", { type: "email", placeholder: UI.emailPlaceholder });
    var submit = el("button", { class: "mei-btn mei-primary", text: UI.submit });
    var form = el("div", { class: "mei-form" }, [nameInput, emailInput, submit]);
    els.body.appendChild(form);
    scrollToBottom();

    submit.addEventListener("click", function () {
      var name = nameInput.value.trim();
      var email = emailInput.value.trim();
      if (!name || !email) return;
      form.remove();
      addMessage(name + " / " + email, "user");
      logEvent("booking_new", { name: name, email: email });
      addMessage(UI.newClientClose.replace("{name}", name), "mei");
      addLinkButton(UI.openWhatsapp, MEI_LINKS.whatsapp + "?text=" + encodeURIComponent("Hi, I'm " + name + " (" + email + ") and I'd like to book my first appointment."));
      addBackToMenu();
    });
  }

  function startAskFlow() {
    addMessage(UI.menuAsk, "user");
    setFooterMode("chat");
    els.input.focus();
  }

  function addBackToMenu() {
    addOptions([{ label: UI.backToMenu, onClick: showMenu }]);
  }

  async function sendMessage(text) {
    if (chatClosed || !text) return;

    addMessage(text, "user");
    chatHistory.push({ role: "user", content: text });
    els.input.value = "";
    els.input.disabled = true;
    els.sendBtn.disabled = true;

    var typingEl = showTyping();

    try {
      if (!WORKER_URL) throw new Error("Worker URL not configured");

      var res = await fetch(WORKER_URL + "/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory }),
      });

      var data = await res.json();
      removeTyping();

      if (!res.ok) {
        addMessage(data.error || UI.errorNotice, "mei");
        addLinkButton(UI.openWhatsapp, MEI_LINKS.whatsapp);
      } else {
        addMessage(data.reply, "mei");
        chatHistory.push({ role: "assistant", content: data.reply });
        renderLinks(data.links);

        if (data.close) {
          chatClosed = true;
          setFooterMode("closed");
          addMessage(UI.closedNotice, "mei");
        }
      }
    } catch (err) {
      removeTyping();
      addMessage(UI.errorNotice, "mei");
      addLinkButton(UI.openWhatsapp, MEI_LINKS.whatsapp);
    } finally {
      if (!chatClosed) {
        els.input.disabled = false;
        els.sendBtn.disabled = false;
        els.input.focus();
      }
    }
  }

  function openPanel() {
    hideBubble();
    els.launcher.classList.remove("mei-pulse");
    els.panel.classList.add("mei-open");
    if (els.body.children.length === 0) {
      showMenu();
    }
  }

  function closePanel() {
    els.panel.classList.remove("mei-open");
  }

  function restartChat() {
    chatHistory = [];
    chatClosed = false;
    els.input.disabled = false;
    els.sendBtn.disabled = false;
    showMenu();
  }

  function wireEvents() {
    els.launcher.addEventListener("click", function () {
      if (els.panel.classList.contains("mei-open")) {
        closePanel();
      } else {
        openPanel();
      }
    });

    els.closeBtn.addEventListener("click", closePanel);
    els.restartBtn.addEventListener("click", restartChat);

    els.bubbleDismiss.addEventListener("click", function (e) {
      e.stopPropagation();
      hideBubble();
      els.launcher.classList.add("mei-pulse");
    });

    els.bubble.addEventListener("click", function (e) {
      if (e.target === els.bubbleDismiss) return;
      openPanel();
    });

    els.sendBtn.addEventListener("click", function () {
      sendMessage(els.input.value.trim());
    });

    els.input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        sendMessage(els.input.value.trim());
      }
    });
  }

  // Keep the panel within the visible viewport on mobile when the
  // on-screen keyboard opens (visualViewport shrinks but fixed-position
  // elements don't always resize to follow it on their own).
  function wireViewportHandling() {
    if (!window.visualViewport) return;
    window.visualViewport.addEventListener("resize", function () {
      var isMobile = window.matchMedia("(max-width: 640px)").matches;
      if (isMobile && els.panel.classList.contains("mei-open")) {
        els.panel.style.height = window.visualViewport.height + "px";
      } else {
        els.panel.style.height = "";
      }
    });
  }

  function init() {
    injectFonts();
    injectStyle();
    build();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
