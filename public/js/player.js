/**
 * Namárië – player.js v4
 * Audio player + SPA navigation + Queue
 */

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
let library    = [];   // semua lagu dari server (tidak berubah)
let playlist   = [];   // urutan putar aktif (bisa berubah karena sort/queue)
let currentIdx = -1;   // index di playlist
let isRepeat   = false;
let isShuffle  = false;
function getLikedKey() { return 'sn_liked_' + (window.NAMARIE_USER_ID || 'guest'); }
function getStateKey() { return 'sn_state_' + (window.NAMARIE_USER_ID || 'guest'); }
let likedIds   = JSON.parse(localStorage.getItem(getLikedKey()) || '[]');
let queueList  = [];   // antrean manual [{id, title, url}]

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
}
function highlightRow(idx) {
  // highlight berdasarkan id lagu yang sedang main
  const activeId = playlist[idx] ? playlist[idx].id : null;
  document.querySelectorAll('.music-row').forEach(r => {
    r.classList.toggle('active', activeId && parseInt(r.dataset.id) === activeId);
  });
}
function setPauseIcon() { playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>'; }
function setPlayIcon()  { playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>'; }

// ── State Persistence ──────────────────────────────────────────
function savePlayerState() {
  const t = playlist[currentIdx];
  if (!t) return;
  const state = {
    track: t,
    time: audio.currentTime || 0,
    queue: queueList,
    repeat: isRepeat,
    shuffle: isShuffle
  };
  localStorage.setItem(getStateKey(), JSON.stringify(state));
}

function restorePlayerState() {
  try {
    const s = JSON.parse(localStorage.getItem(getStateKey()));
    if (!s || !s.track) return;
    queueList = s.queue || [];
    isRepeat  = !!s.repeat;
    isShuffle = !!s.shuffle;
    
    if (btnRepeat) btnRepeat.classList.toggle('active', isRepeat);
    if (btnShuffle) btnShuffle.classList.toggle('active', isShuffle);
    
    audio.src = s.track.url;
    // Set time after loadedmetadata
    audio.addEventListener('loadedmetadata', function setTime() {
      audio.currentTime = s.time || 0;
      audio.removeEventListener('loadedmetadata', setTime);
    });
    
    nowTitle.textContent = s.track.title;
    curTime.textContent = fmt(s.time || 0);
    if (playerLike) playerLike.classList.toggle('liked', isLiked(s.track.id));
    
    playlist = [s.track];
    currentIdx = 0;
  } catch(e) {}
}

restorePlayerState();

// ── Core Player ───────────────────────────────────────────────
function loadTrack(idx) {
  if (!playlist.length) return;
  currentIdx = ((idx % playlist.length) + playlist.length) % playlist.length;
  const t    = playlist[currentIdx];
  audio.src  = t.url;
  nowTitle.textContent = t.title;
  highlightRow(currentIdx);
  if (playerLike) playerLike.classList.toggle('liked', isLiked(t.id));
  savePlayerState();
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
audio.addEventListener('loadedmetadata', () => { durTime.textContent = fmt(audio.duration); });
audio.addEventListener('play',  setPauseIcon);
audio.addEventListener('pause', setPlayIcon);
audio.addEventListener('ended', () => {
  if (isRepeat) {
    audio.currentTime = 0;
    audio.play();
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
seekBar.addEventListener('input',  () => { audio.currentTime = (seekBar.value / 100) * audio.duration; });
volBar.addEventListener('input',   () => { audio.volume = volBar.value / 100; });
audio.volume = 0.8;

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
window.setPlaylist = function(list) {
  library  = list.slice(); // simpan salinan library
  playlist = list.slice();
  
  const curTrack = audio.src ? { url: audio.src, title: nowTitle.textContent } : null;
  if (curTrack) {
    let idx = playlist.findIndex(t => t.url === curTrack.url || t.url === new URL(curTrack.url, location.origin).pathname);
    if (idx === -1) {
      playlist.unshift({ id: -1, title: curTrack.title, url: curTrack.url });
      currentIdx = 0;
    } else {
      currentIdx = idx;
    }
  }

  if (queueList && queueList.length > 0) {
    const insertAt = currentIdx >= 0 ? currentIdx + 1 : 0;
    playlist.splice(insertAt, 0, ...queueList);
  }

  list.forEach(t => refreshLikeUI(t.id));
  if (currentIdx >= 0) highlightRow(currentIdx);
};

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
    console.warn('Track id', trackId, 'tidak ditemukan di library:', library);
    return;
  }

  const t = {id: track.id, title: track.title, url: track.url};

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
  toggleBtn.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
}

// ── Toast ─────────────────────────────────────────────────────
window.showToast = function(msg, type) {
  type = type || 'info';
  if (typeof Toast !== 'undefined') Toast.show(msg, type);
};

// ══════════════════════════════════════════════════════════════
//  SPA NAVIGATION — musik tidak berhenti saat pindah halaman
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
  // If same URL but we're showing a custom playlist in the center, reset to library view
  if (link.href === location.href && window._centerPlaylistId) {
    window._centerPlaylistId = null;
    if (typeof window.restoreLibraryView === 'function') {
      window.restoreLibraryView();
    } else if (typeof window.initMusicPage === 'function') {
      window.initMusicPage();
    }
    highlightRow(currentIdx);
  } else if (link.href !== location.href) {
    ajaxNavigate(link.href);
  }
}, true);

window.addEventListener('popstate', e => {
  if (e.state && e.state.url) ajaxNavigate(e.state.url);
  else ajaxNavigate(location.href);
});

history.replaceState({ url: location.href }, document.title, location.href);