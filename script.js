// ===== CAPRICCIO - Main JavaScript =====

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileMenu();
  initScrollAnimations();
  initCounterAnimation();
  initActiveNavHighlight();
  initSmoothScroll();
  initBackToTop();
});

// ===== HEADER SCROLL EFFECT =====
function initHeader() {
  const header = document.getElementById('header');
  let lastScrollY = 0;
  let ticking = false;

  function updateHeader() {
    const scrollY = window.scrollY;
    
    if (scrollY > 80) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    lastScrollY = scrollY;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateHeader);
      ticking = true;
    }
  });

  // Initial check
  updateHeader();
}

// ===== MOBILE MENU =====
function initMobileMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');

  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    navLinks.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });

  // Close menu on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Close menu on outside click
  document.addEventListener('click', (e) => {
    if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
      menuToggle.classList.remove('active');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
}

// ===== SCROLL ANIMATIONS =====
function initScrollAnimations() {
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -80px 0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        
        // Stagger animation for siblings
        const parent = entry.target.parentElement;
        if (parent) {
          const siblings = parent.querySelectorAll('.animate-on-scroll');
          siblings.forEach((sibling, index) => {
            if (sibling.classList.contains('visible')) {
              sibling.style.transitionDelay = `${index * 0.1}s`;
            }
          });
        }
      }
    });
  }, observerOptions);

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
  });
}

// ===== COUNTER ANIMATION =====
function initCounterAnimation() {
  const counters = document.querySelectorAll('.stat-number[data-target]');
  let animated = false;

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.5
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animated) {
        animated = true;
        animateCounters(counters);
      }
    });
  }, observerOptions);

  if (counters.length > 0) {
    observer.observe(counters[0].closest('.stats-bar'));
  }
}

function animateCounters(counters) {
  counters.forEach(counter => {
    const target = parseInt(counter.getAttribute('data-target'));
    const duration = 2000; // 2 seconds
    const start = 0;
    const startTime = performance.now();

    function updateCounter(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (target - start) * easeOut);

      counter.textContent = current + (target >= 100 ? '+' : '+');

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        counter.textContent = target + (target === 100 ? '%' : '+');
      }
    }

    requestAnimationFrame(updateCounter);
  });
}

// ===== ACTIVE NAV HIGHLIGHT =====
function initActiveNavHighlight() {
  const sections = document.querySelectorAll('section[id], .hero[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -60% 0px',
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => {
    observer.observe(section);
  });
}

// ===== SMOOTH SCROLL =====
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// ===== BACK TO TOP =====
function initBackToTop() {
  const backToTop = document.getElementById('backToTop');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  });
}

// ===== LIGHTBOX =====
function openLightbox(element) {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const img = element.querySelector('img');

  lightboxImg.src = img.src;
  lightboxImg.alt = img.alt;
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
}

// Close lightbox with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeLightbox();
  }
});

// ===== FORM HANDLER =====
function handleFormSubmit(event) {
  event.preventDefault();

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;
  const eventType = document.getElementById('event').value;
  const message = document.getElementById('message').value;

  // Build WhatsApp message
  let whatsappMessage = `Olá! Meu nome é ${name}.%0A`;
  if (email) whatsappMessage += `E-mail: ${email}%0A`;
  if (phone) whatsappMessage += `Telefone: ${phone}%0A`;
  if (eventType) whatsappMessage += `Tipo de evento: ${eventType}%0A`;
  if (message) whatsappMessage += `%0AMensagem: ${message}`;

  // Open WhatsApp with message
  window.open(`https://wa.me/5514999999999?text=${whatsappMessage}`, '_blank');

  // Show success feedback
  const btn = event.target.querySelector('button[type="submit"]');
  const originalHTML = btn.innerHTML;
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
    Mensagem Enviada!
  `;
  btn.style.background = '#25D366';

  setTimeout(() => {
    btn.innerHTML = originalHTML;
    btn.style.background = '';
    event.target.reset();
  }, 3000);
}

// ===== PARALLAX EFFECT (subtle) =====
window.addEventListener('scroll', () => {
  const heroBg = document.querySelector('.hero-bg img');
  if (heroBg && window.innerWidth > 768) {
    const scrolled = window.scrollY;
    heroBg.style.transform = `scale(1.05) translateY(${scrolled * 0.15}px)`;
  }
});

// ===== CURSOR PERSONALIZADO =====
function initCustomCursor() {
  // Só ativa em desktops com mouse real
  if (window.innerWidth < 1024 || !window.matchMedia('(hover: hover)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const dot  = document.createElement('div');
  const ring = document.createElement('div');
  dot.className  = 'cursor-dot';
  ring.className = 'cursor-ring';
  document.body.appendChild(dot);
  document.body.appendChild(ring);

  let mouseX = 0, mouseY = 0;
  let ringX  = 0, ringY  = 0;

  window.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top  = mouseY + 'px';
  });

  // Anel segue com lag suave (lerp)
  function animateRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    ring.style.left = ringX + 'px';
    ring.style.top  = ringY + 'px';
    requestAnimationFrame(animateRing);
  }
  animateRing();

  // Esconde cursor nativo quando sai da janela
  document.addEventListener('mouseleave', () => {
    dot.style.opacity  = '0';
    ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    dot.style.opacity  = '1';
    ring.style.opacity = '1';
  });
}

// ===== HOVER TILT NOS CARDS (efeito 3D CSS) =====
function initCardTilt() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cards = document.querySelectorAll('.service-card, .team-card, .gallery-item');

  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect   = card.getBoundingClientRect();
      const cx     = rect.left + rect.width  / 2;
      const cy     = rect.top  + rect.height / 2;
      const dx     = (e.clientX - cx) / (rect.width  / 2);
      const dy     = (e.clientY - cy) / (rect.height / 2);
      const tiltX  = dy * -6;   // graus
      const tiltY  = dx *  6;

      card.style.transform    = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-6px)`;
      card.style.transition   = 'transform 0.1s ease';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform  = '';
      card.style.transition = 'transform 0.4s ease';
    });
  });
}

// ===== TYPING EFEITO NO HERO (sutil) =====
function initHeroTyping() {
  const highlight = document.querySelector('.hero-title .highlight');
  if (!highlight) return;

  const words = ['Artesanais', 'Irresistíveis', 'com Tradição', 'com Carinho'];
  let idx = 0;
  let charIdx = 0;
  let deleting = false;
  let pause = false;

  function type() {
    if (pause) return;
    const word = words[idx];

    if (!deleting) {
      highlight.textContent = word.slice(0, charIdx + 1);
      charIdx++;
      if (charIdx === word.length) {
        pause = true;
        setTimeout(() => { pause = false; deleting = true; }, 2200);
      }
    } else {
      highlight.textContent = word.slice(0, charIdx - 1);
      charIdx--;
      if (charIdx === 0) {
        deleting = false;
        idx = (idx + 1) % words.length;
      }
    }
  }

  setInterval(type, deleting ? 60 : 90);
}

// Init all enhancements
document.addEventListener('DOMContentLoaded', () => {
  initCustomCursor();
  initCardTilt();
  // Pequeno delay para garantir que o DOM está pronto
  setTimeout(initHeroTyping, 1500);
});


// ===== LOADING SCREEN =====
(function initLoadingScreen() {
  const screen = document.getElementById('loading-screen');
  const bar    = document.getElementById('loadingBar');
  const hint   = document.getElementById('loadingHint');
  if (!screen) return;

  document.body.classList.add('loading-active');

  let progress  = 0;
  let dismissed = false;

  // ── Dismiss: cortinas saem, depois tela desaparece ───
  function dismiss() {
    if (dismissed) return;
    dismissed = true;

    screen.classList.add('hide');

    setTimeout(() => {
      screen.classList.add('done');
      document.body.classList.remove('loading-active');
    }, 620);

    setTimeout(() => screen.remove(), 1100);
  }

  // Tempo total da loading: 4000ms
  // Barra completa em ~1000ms, depois logo fica exibido até 4000ms
  const TOTAL_MS   = 4000; // duração total da tela
  const BAR_MS     = 1000; // em quanto tempo a barra chega a 100%
  const startTime  = performance.now();

  // ── Barra animada com duração fixa de 1s ──────────────────
  function advanceBar(now) {
    const elapsed = now - startTime;
    progress = Math.min((elapsed / BAR_MS) * 100, 100);
    bar.style.width = progress + '%';

    if (progress < 100) {
      requestAnimationFrame(advanceBar);
    } else {
      // Barra completa: exibe "Entrando..." enquanto logo segue animado
      if (hint) hint.classList.add('show');
    }
  }

  requestAnimationFrame(advanceBar);

  // Fecha exatamente após TOTAL_MS
  setTimeout(dismiss, TOTAL_MS);

  // Safety net: fecha em até 6s de qualquer forma
  setTimeout(() => { if (!dismissed) dismiss(); }, 6000);
})();

