/**
 * app.js – Tab switching logic + Responsive UX & About modal audio controls
 */

const TABS = ['pdf', 'video', 'trello'];

let isPipManualClosed = false;
let aboutTrigger = null;

/**
 * Switches the active tab and its corresponding panel.
 * Si el video está reproduciéndose, se minimiza a PiP flotante al salir de la pestaña video.
 * @param {string} name - 'pdf' | 'video' | 'trello'
 */
function switchTab(name) {
  if (!TABS.includes(name)) return;

  const video = document.getElementById('main-video');
  const panelVideo = document.getElementById('panel-video');

  // Deactivate all buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
    btn.setAttribute('aria-selected', 'false');
  });

  // Activate selected button
  const btn = document.getElementById('tab-' + name);
  if (btn) {
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    btn.focus();
  }

  // Deactivate other panels
  document.querySelectorAll('.panel').forEach(panel => {
    if (panel.id !== 'panel-video') {
      panel.classList.remove('active');
    }
  });

  const selectedPanel = document.getElementById('panel-' + name);

  if (name === 'video') {
    // Return video to normal full mode
    if (panelVideo) {
      panelVideo.classList.remove('pip-active');
      panelVideo.classList.add('active');
      // Reset drag styles so it fits back into normal layout
      panelVideo.style.left = '';
      panelVideo.style.top = '';
      panelVideo.style.right = '';
      panelVideo.style.bottom = '';
    }
    isPipManualClosed = false;
  } else {
    // Activating PDF or Trello panel
    if (selectedPanel) {
      selectedPanel.classList.add('active');
    }

    if (panelVideo) {
      panelVideo.classList.remove('active');

      // If video is currently playing, keep it alive in Picture-in-Picture!
      if (video && !video.paused && !isPipManualClosed) {
        panelVideo.classList.add('pip-active');
      } else {
        panelVideo.classList.remove('pip-active');
        panelVideo.style.left = '';
        panelVideo.style.top = '';
        panelVideo.style.right = '';
        panelVideo.style.bottom = '';
      }
    }
  }
}

/**
 * Cierra manualmente el mini reproductor PiP y pausa el video
 */
function closePip() {
  const video = document.getElementById('main-video');
  const panelVideo = document.getElementById('panel-video');

  if (video) {
    video.pause();
  }
  if (panelVideo) {
    panelVideo.classList.remove('pip-active');
    panelVideo.style.left = '';
    panelVideo.style.top = '';
    panelVideo.style.right = '';
    panelVideo.style.bottom = '';
  }
  isPipManualClosed = true;
}

/* ============================================================
   ABOUT MODAL & AUDIO LOGIC
   ============================================================ */

function openAbout() {
  const overlay = document.getElementById('about-overlay');
  const modal = document.getElementById('about-modal');
  if (!overlay) return;

  aboutTrigger = document.activeElement;
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('dialog-open');
  if (modal) modal.focus();

  // Play audio on opening modal
  const audio = document.getElementById('about-audio');
  if (audio) {
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => syncAudioUI(true))
        .catch(() => {
          // Autoplay restricted by browser policy until user interacts
          syncAudioUI(false);
        });
    }
  }
}

function closeAbout() {
  const overlay = document.getElementById('about-overlay');
  if (!overlay) return;

  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('dialog-open');

  // Pause audio on close
  const audio = document.getElementById('about-audio');
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
  syncAudioUI(false);

  if (aboutTrigger && typeof aboutTrigger.focus === 'function') {
    aboutTrigger.focus();
  }
  aboutTrigger = null;
}

function closeAboutOutside(event) {
  if (event.target === document.getElementById('about-overlay')) {
    closeAbout();
  }
}

/**
 * Toggle audio playback inside modal
 */
function toggleAboutAudio() {
  const audio = document.getElementById('about-audio');
  if (!audio) return;

  if (audio.paused) {
    audio.play().then(() => syncAudioUI(true)).catch(() => syncAudioUI(false));
  } else {
    audio.pause();
    syncAudioUI(false);
  }
}

/**
 * Sync visual equalizer and action text with audio state
 * @param {boolean} isPlaying
 */
function syncAudioUI(isPlaying) {
  const eq = document.getElementById('audio-equalizer');
  const actionText = document.getElementById('audio-action-text');

  if (eq) {
    if (isPlaying) {
      eq.classList.add('playing');
    } else {
      eq.classList.remove('playing');
    }
  }

  if (actionText) {
    actionText.textContent = isPlaying ? 'Pausar' : 'Reproducir';
  }
}

// Audio & Video listeners
document.addEventListener('DOMContentLoaded', () => {
  // About modal audio
  const audio = document.getElementById('about-audio');
  if (audio) {
    audio.addEventListener('ended', () => syncAudioUI(false));
    audio.addEventListener('pause', () => syncAudioUI(false));
    audio.addEventListener('play', () => syncAudioUI(true));
  }

  // Main video player & interactive play overlay
  const video = document.getElementById('main-video');
  const panelVideo = document.getElementById('panel-video');

  if (video) {
    video.addEventListener('play', () => {
      isPipManualClosed = false;

      // Si se da play mientras estamos en otra pestaña (por ej. en PiP), asegurar que PiP esté activo
      const activeTab = document.querySelector('.tab-btn.active');
      if (activeTab && activeTab.id !== 'tab-video' && panelVideo) {
        panelVideo.classList.add('pip-active');
      }
    });

    video.addEventListener('ended', () => {
      if (panelVideo) {
        panelVideo.classList.remove('pip-active');
      }
    });
  }

  // Inicializar función de arrastre para el mini-reproductor PiP
  initDraggablePip();
});

/* ============================================================
   MAIN VIDEO CONTROLLER
   ============================================================ */
/* ============================================================
   DRAGGABLE PIP FUNCTIONALITY
   ============================================================ */
let isDraggingPip = false;
let dragStartX = 0;
let dragStartY = 0;
let pipInitialLeft = 0;
let pipInitialTop = 0;

function initDraggablePip() {
  const pipHeader = document.getElementById('pip-header');
  const panelVideo = document.getElementById('panel-video');

  if (!pipHeader || !panelVideo) return;

  function onPointerDown(e) {
    // Solo arrastrar si estamos en modo PiP
    if (!panelVideo.classList.contains('pip-active')) return;

    // Ignorar si se hace clic en botones de acción (maximizar / cerrar)
    if (e.target.closest('.pip-btn')) return;

    isDraggingPip = true;

    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

    dragStartX = clientX;
    dragStartY = clientY;

    // Obtener la posición visual actual en pantalla
    const rect = panelVideo.getBoundingClientRect();
    pipInitialLeft = rect.left;
    pipInitialTop = rect.top;

    // Cambiar a posicionamiento absoluto por left/top para permitir movimiento libre
    panelVideo.style.left = `${pipInitialLeft}px`;
    panelVideo.style.top = `${pipInitialTop}px`;
    panelVideo.style.right = 'auto';
    panelVideo.style.bottom = 'auto';

    panelVideo.classList.add('is-dragging');

    document.addEventListener('mousemove', onPointerMove, { passive: false });
    document.addEventListener('mouseup', onPointerUp);
    document.addEventListener('touchmove', onPointerMove, { passive: false });
    document.addEventListener('touchend', onPointerUp);
  }

  function onPointerMove(e) {
    if (!isDraggingPip) return;

    const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - dragStartX;
    const deltaY = clientY - dragStartY;

    if (e.cancelable) {
      e.preventDefault();
    }

    const rect = panelVideo.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Delimitar dentro de la ventana visible con margen de 10px
    const minLeft = 10;
    const maxLeft = window.innerWidth - width - 10;
    const minTop = 10;
    const maxTop = window.innerHeight - height - 10;

    let newLeft = pipInitialLeft + deltaX;
    let newTop = pipInitialTop + deltaY;

    newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));
    newTop = Math.max(minTop, Math.min(newTop, maxTop));

    panelVideo.style.left = `${newLeft}px`;
    panelVideo.style.top = `${newTop}px`;
  }

  function onPointerUp() {
    if (!isDraggingPip) return;
    isDraggingPip = false;
    panelVideo.classList.remove('is-dragging');

    document.removeEventListener('mousemove', onPointerMove);
    document.removeEventListener('mouseup', onPointerUp);
    document.removeEventListener('touchmove', onPointerMove);
    document.removeEventListener('touchend', onPointerUp);
  }

  pipHeader.addEventListener('mousedown', onPointerDown);
  pipHeader.addEventListener('touchstart', onPointerDown, { passive: true });

  // Si la ventana cambia de tamaño, mantener el mini-reproductor visible dentro de la pantalla
  window.addEventListener('resize', () => {
    if (panelVideo.classList.contains('pip-active') && panelVideo.style.left) {
      const rect = panelVideo.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        panelVideo.style.left = `${Math.max(10, window.innerWidth - rect.width - 10)}px`;
      }
      if (rect.bottom > window.innerHeight) {
        panelVideo.style.top = `${Math.max(10, window.innerHeight - rect.height - 10)}px`;
      }
    }
  });
}

/* ============================================================
   KEYBOARD NAVIGATION & ACCESSIBILITY
   ============================================================ */
document.addEventListener('keydown', (e) => {
  // ESC to close modal
  const overlay = document.getElementById('about-overlay');
  if (e.key === 'Escape' && overlay && overlay.classList.contains('open')) {
    closeAbout();
    return;
  }

  // Arrow navigation between tabs if focus is in a tab
  if (document.activeElement && document.activeElement.classList.contains('tab-btn')) {
    const currentId = document.activeElement.id.replace('tab-', '');
    const currentIndex = TABS.indexOf(currentId);

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextTab = TABS[(currentIndex + 1) % TABS.length];
      switchTab(nextTab);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevTab = TABS[(currentIndex - 1 + TABS.length) % TABS.length];
      switchTab(prevTab);
    }
  }
});
