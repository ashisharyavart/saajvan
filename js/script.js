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

  /* ---------- 5.5 Architectural Projects & Portfolio Controller ---------- */
  function initProjectsSection() {
    const SAAJVAN_PROJECTS = [
      {
        id: "the-hollow-loft",
        title: "The Hollow Loft",
        category: "Residential",
        shortDesc: "A converted industrial warehouse loft blending exposed timber with refined architectural minimal finishes.",
        story: "Situated within a century-old industrial brick building, The Hollow Loft transforms raw structural concrete and weathered timber joists into a serene, light-filled private residence. High ceilings and custom steel-framed glass partitions establish distinct living zones while preserving sweeping spatial transparency.",
        colorHex: "#3E3730",
        labelSvg: "THE HOLLOW LOFT — CONVERTED LOFT RESIDENCE",
        galleryLabels: ["Loft Living Space & High Ceilings", "Custom Timber & Steel Partition", "Minimalist Kitchen & Raw Stone"],
        journalTitle: "Design Study: Transforming Industrial Heritage into Warm Residential Luxury",
        articleHtml: `
          <h3>Spatial Architecture &amp; Light Flow</h3>
          <p>Converting industrial volumes into intimate residential sanctuaries demands delicate balance between raw structural preservation and soft tactile comfort. In The Hollow Loft project, Saajvan Design Studio prioritized natural light penetration through multi-pane arched windows, utilizing warm terracotta and smoked oak to soften double-height brick surfaces.</p>
          <div class="journal-quote">"True architectural luxury relies not on modern ornamentation, but on honoring authentic structural texture through deliberate spatial restraint."</div>
          <h3>Materiality &amp; Custom Millwork</h3>
          <p>Custom cabinetry in stained walnut bridges the open kitchen and living area, concealing functional storage behind sleek, handleless panels. The kitchen island—crafted from solid hand-fluted travertine—anchors the central entertaining area.</p>
        `
      },
      {
        id: "chalkhill-townhouse",
        title: "Chalkhill Townhouse",
        category: "Residential",
        shortDesc: "Comprehensive heritage townhouse renovation honoring classical molding alongside bespoke modern brass detailing.",
        story: "A multi-story heritage residence restored with architectural reverence. Chalkhill Townhouse marries restored Victorian crown moldings and marble mantels with bespoke contemporary brass lighting, sculptural Italian seating, and custom oak chevron flooring.",
        colorHex: "#484136",
        labelSvg: "CHALKHILL TOWNHOUSE — HERITAGE RENOVATION",
        galleryLabels: ["Formal Living Room & Molding", "Bespoke Brass & Oak Kitchen", "Master Suite & Marble Bath"],
        journalTitle: "Restoration & Modernity: Harmonizing Victorian Details with Contemporary Living",
        articleHtml: `
          <h3>Preserving Architectural Heritage</h3>
          <p>Historical townhouse renovations require precision engineering to integrate modern HVAC and home automation without disrupting 19th-century plasterwork. Saajvan Design Studio collaborated with heritage craftsmen to restore original cornice detailing while carving hidden utility chases into solid masonry walls.</p>
          <div class="journal-quote">"When classic architectural heritage meets contemporary spatial planning, timeless residential harmony is born."</div>
          <h3>Material Palette &amp; Lighting Strategy</h3>
          <p>Soft cream lime wash walls and deep brass accent fixtures bounce warm evening light across rich herringbone floorboards.</p>
        `
      },
      {
        id: "amara-showroom",
        title: "Amara Showroom",
        category: "Commercial",
        shortDesc: "A flagship gallery and interactive experience center designed for a premier luxury architectural surfaces brand.",
        story: "Designed as an immersive monolithic sculpture, Amara Showroom showcases high-end porcelain and natural stone surfaces through gallery-style architectural pods. Visitors experience materials in natural and controlled lighting conditions across dynamic spatial walkthroughs.",
        colorHex: "#2E3B34",
        labelSvg: "AMARA SHOWROOM — COMMERCIAL GALLERY",
        galleryLabels: ["Monolithic Surface Pods", "Natural Light Exhibition Corridor", "Private Client Lounge & Consultation"],
        journalTitle: "Commercial Spatial Strategy: Creating Immersive Retail Experiences",
        articleHtml: `
          <h3>Architecture as Product Showcase</h3>
          <p>Traditional surface retail relies on static tile racks. Saajvan Design Studio re-imagined the retail environment as a series of walkable architectural pavilions, allowing architects and interior designers to perceive scale, light reflection, and tactile texture in true-to-life environments.</p>
          <div class="journal-quote">"Commercial design should elevate products into works of art, creating emotional connection between customer and material."</div>
        `
      },
      {
        id: "birch-bay-cafe",
        title: "Birch & Bay Café",
        category: "Hospitality",
        shortDesc: "An organic neighbourhood bistro featuring curved terracotta bar counters, tactile plaster, and warm rattan.",
        story: "Birch & Bay Café brings Scandinavian warmth and Mediterranean craft together. Featuring a hand-rendered Venetian plaster facade, custom curved terracotta espresso bar, and intimate banquette seating tucked under warm timber alcoves.",
        colorHex: "#543C2E",
        labelSvg: "BIRCH & BAY CAFÉ — HOSPITALITY INTERIOR",
        galleryLabels: ["Curved Terracotta Espresso Bar", "Custom Wood & Linen Banquettes", "Sunlit Outdoor Courtyard Dining"],
        journalTitle: "Hospitality Concept Design: Crafting Tactile & Social Neighbourhood Dining Spaces",
        articleHtml: `
          <h3>Flow, Operations &amp; Customer Journey</h3>
          <p>Successful cafe architecture optimizes high-speed morning take-away circulation without disrupting afternoon seated diners. Saajvan Design Studio engineered a dual-flow entrance pathway anchored by a central curved bar unit.</p>
          <div class="journal-quote">"Hospitality spaces thrive when acoustic comfort, tactile natural materials, and seamless service flow converge."</div>
        `
      },
      {
        id: "pinecrest-retreat",
        title: "Pinecrest Retreat",
        category: "Hospitality",
        shortDesc: "A secluded mountain eco-resort villa integrating floor-to-ceiling glass, charred cedar cladding, and stone fireplaces.",
        story: "Perched high amidst a dense pine forest, Pinecrest Retreat offers guests immersive connection with surrounding nature. Charred Shou Sugi Ban timber siding and expansive panoramic glazing framing untouched mountain landscapes.",
        colorHex: "#394336",
        labelSvg: "PINECREST RETREAT — LUXURY MOUNTAIN RESORT",
        galleryLabels: ["Panoramic Mountain Lounge", "Charred Timber & Stone Exterior", "Minimal Spa Bathroom & Fireplace"],
        journalTitle: "Biophilic Architecture: Integrating Mountain Ecosystems into Luxury Hospitality",
        articleHtml: `
          <h3>Site Integration &amp; Low-Impact Construction</h3>
          <p>Nestled onto a steep slope, Pinecrest Retreat minimizes ground disruption through elevated steel pier foundations. The exterior envelope features locally sourced cedar charred using ancient Shou Sugi Ban techniques for natural weather resistance.</p>
          <div class="journal-quote">"Biophilic design connects human wellness with forest topography through unobstructed visual frames and natural materials."</div>
        `
      },
      {
        id: "verge-fitness-studio",
        title: "Verge Fitness Studio",
        category: "Commercial",
        shortDesc: "A high-performance boutique fitness & movement sanctuary defined by ambient linear lighting and micro-cement walls.",
        story: "Verge Fitness Studio redefines boutique athletic spaces through moody architectural elegance. Smoked mirror reflections, warm linear LED lighting bands, micro-cement flooring, and acoustic timber ceiling ribbons.",
        colorHex: "#2C2E33",
        labelSvg: "VERGE FITNESS STUDIO — BOUTIQUE ATHLETIC SPACE",
        galleryLabels: ["Movement Studio & Ambient LEDs", "Custom Recovery Bar & Reception", "Luxury Locker Rooms & Rain Showers"],
        journalTitle: "Architectural Atmosphere in Athletic Wellness: Sensory & Acoustic Design",
        articleHtml: `
          <h3>Atmospheric Lighting &amp; Motivation</h3>
          <p>Diverging from harsh traditional gym fluorescents, Verge Fitness Studio utilizes indirect perimeter LED channels that transition dynamically in color temperature—from energizing morning daylight to calming evening amber tones.</p>
          <div class="journal-quote">"Athletic architecture should inspire physical focus through sensory lighting, clean air flow, and acoustic rhythm."</div>
        `
      }
    ];

    const projectsGrid = document.getElementById('projectsGrid');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectModal = document.getElementById('projectModal');
    const modalBackBtn = document.getElementById('modalBackBtn');
    const lightboxModal = document.getElementById('lightboxModal');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxContent = document.getElementById('lightboxContent');

    if (!projectsGrid) return;

    function generatePlaceholderSvg(title, category, colorHex) {
      const svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600" preserveAspectRatio="none">
          <rect width="800" height="600" fill="${colorHex}"/>
          <pattern id="grid_${Math.random().toString(36).substr(2, 5)}" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
          </pattern>
          <rect width="800" height="600" fill="url(#grid)"/>
          <circle cx="400" cy="300" r="180" fill="none" stroke="rgba(185,131,74,0.2)" stroke-width="2"/>
          <text x="50%" y="46%" dominant-baseline="middle" text-anchor="middle" fill="#B9834A" font-family="Cormorant Garamond, serif" font-size="20" font-weight="700" letter-spacing="4">${category.toUpperCase()}</text>
          <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#FFFFFF" font-family="Poppins, sans-serif" font-size="28" font-weight="700" letter-spacing="2">${title.toUpperCase()}</text>
          <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-family="Inter, sans-serif" font-size="13">[ PHOTO PLACEHOLDER — SWAP IN REAL IMAGE ]</text>
        </svg>
      `;
      return 'data:image/svg+xml;utf8,' + encodeURIComponent(svgString);
    }

    function renderProjects(filter = 'all') {
      projectsGrid.innerHTML = '';
      const filtered = filter === 'all' 
        ? SAAJVAN_PROJECTS 
        : SAAJVAN_PROJECTS.filter(p => p.category.toLowerCase() === filter.toLowerCase());

      filtered.forEach(project => {
        const placeholderImg = generatePlaceholderSvg(project.title, project.category, project.colorHex);

        const card = document.createElement('article');
        card.className = 'project-card';
        card.setAttribute('data-id', project.id);
        card.innerHTML = `
          <div class="project-media">
            <img src="${placeholderImg}" alt="${project.title}" class="placeholder-svg" loading="lazy">
          </div>
          <div class="project-card-overlay">
            <div class="project-cat-badge">${project.category}</div>
            <h3 class="project-card-title">${project.title}</h3>
            <p class="project-card-desc">${project.shortDesc}</p>
          </div>
          <button type="button" class="btn-explore" aria-label="Explore ${project.title}">
            Explore More
            <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        `;

        card.addEventListener('click', () => openProjectModal(project));
        projectsGrid.appendChild(card);
      });
    }

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderProjects(btn.dataset.filter);
      });
    });

    function openProjectModal(project) {
      if (!projectModal) return;
      const heroSvg = generatePlaceholderSvg(project.title, project.category, project.colorHex);
      
      document.getElementById('modalHeroCat').textContent = project.category;
      document.getElementById('modalHeroTitle').textContent = project.title;
      document.getElementById('modalStory').textContent = project.story;
      document.getElementById('journalTitle').textContent = project.journalTitle;
      document.getElementById('journalArticle').innerHTML = project.articleHtml;

      const heroElem = document.getElementById('modalHero');
      if (heroElem) heroElem.style.background = `url("${heroSvg}") center/cover no-repeat`;

      const galleryElem = document.getElementById('modalGallery');
      if (galleryElem) {
        galleryElem.innerHTML = '';
        project.galleryLabels.forEach((label, idx) => {
          const itemSvg = generatePlaceholderSvg(`${project.title} — 0${idx+1}`, project.category, project.colorHex);
          const item = document.createElement('div');
          item.className = 'gallery-item';
          item.innerHTML = `<img src="${itemSvg}" alt="${label}">`;
          item.addEventListener('click', () => openLightbox(itemSvg));
          galleryElem.appendChild(item);
        });
      }

      projectModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    if (modalBackBtn) {
      modalBackBtn.addEventListener('click', () => {
        if (projectModal) projectModal.classList.remove('active');
        document.body.style.overflow = 'auto';
      });
    }

    function openLightbox(src) {
      if (!lightboxModal || !lightboxContent) return;
      lightboxContent.innerHTML = `<img src="${src}" style="max-width:100%; max-height:80vh; display:block; margin:0 auto; border:1px solid var(--saaj-gold);">`;
      lightboxModal.classList.add('active');
    }
    if (lightboxClose) lightboxClose.addEventListener('click', () => lightboxModal.classList.remove('active'));
    if (lightboxModal) {
      lightboxModal.addEventListener('click', (e) => {
        if (e.target === lightboxModal) lightboxModal.classList.remove('active');
      });
    }

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

    const openModal = () => {
      clearActiveTimer();
      if (isPermanentlySubmitted() || isSessionDismissed()) return;
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
        timerId = setTimeout(openModal, 15000);
      } else if (closeCount === 2) {
        // Closed Popup #2 -> Start 60-second timer for Popup #3
        timerId = setTimeout(openModal, 60000);
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
        timerId = setTimeout(openModal, 15000);
      } else if (currentCloseCount === 2) {
        // Visitor navigated after closing Popup #2 -> Wait 60 seconds for Popup #3
        timerId = setTimeout(openModal, 60000);
      } else if (currentCloseCount === 0) {
        // First visit -> Wait 20 seconds for Popup #1
        timerId = setTimeout(openModal, 20000);
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
