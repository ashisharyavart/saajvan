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

  // Contact — footer, floating action buttons
  if (cfg.contact) {
    setHref('footerEmailLink', cfg.contact.email ? `mailto:${cfg.contact.email}` : undefined);
    setText('footerEmailLink', cfg.contact.email);
    setHref('footerPhoneLink', cfg.contact.phoneHref);
    setText('footerPhoneLink', cfg.contact.phoneDisplay);
    setText('footerLocation', cfg.contact.locationLine);
    setHref('fabWhatsapp', cfg.contact.whatsappHref);
    setHref('fabInstagram', cfg.contact.instagramHref);
    setHref('fabYoutube', cfg.contact.youtubeHref);
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

  /* ---------- 0a. Entrance gate — architectural door reveal ---------- */
  (function initEntranceGate() {
    const gate = document.getElementById('entranceGate');
    if (!gate) return;

    // Skip entirely for users who prefer reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      gate.classList.add('is-done');
      return;
    }

    // Lock scrolling while gate is visible
    document.documentElement.classList.add('gate-locked');

    // Short pause (250ms), then trigger the opening animation
    setTimeout(() => {
      gate.classList.add('is-opening');

      // Listen for the left panel animation to end (both panels animate in parallel)
      const leftPanel = gate.querySelector('.entrance-panel--left');
      if (leftPanel) {
        leftPanel.addEventListener('animationend', () => {
          // Remove the gate entirely and restore scrolling
          gate.classList.add('is-done');
          document.documentElement.classList.remove('gate-locked');
        }, { once: true });
      } else {
        // Fallback: remove after animation duration
        setTimeout(() => {
          gate.classList.add('is-done');
          document.documentElement.classList.remove('gate-locked');
        }, 1200);
      }
    }, 250);
  })();

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

  /* ---------- 3. Hero video: background autoplay ---------- */
  const heroVideos = document.querySelectorAll('.hero-video');
  heroVideos.forEach(vid => {
    vid.muted = true;
    vid.play().catch(() => {});
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

  /* ---------- 5.5 Architectural Projects & Dynamic Portfolio Controller ---------- */
  function initProjectsSection() {
    const projectsGrid = document.getElementById('projectsGrid');
    const filterBtns = document.querySelectorAll('.filter-btn');

    if (!projectsGrid) return;

    const allProjects = window.getSaajvanProjects ? window.getSaajvanProjects() : (window.SAAJVAN_PROJECTS_DATA || []);
    if (!allProjects.length) return;

    let activeSlideshowIntervals = [];

    function clearSlideshowIntervals() {
      activeSlideshowIntervals.forEach(id => clearInterval(id));
      activeSlideshowIntervals = [];
    }

    // Render portfolio project cards
    function renderProjects(filter = 'all') {
      clearSlideshowIntervals();
      projectsGrid.innerHTML = '';

      const filtered = filter === 'all' 
        ? allProjects 
        : allProjects.filter(p => p.category.toLowerCase() === filter.toLowerCase());

      filtered.forEach(project => {
        const card = document.createElement('article');
        card.className = 'project-card';
        card.setAttribute('data-id', project.slug);

        const projectUrl = `project.html?id=${encodeURIComponent(project.slug)}`;

        // Build cover slideshow HTML (uses only cover... files)
        let mediaHtml = '<div class="project-media"><div class="card-slideshow">';
        const coverList = project.covers && project.covers.length > 0 ? project.covers : project.media;

        if (coverList && coverList.length > 0) {
          coverList.forEach((cover, idx) => {
            if (cover.type === 'video') {
              mediaHtml += `<video src="${cover.url}" class="slide-img ${idx === 0 ? 'active' : ''}" muted playsinline loop autoplay preload="metadata"></video>`;
            } else {
              mediaHtml += `<img src="${cover.url}" alt="${project.name} cover ${idx + 1}" class="slide-img ${idx === 0 ? 'active' : ''}" loading="lazy">`;
            }
          });
        } else {
          mediaHtml += `<div style="width:100%;height:100%;background:var(--saaj-cream-alt);"></div>`;
        }
        mediaHtml += '</div></div>';

        card.innerHTML = `
          ${mediaHtml}
          <div class="project-card-overlay">
            <div class="project-cat-badge">${project.category}</div>
            <h3 class="project-card-title">${project.name}</h3>
            <p class="project-card-desc">${project.shortDesc}</p>
          </div>
          <a href="${projectUrl}" class="btn-explore" aria-label="Explore ${project.name}">
            Explore More
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        `;

        // 4-second cycling slideshow if multiple cover items
        if (coverList && coverList.length > 1) {
          const slideItems = card.querySelectorAll('.slide-img');
          let currentSlide = 0;

          const intervalId = setInterval(() => {
            if (slideItems.length > 1) {
              slideItems[currentSlide].classList.remove('active');
              currentSlide = (currentSlide + 1) % slideItems.length;
              slideItems[currentSlide].classList.add('active');
            }
          }, 4000);

          activeSlideshowIntervals.push(intervalId);
        }

        // Clicking anywhere on the card navigates directly to the project page
        card.addEventListener('click', (e) => {
          if (e.target.closest('a')) return; // Let <a> handle it
          window.location.href = projectUrl;
        });

        projectsGrid.appendChild(card);
      });
    }

    // Filter tabs
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderProjects(btn.dataset.filter);
      });
    });

    renderProjects('all');
  }

  initProjectsSection();

  /* ---------- 6. 3-Stage Lead Capture Popup Modal State Machine ---------- */
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

    // Permanent Submission Check (across browser reboots/refreshes)
    const isPermanentlySubmitted = () => {
      return localStorage.getItem('saajvan_lead_submitted') === 'true';
    };

    // Session Dismissal Check (Max 3 closes per session)
    const isSessionDismissed = () => {
      const count = parseInt(sessionStorage.getItem('lead_close_count') || '0', 10);
      return count >= 3 || sessionStorage.getItem('lead_session_dismissed') === 'true';
    };

    let timerId = null;

    const clearActiveTimer = () => {
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      }
    };

    const openModal = (force = false) => {
      clearActiveTimer();
      if (!force && (isPermanentlySubmitted() || isSessionDismissed())) return;

      if (force && modalContent && modalSuccess) {
        modalContent.hidden = false;
        modalSuccess.hidden = true;
      }

      modalOverlay.classList.add('is-open');
      modalOverlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
      modalOverlay.classList.remove('is-open');
      modalOverlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      clearActiveTimer();

      if (isPermanentlySubmitted()) return;

      let closeCount = parseInt(sessionStorage.getItem('lead_close_count') || '0', 10);
      closeCount += 1;
      sessionStorage.setItem('lead_close_count', closeCount.toString());

      if (closeCount === 1) {
        // Closed Popup #1 -> Start 15-second timer for Popup #2
        timerId = setTimeout(() => openModal(false), 15000);
      } else if (closeCount === 2) {
        // Closed Popup #2 -> Start 60-second timer for Popup #3
        timerId = setTimeout(() => openModal(false), 60000);
      } else if (closeCount >= 3) {
        // Closed Popup #3 -> FINAL ATTEMPT REACHED: Stop for remainder of session
        sessionStorage.setItem('lead_session_dismissed', 'true');
      }
    };

    // Initial Trigger & Navigation State Check
    if (!isPermanentlySubmitted() && !isSessionDismissed()) {
      const currentCloseCount = parseInt(sessionStorage.getItem('lead_close_count') || '0', 10);
      if (currentCloseCount === 1) {
        // Visitor navigated after closing Popup #1 -> Wait 15 seconds for Popup #2
        timerId = setTimeout(() => openModal(false), 15000);
      } else if (currentCloseCount === 2) {
        // Visitor navigated after closing Popup #2 -> Wait 60 seconds for Popup #3
        timerId = setTimeout(() => openModal(false), 60000);
      } else if (currentCloseCount === 0) {
        // First visit -> Wait 20 seconds for Popup #1
        timerId = setTimeout(() => openModal(false), 20000);
      }
    }

    // Manual CTA triggers across the page (Book a Consultation, Contact Us, etc.)
    const triggerSelectors = [
      '#ctaEmailLink',
      '.header-cta',
      '[data-open-lead-modal]',
      '.btn-book-consultation',
      'a[href="#contact"]'
    ];

    document.querySelectorAll(triggerSelectors.join(', ')).forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(true);
      });
    });

    // Check URL hash on load & on hashchange
    const checkHashTrigger = () => {
      if (window.location.hash === '#contact') {
        setTimeout(() => openModal(true), 300);
      }
    };
    window.addEventListener('hashchange', checkHashTrigger);
    checkHashTrigger();

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
