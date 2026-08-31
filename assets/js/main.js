/* ===========================================================
   KANDY ACHIEVERS BADMINTON ACADEMY, site behaviour
   Plain vanilla JS. No build step, no dependencies.
=========================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- header scroll state + mobile nav ---------- */
  var header = document.querySelector(".site-header");
  var navToggle = document.querySelector(".nav-toggle");
  var body = document.body;

  function onScrollHeader() {
    if (!header) return;
    if (window.scrollY > 40) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  if (navToggle) {
    navToggle.addEventListener("click", function () {
      body.classList.toggle("nav-open");
    });
    document.querySelectorAll(".main-nav a").forEach(function (a) {
      a.addEventListener("click", function () { body.classList.remove("nav-open"); });
    });
  }

  /* ---------- generic reveal-on-scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in-view"); });
  }

  /* ---------- coaches: automatic sideways reveal ---------- */
  var coachCards = document.querySelectorAll(".coach-card");
  if ("IntersectionObserver" in window && coachCards.length) {
    var coachObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            coachObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );
    coachCards.forEach(function (el) { coachObserver.observe(el); });
  } else {
    coachCards.forEach(function (el) { el.classList.add("in-view"); });
  }

  /* ---------- hero: scroll-scrubbed silhouette ---------- */
  var heroWrap = document.querySelector(".hero-pin-wrap");
  var heroPin = document.querySelector(".hero-pin");
  var heroFigure = document.querySelector(".figure-anim");

  if (heroWrap && heroPin && heroFigure) {
    var ticking = false;

    function isMobile() { return window.innerWidth <= 900; }

    function updateHero() {
      ticking = false;
      var rect = heroWrap.getBoundingClientRect();
      var vh = window.innerHeight;
      var total = heroWrap.offsetHeight - vh;
      if (total <= 0) return;

      var scrolled = -rect.top;
      var progress = scrolled / total;
      if (progress < 0) progress = 0;
      if (progress > 1) progress = 1;

      var shiftX = isMobile() ? window.innerWidth * 0.28 : window.innerWidth * 0.34;
      var shiftY = isMobile() ? -40 : -60;
      var scale = 1 - progress * 0.42;
      var translate = progress * shiftX;

      heroFigure.style.transform =
        "translate(" + translate + "px, " + progress * shiftY + "px) scale(" + scale + ")";

      if (progress > 0.06) heroPin.classList.add("in");
      else heroPin.classList.remove("in");

      if (progress > 0.75) heroPin.classList.add("faded");
      else heroPin.classList.remove("faded");
    }

    function onScrollHero() {
      if (!ticking) {
        window.requestAnimationFrame(updateHero);
        ticking = true;
      }
    }

    if (reduceMotion) {
      heroPin.classList.add("in");
    } else {
      window.addEventListener("scroll", onScrollHero, { passive: true });
      window.addEventListener("resize", onScrollHero);
      updateHero();
    }
  }

  /* ---------- slideshow (home preview + events feature) ---------- */
  function initSlideshow(root) {
    var slides = root.querySelectorAll(".slide");
    var dotsWrap = root.querySelector(".slide-dots");
    if (!slides.length) return;

    var index = 0;
    var timer = null;
    var interval = parseInt(root.getAttribute("data-interval"), 10) || 4200;

    if (dotsWrap) {
      slides.forEach(function (_, i) {
        var b = document.createElement("button");
        if (i === 0) b.classList.add("active");
        b.setAttribute("aria-label", "Show photo " + (i + 1));
        b.addEventListener("click", function () { go(i); restart(); });
        dotsWrap.appendChild(b);
      });
    }
    var dots = dotsWrap ? dotsWrap.querySelectorAll("button") : [];

    function go(i) {
      slides[index].classList.remove("active");
      if (dots[index]) dots[index].classList.remove("active");
      index = (i + slides.length) % slides.length;
      slides[index].classList.add("active");
      if (dots[index]) dots[index].classList.add("active");
    }

    function next() { go(index + 1); }

    function start() {
      if (reduceMotion) return;
      stop();
      timer = window.setInterval(next, interval);
    }
    function stop() { if (timer) { window.clearInterval(timer); timer = null; } }
    function restart() { start(); }

    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    root.addEventListener("focusin", stop);
    root.addEventListener("focusout", start);

    slides[0].classList.add("active");
    start();
  }
  document.querySelectorAll(".slideshow").forEach(initSlideshow);

  /* ---------- lightbox gallery (events page) ---------- */
  var galleryButtons = document.querySelectorAll(".gallery-grid button");
  var lightbox = document.querySelector(".lightbox");
  if (galleryButtons.length && lightbox) {
    var lbImg = lightbox.querySelector("img");
    var closeBtn = lightbox.querySelector(".lightbox-close");
    var prevBtn = lightbox.querySelector(".lightbox-prev");
    var nextBtn = lightbox.querySelector(".lightbox-next");
    var items = Array.prototype.map.call(galleryButtons, function (b) {
      return { full: b.getAttribute("data-full"), alt: b.querySelector("img").alt };
    });
    var current = 0;

    function openLB(i) {
      current = i;
      lbImg.src = items[current].full;
      lbImg.alt = items[current].alt;
      lightbox.classList.add("open");
      body.style.overflow = "hidden";
    }
    function closeLB() {
      lightbox.classList.remove("open");
      body.style.overflow = "";
    }
    function stepLB(dir) {
      current = (current + dir + items.length) % items.length;
      lbImg.src = items[current].full;
      lbImg.alt = items[current].alt;
    }

    galleryButtons.forEach(function (b, i) {
      b.addEventListener("click", function () { openLB(i); });
    });
    closeBtn.addEventListener("click", closeLB);
    prevBtn.addEventListener("click", function () { stepLB(-1); });
    nextBtn.addEventListener("click", function () { stepLB(1); });
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLB();
    });
    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("open")) return;
      if (e.key === "Escape") closeLB();
      if (e.key === "ArrowLeft") stepLB(-1);
      if (e.key === "ArrowRight") stepLB(1);
    });
  }

  /* ---------- footer year ---------- */
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- ambient gold particles (whisper level) ---------- */
  document.querySelectorAll(".particle-field").forEach(function (field) {
    if (reduceMotion) return;
    var count = 14;
    for (var i = 0; i < count; i++) {
      var s = document.createElement("span");
      s.style.left = Math.random() * 100 + "%";
      s.style.bottom = "-10px";
      s.style.animationDelay = (Math.random() * 9) + "s";
      s.style.animationDuration = (7 + Math.random() * 6) + "s";
      s.style.opacity = String(0.15 + Math.random() * 0.25);
      field.appendChild(s);
    }
  });
})();
