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
async function handleFormSubmit(event) {
  event.preventDefault();

  const name      = document.getElementById('name').value.trim();
  const email     = document.getElementById('email').value.trim();
  const phone     = document.getElementById('phone').value.trim();
  const eventType = document.getElementById('event').value.trim();
  const message   = document.getElementById('message').value.trim();

  const btn         = event.target.querySelector('button[type="submit"]');
  const originalHTML = btn.innerHTML;

  // Feedback visual de carregamento
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" style="animation:spin 1s linear infinite"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> Gerando PDF...`;
  btn.disabled = true;

  // ── Gera o PDF com jsPDF ─────────────────────────────────
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const now = new Date().toLocaleString('pt-BR');

    // Fundo marrom escuro no topo
    doc.setFillColor(44, 24, 16);
    doc.rect(0, 0, 210, 45, 'F');

    // Título
    doc.setTextColor(197, 151, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.text('Capriccio', 105, 20, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(232, 213, 163);
    doc.text('Salgados & Doces Artesanais — Jaú/SP', 105, 29, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(180, 150, 100);
    doc.text('SOLICITAÇÃO DE ORÇAMENTO', 105, 38, { align: 'center' });

    // Linha dourada decorativa
    doc.setDrawColor(197, 151, 59);
    doc.setLineWidth(0.5);
    doc.line(20, 48, 190, 48);

    // Data
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120, 90, 60);
    doc.text(`Gerado em: ${now}`, 20, 55);

    // Dados do cliente
    doc.setFillColor(252, 248, 240);
    doc.roundedRect(20, 62, 170, 8, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(44, 24, 16);
    doc.text('DADOS DO CLIENTE', 25, 68);

    const campos = [
      ['Nome',          name],
      ['E-mail',        email     || '—'],
      ['Telefone',      phone     || '—'],
      ['Tipo de Evento',eventType || '—'],
    ];

    let y = 78;
    campos.forEach(([label, valor]) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(197, 151, 59);
      doc.text(label + ':', 25, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 30, 15);
      doc.text(valor, 65, y);
      y += 10;
    });

    // Mensagem
    if (message) {
      y += 4;
      doc.setFillColor(252, 248, 240);
      doc.roundedRect(20, y, 170, 8, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(44, 24, 16);
      doc.text('MENSAGEM / DETALHES DO PEDIDO', 25, y + 6);
      y += 16;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(50, 30, 15);
      const linhas = doc.splitTextToSize(message, 160);
      doc.text(linhas, 25, y);
      y += linhas.length * 6;
    }

    // Rodapé
    doc.setDrawColor(197, 151, 59);
    doc.setLineWidth(0.3);
    doc.line(20, 272, 190, 272);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 110, 70);
    doc.text('Capriccio Salgados e Doces Artesanais  •  Jaú - SP  •  (14) 99651-4970', 105, 278, { align: 'center' });
    doc.text('instagram.com/capricciosalgadosedoces', 105, 284, { align: 'center' });

    // Faz download do PDF
    doc.save(`orcamento-capriccio-${name.replace(/\s+/g, '-').toLowerCase()}.pdf`);

  } catch (err) {
    console.warn('jsPDF não disponível, seguindo sem PDF:', err);
  }

  // ── Monta mensagem WhatsApp ───────────────────────────────
  const linhas = [
    '🍬 *Solicitação de Orçamento — Capriccio*',
    '',
    `👤 *Nome:* ${name}`,
    email     ? `📧 *E-mail:* ${email}`          : null,
    phone     ? `📱 *Telefone:* ${phone}`         : null,
    eventType ? `🎉 *Tipo de evento:* ${eventType}` : null,
    message   ? `\n💬 *Mensagem:*\n${message}`    : null,
    '',
    '_Orçamento gerado pelo site Capriccio_',
  ].filter(l => l !== null).join('\n');

  const url = `https://wa.me/5514996514970?text=${encodeURIComponent(linhas)}`;

  // Pequena pausa para o PDF baixar antes de abrir o WhatsApp
  setTimeout(() => {
    window.open(url, '_blank');

    // Feedback de sucesso
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Enviado!`;
    btn.style.background = '#25D366';
    btn.disabled = false;

    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.style.background = '';
      event.target.reset();
    }, 3000);
  }, 800);
}

// ===== PARALLAX EFFECT (subtle) =====
window.addEventListener('scroll', () => {
  const heroBg = document.querySelector('.hero-bg img');
  if (heroBg && window.innerWidth > 768) {
    const scrolled = window.scrollY;
    heroBg.style.transform = `scale(1.05) translateY(${scrolled * 0.15}px)`;
  }
});

// ===== CURSOR PERSONALIZADO — brigadeiro dourado =====
function initCustomCursor() {
  if (window.innerWidth < 1024 || !window.matchMedia('(hover: hover)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // SVG de um brigadeiro visto de cima (bolinha com laço e granulado)
  const brigadeiro = `
    <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 38 38">
      <!-- Sombra -->
      <ellipse cx="20" cy="30" rx="9" ry="3" fill="rgba(0,0,0,0.18)"/>
      <!-- Corpo do brigadeiro -->
      <circle cx="19" cy="19" r="12" fill="url(#bg)"/>
      <!-- Granulado (bolinhas de chocolate) -->
      <circle cx="14" cy="15" r="1.2" fill="#5C2E00" opacity="0.7"/>
      <circle cx="19" cy="12" r="1.2" fill="#5C2E00" opacity="0.7"/>
      <circle cx="24" cy="15" r="1.2" fill="#5C2E00" opacity="0.7"/>
      <circle cx="25" cy="21" r="1.2" fill="#5C2E00" opacity="0.7"/>
      <circle cx="21" cy="25" r="1.2" fill="#5C2E00" opacity="0.7"/>
      <circle cx="15" cy="23" r="1.2" fill="#5C2E00" opacity="0.7"/>
      <circle cx="12" cy="19" r="1.1" fill="#5C2E00" opacity="0.6"/>
      <circle cx="22" cy="18" r="1.0" fill="#5C2E00" opacity="0.5"/>
      <circle cx="17" cy="19" r="1.0" fill="#5C2E00" opacity="0.5"/>
      <!-- Brilho -->
      <ellipse cx="15" cy="14" rx="3.5" ry="2" fill="rgba(255,248,200,0.35)" transform="rotate(-20 15 14)"/>
      <!-- Palito -->
      <rect x="18.2" y="4" width="2" height="10" rx="1" fill="#C5973B"/>
      <rect x="17.5" y="3" width="3.5" height="2" rx="1" fill="#E8D5A3"/>
      <!-- Defs -->
      <defs>
        <radialGradient id="bg" cx="40%" cy="35%" r="65%">
          <stop offset="0%"   stop-color="#C5973B"/>
          <stop offset="55%"  stop-color="#8B5E1A"/>
          <stop offset="100%" stop-color="#5C3310"/>
        </radialGradient>
      </defs>
    </svg>
  `;

  const cursor = document.createElement('div');
  cursor.className = 'cursor-candy';
  cursor.innerHTML = brigadeiro;
  document.body.appendChild(cursor);

  let isHover = false;

  window.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
  });

  // Hover em links e botões: gira o brigadeiro
  document.addEventListener('mouseover', e => {
    if (e.target.closest('a, button, .service-card, .gallery-item, .team-card')) {
      isHover = true;
      cursor.classList.add('cursor-candy--hover');
    }
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest('a, button, .service-card, .gallery-item, .team-card')) {
      isHover = false;
      cursor.classList.remove('cursor-candy--hover');
    }
  });

  // Click: comprime
  document.addEventListener('mousedown', () => cursor.classList.add('cursor-candy--click'));
  document.addEventListener('mouseup',   () => cursor.classList.remove('cursor-candy--click'));

  document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { cursor.style.opacity = '1'; });
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
  let dismissed = false;

  // ── Fecha a tela com fade simples ────────────────────────
  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    screen.style.transition = 'opacity 0.6s ease';
    screen.style.opacity    = '0';
    document.body.classList.remove('loading-active');
    setTimeout(() => screen.remove(), 700);
  }

  // ── Barra: completa em 800ms via CSS transition ──────────
  // Força reflow para garantir que a transition dispara
  bar.style.width = '0%';
  bar.style.transition = 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)';

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      bar.style.width = '100%';
    });
  });

  // Mostra "Entrando..." depois que a barra completar
  setTimeout(() => {
    if (hint) hint.classList.add('show');
  }, 900);

  // Fecha após 2.5s totais
  setTimeout(dismiss, 2500);
})();

