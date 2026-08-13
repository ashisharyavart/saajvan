/* =========================================================
   YOUR FIRM — site behaviour
   0. Render all firm-specific content from data/site-config.js
   1. Mobile nav toggle
   2. Reveal-on-scroll for .reveal elements
   3. Hero video — autoplays once on load, freezes on last frame
   4. All other transformation videos — autoplay once when they
      scroll into view, freeze on last frame (none of them loop)
   ========================================================= */

/* ---------- 0. Render config (name, contact, location, team) ---------- */
function renderSiteConfig() {
  const cfg = window.SITE_CONFIG;
  if (!cfg) {
    console.warn('SITE_CONFIG not found — check that data/site-config.js loads before script.js.');
    return;
  }

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el && value !== undefined) el.textContent = value;
  };
  const setHref = (id, value) => {
    const el = document.getElementById(id);
    if (el && value !== undefined) el.setAttribute('href', value);
  };
  const setHTML = (id, html) => {
    const el = document.getElementById(id);
    if (el && html !== undefined) el.innerHTML = html;
  };

  // Meta
  if (cfg.meta) {
    if (cfg.meta.title) {
      document.title = cfg.meta.title;
      setText('pageTitle', cfg.meta.title);
    }
    const descEl = document.getElementById('pageDescription');
    if (descEl && cfg.meta.description) descEl.setAttribute('content', cfg.meta.description);
  }

  // Brand / logo
  if (cfg.brand) {
    setText('logoMark', cfg.brand.initials);
    setHTML('logoText', [cfg.brand.nameLine1, cfg.brand.nameLine2].filter(Boolean).join('<br>'));
    setHTML('footerLogoText', [cfg.brand.nameLine1, cfg.brand.nameLine2].filter(Boolean).join('<br>'));
  }

  // Hero
  if (cfg.hero) {
    setText('heroEyebrow', cfg.hero.eyebrow);
    setHTML('heroTitle', [cfg.hero.headingLine1, cfg.hero.headingLine2].filter(Boolean).join('<br>'));
    setText('heroDesc', cfg.hero.description);
  }

  // About / intro strip + footer tagline
  if (cfg.about) {
    setText('introCopy', cfg.about.introParagraph);
    setText('footerTagline', cfg.about.footerTagline);
  }

  // Contact — CTA banner, footer, floating action buttons
  if (cfg.contact) {
    setHref('ctaEmailLink', cfg.contact.email ? `mailto:${cfg.contact.email}` : undefined);
    setHref('footerEmailLink', cfg.contact.email ? `mailto:${cfg.contact.email}` : undefined);
    setText('footerEmailLink', cfg.contact.email);
    setHref('footerPhoneLink', cfg.contact.phoneHref);
    setText('footerPhoneLink', cfg.contact.phoneDisplay);
    setText('footerLocation', cfg.contact.locationLine);
    setHref('fabWhatsapp', cfg.contact.whatsappHref);
    setHref('fabInstagram', cfg.contact.instagramHref);
    setHref('fabPhone', cfg.contact.phoneHref);
  }

  // Footer copyright line
  if (cfg.footer && cfg.footer.copyrightName) {
    const year = new Date().getFullYear();
    setText('footerCopyright', `© ${year} ${cfg.footer.copyrightName}.`);
  }

  // Team — build cards from the array so adding/removing people needs
  // no HTML editing at all
  const teamGrid = document.getElementById('teamGrid');
  if (teamGrid && Array.isArray(cfg.team)) {
    teamGrid.innerHTML = '';
    cfg.team.forEach(member => {
      const card = document.createElement('div');
      card.className = 'team-card';
      card.innerHTML = `
        <div class="team-photo"><img src="${member.photo}" alt="${member.name}"></div>
        <h3>${member.name}</h3>
        <p>${member.role}</p>
      `;
      teamGrid.appendChild(card);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {

  renderSiteConfig();

  /* ---------- 1. Mobile nav ---------- */
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const open = mainNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open);
    });
    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- 2. Reveal on scroll ---------- */
  const revealTargets = document.querySelectorAll(
    '.service-row, .portfolio-card, .team-card'
  );
  revealTargets.forEach(el => el.classList.add('reveal'));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealTargets.forEach(el => revealObserver.observe(el));

  /* ---------- 3. Hero video: autoplay once, freeze on last frame ---------- */
  const heroVideos = document.querySelectorAll('.hero-video');
  heroVideos.forEach(vid => {
    vid.play().catch(() => {
      console.warn('Hero video could not autoplay — poster image is shown instead.');
    });
    vid.addEventListener('error', () => {
      console.warn('Hero video failed to load — showing poster/gradient fallback.');
    });
  });

  /* ---------- 4. Transformation videos: play once when in view ---------- */
  const transformVideos = document.querySelectorAll('.loop-video');

  const playOnceObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const vid = entry.target;
      if (entry.isIntersecting) {
        vid.play().catch(() => {});
        // Only trigger once — after this the video plays through on its
        // own and stops on its last frame (no loop attribute set).
        playOnceObserver.unobserve(vid);
      }
    });
  }, { threshold: 0.35 });

  transformVideos.forEach(vid => playOnceObserver.observe(vid));

  /* ---------- 5. Count-up animation for stats ---------- */
  const statNumbers = document.querySelectorAll('.stat-number');

  const countUp = (el) => {
    const target = parseFloat(el.getAttribute('data-target'));
    const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    const duration = 1500; // 1.5 seconds
    const startTime = performance.now();

    const updateCount = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out quad: f(x) = x * (2 - x)
      const easeProgress = progress * (2 - progress);
      const currentValue = easeProgress * target;

      el.textContent = currentValue.toFixed(decimals);

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        el.textContent = target.toFixed(decimals);
      }
    };

    requestAnimationFrame(updateCount);
  };

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        countUp(entry.target);
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  statNumbers.forEach(num => statsObserver.observe(num));

});
