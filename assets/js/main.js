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

    var isMobileNav = function () { return window.matchMedia('(max-width: 1023px)').matches; };

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
    var tabsWrap = document.querySelector('.hero__tabs');
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

    // Autoplay pauses only while the cursor or keyboard focus is on the tab
    // rail itself (so picking/reading a specific slide's tab doesn't get
    // cut off) or the tab is backgrounded — hovering the rest of the hero
    // (image, headline, CTAs) no longer stops it. Resumes with a fresh full
    // interval afterward.
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

    if (tabsWrap) {
      tabsWrap.addEventListener('mouseenter', function () { hovering = true; syncPausedState(); });
      tabsWrap.addEventListener('mouseleave', function () { hovering = false; syncPausedState(); });
      tabsWrap.addEventListener('focusin', function () { hovering = true; syncPausedState(); });
      tabsWrap.addEventListener('focusout', function () { hovering = false; syncPausedState(); });
    }

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

  // Scroll-triggered reveal for [data-reveal] elements — replays every time
  // an element crosses into or out of view, rather than firing once and
  // disconnecting, so scrolling back up to a section plays it again.
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
        entry.target.classList.toggle('is-visible', entry.isIntersecting);
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

  // Industries We Serve — horizontal accordion. One panel expands at a
  // time on an auto-advance timer; hovering, clicking, or focusing a
  // panel jumps to it and pauses the timer until the pointer leaves the
  // whole accordion. The progress bar's width transition is what actually
  // drives the auto-advance timing visually — its duration matches
  // INTERVAL so it fills exactly as the active panel's turn ends.
  // The timer only runs while the section is actually on screen — started
  // via IntersectionObserver rather than at page load — so a reader who
  // lingers on the hero above it doesn't scroll down to find it already
  // several panels in.
  function initIndustriesAccordion() {
    var root = document.querySelector('[data-accordion]');
    if (!root) return;
    var panels = Array.from(root.querySelectorAll('.industry-panel'));
    if (!panels.length) return;

    var INTERVAL = 5000;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var active = 0;
    var timer = null;
    var hovering = false;
    var visible = false;

    function setActive(index) {
      active = (index + panels.length) % panels.length;
      panels.forEach(function (panel, i) {
        var isActive = i === active;
        panel.classList.toggle('is-active', isActive);
        panel.setAttribute('aria-expanded', String(isActive));
        var bar = panel.querySelector('.industry-panel__progress');
        if (!bar) return;
        bar.style.transition = 'none';
        bar.style.width = '0%';
        if (isActive && !reduceMotion) {
          void bar.offsetWidth; // force reflow so the transition below restarts cleanly
          bar.style.transition = 'width ' + INTERVAL + 'ms linear';
          bar.style.width = '100%';
        }
      });
    }

    function startAuto() {
      if (reduceMotion || hovering || !visible) return;
      stopAuto();
      timer = setInterval(function () { setActive(active + 1); }, INTERVAL);
    }
    function stopAuto() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    panels.forEach(function (panel, i) {
      panel.addEventListener('mouseenter', function () {
        hovering = true;
        setActive(i);
        stopAuto();
      });
      panel.addEventListener('focus', function () {
        hovering = true;
        setActive(i);
        stopAuto();
      });
      panel.addEventListener('click', function (e) {
        if (e.target.closest('.industry-panel__cta')) return;
        setActive(i);
        stopAuto();
      });
      panel.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        setActive(i);
        stopAuto();
      });
    });

    root.addEventListener('mouseleave', function () {
      hovering = false;
      startAuto();
    });

    setActive(0);

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          visible = entry.isIntersecting;
          if (visible) startAuto();
          else stopAuto();
        });
      }, { threshold: 0.4 });
      observer.observe(root);
    } else {
      // No IntersectionObserver support — fall back to the old always-on timer.
      visible = true;
      startAuto();
    }
  }

  // Outcomes — a numbered list on the left drives which outcome's card is
  // in front of a 3D depth stack on the right. Auto-advances every 6s
  // (matched against the reference), pausing on hover and restarting
  // fresh after any manual interaction (list click, prev/next, card
  // click, or drag) so the timer never immediately overrides a choice
  // the user just made. Like the Industries accordion, the timer only
  // runs while the section is actually on screen — started via
  // IntersectionObserver rather than at page load — so a reader who
  // lingers on the hero above it doesn't scroll down to find it already
  // several cards in; it should still be showing card 1 (AI First
  // Solutions) at that point.
  function initOutcomesStack() {
    var root = document.querySelector('[data-outcomes]');
    if (!root) return;
    var stack = root.querySelector('[data-outcomes-stack]');
    var counter = root.querySelector('[data-outcomes-counter]');
    var listItems = Array.from(root.querySelectorAll('.outcomes__list-item'));
    var cards = Array.from(stack.querySelectorAll('.outcome-card'));
    var prevBtn = root.querySelector('[data-outcomes-prev]');
    var nextBtn = root.querySelector('[data-outcomes-next]');
    if (!stack || !listItems.length || !cards.length) return;

    var total = cards.length;
    var active = 0;
    var AUTO_INTERVAL = 6000;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var timer = null;
    var hovering = false;
    var visible = false;

    function startAuto() {
      if (reduceMotion || hovering || !visible) return;
      stopAuto();
      timer = setInterval(function () { setActive(active + 1); }, AUTO_INTERVAL);
    }
    function stopAuto() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    var STACK_STATES = [
      { transform: 'none', opacity: '1', zIndex: '40', pointerEvents: 'auto' },
      { transform: 'translateY(20px) scale(0.955) rotateX(2deg)', opacity: '0.5', zIndex: '39', pointerEvents: 'none' },
      { transform: 'translateY(40px) scale(0.91) rotateX(4deg)', opacity: '0.22', zIndex: '38', pointerEvents: 'none' },
      // { transform: 'translateX(72%) rotate(7deg) scale(0.94)', opacity: '0', zIndex: '37', pointerEvents: 'none' }
      { transform: 'translateY(60px) scale(0.94) rotateX(6deg)', opacity: '0', zIndex: '37', pointerEvents: 'none' }
    ];

    function setActive(index) {
      active = (index + total) % total;

      listItems.forEach(function (item, i) {
        var isActive = i === active;
        item.classList.toggle('is-active', isActive);
        item.setAttribute('aria-selected', String(isActive));
      });
      if (counter) counter.textContent = String(active + 1).padStart(2, '0');

      cards.forEach(function (card, i) {
        var distance = (i - active + total) % total;
        var state = STACK_STATES[Math.min(distance, STACK_STATES.length - 1)];
        card.classList.toggle('is-active', distance === 0);
        card.style.transform = state.transform;
        card.style.opacity = state.opacity;
        card.style.zIndex = state.zIndex;
        card.style.pointerEvents = state.pointerEvents;
        // Only the front card is interactive — keep the buried ones out of
        // the tab order the same way they're already out of click range.
        card.tabIndex = distance === 0 ? 0 : -1;
      });
    }

    listItems.forEach(function (item, i) {
      item.addEventListener('click', function () { setActive(i); startAuto(); });
    });
    if (prevBtn) prevBtn.addEventListener('click', function () { setActive(active - 1); startAuto(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { setActive(active + 1); startAuto(); });

    stack.addEventListener('mouseenter', function () { hovering = true; stopAuto(); });
    stack.addEventListener('mouseleave', function () { hovering = false; startAuto(); });

    // Click the front card to advance; drag it left/right to go next/prev.
    // Cards behind the front one are pointer-events:none, so any click or
    // drag that reaches the stack always originates from the active card.
    var dragging = false;
    var dragged = false;
    var startX = 0;
    stack.addEventListener('mousedown', function (e) {
      dragging = true;
      dragged = false;
      startX = e.pageX;
      stack.classList.add('is-dragging');
    });
    window.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      if (Math.abs(e.pageX - startX) > 6) dragged = true;
    });
    window.addEventListener('mouseup', function (e) {
      if (!dragging) return;
      dragging = false;
      stack.classList.remove('is-dragging');
      if (!dragged) return;
      var dx = e.pageX - startX;
      if (Math.abs(dx) < 40) return;
      setActive(dx < 0 ? active + 1 : active - 1);
      startAuto();
    });
    stack.addEventListener('click', function (e) {
      if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; return; }
      if (e.target.closest('.outcome-card__cta')) return;
      if (e.target.closest('.outcome-card.is-active')) { setActive(active + 1); startAuto(); }
    });

    // Keyboard equivalents for the mouse-only drag/click gestures above:
    // arrow keys step through the stack from anywhere inside it, and
    // Enter/Space on the focused front card advances it (mirroring a
    // click) without also firing for its inner CTA link.
    stack.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); setActive(active + 1); startAuto(); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); setActive(active - 1); startAuto(); return; }
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (e.target.closest('.outcome-card__cta')) return;
      if (e.target.closest('.outcome-card.is-active')) {
        e.preventDefault();
        setActive(active + 1);
        startAuto();
      }
    });

    setActive(0);

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          visible = entry.isIntersecting;
          if (visible) startAuto();
          else stopAuto();
        });
      }, { threshold: 0.4 });
      observer.observe(root);
    } else {
      // No IntersectionObserver support — fall back to the old always-on timer.
      visible = true;
      startAuto();
    }
  }

  // 3D tilt on cards — rotation follows the cursor across the card face
  function initTiltCards() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    // .outcome-card and .testimonial-card are excluded — initOutcomesStack
    // and initTestimonialsCarousel already drive their transform (stack
    // depth/arc position), and tilt's own transform writes would silently
    // fight with it on hover, snapping the card back toward the identity
    // transform (i.e. toward the active card's position) instead of
    // leaving it where the carousel placed it.
    var els = Array.from(document.querySelectorAll('.feature-card, .fintech-service, .wwa-director-card, .wwa-ethics-card, .wwa-office-card, ' +
      '.op-cap-card, .op-eng-card, .eng-carousel-card, .eng-cluster-card, .eng-service-card, .eng-cost-card, .eng-value-card, .eng-step-card, ' +
      '.its-service-card, .its-cloud-card, .its-managed-card, .its-rpa-card, .its-mod-card, .its-collab-card, ' +
      '.industry-case-card, .project-card, .blog-card, .co-job-card, .case-study-card, .trust-card, ' +
      '.agentic-objective-card, .pva-objective-card, .voice-objective-card, .docai-objective-card, .retail-platforms__card, ' +
      '.rpa-benefit-card, .rpa-achievement-card, .rpa-metric-card, ' +
      '.pva-impact-card, .agentic-impact-card, .voice-impact-card, .docai-impact-card, .benefit-card, .retail-cta__card, .retail-sync__feature, ' +
      '.its-tech-tile, .its-stat-box, .its-cta-stat, .metric-card, .eng-metric-card, ' +
      '.retail1-service-card, .retail1-solution-group, .retail1-project-card, .retail1-advanced-card'));
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

  // Testimonials — auto-advancing circular carousel. Each card's signed
  // distance from the active index drives an x/y/scale/rotateY/opacity
  // offset (spacing scaled to the ring's own width so it holds up across
  // breakpoints without separate per-tier constants), so stepping to the
  // next card swings the whole set around a shared arc instead of sliding
  // flat. Auto-advances on a timer, paused while the ring is hovered; dots
  // and a click on any visible side card both jump straight to that index.
  function initTestimonialsCarousel() {
    var section = document.querySelector('.testimonials');
    var viewport = document.querySelector('.testimonials__viewport');
    var ring = document.querySelector('.testimonials__ring');
    var dotsContainer = document.querySelector('.testimonials__dots');
    var cards = Array.from(document.querySelectorAll('.testimonial-card'));
    if (!section || !viewport || !ring || !cards.length) return;

    var total = cards.length;
    var active = 0;
    var AUTO_INTERVAL = 6500;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var timer = null;
    var hovering = false;
    var dots = [];

    if (dotsContainer) {
      cards.forEach(function (card, i) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'testimonials__dot' + (i === 0 ? ' is-active' : '');
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-selected', String(i === 0));
        dot.setAttribute('aria-label', 'Show testimonial ' + (i + 1));
        dotsContainer.appendChild(dot);
        dots.push(dot);
      });
    }

    function startAuto() {
      if (reduceMotion || hovering) return;
      stopAuto();
      timer = setInterval(function () { setActive(active + 1); }, AUTO_INTERVAL);
    }
    function stopAuto() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    // Indexed by distance-from-active, same pattern as initOutcomesStack's
    // STACK_STATES. x/y are px offsets scaled off the ring's live width so
    // the arc reads correctly at any breakpoint.
    function arcStates() {
      var w = viewport.clientWidth || 900;
      return [
        { x: 0, y: 0, scale: 1, rot: 0, opacity: 1, z: 50 },
        { x: w * 0.32, y: 18, scale: 0.86, rot: 34, opacity: 0.55, z: 40 },
        { x: w * 0.5, y: 34, scale: 0.72, rot: 48, opacity: 0.16, z: 30 },
        { x: w * 0.58, y: 46, scale: 0.62, rot: 55, opacity: 0, z: 20 }
      ];
    }

    function setActive(index) {
      active = (index + total) % total;
      var states = arcStates();

      dots.forEach(function (dot, i) {
        var isActive = i === active;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-selected', String(isActive));
      });

      cards.forEach(function (card, i) {
        var raw = i - active;
        if (raw > total / 2) raw -= total;
        if (raw < -total / 2) raw += total;
        var absD = Math.abs(raw);
        var sign = raw === 0 ? 0 : (raw > 0 ? 1 : -1);
        var state = states[Math.min(absD, states.length - 1)];
        card.classList.toggle('is-active', absD === 0);
        card.style.transform = 'translateX(' + (sign * state.x) + 'px) translateY(' + state.y +
          'px) scale(' + state.scale + ') rotateY(' + (-sign * state.rot) + 'deg)';
        card.style.opacity = String(state.opacity);
        card.style.zIndex = String(state.z);
        card.style.pointerEvents = absD <= 2 ? 'auto' : 'none';
      });
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () { setActive(i); startAuto(); });
    });

    // Pausing is scoped to the cards themselves, not the whole viewport box
    // — the viewport has to be wider/taller than the visible cards to make
    // room for the arc's side offsets, so a viewport-level mouseenter would
    // stay "hovering" even once the cursor left every card, and auto-advance
    // would never resume. hoverCount (rather than a plain boolean) covers
    // moving directly between two overlapping cards without a false resume
    // in the gap between their mouseleave/mouseenter.
    var hoverCount = 0;
    cards.forEach(function (card, i) {
      card.addEventListener('click', function () {
        if (i === active) return;
        setActive(i);
        startAuto();
      });
      card.addEventListener('mouseenter', function () {
        hoverCount++;
        hovering = true;
        stopAuto();
      });
      card.addEventListener('mouseleave', function () {
        hoverCount = Math.max(0, hoverCount - 1);
        if (hoverCount === 0) {
          hovering = false;
          startAuto();
        }
      });
    });

    // Re-layout on resize: the arc's px offsets are derived from the
    // ring's current width, so a viewport/breakpoint change needs a
    // recompute even though `active` itself hasn't moved.
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { setActive(active); }, 150);
    });

    setActive(0);
    startAuto();
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

  // Careers "Stories by MKS Vision" blog strip — shows ~4 cards, advances
  // one page every 5s while in view, and supports manual mouse/touch drag
  // at any time (touch drag is native to the scroll container; mouse drag
  // is wired up here). Auto-advance pauses on hover/drag, matching the
  // same visible-and-not-interacting gating as the other carousels.
  function initCareersBlogCarousel() {
    var track = document.querySelector('[data-blog-carousel]');
    if (!track) return;

    var AUTO_INTERVAL = 5000;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var timer = null;
    var hovering = false;
    var dragging = false;
    var visible = false;

    function pageWidth() { return track.clientWidth; }
    function advance() {
      var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      track.scrollTo({ left: atEnd ? 0 : track.scrollLeft + pageWidth(), behavior: 'smooth' });
    }
    function startAuto() {
      if (reduceMotion || hovering || dragging || !visible) return;
      stopAuto();
      timer = setInterval(advance, AUTO_INTERVAL);
    }
    function stopAuto() { if (timer) { clearInterval(timer); timer = null; } }

    track.addEventListener('mouseenter', function () { hovering = true; stopAuto(); });
    track.addEventListener('mouseleave', function () { hovering = false; startAuto(); });

    var startX = 0, startScroll = 0;
    track.addEventListener('mousedown', function (e) {
      dragging = true;
      track.classList.add('is-dragging');
      startX = e.clientX;
      startScroll = track.scrollLeft;
      stopAuto();
    });
    window.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      track.scrollLeft = startScroll - (e.clientX - startX);
    });
    window.addEventListener('mouseup', function () {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('is-dragging');
      startAuto();
    });

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          visible = entry.isIntersecting;
          if (visible) startAuto(); else stopAuto();
        });
      }, { threshold: 0.4 });
      observer.observe(track);
    } else {
      visible = true;
      startAuto();
    }
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
  // One corporate blue, six depths — placeholders vary in value, never in hue.
  var FALLBACK_PALETTE = [
    ['#0B3454', '#1A70B2'],
    ['#0F4772', '#2784C5'],
    ['#145C93', '#4E9BD1'],
    ['#0B3454', '#145C93'],
    ['#0F4772', '#1A70B2'],
    ['#153C5A', '#2784C5']
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

  // Shared footer: the static pages predate component includes, so keep every
  // instance synchronized with the Figma footer component at runtime.
  function initFooter() {
    var footer = document.querySelector('.footer');
    if (!footer) return;

    footer.innerHTML = `
      <div class="footer__inner" data-reveal>
        <section class="footer__brand" aria-label="MKS Vision">
          <img class="footer__logo-img" src="assets/images/logos/mks-logo-light.svg" alt="MKS Vision, a preferred technology partner">
          <p class="footer__tagline">Engineering outcomes for the world's most complex industries. Since 2012, we've bridged the gap between physical operations and digital intelligence.</p>
          <div class="footer__social"><a href="#" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg></a><a href="#" aria-label="Twitter"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg></a></div>
        </section>
        <nav class="footer__col footer__col--services" aria-label="What we do"><h2 class="footer__col-title">What we do</h2><ul class="footer__list footer__list--wrap"><li><a href="#" class="footer__link-dot">AI solutions</a></li><li><a href="#" class="footer__link-dot">IT Services</a></li><li><a href="#" class="footer__link-dot">Engineering</a></li><li><a href="#" class="footer__link-dot">Products &amp; Platforms</a></li><li><a href="#" class="footer__link-dot">Managed Services</a></li><li><a href="#" class="footer__link-dot">Data &amp; Analytics</a></li><li><a href="#" class="footer__link-dot">Industries</a></li></ul></nav>
        <nav class="footer__col footer__col--industries" aria-label="Industries"><h2 class="footer__col-title">Industries</h2><ul class="footer__list footer__list--bulleted"><li><a href="#">Banking &amp; Financial Institutions</a></li><li><a href="#">(BFI)NBFC &amp; Fintech</a></li><li><a href="#">Healthcare</a></li><li><a href="#">Retail</a></li><li><a href="#">Manufacturing</a></li><li><a href="#">Data Center Infrastructure</a></li></ul></nav>
        <div class="footer__col footer__col--company-contact"><nav class="footer__company" aria-label="Company"><h2 class="footer__col-title">Company</h2><ul class="footer__list footer__list--bulleted footer__list--inline"><li><a href="who-we-are.html">Who we are</a></li><li><a href="capabilities.html">Capabilities</a></li><li><a href="careers.html">Careers</a></li></ul></nav><address class="footer__contact"><h2 class="footer__col-title">Contact Us</h2><div class="footer__contact-list"><a href="tel:+15027499992" class="footer__contact-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>+1 (502) 749-9992</a><a href="mailto:hr@mksvision.com" class="footer__contact-item footer__contact-item--email"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>hr@mksvision.com</a></div></address></div>
      </div>
      <div class="footer__bottom" data-reveal style="--reveal-delay: 0.15s"><span class="footer__copy">© 2026 MKS Vision. All rights reserved.</span><nav class="footer__legal" aria-label="Legal"><a href="#">Privacy Policy</a><a href="#">Terms of Service</a><a href="#">Cookie Settings</a></nav></div>`;
  }

  // Careers — Current Openings tabs (careers-openings.html). Which panel is
  // active can be deep-linked via ?tab=entry / ?tab=lateral — careers.html's
  // "Entry Level & Internships" / "Lateral Hiring" Explore buttons link here
  // with that param so the right list is already open on arrival.
  function initCareersOpenings() {
    var tabs = Array.from(document.querySelectorAll('[data-co-tab]'));
    var panels = Array.from(document.querySelectorAll('[data-co-panel]'));
    if (!tabs.length || !panels.length) return;

    function activate(name) {
      tabs.forEach(function (tab) {
        var isActive = tab.getAttribute('data-co-tab') === name;
        tab.classList.toggle('is-active', isActive);
        tab.setAttribute('aria-selected', String(isActive));
      });
      panels.forEach(function (panel) {
        panel.classList.toggle('is-active', panel.getAttribute('data-co-panel') === name);
      });
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var name = tab.getAttribute('data-co-tab');
        activate(name);
        var url = new URL(window.location.href);
        url.searchParams.set('tab', name);
        window.history.replaceState(null, '', url);
      });
    });

    // Arriving with a ?tab= param means the visit came from one of
    // careers.html's "Explore" buttons — the page loads on the hero as
    // normal, then eases down to the openings section a beat later so the
    // jump reads as an animated hand-off rather than landing mid-page.
    var requested = new URLSearchParams(window.location.search).get('tab');
    if (requested && tabs.some(function (t) { return t.getAttribute('data-co-tab') === requested; })) {
      activate(requested);
      var openings = document.getElementById('current-openings');
      if (openings) {
        var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.setTimeout(function () {
          openings.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        }, 500);
      }
    }
  }

  // Outcomes (outcomes.html) — the homepage's four outcome cards ("AI First
  // Solutions", "IT Services", "Engineering", "Products & Platform") each
  // Explore into this same page with ?section=<id>. A plain #hash link
  // would make the browser jump there instantly before the page even
  // finishes rendering; a query param avoids that native jump entirely, so
  // the page loads on the hero as normal and then eases down to the right
  // section a beat later — the same animated hand-off used for careers.html
  // → careers-openings.html.
  function initOutcomesScroll() {
    var sectionIds = ['ai-first-solutions', 'it-services', 'engineering', 'products-platform'];
    var requested = new URLSearchParams(window.location.search).get('section');
    if (!requested || sectionIds.indexOf(requested) === -1) return;

    var target = document.getElementById(requested);
    if (!target) return;

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.setTimeout(function () {
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }, 500);
  }

  // Init all on DOM ready
  // Retail 1 — ecommerce platforms accordion. Click a platform to expand
  // its description; only one open at a time, matching the same
  // single-open pattern as the careers openings tabs.
  function initPlatformsAccordion() {
    var root = document.querySelector('[data-platform-accordion]');
    if (!root) return;
    var items = Array.from(root.querySelectorAll('.retail1-platform-item'));
    items.forEach(function (item) {
      var head = item.querySelector('.retail1-platform-item__head');
      head.addEventListener('click', function () {
        var wasActive = item.classList.contains('is-active');
        items.forEach(function (other) {
          other.classList.remove('is-active');
          other.querySelector('.retail1-platform-item__head').setAttribute('aria-expanded', 'false');
        });
        if (!wasActive) {
          item.classList.add('is-active');
          head.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  // Site-wide modals — Apply Now / Get In Touch / Success. Injected on
  // every page so no per-page markup is needed. `a[href="contact.html"]`
  // was a dead link sitewide (the page was never built) — clicks on it now
  // open the Get In Touch modal instead; `.co-job-card__apply` links open
  // the Apply Now modal with the job title pre-filled.
  function initModals() {
    var checkSvg = '<svg viewBox="0 0 24 17" fill="none"><path d="M23 1.5L8.5 15.5 1 8.5" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var closeSvg = '<svg viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
    document.body.insertAdjacentHTML('beforeend',
      '<div class="modal-overlay" id="apply-modal" data-modal>' +
        '<div class="modal modal--apply" role="dialog" aria-modal="true" aria-labelledby="apply-modal-title">' +
          '<button type="button" class="modal__close" data-modal-close aria-label="Close">' + closeSvg + '</button>' +
          '<div class="modal__body">' +
          '<h2 class="modal__title" id="apply-modal-title">Send your application now !</h2>' +
          '<form data-modal-form>' +
            '<div class="modal__row">' +
              '<div class="modal__col">' +
                '<div class="modal-field"><label class="modal-field__label">Name *</label><input class="modal-field__control" type="text" placeholder="Full name" required /></div>' +
                '<div class="modal-field"><label class="modal-field__label">Job Role *</label><input class="modal-field__control" type="text" data-apply-role placeholder="Job role" required /></div>' +
                '<div class="modal-field"><label class="modal-field__label">When Able to Start *</label>' +
                  '<select class="modal-field__control modal-field__control--select" required>' +
                    '<option value="">Select…</option><option>Immediate Joining</option><option>2 Weeks Notice</option><option>1 Month Notice</option>' +
                  '</select></div>' +
                '<div class="modal-field"><label class="modal-field__label">Upload Resume *</label>' +
                  '<div class="modal-field__file"><label class="modal-field__file-btn">Choose File<input type="file" data-file-input required /></label><span class="modal-field__file-name" data-file-name>No file chosen</span></div></div>' +
              '</div>' +
              '<div class="modal__col">' +
                '<div class="modal-field"><label class="modal-field__label">Email *</label><input class="modal-field__control" type="email" placeholder="Email address" required /></div>' +
                '<div class="modal-field"><label class="modal-field__label">Phone *</label><input class="modal-field__control" type="tel" placeholder="Phone number" required /></div>' +
                '<div class="modal-field"><label class="modal-field__label">Message</label><textarea class="modal-field__control" placeholder="Write your message here..."></textarea></div>' +
              '</div>' +
            '</div>' +
            '<button type="submit" class="modal__submit" style="margin-top:24px">Save &amp; Apply</button>' +
          '</form>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="modal-overlay" id="contact-modal" data-modal>' +
        '<div class="modal modal--contact" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">' +
          '<button type="button" class="modal__close" data-modal-close aria-label="Close">' + closeSvg + '</button>' +
          '<div class="modal__body">' +
          '<h2 class="modal__title" id="contact-modal-title" style="font-size:20px;line-height:28px">Get In Touch</h2>' +
          '<form data-modal-form>' +
            '<div class="modal-field"><label class="modal-field__label">Name *</label><input class="modal-field__control" type="text" placeholder="Full name" required /></div>' +
            '<div class="modal-field" style="margin-top:24px"><label class="modal-field__label">Email *</label><input class="modal-field__control" type="email" placeholder="Email address" required /></div>' +
            '<div class="modal-field" style="margin-top:24px"><label class="modal-field__label">Phone *</label><input class="modal-field__control" type="tel" placeholder="Phone number" required /></div>' +
            '<div class="modal-field" style="margin-top:24px"><label class="modal-field__label">Message</label><textarea class="modal-field__control" placeholder="Write your message here..."></textarea></div>' +
            '<button type="submit" class="modal__submit" style="margin-top:24px">Send Message</button>' +
          '</form>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="modal-overlay" id="success-modal" data-modal>' +
        '<div class="modal modal--success" role="dialog" aria-modal="true">' +
          '<button type="button" class="modal__close" data-modal-close aria-label="Close">' + closeSvg + '</button>' +
          '<div class="modal__body">' +
          '<span class="modal__check">' + checkSvg + '</span>' +
          '<p class="modal__success-text">Thank you! We received your information. Will get back to you shortly.</p>' +
          '</div>' +
        '</div>' +
      '</div>'
    );

    var overlays = Array.from(document.querySelectorAll('[data-modal]'));
    function closeAll() {
      overlays.forEach(function (o) { o.classList.remove('is-open'); });
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    function open(id) {
      closeAll();
      var o = document.getElementById(id);
      if (!o) return;
      o.classList.add('is-open');
      // Locking body alone doesn't stop the page scrolling here — html
      // itself is the actual scroll container (see reset.css's overflow-x
      // comment), so it needs the lock too.
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    }

    document.addEventListener('click', function (e) {
      var applyLink = e.target.closest('a.co-job-card__apply');
      if (applyLink) {
        e.preventDefault();
        var card = applyLink.closest('.co-job-card');
        var roleInput = document.querySelector('#apply-modal [data-apply-role]');
        var titleEl = card && card.querySelector('.co-job-card__title');
        if (roleInput) roleInput.value = titleEl ? titleEl.textContent.trim() : '';
        open('apply-modal');
        return;
      }
      var contactLink = e.target.closest('a[href="contact.html"]');
      if (contactLink) {
        e.preventDefault();
        open('contact-modal');
        return;
      }
      if (e.target.closest('[data-modal-close]') || e.target.classList.contains('modal-overlay')) {
        closeAll();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAll();
    });

    document.addEventListener('change', function (e) {
      if (e.target.matches('[data-file-input]')) {
        var nameEl = e.target.closest('.modal-field__file').querySelector('[data-file-name]');
        nameEl.textContent = e.target.files[0] ? e.target.files[0].name : 'No file chosen';
      }
    });

    document.addEventListener('submit', function (e) {
      var form = e.target.closest('[data-modal-form]');
      if (!form) return;
      e.preventDefault();
      form.reset();
      var fileName = form.querySelector('[data-file-name]');
      if (fileName) fileName.textContent = 'No file chosen';
      open('success-modal');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initFooter();
    document.documentElement.classList.remove('preload');
    initNavbar();
    initNavbarScroll();
    initMegaMenu();
    initHeroSlider();
    initTestimonialsCarousel();
    initOutcomesMarquee();
    initVerticalMarquee();
    initImageFallback();
    initSplitText();
    initScrollReveal();
    initCountUp();
    initMagneticButtons();
    initTiltCards();
    initIndustriesAccordion();
    initOutcomesStack();
    initCareersOpenings();
    initOutcomesScroll();
    initPlatformsAccordion();
    initModals();
    initCareersBlogCarousel();
  });
})();
