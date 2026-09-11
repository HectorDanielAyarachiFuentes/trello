/**
 * app.js – Tab switching logic + About modal
 */

/**
 * Switches the active tab and its corresponding panel.
 * @param {string} name - 'pdf' | 'video' | 'trello'
 */
function switchTab(name) {
  // Deactivate all buttons and panels
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
    btn.setAttribute('aria-selected', 'false');
  });
  document.querySelectorAll('.panel').forEach(panel => {
    panel.classList.remove('active');
  });

  // Activate the selected button and panel
  const btn = document.getElementById('tab-' + name);
  const panel = document.getElementById('panel-' + name);

  if (btn) {
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
  }
  if (panel) {
    panel.classList.add('active');
  }

  // Pause video when switching away
  if (name !== 'video') {
    const video = document.querySelector('.video-player');
    if (video && !video.paused) video.pause();
  }
}

/* ============================================================
   ABOUT MODAL
   ============================================================ */

function openAbout() {
  const overlay = document.getElementById('about-overlay');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Play the banger 🎵
  const audio = document.getElementById('about-audio');
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(() => {/* autoplay blocked, no pasa nada */});
  }
}

function closeAbout() {
  const overlay = document.getElementById('about-overlay');
  overlay.classList.remove('open');
  document.body.style.overflow = '';

  // Pause audio on close
  const audio = document.getElementById('about-audio');
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
}

function closeAboutOutside(event) {
  // Solo cierra si se clickea el fondo (overlay), no el modal en sí
  if (event.target === document.getElementById('about-overlay')) {
    closeAbout();
  }
}

// Cerrar con ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeAbout();
});

