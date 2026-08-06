(function () {
  'use strict';

  // Navbar toggle & dropdowns
  function initNavbar() {
    var toggle = document.querySelector('.navbar__toggle');
    var nav = document.querySelector('.navbar__nav');

    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        var isOpen = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(isOpen));
      });
    }

    var isMobileNav = function () { return window.matchMedia('(max-width: 1024px)').matches; };

    document.querySelectorAll('.navbar__item--dropdown').forEach(function (item) {
      var btn = item.querySelector('.navbar__link');
      if (!btn) return;

      btn.addEventListener('click', function () {
        if (!isMobileNav()) return;
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        item.classList.toggle('is-open');
      });

      item.addEventListener('mouseenter', function () {
        if (isMobileNav()) return;
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      });

      item.addEventListener('mouseleave', function () {
        if (isMobileNav()) return;
        item.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // "What We Do" mega-menu — left-rail tabs swap the right-hand panel
  function initMegaMenu() {
    document.querySelectorAll('[data-mega-menu]').forEach(function (menu) {
      var tabs = Array.from(menu.querySelectorAll('.mega-menu__tab'));
      var panels = Array.from(menu.querySelectorAll('.mega-menu__panel'));
      if (!tabs.length) return;

      function activate(key) {
        tabs.forEach(function (tab) {
          var isActive = tab.dataset.tab === key;
          tab.classList.toggle('is-active', isActive);
          tab.setAttribute('aria-selected', String(isActive));
        });
        panels.forEach(function (panel) {
          panel.classList.toggle('is-active', panel.dataset.panel === key);
        });
      }

      tabs.forEach(function (tab) {
        tab.addEventListener('mouseenter', function () { activate(tab.dataset.tab); });
        tab.addEventListener('click', function () { activate(tab.dataset.tab); });
      });
    });
  }

  // Hero slider with auto-play
  function initHeroSlider() {
    var hero = document.querySelector('.hero');
    var bgs = Array.from(document.querySelectorAll('.hero__bg[data-slide]'));
    var contents = Array.from(document.querySelectorAll('.hero__content[data-slide]'));
    var segments = Array.from(document.querySelectorAll('.hero__tab'));
    if (!hero || !bgs.length || !contents.length) return;

    var current = 0;
    var total = bgs.length;
    var interval = 6500;
    var timer = null;
    var hovering = false;

    // Restarts the background's slow zoom and the title/subtitle's fade-up
    // rise for the given slide. Kept separate from the opacity crossfade
    // below so a mid-fade restart never snaps anything's position.
    function triggerEntrance(index) {
      var bg = bgs[index];
      bg.classList.remove('is-zooming');
      void bg.offsetWidth;
      bg.classList.add('is-zooming');

      var content = contents[index];
      [content.querySelector('.hero__title'), content.querySelector('.hero__subtitle')].forEach(function (el) {
        if (!el) return;
        el.classList.remove('is-active');
        void el.offsetWidth;
        el.classList.add('is-active');
      });
    }

    function goToSlide(index) {
      bgs.forEach(function (bg) { bg.classList.remove('is-active'); });
      contents.forEach(function (c) { c.classList.remove('is-active'); });
      // Segments before the new index read as "already seen" (solid), the
      // active one gets the animated fill, later ones stay dim — resets
      // each time the rail loops back to the first slide.
      segments.forEach(function (seg, i) {
        seg.classList.remove('is-active', 'is-viewed');
        seg.setAttribute('aria-selected', 'false');
        if (i < index) seg.classList.add('is-viewed');
      });

      bgs[index].classList.add('is-active');
      contents[index].classList.add('is-active');
      if (segments[index]) {
        segments[index].classList.add('is-active');
        segments[index].setAttribute('aria-selected', 'true');
      }
      current = index;

      triggerEntrance(index);
    }

    function nextSlide() {
      goToSlide((current + 1) % total);
    }

    function startAutoPlay() {
      stopAutoPlay();
      timer = setInterval(nextSlide, interval);
    }

    function stopAutoPlay() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    // Restarts the active segment's progress-fill from empty, same reflow
    // trick as triggerEntrance — used whenever autoplay resumes so the
    // reading window that follows is always a full interval.
    function restartSegmentProgress() {
      var activeSegment = segments[current];
      if (!activeSegment) return;
      activeSegment.classList.remove('is-active');
      void activeSegment.offsetWidth;
      activeSegment.classList.add('is-active');
    }

    // Autoplay pauses whenever the cursor or keyboard focus is anywhere on
    // the hero (so reading the headline never gets cut off) or the tab is
    // backgrounded, and resumes with a fresh full interval afterward.
    function syncPausedState() {
      var shouldPause = hovering || document.hidden;
      hero.classList.toggle('is-paused', shouldPause);
      if (shouldPause) {
        stopAutoPlay();
      } else {
        restartSegmentProgress();
        startAutoPlay();
      }
    }

    segments.forEach(function (seg, i) {
      seg.addEventListener('click', function () {
        goToSlide(i);
        if (!hovering) startAutoPlay();
      });
    });

    hero.addEventListener('mouseenter', function () { hovering = true; syncPausedState(); });
    hero.addEventListener('mouseleave', function () { hovering = false; syncPausedState(); });
    hero.addEventListener('focusin', function () { hovering = true; syncPausedState(); });
    hero.addEventListener('focusout', function () { hovering = false; syncPausedState(); });

    document.addEventListener('visibilitychange', syncPausedState);

    startAutoPlay();
  }

  // Navbar shadow once the page has scrolled past the top
  function initNavbarScroll() {
    var navbar = document.querySelector('.navbar');
    if (!navbar) return;

    var ticking = false;
    function update() {
      navbar.classList.toggle('is-scrolled', window.scrollY > 8);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    });
    update();
  }

  // Scroll-triggered reveal for [data-reveal] elements
  function initScrollReveal() {
    var els = Array.from(document.querySelectorAll('[data-reveal]'));
    if (!els.length) return;

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    els.forEach(function (el) { observer.observe(el); });
  }

  // Count-up animation for trust-stats numbers, triggered once each enters view
  function initCountUp() {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var els = Array.from(document.querySelectorAll('.stat-card__number'));
    if (reduceMotion || !els.length || !('IntersectionObserver' in window)) return;

    function animate(el) {
      var match = el.textContent.match(/^(\d+)(.*)$/);
      if (!match) return;
      var target = parseInt(match[1], 10);
      var suffix = match[2] || '';
      var duration = 1800;
      var start = null;

      function step(timestamp) {
        if (start === null) start = timestamp;
        var progress = Math.min((timestamp - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animate(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.4 });

    els.forEach(function (el) { observer.observe(el); });
  }

  // Kinetic split-text — wraps each word of [data-split] headings in its own
  // clipped box so it can slide in independently once the ancestor
  // [data-reveal] block gets its "is-visible" class (see animations.css).
  function initSplitText() {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var els = Array.from(document.querySelectorAll('[data-split]'));
    if (!els.length || reduceMotion) return;

    els.forEach(function (el) {
      // Flattening to textContent would silently drop any nested element
      // (e.g. a colored accent <span>) — skip rather than mangle those.
      if (el.querySelector('*')) return;

      var words = el.textContent.trim().split(/\s+/);
      el.textContent = '';
      words.forEach(function (word, i) {
        var outer = document.createElement('span');
        outer.className = 'split-word';
        var inner = document.createElement('span');
        inner.className = 'split-word__inner';
        inner.textContent = word;
        inner.style.transitionDelay = (i * 0.07) + 's';
        outer.appendChild(inner);
        el.appendChild(outer);
        if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
      });
    });
  }

  // Magnetic buttons — primary CTAs shift slightly toward the cursor
  function initMagneticButtons() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    var els = Array.from(document.querySelectorAll('[data-magnetic]'));
    if (!els.length) return;

    var STRENGTH = 0.3;
    els.forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var rect = el.getBoundingClientRect();
        var x = (e.clientX - rect.left - rect.width / 2) * STRENGTH;
        var y = (e.clientY - rect.top - rect.height / 2) * STRENGTH;
        el.style.transform = 'translate(' + x.toFixed(1) + 'px, ' + y.toFixed(1) + 'px)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transform = '';
      });
    });
  }

  // 3D tilt on cards — rotation follows the cursor across the card face
  function initTiltCards() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    var els = Array.from(document.querySelectorAll('.outcome-card, .feature-card, .fintech-service, .testimonial-card'));
    if (!els.length) return;

    var MAX_TILT = 6;
    els.forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var rect = el.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;
        var py = (e.clientY - rect.top) / rect.height;
        var rotateY = (px - 0.5) * MAX_TILT * 2;
        var rotateX = (0.5 - py) * MAX_TILT * 2;
        el.style.transform = 'perspective(700px) rotateX(' + rotateX.toFixed(2) + 'deg) rotateY(' +
          rotateY.toFixed(2) + 'deg) translateY(-6px)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transform = '';
      });
    });
  }

  // Testimonials wall — two counter-scrolling rows, each row's card group
  // cloned once for a seamless loop (same idea as the outcomes/trust-stats
  // marquees). Runs before initTiltCards() so the clones also get the tilt
  // hover effect, not just the originals.
  function initTestimonialsMarquee() {
    var PX_PER_SECOND = 45;
    document.querySelectorAll('.testimonials__track').forEach(function (track) {
      var group = track.querySelector('.testimonials__group');
      if (!group) return;

      var clone = group.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);

      var duration = (group.getBoundingClientRect().width + 24) / PX_PER_SECOND;
      track.style.setProperty('--marquee-h-duration', duration + 's');
    });
  }

  // Outcomes "Delivering Impact" marquee — duplicate the pill group for a seamless infinite scroll
  function initOutcomesMarquee() {
    var track = document.querySelector('[data-marquee]');
    var group = track && track.querySelector('.outcomes__impact-group');
    if (!track || !group) return;

    var clone = group.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);

    var PX_PER_SECOND = 40;
    var duration = (group.getBoundingClientRect().width + 24) / PX_PER_SECOND;
    track.style.setProperty('--marquee-duration', duration + 's');
  }

  // Trust-stats vertical tickers — same duplicate-for-seamless-loop idea as
  // the outcomes marquee, but per column and top-to-bottom. The "down"
  // column reuses the same up-scrolling keyframe with animation-direction
  // reversed (see trust-stats.css), so both columns share one duration
  // formula and only differ in which way they play.
  function initVerticalMarquee() {
    var PX_PER_SECOND = 22;
    document.querySelectorAll('[data-marquee-v]').forEach(function (track) {
      var group = track.querySelector('.trust-stats__group');
      if (!group) return;

      var clone = group.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);

      var duration = group.getBoundingClientRect().height / PX_PER_SECOND;
      track.style.setProperty('--marquee-v-duration', duration + 's');
    });
  }

  // Image fallback gradients
  var FALLBACK_PALETTE = [
    ['#2A2D57', '#4C3F82'],
    ['#153C5A', '#2784C5'],
    ['#4D2F82', '#8465FF'],
    ['#8B3A3A', '#E27B4F'],
    ['#134E4A', '#1F9E8A'],
    ['#6E1F44', '#C64B7E']
  ];

  function pickGradient(src) {
    var hash = 0;
    for (var i = 0; i < src.length; i++) hash = (hash * 31 + src.charCodeAt(i)) | 0;
    var pair = FALLBACK_PALETTE[Math.abs(hash) % FALLBACK_PALETTE.length];
    return 'linear-gradient(135deg, ' + pair[0] + ' 0%, ' + pair[1] + ' 100%)';
  }

  function initImageFallback() {
    document.querySelectorAll('img[src*="assets/images/content"], img[src*="assets/images/logos"]').forEach(function (img) {
      img.addEventListener('error', function () {
        img.style.background = pickGradient(img.src);
        img.removeAttribute('src');
      }, { once: true });
    });
  }

  // Init all on DOM ready
  document.addEventListener('DOMContentLoaded', function () {
    document.documentElement.classList.remove('preload');
    initNavbar();
    initNavbarScroll();
    initMegaMenu();
    initHeroSlider();
    initTestimonialsMarquee();
    initOutcomesMarquee();
    initVerticalMarquee();
    initImageFallback();
    initSplitText();
    initScrollReveal();
    initCountUp();
    initMagneticButtons();
    initTiltCards();
  });
})();
