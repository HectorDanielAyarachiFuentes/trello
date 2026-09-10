/**
 * app.js – Tab switching logic
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
