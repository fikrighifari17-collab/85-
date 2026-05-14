// ── Elements ──────────────────────────────────────────────────
const audio     = document.getElementById('audio-player');
const seekBar   = document.getElementById('seek-bar');
const volBar    = document.getElementById('vol-bar');
const btnPlay   = document.getElementById('btn-play');
const btnPrev   = document.getElementById('btn-prev');
const btnNext   = document.getElementById('btn-next');
const btnRepeat = document.getElementById('btn-repeat');
const btnShuffle= document.getElementById('btn-shuffle');
const nowTitle  = document.getElementById('now-playing-title');
const curTime   = document.getElementById('cur-time');
const durTime   = document.getElementById('dur-time');
const playIcon  = document.getElementById('play-icon');
const playerLike= document.getElementById('player-like');

// ── State ─────────────────────────────────────────────────────
let library    = [];   // all tracks from server (constant)
let playlist   = [];   // active playback order (dynamic)
let currentIdx = -1;   // index in playlist
let isRepeat   = false;
let isShuffle  = false;
function getLikedKey() { return 'sn_liked_' + (window.NAMARIE_USER_ID || 'guest'); }
function getStateKey() { return 'sn_state_' + (window.NAMARIE_USER_ID || 'guest'); }
let likedIds   = JSON.parse(localStorage.getItem(getLikedKey()) || '[]');
let queueList  = [];   // antrean manual [{id, title, url}]
let sessionTrackId = null;
let sessionStartTime = null;

// ── Helpers ───────────────────────────────────────────────────
function fmt(s) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}
function saveLiked()    { localStorage.setItem(getLikedKey(), JSON.stringify(likedIds)); }
function isLiked(id)    { return likedIds.includes(id); }
function _toggleLike(id) {
  likedIds = isLiked(id) ? likedIds.filter(x => x !== id) : [...likedIds, id];
  saveLiked(); refreshLikeUI(id);
}
function refreshLikeUI(id) {
  if (playerLike && playlist[currentIdx] && playlist[currentIdx].id === id)
    playerLike.classList.toggle('liked', isLiked(id));
  document.querySelectorAll('.music-like[data-id="' + id + '"]').forEach(b =>
    b.classList.toggle('liked', isLiked(id))
  );
  
  // Also update track info like button if it's for this song
  const tiLike = document.getElementById('track-info-like');
  if (tiLike && window._currentTrackId === id) {
    tiLike.classList.toggle('liked', isLiked(id));
    const label = tiLike.querySelector('.like-label');
    if (label) label.textContent = isLiked(id) ? 'Liked' : 'Like';
  }
}
function updateAllLikeButtons() {
  const allLiked = JSON.parse(localStorage.getItem(getLikedKey()) || '[]');
  document.querySelectorAll('.music-like').forEach(btn => {
    const id = parseInt(btn.dataset.id);
    btn.classList.toggle('liked', allLiked.includes(id));
  });
}
window.updateAllLikeButtons = updateAllLikeButtons;
function highlightRow(idx) {
  // highlight berdasarkan id lagu yang sedang main
  const activeId = playlist[idx] ? playlist[idx].id : null;
  document.querySelectorAll('.music-row').forEach(r => {
    r.classList.toggle('active', activeId && parseInt(r.dataset.id) === activeId);
  });
}
function setStopIcon() { 
  if (playIcon) playIcon.innerHTML = '<rect x="6" y="6" width="12" height="12" rx="2"/>'; 
  if (btnPlay) btnPlay.title = 'Stop';
  
  // Update card icons
  const activePlId = window._currentlyPlayingPlaylistId;
  document.querySelectorAll('.pl-card-play-overlay').forEach(overlay => {
    const svg = overlay.querySelector('.pl-card-play-icon-svg');
    if (svg) {
      if (parseInt(overlay.dataset.plId) === activePlId) {
        svg.innerHTML = '<rect x="6" y="6" width="12" height="12" rx="2"/>';
      } else {
        svg.innerHTML = '<path d="M8 5v14l11-7z"/>';
      }
    }
  });
}
function setPlayIcon() { 
  if (playIcon) playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>'; 
  if (btnPlay) btnPlay.title = 'Play';

  // Update card icons to play state
  document.querySelectorAll('.pl-card-play-icon-svg').forEach(svg => {
    svg.innerHTML = '<path d="M8 5v14l11-7z"/>';
  });
}

// ── State Persistence ──────────────────────────────────────────
function savePlayerState() {
  const t = playlist[currentIdx] || null;
  const state = {
    track: t,
    time: audio ? (audio.currentTime || 0) : 0,
    queue: queueList || [],
    repeat: !!isRepeat,
    shuffle: !!isShuffle,
    volume: audio ? audio.volume : 0.8,
    duration: audio ? (audio.duration || 0) : 0
  };
  localStorage.setItem(getStateKey(), JSON.stringify(state));
}

function restorePlayerState() {
  try {
    const s = JSON.parse(localStorage.getItem(getStateKey()));
    if (!s) return;
    
    queueList = s.queue || [];
    isRepeat  = !!s.repeat;
    isShuffle = !!s.shuffle;
    
    if (btnRepeat) btnRepeat.classList.toggle('active', isRepeat);
    if (btnShuffle) btnShuffle.classList.toggle('active', isShuffle);
    
    if (s.track) {
      audio.src = s.track.url;
      
      // Immediate UI sync (before metadata loads)
      if (s.duration) {
        durTime.textContent = fmt(s.duration);
        seekBar.value = (s.time / s.duration) * 100;
      }
      
      audio.addEventListener('loadedmetadata', function setTime() {
        audio.currentTime = s.time || 0;
        // Re-sync seekbar visual position when metadata is actually ready
        if (audio.duration) {
          seekBar.value = (audio.currentTime / audio.duration) * 100;
          durTime.textContent = fmt(audio.duration);
        }
        audio.removeEventListener('loadedmetadata', setTime);
      });
      
      updateNowPlayingUI(s.track);

      curTime.textContent = fmt(s.time || 0);
      playlist = [s.track];
      currentIdx = 0;
    }

    // Restore volume
    if (s.volume !== undefined) {
      audio.volume = s.volume;
      if (volBar) volBar.value = s.volume * 100;
    }

    // Update UI
    updateQueueBadge();
    if (typeof window.renderQueuePanel === 'function') window.renderQueuePanel();
  } catch(e) {}
}

restorePlayerState();

// ── Core Player ───────────────────────────────────────────────
function loadTrack(idx) {
  if (!playlist.length) return;
  currentIdx = ((idx % playlist.length) + playlist.length) % playlist.length;
  const t    = playlist[currentIdx];

  // Record previous session before changing
  if (sessionTrackId && sessionStartTime) {
    const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
    if (typeof window.recordListenDuration === 'function') {
      window.recordListenDuration(sessionTrackId, duration);
    }
  }
  sessionTrackId = t.id;
  sessionStartTime = Date.now();

  audio.src  = t.url;
  updateNowPlayingUI(t);

  highlightRow(currentIdx);
  savePlayerState();
  
  // Track play count
  if (typeof window.incrementPlayCount === 'function') {
    window.incrementPlayCount(t.id);
  }

  audio.play().catch(() => {});
}

let lastSaveTime = 0;
audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  seekBar.value       = (audio.currentTime / audio.duration) * 100;
  curTime.textContent = fmt(audio.currentTime);
  
  const now = Date.now();
  if (now - lastSaveTime > 1000) {
    savePlayerState();
    lastSaveTime = now;
  }
});
audio.addEventListener('loadedmetadata', () => { 
  durTime.textContent = fmt(audio.duration); 
  // Ensure seekbar is correct if metadata loads after restore
  if (audio.currentTime > 0 && audio.duration) {
    seekBar.value = (audio.currentTime / audio.duration) * 100;
  }
});
audio.addEventListener('play',  setStopIcon);
audio.addEventListener('pause', () => {
  setPlayIcon();
  savePlayerState(); // Save state when paused
});
audio.addEventListener('ended', () => {
  if (isRepeat) {
    audio.currentTime = 0;
    audio.play();
    
    // Matikan repeat otomatis setelah putar ulang sekali
    isRepeat = false;
    if (btnRepeat) btnRepeat.classList.remove('active');
    savePlayerState();
    return;
  }

  // Hapus lagu yang BARU SELESAI dari queueList jika itu item antrean
  const justPlayed = playlist[currentIdx];
  if (justPlayed && queueList.length > 0) {
    const qIdx = queueList.findIndex(q => q.id === justPlayed.id);
    if (qIdx >= 0) {
      queueList.splice(qIdx, 1);
      updateQueueBadge();
      if (typeof window.renderQueuePanel === 'function') window.renderQueuePanel();
    }
  }

  // Record session on end
  if (sessionTrackId && sessionStartTime) {
    const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
    if (typeof window.recordListenDuration === 'function') {
      window.recordListenDuration(sessionTrackId, duration);
    }
    sessionTrackId = null;
    sessionStartTime = null;
  }

  if (isShuffle) {
    loadTrack(Math.floor(Math.random() * playlist.length));
  } else {
    loadTrack(currentIdx + 1);
  }
});

btnPlay.addEventListener('click',  () => audio.paused ? audio.play() : audio.pause());
btnPrev.addEventListener('click',  () => audio.currentTime > 3 ? (audio.currentTime = 0) : loadTrack(currentIdx - 1));
btnNext.addEventListener('click',  () => {
  // Hapus dari antrean jika lagu sekarang adalah item antrean
  removeCurrentFromQueue();
  loadTrack(currentIdx + 1);
});
seekBar.addEventListener('input',  () => { audio.currentTime = (seekBar.value / 100) * audio.duration; savePlayerState(); });
seekBar.addEventListener('change', () => seekBar.blur());

volBar.addEventListener('input',   () => { 
  audio.volume = volBar.value / 100; 
  savePlayerState(); 
});
volBar.addEventListener('change',  () => volBar.blur());

if (btnRepeat)  btnRepeat.addEventListener('click',  () => { isRepeat  = !isRepeat;  btnRepeat.classList.toggle('active', isRepeat); savePlayerState(); });
if (btnShuffle) btnShuffle.addEventListener('click', () => { isShuffle = !isShuffle; btnShuffle.classList.toggle('active', isShuffle); savePlayerState(); });
if (playerLike) playerLike.addEventListener('click', () => { if (playlist[currentIdx]) _toggleLike(playlist[currentIdx].id); });

function removeCurrentFromQueue() {
  const current = playlist[currentIdx];
  if (!current || !queueList.length) return;
  const qIdx = queueList.findIndex(q => q.id === current.id);
  if (qIdx >= 0) {
    queueList.splice(qIdx, 1);
    updateQueueBadge();
    if (typeof window.renderQueuePanel === 'function') window.renderQueuePanel();
    savePlayerState();
  }
}

// ── Public API ────────────────────────────────────────────────
window.setPlaylist = function(list, forceFresh = false) {
  library  = list.slice();
  playlist = list.slice();
  
  const curTrack = (!forceFresh && audio.src) ? { url: audio.src, title: nowTitle.textContent } : null;
  if (curTrack) {
    let idx = playlist.findIndex(t => t.url === curTrack.url || t.url === new URL(curTrack.url, location.origin).pathname);
    if (idx === -1) {
      playlist.unshift({ id: -1, title: curTrack.title, url: curTrack.url });
      currentIdx = 0;
    } else {
      currentIdx = idx;
      // Refresh UI with fresh metadata if track is found in the new list
      updateNowPlayingUI(playlist[currentIdx]);
    }
  }

  if (queueList && queueList.length > 0) {
    const insertAt = currentIdx >= 0 ? currentIdx + 1 : 0;
    playlist.splice(insertAt, 0, ...queueList);
  }

  list.forEach(t => refreshLikeUI(t.id));
  if (currentIdx >= 0) highlightRow(currentIdx);
};

function updateNowPlayingUI(t) {
  if (!t) return;
  if (nowTitle) nowTitle.textContent = t.title;
  
  const metaEl = document.getElementById('now-playing-meta');
  if (metaEl) {
    metaEl.textContent = t.artist || 'Unknown Artist';
  }
  
  const coverEl = document.getElementById('player-cover-display');
  const iconEl = document.getElementById('player-default-icon');
  if (coverEl && iconEl) {
    if (t.cover_url && !t.cover_url.includes('default-cover.png')) {
      coverEl.src = t.cover_url;
      coverEl.style.display = 'block';
      iconEl.style.display = 'none';
    } else {
      coverEl.style.display = 'none';
      iconEl.style.display = 'block';
    }
  }
  
  if (playerLike) playerLike.classList.toggle('liked', isLiked(t.id));

  // Update Track Info pane if it's currently open
  const trackPane = document.getElementById('pane-track-info');
  if (trackPane && trackPane.classList.contains('active')) {
    if (typeof window.refreshTrackInfoUI === 'function') window.refreshTrackInfoUI();
  }
  
  // Update browser media metadata if possible
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: t.title,
      artist: t.artist || 'Unknown Artist',
      album: t.album || '',
      artwork: t.cover_url ? [{ src: t.cover_url }] : []
    });
  }
}
window.updateNowPlayingUI = updateNowPlayingUI;

window.getLibrary = function() { return library; };

window.playTrack = function(idx) {
  loadTrack(idx);
};

window.playTrackById = function(trackId) {
  let idx = playlist.findIndex(t => t.id === trackId);
  if (idx !== -1) {
    loadTrack(idx);
  } else {
    // Fallback if not found in current playlist, find in library
    const libTrack = library.find(t => t.id === trackId);
    if (libTrack) {
      playlist.push(libTrack);
      loadTrack(playlist.length - 1);
    }
  }
};

window.toggleLikeTrack = function(id) { _toggleLike(id); };

// ── QUEUE SYSTEM ─────────────────────────────────────────────
// queueTrack dipanggil dengan TRACK ID (bukan index)
window.queueTrack = function(trackId) {
  // Cari track dari library berdasarkan ID
  const track = library.find(t => t.id === trackId);
  if (!track) {
    console.warn('Track id', trackId, 'not found in library:', library);
    return;
  }

  const t = {
    id: track.id, 
    title: track.title, 
    url: track.url, 
    artist: track.artist, 
    cover_url: track.cover_url
  };

  // Tambah ke queueList
  queueList.push(t);

  // Sisipkan ke playlist setelah semua lagu yang sudah ada di antrean
  // posisi insert = setelah lagu aktif + semua antrean sebelumnya
  const insertAt = currentIdx + queueList.length;
  playlist.splice(insertAt, 0, t);

  // Jika tidak ada yang main, langsung putar
  if (currentIdx === -1) {
    loadTrack(0);
  }

  // Update badge
  updateQueueBadge();

  // Refresh panel antrean
  if (typeof window.renderQueuePanel === 'function') window.renderQueuePanel();
  
  savePlayerState();

  if (typeof showToast === 'function') showToast('"' + t.title + '" added to queue', 'info');
};

window.removeFromQueue = function(queueIdx) {
  if (queueIdx < 0 || queueIdx >= queueList.length) return;
  const removed = queueList.splice(queueIdx, 1)[0];

  // Hapus dari playlist juga
  const plIdx = playlist.findIndex((t, i) => i > currentIdx && t.id === removed.id);
  if (plIdx >= 0) playlist.splice(plIdx, 1);

  updateQueueBadge();
  if (typeof window.renderQueuePanel === 'function') window.renderQueuePanel();
  savePlayerState();
};

window.clearQueue = function() {
  // Hapus semua item antrean dari playlist
  queueList.forEach(t => {
    const plIdx = playlist.findIndex((p, i) => i > currentIdx && p.id === t.id);
    if (plIdx >= 0) playlist.splice(plIdx, 1);
  });
  queueList = [];
  updateQueueBadge();
  if (typeof window.renderQueuePanel === 'function') window.renderQueuePanel();
  savePlayerState();
};

window.getQueueList = function() { return queueList; };

// Alias agar bisa dipanggil dari music.js
window.queueTrack_player = window.queueTrack;

function updateQueueBadge() {
  const badge = document.getElementById('queue-badge');
  if (!badge) return;
  if (queueList.length > 0) {
    badge.textContent    = queueList.length;
    badge.style.display  = 'inline-flex';
  } else {
    badge.style.display  = 'none';
  }
}

// ── Sidebar toggle ────────────────────────────────────────────
const sidebar   = document.getElementById('main-sidebar');
const toggleBtn = document.getElementById('sidebar-toggle');
if (sidebar && toggleBtn) {
  // Restore state immediately
  if (localStorage.getItem('sn_sidebar_collapsed') === 'true') {
    sidebar.classList.add('collapsed');
  }

  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    localStorage.setItem('sn_sidebar_collapsed', sidebar.classList.contains('collapsed'));
  });
}

// ── Right panel toggle ──────────────────────────────────────────
const rightPanel = document.getElementById('right-panel');
const rightToggle = document.getElementById('right-panel-toggle');

window.toggleRightPanel = function() {
  if (!rightPanel) return;
  if (window.innerWidth <= 768) {
    rightPanel.classList.toggle('mobile-active');
    createMobileOverlay(() => rightPanel.classList.remove('mobile-active'));
  } else {
    rightPanel.classList.toggle('collapsed');
    localStorage.setItem('sn_right_panel_collapsed', rightPanel.classList.contains('collapsed'));
  }
};

if (rightPanel && rightToggle) {
  if (localStorage.getItem('sn_right_panel_collapsed') === 'true') {
    rightPanel.classList.add('collapsed');
  }
  rightToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    window.toggleRightPanel();
  });
}

// Logic Sidebar Kiri untuk Mobile
const leftSidebar = document.querySelector('.sidebar');
const leftToggle = document.getElementById('sidebar-toggle');
if (leftSidebar && leftToggle) {
  leftToggle.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
      e.stopPropagation();
      leftSidebar.classList.toggle('mobile-active');
      createMobileOverlay(() => leftSidebar.classList.remove('mobile-active'));
    }
  });
}

function createMobileOverlay(closeCallback) {
  let overlay = document.getElementById('mobile-sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'mobile-sidebar-overlay';
    overlay.style = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:1500;display:none;';
    document.body.appendChild(overlay);
  }
  overlay.style.display = 'block';
  overlay.onclick = () => {
    overlay.style.display = 'none';
    if (closeCallback) closeCallback();
  };
}

// ── Global Cropper Logic ──────────────────────────────────────
window.openCropper = function(options) {
  const modal = document.getElementById('cropper-modal');
  const image = document.getElementById('cropper-image');
  const saveBtn = document.getElementById('crop-save-btn');
  const zoomSlider = document.getElementById('cropper-zoom-slider');
  const titleEl = document.getElementById('cropper-modal-title');

  if (!modal || !image || !saveBtn) return;
  if (typeof Cropper === 'undefined') {
    if (typeof showToast === 'function') showToast('Cropper.js not loaded', 'error');
    return;
  }

  titleEl.textContent = options.title || 'Crop Photo';
  image.src = options.src;
  modal.classList.add('active');

  if (window._globalCropper) window._globalCropper.destroy();

  window._globalCropper = new Cropper(image, {
    aspectRatio: options.aspectRatio || 1,
    viewMode: 1,
    guides: false,
    autoCropArea: 1,
    dragMode: 'move',
    background: false,
    cropBoxMovable: false,
    cropBoxResizable: false,
    ready() {
      if (zoomSlider) zoomSlider.value = 0;
    }
  });

  // Zoom handling
  const handleZoom = (e) => {
    if (window._globalCropper) window._globalCropper.zoomTo(1 + parseFloat(e.target.value));
  };
  zoomSlider.oninput = handleZoom;

  // Save handling
  saveBtn.onclick = () => {
    if (!window._globalCropper) return;
    const canvas = window._globalCropper.getCroppedCanvas({
      width: options.outWidth || 400,
      height: options.outHeight || 400
    });
    
    if (canvas && options.onSave) {
      options.onSave(canvas);
      window.closeCropModal();
    }
  };
};

window.closeCropModal = function() {
  const modal = document.getElementById('cropper-modal');
  if (modal) modal.classList.remove('active');
  if (window._globalCropper) {
    window._globalCropper.destroy();
    window._globalCropper = null;
  }
};

// ── Toast ─────────────────────────────────────────────────────
window.showToast = function(msg, type) {
  type = type || 'info';
  if (typeof Toast !== 'undefined') Toast.show(msg, type);
};

// ══════════════════════════════════════════════════════════════
//  SPA NAVIGATION — music doesn't stop when switching pages
// ══════════════════════════════════════════════════════════════
const contentArea = document.querySelector('.content-area');

function isInternalUrl(url) {
  try { return new URL(url).origin === location.origin; }
  catch { return false; }
}

function ajaxNavigate(url) {
  if (!contentArea) { location.href = url; return; }

  contentArea.style.opacity       = '0.4';
  contentArea.style.pointerEvents = 'none';

  fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'text/html' } })
    .then(r => { if (!r.ok) throw r.status; return r.text(); })
    .then(html => {
      const doc        = new DOMParser().parseFromString(html, 'text/html');
      const newContent = doc.querySelector('.content-area');
      if (!newContent) throw new Error('no .content-area');

      contentArea.innerHTML = newContent.innerHTML;
      document.title        = doc.title;
      history.pushState({ url }, doc.title, url);
      window._isStatsMode   = false;

      // Execute scripts in the new content
      const scripts = newContent.querySelectorAll('script');
      scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
        newScript.appendChild(document.createTextNode(oldScript.innerHTML));
        oldScript.parentNode.replaceChild(newScript, oldScript);
      });

      // Update active nav
      document.querySelectorAll('.sidebar a.nav-link').forEach(a => {
        try {
          const aUrl = new URL(a.href);
          const cUrl = new URL(url, location.origin);
          if (aUrl.pathname === cUrl.pathname) {
            a.classList.toggle('active', aUrl.search === cUrl.search);
          } else {
            a.classList.toggle('active', aUrl.pathname !== '/' && cUrl.pathname.startsWith(aUrl.pathname));
          }
        } catch {}
      });

      // Jalankan HANYA script inline (berisi data seperti _pageTracksData)
      // Script eksternal (music.js, player.js) sudah dimuat sekali di layout
      contentArea.querySelectorAll('script:not([src])').forEach(old => {
        const s = document.createElement('script');
        s.textContent = old.textContent;
        old.replaceWith(s);
      });

      // Hapus script[src] dari content area agar tidak di-render sebagai teks
      contentArea.querySelectorAll('script[src]').forEach(s => s.remove());

      // Panggil initMusicPage setelah data ter-inject
      if (typeof window.initMusicPage === 'function') window.initMusicPage();
      highlightRow(currentIdx);
      if (typeof window.reloadSidebarPlaylists === 'function') window.reloadSidebarPlaylists();

      contentArea.style.opacity       = '1';
      contentArea.style.pointerEvents = '';
      contentArea.scrollTop           = 0;
    })
    .catch(() => { location.href = url; });
}

// Intercept semua klik link
document.addEventListener('click', e => {
  const link = e.target.closest('a');
  if (!link) return;
  const href = link.getAttribute('href');
  if (!href || href === '#' || href.startsWith('mailto:')) return;
  if (!isInternalUrl(link.href)) return;
  if (link.target && link.target !== '_self') return;
  if (link.closest('.modal-overlay, .rename-overlay')) return;
  if (link.dataset.noAjax) return;

  e.preventDefault();
  
  // Detection: are we in a dynamic playlist view (Grid or Detail) or Stats Mode?
  const isDynamicMode = window._centerPlaylistId !== null || document.querySelector('.playlist-grid-all') || window._isStatsMode;
  
  // If same URL but in dynamic view, or if different URL, use AJAX
  if ((link.href === location.href && isDynamicMode) || (link.href !== location.href)) {
    ajaxNavigate(link.href);
  }
}, true);

window.ajaxNavigate = ajaxNavigate;

window.addEventListener('popstate', e => {
  if (e.state && e.state.url) ajaxNavigate(e.state.url);
  else ajaxNavigate(location.href);
});

history.replaceState({ url: location.href }, document.title, location.href);

// ── Keyboard Shortcuts ─────────────────────────────────────────
window.addEventListener('keydown', e => {
  // Hanya trigger jika bukan sedang mengetik di input/textarea/contenteditable
  const isTyping = (e.target.tagName === 'INPUT' && !['range', 'checkbox', 'radio'].includes(e.target.type)) || 
                   e.target.tagName === 'TEXTAREA' || 
                   e.target.isContentEditable;
  
  if (e.code === 'Space' && !isTyping) {
    e.preventDefault(); // Cegah halaman scroll ke bawah
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }
});

// ── Track Info Sidebar Logic ─────────────────────────────────
window.refreshTrackInfoUI = function() {
  const t = playlist[currentIdx];
  if (!t) return;

  window._currentTrackId = t.id;

  const coverEl = document.getElementById('track-info-cover');
  const iconEl  = document.getElementById('track-info-default-icon');
  const titleEl = document.getElementById('track-info-title');
  const artistEl= document.getElementById('track-info-artist');
  const albumEl = document.getElementById('track-info-album-text');

  if (titleEl)  titleEl.textContent = t.title || 'Unknown Title';
  if (artistEl) artistEl.textContent = t.artist || 'Unknown Artist';
  if (albumEl)  albumEl.textContent = t.album || 'Unknown Album';

  if (coverEl && iconEl) {
    if (t.cover_url && !t.cover_url.includes('default-cover.png')) {
      coverEl.src = t.cover_url;
      coverEl.style.display = 'block';
      iconEl.style.display  = 'none';
    } else {
      coverEl.style.display = 'none';
      iconEl.style.display  = 'block';
    }
  }

  // Update Like state
  const tiLike = document.getElementById('track-info-like');
  if (tiLike) {
    tiLike.dataset.id = t.id;
    tiLike.classList.toggle('liked', isLiked(t.id));
    const label = tiLike.querySelector('.like-label');
    if (label) label.textContent = isLiked(t.id) ? 'Liked' : 'Like';
  }
};

window.showTrackInfo = function() {
  window.refreshTrackInfoUI();

  // UI State: Hide only the tab buttons, keep the container for the toggle button
  document.querySelectorAll('.right-panel-tab').forEach(t => t.style.display = 'none');
  const tabsWrapper = document.querySelector('.right-panel-tabs');
  if (tabsWrapper) tabsWrapper.style.borderBottom = 'none'; // Clean look

  // Hide original toggle button
  const rt = document.getElementById('right-panel-toggle');
  if (rt) rt.style.display = 'none';

  // Save previous active tab to restore later
  const activeTab = document.querySelector('.right-panel-tab.active');
  if (activeTab) window._prevActiveTab = activeTab.dataset.tab;

  document.querySelectorAll('.right-panel-pane').forEach(p => p.classList.remove('active'));
  const trackPane = document.getElementById('pane-track-info');
  if (trackPane) trackPane.classList.add('active');

  // Ensure right panel is open
  const rp = document.getElementById('right-panel');
  if (rp && rp.classList.contains('collapsed')) {
    window.toggleRightPanel();
  }

  localStorage.setItem('namarie_right_panel_mode', 'track_info');
};

window.hideTrackInfo = function() {
  document.querySelectorAll('.right-panel-tab').forEach(t => t.style.display = 'flex');
  const tabsWrapper = document.querySelector('.right-panel-tabs');
  if (tabsWrapper) tabsWrapper.style.borderBottom = '';

  // Show original toggle button
  const rt = document.getElementById('right-panel-toggle');
  if (rt) rt.style.display = 'flex';

  document.querySelectorAll('.right-panel-pane').forEach(p => p.classList.remove('active'));
  
  const prevTab = window._prevActiveTab || 'discover';
  const prevPane = document.getElementById('pane-' + prevTab);
  if (prevPane) prevPane.classList.add('active');

  const tabBtn = document.querySelector('.right-panel-tab[data-tab="' + prevTab + '"]');
  if (tabBtn) {
    document.querySelectorAll('.right-panel-tab').forEach(b => b.classList.remove('active'));
    tabBtn.classList.add('active');
  }

  // Trigger re-render of the restored tab
  if (prevTab === 'queue' && typeof window.renderQueuePanel === 'function') window.renderQueuePanel();
  if (prevTab === 'top' && typeof window.renderTopPanel === 'function') window.renderTopPanel();
  if (prevTab === 'discover' && typeof window.renderDiscoverPanel === 'function') window.renderDiscoverPanel();
  if (prevTab === 'playlist' && typeof window.renderPlaylistPanel === 'function') window.renderPlaylistPanel();

  localStorage.setItem('namarie_right_panel_mode', 'tabs');
};

// ── Persistence ────────────────────────────────────────────────
window.addEventListener('beforeunload', () => {
  if (sessionTrackId && sessionStartTime) {
    const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
    if (typeof window.recordListenDuration === 'function' && duration >= 1) {
      window.recordListenDuration(sessionTrackId, duration);
    }
  }
});