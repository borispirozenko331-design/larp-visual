(() => {
  'use strict';

  const body = document.body;
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#site-nav');
  const mobileQuery = window.matchMedia('(max-width: 760px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function closeMenu() {
    body.classList.remove('menu-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Открыть меню');
  }

  menuButton.addEventListener('click', () => {
    const opened = !body.classList.contains('menu-open');
    body.classList.toggle('menu-open', opened);
    menuButton.setAttribute('aria-expanded', String(opened));
    menuButton.setAttribute('aria-label', opened ? 'Закрыть меню' : 'Открыть меню');
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });
  mobileQuery.addEventListener('change', event => {
    if (!event.matches) closeMenu();
  });

  const soundToggle = document.querySelector('.sound-toggle');
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  let audioContext;
  let soundEnabled = true;
  try {
    soundEnabled = localStorage.getItem('larp-site-sound') !== 'off';
  } catch {}

  function updateSoundToggle() {
    soundToggle.setAttribute('aria-pressed', String(soundEnabled));
    soundToggle.setAttribute('aria-label', soundEnabled ? 'Выключить звуки сайта' : 'Включить звуки сайта');
    soundToggle.querySelector('.sound-label').textContent = soundEnabled ? 'Звук включён' : 'Звук выключен';
  }

  function playClickSound(primary = false) {
    if (!soundEnabled || !AudioContextClass) return;
    try {
      audioContext ||= new AudioContextClass();
      if (audioContext.state === 'suspended') void audioContext.resume().catch(() => {});
      const now = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(primary ? 780 : 560, now);
      oscillator.frequency.exponentialRampToValueAtTime(primary ? 1040 : 690, now + 0.085);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(primary ? 0.027 : 0.018, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.12);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    } catch {}
  }

  updateSoundToggle();
  soundToggle.addEventListener('click', event => {
    event.stopPropagation();
    soundEnabled = !soundEnabled;
    try { localStorage.setItem('larp-site-sound', soundEnabled ? 'on' : 'off'); } catch {}
    updateSoundToggle();
    if (event.isTrusted && soundEnabled) playClickSound();
  });
  document.addEventListener('click', event => {
    if (!event.isTrusted) return;
    const control = event.target.closest('.button, .header-link, .site-nav a, .text-link, .brand, .menu-toggle, .faq-list summary, .site-footer>a:last-child');
    if (control) playClickSound(control.classList.contains('button-primary'));
  });

  const reveals = [...document.querySelectorAll('.reveal, .reveal-image')];
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px 35px 0px' });
    reveals.forEach(element => observer.observe(element));
    body.classList.add('motion-ready');
  } else {
    reveals.forEach(element => element.classList.add('is-visible'));
  }

  const hero = document.querySelector('.hero');
  const introVisual = document.querySelector('.intro-visual');
  const visualPreview = document.querySelector('.visual-preview');
  const closing = document.querySelector('.closing');
  const hoverPointer = window.matchMedia('(hover: hover)');
  let pointerX = 0;
  let pointerY = 0;
  let motionFrame = 0;

  function centerProgress(element) {
    const rect = element.getBoundingClientRect();
    return Math.max(-1, Math.min(1, (window.innerHeight / 2 - (rect.top + rect.height / 2)) / window.innerHeight));
  }

  function updateMotion() {
    motionFrame = 0;
    const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    document.documentElement.style.setProperty('--page-progress', Math.min(1, Math.max(0, window.scrollY / scrollable)).toFixed(4));
    if (reducedMotion.matches) {
      hero.style.setProperty('--hero-x', '0px');
      hero.style.setProperty('--hero-y', '0px');
      introVisual.style.setProperty('--intro-y', '0px');
      visualPreview.style.setProperty('--preview-y', '0px');
      closing.style.setProperty('--closing-y', '0px');
      return;
    }
    const heroShift = Math.max(-44, Math.min(20, -window.scrollY * 0.07));
    hero.style.setProperty('--hero-x', `${(pointerX * 11).toFixed(1)}px`);
    hero.style.setProperty('--hero-y', `${(heroShift + pointerY * 8).toFixed(1)}px`);
    introVisual.style.setProperty('--intro-y', `${(centerProgress(introVisual) * 28).toFixed(1)}px`);
    visualPreview.style.setProperty('--preview-y', `${(centerProgress(visualPreview) * 26).toFixed(1)}px`);
    closing.style.setProperty('--closing-y', `${(centerProgress(closing) * 33).toFixed(1)}px`);
  }

  function requestMotionUpdate() {
    if (!motionFrame) motionFrame = requestAnimationFrame(updateMotion);
  }

  window.addEventListener('scroll', requestMotionUpdate, { passive: true });
  window.addEventListener('resize', requestMotionUpdate, { passive: true });
  window.addEventListener('pointermove', event => {
    if (!hoverPointer.matches || reducedMotion.matches) return;
    pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
    pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
    requestMotionUpdate();
  }, { passive: true });
  reducedMotion.addEventListener('change', requestMotionUpdate);
  requestMotionUpdate();

  document.querySelectorAll('.detail-card').forEach(card => {
    card.addEventListener('pointermove', event => {
      if (!hoverPointer.matches || reducedMotion.matches) return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty('--tilt-x', `${(-y * 4).toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${(x * 4).toFixed(2)}deg`);
    }, { passive: true });
    card.addEventListener('pointerleave', () => {
      card.style.removeProperty('--tilt-x');
      card.style.removeProperty('--tilt-y');
    });
  });

  const canvas = document.querySelector('#snow');
  const context = canvas.getContext('2d');
  if (!context) return;
  let width = 0;
  let height = 0;
  let flakes = [];
  let frame = 0;
  let previousTime = 0;
  let snowTime = 0;

  function newFlake(startAnywhere = true) {
    const depth = Math.random();
    return {
      x: Math.random() * (width + 20) - 10,
      y: startAnywhere ? Math.random() * height : -8,
      radius: 0.6 + depth * 1.35,
      speed: 11 + depth * 33,
      drift: 3 + depth * 13,
      alpha: 0.18 + depth * 0.4,
      phase: Math.random() * Math.PI * 2,
      wobble: 1.5 + Math.random() * 3,
      depth
    };
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.min(70, Math.max(26, Math.round(width * height / 23000)));
    flakes = Array.from({ length: count }, () => newFlake());
    draw(0);
  }

  function draw(delta) {
    context.clearRect(0, 0, width, height);
    snowTime += delta;
    const gust = Math.sin(snowTime * 0.32) * 10 + Math.sin(snowTime * 0.79) * 4;
    for (let i = 0; i < flakes.length; i++) {
      const flake = flakes[i];
      flake.x += (flake.drift + gust * (0.35 + flake.depth)) * delta;
      flake.y += flake.speed * delta;
      if (flake.y > height + 8 || flake.x > width + 8 || flake.x < -12) {
        flakes[i] = newFlake(false);
        continue;
      }
      context.beginPath();
      context.fillStyle = `rgba(238,247,255,${flake.alpha})`;
      context.arc(flake.x + Math.sin(snowTime * flake.wobble + flake.phase) * 1.4, flake.y, flake.radius, 0, Math.PI * 2);
      context.fill();
    }
  }

  function tick(time) {
    const delta = Math.min((time - (previousTime || time)) / 1000, 0.04);
    previousTime = time;
    draw(delta);
    frame = requestAnimationFrame(tick);
  }

  function syncMotion() {
    cancelAnimationFrame(frame);
    previousTime = 0;
    if (!reducedMotion.matches && !document.hidden) frame = requestAnimationFrame(tick);
    else draw(0);
  }

  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', syncMotion);
  reducedMotion.addEventListener('change', syncMotion);
  resize();
  syncMotion();
})();
