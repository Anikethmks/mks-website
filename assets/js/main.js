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
    var bgs = Array.from(document.querySelectorAll('.hero__bg[data-slide]'));
    var contents = Array.from(document.querySelectorAll('.hero__content[data-slide]'));
    var dots = Array.from(document.querySelectorAll('.hero__dot'));
    if (!bgs.length || !contents.length) return;

    var current = 0;
    var total = bgs.length;
    var interval = 5000;
    var timer = null;

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
      dots.forEach(function (d) {
        d.classList.remove('is-active');
        d.setAttribute('aria-selected', 'false');
      });

      bgs[index].classList.add('is-active');
      contents[index].classList.add('is-active');
      if (dots[index]) {
        dots[index].classList.add('is-active');
        dots[index].setAttribute('aria-selected', 'true');
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

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        goToSlide(i);
        startAutoPlay();
      });
    });

    // Pause auto-advance while hovering the dots, so it doesn't advance out
    // from under the cursor right as you're about to click one.
    var dotsContainer = document.querySelector('.hero__dots');
    if (dotsContainer) {
      dotsContainer.addEventListener('mouseenter', stopAutoPlay);
      dotsContainer.addEventListener('mouseleave', startAutoPlay);
    }

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
      var duration = 1200;
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
      var words = el.textContent.trim().split(/\s+/);
      el.textContent = '';
      words.forEach(function (word, i) {
        var outer = document.createElement('span');
        outer.className = 'split-word';
        var inner = document.createElement('span');
        inner.className = 'split-word__inner';
        inner.textContent = word;
        inner.style.transitionDelay = (i * 0.04) + 's';
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

  // Testimonial dot navigation
  function initTestimonialSlider() {
    var dots = Array.from(document.querySelectorAll('.testimonials__dot'));
    if (!dots.length) return;

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        dots.forEach(function (d) {
          d.classList.remove('is-active');
          d.setAttribute('aria-selected', 'false');
        });
        dot.classList.add('is-active');
        dot.setAttribute('aria-selected', 'true');
      });
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
    initNavbar();
    initNavbarScroll();
    initMegaMenu();
    initHeroSlider();
    initTestimonialSlider();
    initOutcomesMarquee();
    initImageFallback();
    initSplitText();
    initScrollReveal();
    initCountUp();
    initMagneticButtons();
    initTiltCards();
  });
})();
