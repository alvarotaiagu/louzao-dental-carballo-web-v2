/* Clínica Dental Louzao — comportamiento y movimiento.
   Todo el motion (GSAP, ScrollTrigger, Lenis, shader) es opcional: si un CDN
   falla o el usuario prefiere menos movimiento, la web sigue completa y
   estática — teléfono, horario, mapa y aviso de cookies no dependen de nada
   de esto. */
(function () {
  "use strict";

  var body = document.body;
  body.classList.add("js");

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) body.classList.add("motion-reduced");

  var gsapReady = !reduced && typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  if (gsapReady) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Lenis: un único motor de scroll suave ---------- */
  var lenis = null;
  if (gsapReady && typeof Lenis !== "undefined") {
    lenis = new Lenis({
      duration: 1.35,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      touchMultiplier: 1.6
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  function scrollToHash(hash) {
    var target = document.querySelector(hash);
    if (!target) return false;
    if (lenis) lenis.scrollTo(target, { offset: -8, duration: 1.6 });
    else target.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    return true;
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute("href").length < 2) return;
    if (scrollToHash(a.getAttribute("href"))) e.preventDefault();
  });

  /* ---------- Split de caracteres (accesible: aria-label con el texto) ---------- */
  function splitChars(el) {
    var text = el.textContent.trim();
    el.setAttribute("aria-label", text);
    el.innerHTML = "";
    var wrap = document.createElement("span");
    wrap.setAttribute("aria-hidden", "true");
    var chars = [];
    text.split(/\s+/).forEach(function (word, i, arr) {
      var w = document.createElement("span");
      w.className = "sc-word";
      word.split("").forEach(function (ch) {
        var c = document.createElement("span");
        c.className = "sc-char";
        c.textContent = ch;
        w.appendChild(c);
        chars.push(c);
      });
      wrap.appendChild(w);
      if (i < arr.length - 1) wrap.appendChild(document.createTextNode(" "));
    });
    el.appendChild(wrap);
    return chars;
  }

  var splitTargets = Array.prototype.slice.call(document.querySelectorAll("[data-split-char]"));
  var splitMap = new Map();
  splitTargets.forEach(function (el) { splitMap.set(el, splitChars(el)); });

  function revealChars(el, delay) {
    var chars = splitMap.get(el);
    if (!chars) return;
    gsap.to(chars, {
      opacity: 1, y: 0, duration: 1.15, ease: "power3.out",
      stagger: { each: 0.028, from: "start" }, delay: delay || 0, overwrite: true
    });
  }

  /* ---------- Hero: shader de agua + trazo del logo ---------- */
  var hero = document.querySelector(".hero");
  var aguaCanvas = hero && hero.querySelector(".agua-canvas");
  var agua = null;
  if (!reduced && aguaCanvas && typeof window.createAguaScene === "function") {
    try {
      agua = window.createAguaScene(aguaCanvas, { scale: 0.5 });
    } catch (e) { agua = null; }
    if (agua) {
      agua.renderOnce();
      agua.play();
      hero.classList.add("is-animated");
    }
  }

  function heroIntro() {
    var title = document.querySelector(".hero-title");
    var marks = document.querySelectorAll(".hero-mark path");
    var reveals = hero ? hero.querySelectorAll("[data-reveal]") : [];
    if (!gsapReady) {
      // Sin GSAP: primer frame completo, sin esperar a nada.
      splitMap.forEach(function (chars) { chars.forEach(function (c) { c.style.opacity = 1; c.style.transform = "none"; }); });
      document.querySelectorAll("[data-reveal]").forEach(function (el) { el.style.opacity = 1; el.style.transform = "none"; });
      document.querySelectorAll(".hero-mark path").forEach(function (p) { p.style.strokeDashoffset = 0; });
      return;
    }
    var tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    tl.to(marks, { strokeDashoffset: 0, duration: 2.6, ease: "power2.inOut", stagger: 0.12 }, 0.2);
    tl.add(function () { revealChars(title, 0); }, 0.9);
    tl.to(reveals, { opacity: 1, y: 0, duration: 1.1, stagger: 0.14 }, 1.5);
  }
  heroIntro();

  /* ---------- Reveals y titulares al hacer scroll ---------- */
  if (gsapReady) {
    splitTargets.forEach(function (el) {
      if (el.classList.contains("hero-title")) return;
      ScrollTrigger.create({ trigger: el, start: "top 84%", once: true, onEnter: function () { revealChars(el, 0); } });
    });
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      if (hero && hero.contains(el)) return;
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1.05, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true }
      });
    });

    /* Manifiesto: palabras que se encienden con el scroll y fondo que vira
       de hueso a bruma teal (scrub). */
    var calma = document.querySelector(".calma");
    var calmaText = document.querySelector("[data-scrub-words]");
    if (calma && calmaText) {
      var words = calmaText.textContent.trim().split(/\s+/);
      calmaText.setAttribute("aria-label", calmaText.textContent.trim());
      calmaText.innerHTML = "";
      var frag = document.createElement("span");
      frag.setAttribute("aria-hidden", "true");
      words.forEach(function (wd, i) {
        var s = document.createElement("span");
        s.className = "sw";
        s.textContent = wd;
        frag.appendChild(s);
        if (i < words.length - 1) frag.appendChild(document.createTextNode(" "));
      });
      calmaText.appendChild(frag);
      gsap.to(calmaText.querySelectorAll(".sw"), {
        opacity: 1, stagger: 0.06, ease: "none",
        scrollTrigger: { trigger: calmaText, start: "top 78%", end: "bottom 42%", scrub: 0.6 }
      });
      var mix = { v: 0 };
      gsap.to(mix, {
        v: 1, ease: "none",
        scrollTrigger: { trigger: calma, start: "top 80%", end: "bottom 30%", scrub: 0.8 },
        onUpdate: function () {
          // hueso #F7F4EE -> bruma #E1EDF0 -> bruma-2 #CFE3E8 (ida y vuelta suave)
          var t = Math.sin(mix.v * Math.PI);
          var r = Math.round(247 + (207 - 247) * t);
          var g = Math.round(244 + (227 - 244) * t);
          var b = Math.round(238 + (232 - 238) * t);
          calma.style.backgroundColor = "rgb(" + r + "," + g + "," + b + ")";
        }
      });
    }

    /* Parallax sutil en figuras */
    document.querySelectorAll("[data-parallax]").forEach(function (el) {
      var amt = parseFloat(el.getAttribute("data-parallax")) || 0;
      gsap.fromTo(el, { y: -amt }, {
        y: amt, ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 1.2 }
      });
    });
    document.querySelectorAll("[data-parallax-img] img").forEach(function (img) {
      gsap.fromTo(img, { yPercent: -9 }, {
        yPercent: 0, ease: "none",
        scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: 1.2 }
      });
    });

    /* Sticky-stack de tratamientos: cada tarjeta se encoge y se vela un
       poco cuando la siguiente la cubre. */
    var cards = Array.prototype.slice.call(document.querySelectorAll(".trat-card"));
    cards.forEach(function (card, i) {
      var next = cards[i + 1];
      if (!next) return;
      var veil = card.querySelector(".trat-card-veil");
      gsap.to(card, {
        scale: 0.94, ease: "none",
        scrollTrigger: { trigger: next, start: "top bottom", end: "top top+=120", scrub: 0.8 }
      });
      gsap.to(veil, {
        opacity: 0.55, ease: "none",
        scrollTrigger: { trigger: next, start: "top bottom", end: "top top+=120", scrub: 0.8 }
      });
    });
  } else {
    // Sin GSAP: todo visible desde el principio.
    document.querySelectorAll("[data-reveal]").forEach(function (el) { el.style.opacity = 1; el.style.transform = "none"; });
    splitMap.forEach(function (chars) { chars.forEach(function (c) { c.style.opacity = 1; c.style.transform = "none"; }); });
  }

  /* ---------- Botones magnéticos (solo puntero fino) ---------- */
  function initMagnetic() {
    if (!gsapReady || !window.matchMedia("(pointer: fine)").matches) return;
    var items = Array.prototype.slice.call(document.querySelectorAll("[data-magnetic]"));
    if (!items.length) return;
    var PAD = 70, STRENGTH = 0.32;
    var setters = items.map(function (el) {
      return {
        el: el,
        x: gsap.quickTo(el, "x", { duration: 0.7, ease: "power3.out" }),
        y: gsap.quickTo(el, "y", { duration: 0.7, ease: "power3.out" }),
        active: false
      };
    });
    window.addEventListener("pointermove", function (e) {
      for (var i = 0; i < setters.length; i++) {
        var s = setters[i];
        var r = s.el.getBoundingClientRect();
        var inside = e.clientX > r.left - PAD && e.clientX < r.right + PAD && e.clientY > r.top - PAD && e.clientY < r.bottom + PAD;
        if (inside) {
          s.active = true;
          s.x((e.clientX - (r.left + r.width / 2)) * STRENGTH);
          s.y((e.clientY - (r.top + r.height / 2)) * STRENGTH);
        } else if (s.active) {
          s.active = false;
          s.x(0); s.y(0);
        }
      }
    }, { passive: true });
  }
  initMagnetic();

  /* ---------- Cabecera: estado al hacer scroll ---------- */
  var header = document.querySelector(".site-header");
  function onScrollHeader() {
    var y = window.scrollY || document.documentElement.scrollTop;
    header.classList.toggle("is-scrolled", y > 40);
  }
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  /* ---------- Menú móvil ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var overlay = document.getElementById("nav-overlay");
  var closeTimer = 0;
  function openNav() {
    overlay.hidden = false;
    requestAnimationFrame(function () { overlay.classList.add("is-open"); });
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Cerrar menú");
    body.classList.add("nav-open");
    header.classList.add("is-scrolled");
    if (lenis) lenis.stop();
  }
  function closeNav() {
    overlay.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menú");
    body.classList.remove("nav-open");
    onScrollHeader();
    if (lenis) lenis.start();
    clearTimeout(closeTimer);
    closeTimer = setTimeout(function () { overlay.hidden = true; }, reduced ? 0 : 600);
  }
  if (toggle && overlay) {
    toggle.addEventListener("click", function () {
      if (toggle.getAttribute("aria-expanded") === "true") closeNav(); else openNav();
    });
    overlay.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeNav); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !overlay.hidden) closeNav(); });
  }

  /* ---------- Horario real: estado en directo ----------
     L/X/J 10-14 y 16-20 · M/V 10-14 · S/D cerrado. */
  var HORARIO = [[], [[10, 14], [16, 20]], [[10, 14]], [[10, 14], [16, 20]], [[10, 14], [16, 20]], [[10, 14]], []];
  var DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  function fmt(h) { return (h < 10 ? "0" : "") + h + ":00"; }
  function estadoAhora(now) {
    var d = now.getDay();
    var h = now.getHours() + now.getMinutes() / 60;
    var tramos = HORARIO[d];
    for (var i = 0; i < tramos.length; i++) {
      if (h >= tramos[i][0] && h < tramos[i][1]) return { open: true, detail: "Cierra a las " + fmt(tramos[i][1]) };
      if (h < tramos[i][0]) return { open: false, detail: "Abre hoy a las " + fmt(tramos[i][0]) };
    }
    for (var k = 1; k <= 7; k++) {
      var nd = (d + k) % 7;
      if (HORARIO[nd].length) {
        var cuando = k === 1 ? "mañana" : "el " + DIAS[nd];
        return { open: false, detail: "Abre " + cuando + " a las " + fmt(HORARIO[nd][0][0]) };
      }
    }
    return { open: false, detail: "" };
  }
  function updateEstado() {
    var now = new Date();
    var st = estadoAhora(now);
    document.querySelectorAll("[data-estado]").forEach(function (el) {
      el.classList.toggle("is-open", st.open);
      el.querySelector("[data-estado-label]").textContent = st.open ? "Abierto ahora" : "Cerrado ahora";
      el.querySelector("[data-estado-detail]").textContent = st.detail ? "· " + st.detail : "";
    });
    document.querySelectorAll(".horario tr").forEach(function (tr) {
      tr.classList.toggle("is-hoy", tr.getAttribute("data-dia") === String(now.getDay()));
    });
  }
  updateEstado();
  setInterval(updateEstado, 60000);

  /* ---------- Aviso de cookies ---------- */
  (function initCookieBanner() {
    var banner = document.querySelector(".cookie-banner");
    var ack = document.querySelector(".cookie-ack");
    if (!banner || !ack) return;
    var KEY = "louzao-cookie-ack";
    var seen = false;
    try { seen = localStorage.getItem(KEY) === "1"; } catch (e) {}
    if (!seen) banner.hidden = false;
    ack.addEventListener("click", function () {
      banner.hidden = true;
      try { localStorage.setItem(KEY, "1"); } catch (e) {}
    });
  })();

  /* ---------- Mapa: solo al pulsar (coherente con "sin cookies de terceros") ---------- */
  document.querySelectorAll(".map-consent").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!btn.dataset.mapSrc) return;
      var iframe = document.createElement("iframe");
      iframe.title = btn.dataset.mapTitle || "Mapa";
      iframe.src = btn.dataset.mapSrc;
      iframe.loading = "lazy";
      iframe.referrerPolicy = "no-referrer-when-downgrade";
      btn.replaceWith(iframe);
    }, { once: true });
  });

  /* ---------- Pie ---------- */
  var year = document.getElementById("footer-year");
  if (year) year.textContent = new Date().getFullYear();

  if (gsapReady) {
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  }
})();
