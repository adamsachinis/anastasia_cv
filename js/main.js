/* Αναστασία Γκλιάτη — Βιογραφικό: interactions & animations */
(() => {
  'use strict';

  const root = document.documentElement;
  root.classList.add('io'); // main.js is running: disable CSS safety net

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  /* ---------- Hero name: letter-by-letter entrance ---------- */
  const heroName = $('.hero__name');
  if (heroName) {
    let i = 0;
    $$('.line', heroName).forEach((line) => {
      const text = line.textContent.trim();
      line.textContent = '';
      line.setAttribute('aria-hidden', 'true');
      for (const ch of text) {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = ch;
        span.style.setProperty('--i', i++);
        line.appendChild(span);
      }
    });
    heroName.classList.add('is-split');
  }

  /* ---------- Stagger delays ---------- */
  $$('[data-stagger]').forEach((group) => {
    Array.from(group.children).forEach((child, idx) => {
      child.style.setProperty('--d', `${idx * 110}ms`);
    });
  });

  /* ---------- Count-up numbers ---------- */
  const formatNumber = (value, decimals) =>
    value.toLocaleString('el-GR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  const countUp = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    if (Number.isNaN(target)) return;
    if (reduceMotion.matches) {
      el.textContent = formatNumber(target, decimals);
      return;
    }
    const duration = 1600;
    let start = null;
    const step = (now) => {
      if (start === null) start = now;
      const k = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      el.textContent = formatNumber(target * eased, decimals);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /* ---------- Reveal on scroll ---------- */
  const reveal = (el) => {
    el.classList.add('is-visible');
    $$('[data-count]', el).forEach((n) => {
      if (!n.dataset.counted) {
        n.dataset.counted = '1';
        countUp(n);
      }
    });
  };

  const revealables = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach(reveal);
  }

  /* ---------- Scroll-driven UI: progress, top bar, timeline, back-to-top ---------- */
  const progress = $('.progress span');
  const topbar = $('.topbar');
  const toTop = $('.to-top');
  const timeline = $('.timeline');
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const vh = window.innerHeight;
    const max = root.scrollHeight - vh;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    if (topbar) topbar.classList.toggle('is-scrolled', y > 12);
    if (toTop) toTop.classList.toggle('is-visible', y > vh * 0.9);
    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const p = (vh * 0.62 - r.top) / r.height;
      timeline.style.setProperty('--tl', Math.min(1, Math.max(0, p)).toFixed(4));
    }
    ticking = false;
  };
  const requestScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  };
  window.addEventListener('scroll', requestScroll, { passive: true });
  window.addEventListener('resize', requestScroll);
  onScroll();

  /* ---------- Scrollspy ---------- */
  const navLinks = $$('[data-spy]');
  if (navLinks.length && 'IntersectionObserver' in window) {
    const setActive = (id) => {
      navLinks.forEach((a) => {
        const on = a.dataset.spy === id;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    };
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach((a) => {
      const section = document.getElementById(a.dataset.spy);
      if (section) spy.observe(section);
    });
    const hero = $('#top');
    if (hero) {
      new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) setActive(null);
      }, { rootMargin: '-45% 0px -50% 0px' }).observe(hero);
    }
  }

  /* ---------- Mobile menu ---------- */
  const navToggle = $('[data-nav-toggle]');
  const nav = $('#site-nav');
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    if (navToggle) navToggle.setAttribute('aria-expanded', String(open));
  };
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => setMenu(navToggle.getAttribute('aria-expanded') !== 'true'));
    $$('a', nav).forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
        setMenu(false);
        navToggle.focus();
      }
    });
    document.addEventListener('click', (e) => {
      if (document.body.classList.contains('menu-open') && !nav.contains(e.target) && !navToggle.contains(e.target)) {
        setMenu(false);
      }
    });
  }

  /* ---------- Theme toggle (with circular reveal where supported) ---------- */
  const themeBtn = $('[data-theme-toggle]');
  const currentTheme = () => root.getAttribute('data-theme') || (systemDark.matches ? 'dark' : 'light');
  const syncThemeButton = () => {
    if (!themeBtn) return;
    const dark = currentTheme() === 'dark';
    themeBtn.setAttribute('aria-label', dark ? 'Ενεργοποίηση φωτεινού θέματος' : 'Ενεργοποίηση σκοτεινού θέματος');
  };
  const applyTheme = (theme) => {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) { /* storage unavailable */ }
    syncThemeButton();
  };
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      if (!document.startViewTransition || reduceMotion.matches) {
        applyTheme(next);
        return;
      }
      const r = themeBtn.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      const transition = document.startViewTransition(() => applyTheme(next));
      transition.ready.then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 700, easing: 'cubic-bezier(.22, .61, .36, 1)', pseudoElement: '::view-transition-new(root)' }
        );
      }).catch(() => {});
    });
  }
  if (systemDark.addEventListener) systemDark.addEventListener('change', syncThemeButton);
  syncThemeButton();

  /* ---------- Portrait parallax (desktop pointers only) ---------- */
  const heroSection = $('.hero');
  const layers = $$('[data-depth]');
  if (heroSection && layers.length && window.matchMedia('(pointer: fine)').matches && !reduceMotion.matches) {
    let frame = 0;
    let px = 0;
    let py = 0;
    heroSection.addEventListener('pointermove', (e) => {
      const r = heroSection.getBoundingClientRect();
      px = (e.clientX - r.left) / r.width - 0.5;
      py = (e.clientY - r.top) / r.height - 0.5;
      if (!frame) {
        frame = requestAnimationFrame(() => {
          layers.forEach((layer) => {
            const depth = parseFloat(layer.dataset.depth) || 0;
            layer.style.translate = `${(px * depth).toFixed(2)}px ${(py * depth).toFixed(2)}px`;
          });
          frame = 0;
        });
      }
    });
    heroSection.addEventListener('pointerleave', () => {
      layers.forEach((layer) => { layer.style.translate = ''; });
    });
  }

  /* ---------- Card spotlight ---------- */
  $$('[data-spotlight]').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  /* ---------- Toast ---------- */
  const toast = $('.toast');
  let toastTimer = 0;
  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-shown'), 2200);
  };

  /* ---------- Copy email ---------- */
  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      ta.remove();
      return ok;
    }
  };
  $$('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const ok = await copyText(btn.dataset.copy);
      showToast(ok ? 'Το email αντιγράφηκε' : 'Δεν ήταν δυνατή η αντιγραφή');
      if (ok) {
        btn.classList.add('is-done');
        setTimeout(() => btn.classList.remove('is-done'), 1800);
      }
    });
  });

  /* ---------- Print & year ---------- */
  $$('[data-print]').forEach((btn) => btn.addEventListener('click', () => window.print()));
  $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
})();
