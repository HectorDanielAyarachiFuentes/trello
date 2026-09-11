/**
 * app.js – Tab switching logic + Responsive UX & About modal audio controls
 */

const TABS = ['pdf', 'video', 'trello'];

/**
 * Switches the active tab and its corresponding panel.
 * @param {string} name - 'pdf' | 'video' | 'trello'
 */
function switchTab(name) {
  if (!TABS.includes(name)) return;

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
    btn.focus();
  }
  if (panel) {
    panel.classList.add('active');
  }

  // Pause video when switching away from video tab
  if (name !== 'video') {
    const video = document.querySelector('.video-player');
    if (video && !video.paused) {
      video.pause();
    }
  }
}

/* ============================================================
   ABOUT MODAL & AUDIO LOGIC
   ============================================================ */

function openAbout() {
  const overlay = document.getElementById('about-overlay');
  if (!overlay) return;

  overlay.classList.add('open');

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

  // Pause audio on close
  const audio = document.getElementById('about-audio');
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
  syncAudioUI(false);
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
  const videoOverlay = document.getElementById('video-play-overlay');

  if (video && videoOverlay) {
    video.addEventListener('play', () => {
      videoOverlay.classList.add('hidden');
    });
    video.addEventListener('pause', () => {
      videoOverlay.classList.remove('hidden');
    });
    video.addEventListener('ended', () => {
      videoOverlay.classList.remove('hidden');
    });
  }
});

/* ============================================================
   MAIN VIDEO CONTROLLER
   ============================================================ */
function toggleMainVideo() {
  const video = document.getElementById('main-video');
  if (!video) return;

  if (video.paused) {
    video.play();
  } else {
    video.pause();
  }
}

/* ============================================================
   KEYBOARD NAVIGATION & ACCESSIBILITY
   ============================================================ */
document.addEventListener('keydown', (e) => {
  // ESC to close modal
  if (e.key === 'Escape') {
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

