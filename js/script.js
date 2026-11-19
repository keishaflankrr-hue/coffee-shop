/* ==========================================================
   WABI SABI — site scripts
   Loaded at the bottom of every page, after jQuery.

   1. INTERACTIVE ELEMENTS   accordion + modal (jQuery)
   2. ANIMATION              scroll reveal, sticky header, back-to-top
   3. DOM MANIPULATION       open-now badge, enquiry form checks
   4. GALLERY LIGHTBOX       built from scratch with vanilla JS

   The menu page (tabs, search, sort, dynamic loading) lives in js/menu.js.

   Every feature starts by checking that its elements exist on the
   current page, so one file can safely be used on all six pages.
   ========================================================== */

(function () {
  'use strict';

  // jQuery comes from a CDN. If it fails to load, the vanilla features still work.
  var jq = window.jQuery;

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // jQuery's own animations (slideDown etc.) can be switched off globally
  if (jq && prefersReducedMotion) {
    jq.fx.off = true;
  }


  /* ========================================================
     1. INTERACTIVE ELEMENTS
     ======================================================== */

  /* ---------- 1a. Accordion (FAQs) — jQuery ----------
     Without JS every answer is visible. With JS they start collapsed
     and each question button toggles its own answer. */
  function initAccordion() {
    if (!jq || !jq('.accordion').length) return;

    function openItem($button) {
      var $panel = jq('#' + $button.attr('aria-controls'));
      $button.attr('aria-expanded', 'true').closest('.accordion-item').addClass('is-open');
      $panel.stop(true, true).hide().prop('hidden', false).slideDown(250);
    }

    function closeItem($button) {
      var $panel = jq('#' + $button.attr('aria-controls'));
      $button.attr('aria-expanded', 'false').closest('.accordion-item').removeClass('is-open');
      $panel.stop(true, true).slideUp(250, function () { jq(this).prop('hidden', true); });
    }

    jq('.accordion').each(function () {
      var $accordion = jq(this);

      // Collapse everything to start
      $accordion.find('.accordion-trigger').each(function () {
        var $button = jq(this);
        $button.attr('aria-expanded', 'false');
        jq('#' + $button.attr('aria-controls')).prop('hidden', true);
      });

      // One click handler on the whole accordion (event delegation)
      $accordion.on('click', '.accordion-trigger', function () {
        var $button = jq(this);
        var isOpen = $button.attr('aria-expanded') === 'true';

        // Only one answer open at a time
        $accordion.find('.accordion-trigger[aria-expanded="true"]').not($button).each(function () {
          closeItem(jq(this));
        });

        if (isOpen) { closeItem($button); } else { openItem($button); }
      });
    });
  }


  /* ---------- 1b. Modal — jQuery ----------
     The modal is built on demand, so any page can call
     WabiModal.open({ title, message, trigger }). */
  function initModal() {
    if (!jq) return;

    var $lastFocused = null;

    function closeModal() {
      var $overlay = jq('.modal-overlay');
      if (!$overlay.length) return;

      $overlay.removeClass('is-open');                  // CSS fades it out
      jq('body').removeClass('no-scroll');
      jq(document).off('keydown.modal');

      setTimeout(function () {
        $overlay.remove();
        if ($lastFocused && $lastFocused.length) $lastFocused.trigger('focus');   // give focus back
      }, prefersReducedMotion ? 0 : 250);
    }

    function openModal(options) {
      if (jq('.modal-overlay').length) return;          // never stack two modals
      $lastFocused = jq(options.trigger || document.activeElement);

      // Build the elements. .text() (not .html()) keeps anything typed by a visitor harmless.
      var $overlay = jq('<div class="modal-overlay"></div>');
      var $dialog  = jq('<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-message"></div>');
      var $close   = jq('<button type="button" class="modal-close" aria-label="Close dialog">&times;</button>');
      var $title   = jq('<h2 id="modal-title"></h2>').text(options.title);
      var $message = jq('<p id="modal-message"></p>').text(options.message);
      var $ok      = jq('<button type="button" class="button modal-ok">Got it</button>');

      $dialog.append($close, $title, $message, $ok);
      $overlay.append($dialog).appendTo('body');
      jq('body').addClass('no-scroll');

      // Wait one frame so the browser sees the "closed" state and the CSS transition can run
      requestAnimationFrame(function () {
        $overlay.addClass('is-open');
        $ok.trigger('focus');
      });

      // Close: X button, "Got it", click on the dark backdrop, or Esc
      $close.add($ok).on('click', closeModal);
      $overlay.on('click', function (e) { if (e.target === this) closeModal(); });

      jq(document).on('keydown.modal', function (e) {
        if (e.key === 'Escape') { closeModal(); return; }

        // Keep Tab inside the dialog while it is open
        if (e.key === 'Tab') {
          var focusable = $dialog.find('button');
          var first = focusable.get(0);
          var last = focusable.get(focusable.length - 1);
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      });
    }

    window.WabiModal = { open: openModal };

    // Footer links that don't have a page yet (Gift Cards, Rewards, Social Media)
    jq(document).on('click', '[data-coming-soon]', function (e) {
      e.preventDefault();
      openModal({
        title: jq(this).text().trim(),
        message: 'Coming soon! We are still putting this together. In the meantime, say hello through our enquiry page.',
        trigger: this
      });
    });
  }


  /* ========================================================
     2. ANIMATION (CSS does the movement, JS decides when)
     ======================================================== */

  /* ---------- 2a. Scroll reveal ----------
     Elements fade up as they scroll into view. JS adds the .reveal class
     itself, so if JS is off nothing is ever hidden. */
  function initScrollReveal() {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) return;

    var selectors = [
      '.menu-intro', '.about-content > *', '.contact-info',
      '.accordion-item', '.map-section > *', '.enquiry-intro', '.enquiry-form .form-group',
      '.page-intro', '.gallery-item'
    ].join(', ');

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        observer.unobserve(el);                                // reveal once only

        setTimeout(function () {
          el.classList.add('is-visible');
          // Tidy up afterwards so the slow reveal transition doesn't affect hover effects
          setTimeout(function () { el.classList.remove('reveal', 'is-visible'); }, 700);
        }, Number(el.getAttribute('data-reveal-delay')) || 0);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    var siblingCount = new Map();      // staggers items that share a parent
    document.querySelectorAll(selectors).forEach(function (el) {
      var parent = el.parentElement;
      var n = siblingCount.get(parent) || 0;
      siblingCount.set(parent, n + 1);
      el.setAttribute('data-reveal-delay', Math.min(n, 6) * 70);
      el.classList.add('reveal');
      observer.observe(el);
    });
  }


  /* ---------- 2b. Sticky header shadow + back-to-top button ---------- */
  function initScrollEffects() {
    var header = document.querySelector('.site-header');

    // Create the button with the DOM API and add it to the page
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'back-to-top';
    button.setAttribute('aria-label', 'Back to top');
    button.innerHTML =
      '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">' +
      '<path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    document.body.appendChild(button);

    button.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });

    // Scroll fires constantly, so do the work at most once per animation frame
    var waiting = false;
    function update() {
      var y = window.scrollY;
      if (header) header.classList.toggle('is-scrolled', y > 10);
      button.classList.toggle('is-visible', y > 600);
      waiting = false;
    }
    window.addEventListener('scroll', function () {
      if (!waiting) { waiting = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }


  /* ========================================================
     3. DOM MANIPULATION
     ======================================================== */

  /* ---------- 3a. "Open now" badge (contact page) ----------
     Reads the opening hours from data-* attributes in the HTML list,
     works out whether the shop is open right now (in South African time,
     wherever the visitor is), and inserts a badge above the list. */
  function initOpenNow() {
    var list = document.querySelector('.opening-hours');
    if (!list) return;

    var DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Build { 1: {open:'07:00', close:'18:00'}, 2: {...}, ... } from the list items
    var schedule = {};
    list.querySelectorAll('li[data-days]').forEach(function (li) {
      li.getAttribute('data-days').split(',').forEach(function (day) {
        schedule[Number(day)] = { open: li.getAttribute('data-open'), close: li.getAttribute('data-close') };
      });
    });

    function toMinutes(time) {                 // '07:30' -> 450
      var parts = time.split(':');
      return Number(parts[0]) * 60 + Number(parts[1]);
    }

    function formatTime(minutes) {             // 450 -> '7:30 AM'
      var h = Math.floor(minutes / 60);
      var m = minutes % 60;
      var suffix = h >= 12 ? 'PM' : 'AM';
      var h12 = h % 12 === 0 ? 12 : h % 12;
      return h12 + ':' + (m < 10 ? '0' : '') + m + ' ' + suffix;
    }

    function shopTimeNow() {
      var parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Africa/Johannesburg', weekday: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
      }).formatToParts(new Date());
      function get(type) { return parts.filter(function (p) { return p.type === type; })[0].value; }
      return { day: DAY_NAMES.indexOf(get('weekday')), minutes: Number(get('hour')) * 60 + Number(get('minute')) };
    }

    var badge = document.createElement('p');
    badge.className = 'open-badge';
    badge.setAttribute('role', 'status');
    var dot = document.createElement('span');
    dot.className = 'open-badge-dot';
    dot.setAttribute('aria-hidden', 'true');
    var text = document.createElement('span');
    badge.append(dot, text);
    list.before(badge);

    function update() {
      var now = shopTimeNow();
      var today = schedule[now.day];
      var isOpen = false;
      var message = '';

      if (today) {
        var opens = toMinutes(today.open);
        var closes = toMinutes(today.close);
        if (now.minutes >= opens && now.minutes < closes) {
          isOpen = true;
          message = 'Open now · closes at ' + formatTime(closes);
        } else if (now.minutes < opens) {
          message = 'Closed now · opens today at ' + formatTime(opens);
        }
      }

      if (!isOpen && !message) {               // already closed for today: find the next open day
        for (var i = 1; i <= 7; i++) {
          var day = (now.day + i) % 7;
          if (schedule[day]) {
            message = 'Closed now · opens ' + (i === 1 ? 'tomorrow' : DAY_NAMES[day]) + ' at ' + formatTime(toMinutes(schedule[day].open));
            break;
          }
        }
      }

      badge.classList.toggle('is-open', isOpen);
      badge.classList.toggle('is-closed', !isOpen);
      text.textContent = message || 'Closed now';
    }

    update();
    setInterval(update, 60000);                // refresh every minute
  }


  /* ---------- 3b. Enquiry form: live checks, character counter, confirmation ---------- */
  function initEnquiryForm() {
    var form = document.querySelector('.enquiry-form form');
    if (!form) return;
    form.noValidate = true;                    // we show our own friendlier messages

    // One small rule per field. Each returns an error message, or '' if the value is fine.
    var rules = {
      name: function (v) { return v ? '' : 'Please tell us your name.'; },
      email: function (v) {
        if (!v) return 'Please enter your email address.';
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'That email doesn’t look right. Try name@example.com.';
      },
      phone: function (v) {
        return !v || /^[+()\d][\d\s()-]{6,19}$/.test(v) ? '' : 'Please enter a valid phone number, or leave it blank.';
      },
      reason: function (v) { return v ? '' : 'Please choose a reason for contacting us.'; },
      message: function (v) { return v ? '' : 'Please write us a message.'; }
    };

    function showError(field, message) {
      var error = document.getElementById(field.id + '-error');
      if (!error) {
        error = document.createElement('p');
        error.id = field.id + '-error';
        error.className = 'field-error';
        field.parentElement.appendChild(error);
      }
      error.textContent = message;
      field.setAttribute('aria-invalid', 'true');
      field.setAttribute('aria-describedby', error.id);
    }

    function clearError(field) {
      var error = document.getElementById(field.id + '-error');
      if (error) error.remove();
      field.removeAttribute('aria-invalid');
      field.removeAttribute('aria-describedby');
    }

    function validate(field) {
      var message = rules[field.name](field.value.trim());
      if (message) { showError(field, message); } else { clearError(field); }
      return !message;
    }

    var fields = Array.prototype.slice.call(form.elements).filter(function (el) { return rules[el.name]; });

    fields.forEach(function (field) {
      field.addEventListener('blur', function () { validate(field); });
      field.addEventListener('input', function () {
        if (field.hasAttribute('aria-invalid')) validate(field);    // clear the error as soon as it's fixed
      });
      if (field.tagName === 'SELECT') field.addEventListener('change', function () { validate(field); });
    });

    // Character counter under the message box
    var textarea = document.getElementById('message');
    var LIMIT = 500;
    var counter = document.createElement('p');
    counter.className = 'char-count';
    textarea.maxLength = LIMIT;
    textarea.after(counter);
    function updateCounter() {
      counter.textContent = textarea.value.length + ' / ' + LIMIT;
      counter.classList.toggle('near-limit', textarea.value.length >= LIMIT * 0.9);
    }
    textarea.addEventListener('input', updateCounter);
    updateCounter();

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var invalid = fields.filter(function (field) { return !validate(field); });
      if (invalid.length) { invalid[0].focus(); return; }

      var name = document.getElementById('name').value.trim();
      var email = document.getElementById('email').value.trim();

      // TODO: this page has no server yet, so nothing is actually sent.
      // To really deliver the message, point the form at a service such as Formspree or Netlify Forms.
      var title = 'Thank you, ' + name + '!';
      var message = 'Your enquiry has been received. We’ll reply to ' + email + ' as soon as we can.';

      if (window.WabiModal) {
        window.WabiModal.open({ title: title, message: message, trigger: form.querySelector('button[type="submit"]') });
      } else {
        var note = document.createElement('p');          // fallback if jQuery didn't load
        note.className = 'form-success';
        note.setAttribute('role', 'status');
        note.textContent = title + ' ' + message;
        form.after(note);
      }

      form.reset();
      updateCounter();
    });
  }


  /* ========================================================
     4. GALLERY LIGHTBOX
     Each thumbnail is a normal link to the large image, so the gallery
     still works with JS off. With JS on, the click opens a viewer layer.
     ======================================================== */
  function initLightbox() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.gallery a'));
    if (!links.length) return;

    var overlay = null;
    var image, caption, counter, closeButton;
    var current = 0;
    var lastFocused = null;
    var touchStartX = 0;

    function build() {
      overlay = document.createElement('div');
      overlay.className = 'lightbox';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', 'Image viewer');
      overlay.innerHTML =
        '<button type="button" class="lightbox-btn lightbox-close" aria-label="Close">&times;</button>' +
        '<button type="button" class="lightbox-btn lightbox-prev" aria-label="Previous image">&#8249;</button>' +
        '<figure class="lightbox-figure"><img class="lightbox-img" alt=""><figcaption class="lightbox-caption"></figcaption></figure>' +
        '<button type="button" class="lightbox-btn lightbox-next" aria-label="Next image">&#8250;</button>' +
        '<p class="lightbox-counter" aria-live="polite"></p>';

      image = overlay.querySelector('.lightbox-img');
      caption = overlay.querySelector('.lightbox-caption');
      counter = overlay.querySelector('.lightbox-counter');
      closeButton = overlay.querySelector('.lightbox-close');

      overlay.addEventListener('click', function (e) {
        if (e.target.closest('.lightbox-close') || e.target === overlay || e.target.classList.contains('lightbox-figure')) close();
        else if (e.target.closest('.lightbox-prev')) show(current - 1);
        else if (e.target.closest('.lightbox-next')) show(current + 1);
      });

      // Swipe left / right on touch screens
      overlay.addEventListener('touchstart', function (e) { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
      overlay.addEventListener('touchend', function (e) {
        var dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 50) show(dx < 0 ? current + 1 : current - 1);
      }, { passive: true });
    }

    function show(index) {
      current = (index + links.length) % links.length;       // wraps around at both ends
      var link = links[current];
      var thumb = link.querySelector('img');

      image.classList.add('is-loading');                      // fades out until the new photo has loaded
      image.onload = image.onerror = function () { image.classList.remove('is-loading'); };
      image.alt = thumb.alt;
      image.src = link.href;                                  // the large version
      caption.textContent = link.getAttribute('data-caption') || thumb.alt;
      counter.textContent = (current + 1) + ' / ' + links.length;

      // Quietly load the neighbours so next/previous feels instant
      [current + 1, current - 1].forEach(function (n) {
        new Image().src = links[(n + links.length) % links.length].href;
      });
    }

    function onKeydown(e) {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') show(current + 1);
      else if (e.key === 'ArrowLeft') show(current - 1);
      else if (e.key === 'Tab') {                             // keep keyboard focus inside the viewer
        var buttons = overlay.querySelectorAll('.lightbox-btn');
        var first = buttons[0];
        var last = buttons[buttons.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }

    function open(index, trigger) {
      if (!overlay) build();
      lastFocused = trigger;
      show(index);
      document.body.appendChild(overlay);
      document.body.classList.add('no-scroll');
      document.addEventListener('keydown', onKeydown);
      requestAnimationFrame(function () {
        overlay.classList.add('is-open');
        closeButton.focus();
      });
    }

    function close() {
      overlay.classList.remove('is-open');
      document.body.classList.remove('no-scroll');
      document.removeEventListener('keydown', onKeydown);
      setTimeout(function () {
        overlay.remove();
        if (lastFocused) lastFocused.focus();
      }, prefersReducedMotion ? 0 : 300);
    }

    links.forEach(function (link, i) {
      link.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;     // let "open in new tab" work as normal
        e.preventDefault();
        open(i, link);
      });
    });
  }


  /* ========================================================
     START EVERYTHING
     ======================================================== */
  initAccordion();
  initModal();
  initOpenNow();
  initEnquiryForm();
  initLightbox();
  initScrollReveal();
  initScrollEffects();

})();
