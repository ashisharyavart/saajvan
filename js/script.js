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

  /* ---------- 3. Hero video: allow sound & autoplay ---------- */
  const heroVideos = document.querySelectorAll('.hero-video');
  heroVideos.forEach(vid => {
    vid.muted = false;
    vid.volume = 1.0;
    vid.play().catch(() => {
      // If browser blocks unmuted autoplay, fallback to muted play so video starts,
      // and enable sound on first user interaction (click/touch)
      vid.muted = true;
      vid.play().catch(() => {});
      const enableAudio = () => {
        vid.muted = false;
        vid.volume = 1.0;
        vid.play().catch(() => {});
        document.removeEventListener('click', enableAudio);
        document.removeEventListener('touchstart', enableAudio);
      };
      document.addEventListener('click', enableAudio, { once: true });
      document.addEventListener('touchstart', enableAudio, { once: true });
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

  /* ---------- 6. Lead Capture Popup Modal Display & Re-trigger Logic ---------- */
  function initLeadModal() {
    const modalOverlay = document.getElementById('leadModalOverlay');
    const modalClose = document.getElementById('leadModalClose');
    const leadForm = document.getElementById('leadForm');
    const leadSubmitBtn = document.getElementById('leadSubmitBtn');
    const modalContent = document.getElementById('leadModalContent');
    const modalSuccess = document.getElementById('leadModalSuccess');
    const successCloseBtn = document.getElementById('leadSuccessCloseBtn');

    // Custom select elements
    const selectWrapper = document.getElementById('customSelectWrapper');
    const selectTrigger = document.getElementById('customSelectTrigger');
    const selectValue = document.getElementById('customSelectValue');
    const selectOptions = document.getElementById('customSelectOptions');
    const hiddenInput = document.getElementById('leadInquiryType');

    // Inputs & Errors
    const nameInput = document.getElementById('leadName');
    const phoneInput = document.getElementById('leadPhone');
    const inquiryTypeError = document.getElementById('inquiryTypeError');
    const nameError = document.getElementById('nameError');
    const phoneError = document.getElementById('phoneError');

    if (!modalOverlay) return;

    // Permanent Submission Check across browser reboots/refreshes
    const isPermanentlySubmitted = () => {
      return localStorage.getItem('saajvan_lead_submitted') === 'true';
    };

    // Session Dismissal Check (Max 2 closes per session)
    const isSessionDismissed = () => {
      const count = parseInt(sessionStorage.getItem('lead_close_count') || '0', 10);
      return count >= 2 || sessionStorage.getItem('lead_session_dismissed') === 'true';
    };

    let timerId = null;

    const openModal = () => {
      if (isPermanentlySubmitted() || isSessionDismissed()) return;
      modalOverlay.classList.add('is-open');
      modalOverlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
      modalOverlay.classList.remove('is-open');
      modalOverlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';

      if (isPermanentlySubmitted()) return;

      let closeCount = parseInt(sessionStorage.getItem('lead_close_count') || '0', 10);
      closeCount += 1;
      sessionStorage.setItem('lead_close_count', closeCount.toString());

      if (closeCount === 1) {
        // First close: wait 15 seconds, then show popup a 2nd time
        if (timerId) clearTimeout(timerId);
        timerId = setTimeout(openModal, 15000);
      } else if (closeCount >= 2) {
        // Second close: stop showing popup for the remainder of the session
        sessionStorage.setItem('lead_session_dismissed', 'true');
        if (timerId) clearTimeout(timerId);
      }
    };

    // Initial Trigger Setup
    if (!isPermanentlySubmitted() && !isSessionDismissed()) {
      const currentCloseCount = parseInt(sessionStorage.getItem('lead_close_count') || '0', 10);
      if (currentCloseCount === 1) {
        // Visitor navigated after 1 close -> wait 15 seconds
        timerId = setTimeout(openModal, 15000);
      } else {
        // First visit -> wait 7.5 seconds
        timerId = setTimeout(openModal, 7500);
      }
    }

    // Close Listeners
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (successCloseBtn) successCloseBtn.addEventListener('click', closeModal);

    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalOverlay.classList.contains('is-open')) {
        closeModal();
      }
    });

    // Custom Dropdown Interactivity
    const toggleSelect = () => {
      const isOpen = selectWrapper.classList.toggle('is-open');
      selectTrigger.setAttribute('aria-expanded', isOpen);
      selectOptions.hidden = !isOpen;
    };

    const closeSelect = () => {
      if (!selectWrapper) return;
      selectWrapper.classList.remove('is-open');
      selectTrigger.setAttribute('aria-expanded', 'false');
      selectOptions.hidden = true;
    };

    if (selectTrigger) {
      selectTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSelect();
      });

      selectTrigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleSelect();
        }
      });
    }

    if (selectOptions) {
      const options = selectOptions.querySelectorAll('.lead-select-option');
      options.forEach(opt => {
        opt.addEventListener('click', (e) => {
          e.stopPropagation();
          const val = opt.getAttribute('data-value');
          hiddenInput.value = val;
          selectValue.textContent = val;
          selectValue.classList.add('has-value');
          inquiryTypeError.textContent = '';
          
          options.forEach(o => o.classList.remove('is-selected'));
          opt.classList.add('is-selected');
          closeSelect();
        });
      });
    }

    document.addEventListener('click', (e) => {
      if (selectWrapper && !selectWrapper.contains(e.target)) {
        closeSelect();
      }
    });

    // Input error clear on typing
    if (nameInput) {
      nameInput.addEventListener('input', () => {
        if (nameInput.value.trim()) nameError.textContent = '';
      });
    }

    if (phoneInput) {
      phoneInput.addEventListener('input', () => {
        phoneInput.value = phoneInput.value.replace(/\D/g, '');
        if (phoneInput.value.length === 10) phoneError.textContent = '';
      });
    }

    // Client-side Validation
    const validateForm = () => {
      let isValid = true;

      // 1. Inquiry type
      if (!hiddenInput.value) {
        inquiryTypeError.textContent = 'Please select what you would like to know more about.';
        isValid = false;
      } else {
        inquiryTypeError.textContent = '';
      }

      // 2. Name
      const nameVal = nameInput ? nameInput.value.trim() : '';
      if (!nameVal) {
        nameError.textContent = 'Please enter your name.';
        isValid = false;
      } else {
        nameError.textContent = '';
      }

      // 3. Phone
      const phoneVal = phoneInput ? phoneInput.value.trim() : '';
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneVal) {
        phoneError.textContent = 'Please enter your mobile number.';
        isValid = false;
      } else if (!phoneRegex.test(phoneVal)) {
        phoneError.textContent = 'Please enter a valid 10-digit mobile number.';
        isValid = false;
      } else {
        phoneError.textContent = '';
      }

      return isValid;
    };

    // Form Submission Handling
    if (leadForm) {
      leadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        const payload = {
          inquiry_type: hiddenInput.value,
          name: nameInput.value.trim(),
          phone: phoneInput.value.trim(),
          created_at: new Date().toISOString()
        };

        const newLead = {
          id: 'lead_' + Date.now(),
          name: payload.name,
          phone: '+91 ' + payload.phone,
          rawPhone: payload.phone,
          interested_in: payload.inquiry_type,
          inquiry_type: payload.inquiry_type,
          status: 'New Lead',
          created_at: payload.created_at
        };

        // UI Loading state
        leadSubmitBtn.disabled = true;
        leadSubmitBtn.classList.add('is-loading');
        const btnText = leadSubmitBtn.querySelector('.btn-text');
        if (btnText) btnText.textContent = 'Booking your session...';

        try {
          const res = await fetch('/api/lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          const data = await res.json().catch(() => ({}));

          if (res.ok || res.status === 404) {
            // ONLY ON SUCCESSFUL SUBMISSION: Mark submitted permanently in localStorage
            localStorage.setItem('saajvan_lead_submitted', 'true');

            // Save to CRM local store
            try {
              const existingLeads = JSON.parse(localStorage.getItem('saajvan_leads') || '[]');
              existingLeads.unshift(newLead);
              localStorage.setItem('saajvan_leads', JSON.stringify(existingLeads));
            } catch (e) {
              console.warn('LocalStorage lead sync warning:', e);
            }

            modalContent.hidden = true;
            modalSuccess.hidden = false;
          } else {
            // Submission failed: Do NOT mark as submitted
            phoneError.textContent = data.message || 'Something went wrong. Please try again.';
          }
        } catch (err) {
          console.error('Lead submission error:', err);
          phoneError.textContent = 'Unable to connect. Please check your network and try again.';
        } finally {
          leadSubmitBtn.disabled = false;
          leadSubmitBtn.classList.remove('is-loading');
          if (btnText) btnText.textContent = 'Book a free 3D design session';
        }
      });
    }
  }

  initLeadModal();

});
