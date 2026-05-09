/**
 * Namárië – toast.js
 * Sistem notifikasi toast pojok kanan atas
 * Letakkan di: public/js/toast.js
 *
 * Cara pakai:
 *   Toast.show('Pesan', 'success')   → hijau
 *   Toast.show('Pesan', 'error')     → merah
 *   Toast.show('Pesan', 'info')      → ungu (default)
 *   Toast.show('Pesan', 'warning')   → kuning
 */

const Toast = (function () {
  const DURATION = 3000; // ms

  // Buat container sekali saja
  function getContainer() {
    let c = document.getElementById('toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toast-container';
      document.body.appendChild(c);
    }
    return c;
  }

  // Icon SVG per type
  const icons = {
    success: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    info:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    warning: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  };

  function show(message, type = 'info', duration = DURATION) {
    const container = getContainer();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      ${icons[type] || icons.info}
      <span style="flex:1">${message}</span>
      <button class="toast-close" onclick="this.closest('.toast')._dismiss()">×</button>
      <div class="toast-progress" style="animation-duration:${duration}ms"></div>
    `;

    // Fungsi dismiss
    toast._dismiss = function () {
      toast.classList.add('hide');
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 350);
    };

    container.appendChild(toast);

    // Trigger animasi masuk (butuh 1 frame delay)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('show'));
    });

    // Auto dismiss
    const timer = setTimeout(() => toast._dismiss(), duration);

    // Pause progress saat hover
    toast.addEventListener('mouseenter', () => {
      clearTimeout(timer);
      const bar = toast.querySelector('.toast-progress');
      if (bar) bar.style.animationPlayState = 'paused';
    });
    toast.addEventListener('mouseleave', () => {
      const bar = toast.querySelector('.toast-progress');
      if (bar) bar.style.animationPlayState = 'running';
      setTimeout(() => toast._dismiss(), 1500);
    });

    return toast;
  }

  // Shortcut methods
  return {
    show,
    success: (msg) => show(msg, 'success'),
    error:   (msg) => show(msg, 'error'),
    info:    (msg) => show(msg, 'info'),
    warning: (msg) => show(msg, 'warning'),
  };
})();

// Expose global showToast agar kompatibel dengan kode lama
window.showToast = function (msg, type = 'info') {
  Toast.show(msg, type);
};