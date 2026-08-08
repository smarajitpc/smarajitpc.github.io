document.addEventListener('DOMContentLoaded', function () {
  const navLinks = document.querySelectorAll('.nav-links a');
  const sections = {
    about: document.getElementById('about'),
    experience: document.getElementById('experience'),
    education: document.getElementById('education'),
    research: document.getElementById('research'),
    projects: document.getElementById('projects')
  };

  function showSection(key) {
    Object.keys(sections).forEach(k => {
      const el = sections[k];
      if (!el) return;
      if (key === 'experience') {
        el.style.display = (k === 'experience' || k === 'education') ? 'block' : 'none';
      } else {
        el.style.display = (k === key) ? 'block' : 'none';
      }
    });
    history.replaceState(null, '', '#' + key);
  }

  navLinks.forEach(a => {
    a.addEventListener('click', function (e) {
      const href = this.getAttribute('href') || '';
      if (!href.startsWith('#')) return; // external links behave normally
      e.preventDefault();
      const key = href.replace('#', '');
      if (['about','experience','research','projects'].includes(key)) showSection(key);
      // scroll to top of section container for accessibility
      const el = document.getElementById(key);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // initial view from hash
  const initial = (location.hash || '').replace('#','');
  showSection(['about','experience','research','projects'].includes(initial) ? initial : 'about');

  // Timeline items: click the dot to expand/collapse role details, if present
  document.querySelectorAll('.timeline-item').forEach(item => {
    const details = item.querySelector('.timeline-details-wrap');
    const dot = item.querySelector('.timeline-dot');
    if (!details || !dot) return;

    item.classList.add('has-details');
    dot.setAttribute('role', 'button');
    dot.setAttribute('tabindex', '0');
    dot.setAttribute('aria-expanded', 'false');

    function toggle() {
      const expanded = item.classList.toggle('expanded');
      dot.setAttribute('aria-expanded', String(expanded));
    }

    dot.addEventListener('click', toggle);
    dot.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  });

  // Particle network background — one independent instance per .particle-section
  function initParticleBackground(section) {
    const canvas = section.querySelector('.particle-bg');
    if (!canvas || !canvas.getContext) return;

    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let particles = [];
    let width, height, dpr;
    let rafId = null;

    const DENSITY = 5000; // px^2 per particle
    const LINK_DIST = 130;
    const SPEED = 0.18;
    const REPEL_RADIUS = 120;
    const REPEL_STRENGTH = 2.2;
    const mouse = { x: null, y: null };

    function resize() {
      const rect = section.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round((width * height) / DENSITY);
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * SPEED,
        vy: (Math.random() - 0.5) * SPEED
      }));
    }

    function step() {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        if (!reduceMotion) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;

          if (mouse.x !== null) {
            const dx = p.x - mouse.x, dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < REPEL_RADIUS && dist > 0.01) {
              const force = (REPEL_RADIUS - dist) / REPEL_RADIUS;
              p.x += (dx / dist) * force * REPEL_STRENGTH;
              p.y += (dy / dist) * force * REPEL_STRENGTH;
              p.x = Math.min(Math.max(p.x, 0), width);
              p.y = Math.min(Math.max(p.y, 0), height);
            }
          }
        }
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DIST) {
            ctx.strokeStyle = 'rgba(29, 78, 216, ' + (0.12 * (1 - dist / LINK_DIST)) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      ctx.fillStyle = 'rgba(29, 78, 216, 0.35)';
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduceMotion) rafId = requestAnimationFrame(step);
    }

    function start() {
      if (rafId) return;
      resize(); // re-measure in case the section was hidden (display:none) and just shown
      rafId = requestAnimationFrame(step);
    }
    function stop() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    }

    resize();
    step(); // draw first frame immediately (covers reduced-motion case too)

    window.addEventListener('resize', () => { resize(); if (reduceMotion) step(); });

    if (!reduceMotion) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => entry.isIntersecting ? start() : stop());
      }, { threshold: 0 });
      io.observe(section);

      section.addEventListener('mousemove', (e) => {
        const rect = section.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      });
      section.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
      });
    }
  }

  document.querySelectorAll('.particle-section').forEach(initParticleBackground);

  // Section collapse/expand (e.g. Work Experience, Education, Research, Projects)
  document.querySelectorAll('.section-toggle').forEach(btn => {
    const collapsible = btn.closest('.section-collapsible');
    if (!collapsible) return;
    const name = btn.dataset.sectionName || 'section';
    btn.addEventListener('click', () => {
      const collapsed = collapsible.classList.toggle('collapsed');
      btn.setAttribute('aria-expanded', String(!collapsed));
      btn.setAttribute('aria-label', (collapsed ? 'Expand ' : 'Collapse ') + name);
    });
  });
});
