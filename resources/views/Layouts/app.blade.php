{{-- resources/views/layouts/app.blade.php --}}
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>@yield('title', 'Namárië')</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{{ asset('css/app.css') }}">
  @stack('styles')
</head>
<body>

<div class="app-shell">

  {{-- ── 1. LEFT SIDEBAR ── --}}
  <nav class="sidebar" id="main-sidebar">

    {{-- Logo + Toggle (selalu tampil, bahkan saat collapsed) --}}
    <div class="logo">
      <svg class="logo-icon" viewBox="0 0 24 24" style="flex-shrink:0;fill:var(--accent)">
        <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/>
      </svg>
      <span class="logo-text">Namárië</span>
      <button id="sidebar-toggle"
              style="margin-left:auto;width:28px;height:28px;border-radius:6px;border:none;background:transparent;color:var(--muted);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .12s,color .12s"
              title="Toggle Sidebar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
    </div>

    {{-- Semua konten sidebar dibungkus .sidebar-body --}}
    <div class="sidebar-body">

      {{-- Library --}}
      <div class="nav-section">Library</div>
      <a href="{{ route('music.index') }}" class="nav-link {{ request()->routeIs('music.index') && request('filter') !== 'liked' ? 'active' : '' }}" id="nav-all-music">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        <span>My Music</span>
      </a>
      <a href="{{ route('music.index') }}?filter=liked" class="nav-link {{ request('filter') === 'liked' ? 'active' : '' }}" id="nav-liked-music">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        <span>Liked Music</span>
      </a>

      {{-- Mini Upload --}}
      <form method="POST" action="{{ route('music.upload') }}" enctype="multipart/form-data" id="sidebar-upload-form">
        @csrf
        <input type="file" id="file-input-sidebar" name="file" accept=".mp3,.mp4,.m4a,.wav,.flac,.ogg" style="display:none">
        <button type="button" class="mini-upload" id="mini-upload-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <span>Upload Music</span>
        </button>
      </form>
      <div class="upload-progress" id="upload-progress-sidebar">
        <div class="upload-spinner"></div>
        <span>Uploading...</span>
      </div>

      {{-- New Playlist button (below Upload Music) --}}
      <button class="btn-add-playlist" id="sidebar-new-playlist">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        <span>New Playlist</span>
      </button>

      {{-- Playlist (scrollable section) --}}
      <div class="nav-section">Playlist</div>
      <div class="sidebar-playlists-wrap">
        <div id="sidebar-playlists"></div>
      </div>

    </div>{{-- end .sidebar-body --}}

    {{-- Account section – always fixed at bottom --}}
    <div class="sidebar-footer">
      <div class="nav-section">Account</div>
      <a href="{{ route('profile.show') }}" class="nav-link {{ request()->routeIs('profile.*') ? 'active' : '' }}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
        <span>Profile</span>
      </a>

      {{-- User chip + logout --}}
      <div class="sidebar-bottom">
        <a href="{{ route('profile.show') }}" class="user-chip">
          <img src="{{ Auth::user()->avatar_url }}" alt="avatar">
          <div class="user-chip-info">
            <div class="user-chip-name">{{ Auth::user()->name }}</div>
            <div class="user-chip-email">{{ Auth::user()->email }}</div>
          </div>
        </a>
        <form method="POST" action="{{ route('logout') }}" style="margin-top:6px">
          @csrf
          <button type="submit" class="nav-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span>Logout</span>
          </button>
        </form>
      </div>
    </div>{{-- end .sidebar-footer --}}
  </nav>

  {{-- ── 2. MAIN AREA ── --}}
  <main class="main-area">
    <div class="content-area">
      {{-- Flash messages ditangani oleh Toast JS di bawah --}}
      @yield('content')
    </div>

    {{-- ── 3. PLAYER BAR ── --}}
    <div id="player-bar">
      <div class="player-info">
        <div class="player-thumb">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>
        </div>
        <div class="player-text">
          <div class="player-title" id="now-playing-title">Select a song to play</div>
          <div class="player-time"><span id="cur-time">0:00</span> / <span id="dur-time">0:00</span></div>
        </div>
        <button class="like-btn" id="player-like">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </div>

      <div class="player-controls">
        <button class="ctrl-btn" id="btn-shuffle" title="Shuffle">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>
        </button>
        <button class="ctrl-btn" id="btn-prev" title="Previous">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
        </button>
        <button class="ctrl-btn play-btn" id="btn-play" title="Play">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" id="play-icon"><path d="M8 5v14l11-7z"/></svg>
        </button>
        <button class="ctrl-btn" id="btn-next" title="Next">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm2.5-6 8.5 6V6z"/></svg>
        </button>
        <button class="ctrl-btn" id="btn-repeat" title="Repeat">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
        </button>
      </div>

      <div class="progress-wrap">
        <input type="range" id="seek-bar" value="0" min="0" max="100" step="0.1">
      </div>

      <div class="vol-wrap">
        <svg viewBox="0 0 24 24" fill="currentColor" style="width:16px"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
        <input type="range" id="vol-bar" value="80" min="0" max="100">
      </div>
    </div>
  </main>

  {{-- ── 4. RIGHT PANEL ── --}}
  <aside class="right-panel" id="right-panel">

    {{-- Tab: Queue only --}}
    <div class="right-panel-tabs">
      <button class="right-panel-tab active" data-tab="queue">
        Queue <span class="queue-badge" id="queue-badge" style="display:none">0</span>
      </button>
    </div>

    {{-- Pane: Queue --}}
    <div class="right-panel-pane active" id="pane-queue">
      <div class="right-panel-header">
        <div>
          <div class="right-panel-title">Queue</div>
          <div class="right-panel-meta" id="queue-meta">No songs in queue</div>
        </div>
        <button class="btn btn-ghost btn-sm" id="clear-queue-btn"
                style="margin-left:auto;font-size:11px;padding:4px 8px">
          Clear
        </button>
      </div>
      <div class="right-panel-tracks" id="queue-list">
        <div class="right-panel-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          <p>No songs yet.<br>Click ≡+ next to a song<br>to add to queue.</p>
        </div>
      </div>
    </div>

  </aside>

</div>

<div class="modal-overlay" id="modal-overlay">
  <div class="modal">
    <div class="modal-title">Create New Playlist</div>
    <form id="playlist-form">
      <div class="form-group">
        <label>Playlist Name</label>
        <input class="input" id="pl-name" placeholder="Favorites..." required>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
        <button type="button" class="btn btn-ghost btn-sm" onclick="closeModal('modal-overlay')">Cancel</button>
        <button type="submit" class="btn btn-primary btn-sm">Create</button>
      </div>
    </form>
  </div>
</div>

<div class="rename-overlay" id="rename-overlay">
  <div class="rename-dialog">
    <div class="rename-dialog-title">Rename Song</div>
    <div class="rename-dialog-sub" id="rename-dialog-old"></div>
    <input class="input" id="rename-dialog-input" type="text" placeholder="New name..." maxlength="200">
    <div class="rename-dialog-btns">
      <button class="btn btn-ghost btn-sm" id="rename-cancel-btn">Cancel</button>
      <button class="btn btn-primary btn-sm" id="rename-save-btn">Save</button>
    </div>
  </div>
</div>

<div class="modal-overlay" id="modal-delete">
  <div class="modal">
    <div class="modal-title">Delete Music?</div>
    <p style="font-size:13px;color:var(--muted);margin:12px 0 20px">Song will be deleted permanently.</p>
    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button type="button" class="btn btn-ghost btn-sm" onclick="closeModal('modal-delete')">Cancel</button>
      <button type="button" class="btn btn-danger btn-sm" id="confirm-delete-btn">Delete</button>
    </div>
  </div>
</div>

<div class="modal-overlay" id="modal-delete-playlist">
  <div class="modal">
    <div class="modal-title">Delete Playlist?</div>
    <p style="font-size:13px;color:var(--muted);margin:12px 0 20px">Are you sure you want to delete this playlist?</p>
    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button type="button" class="btn btn-ghost btn-sm" onclick="closeModal('modal-delete-playlist')">Cancel</button>
      <button type="button" class="btn btn-danger btn-sm" id="confirm-delete-playlist-btn">Delete</button>
    </div>
  </div>
</div>

<div class="modal-overlay" id="modal-add-songs-playlist">
  <div class="modal" style="width: 400px; max-width: 90vw;">
    <div class="modal-title">Add Songs to Playlist</div>
    <div style="margin-bottom: 12px; position: relative;">
      <input type="text" class="input" id="add-songs-search" placeholder="Search songs..." oninput="window.filterAddSongs()">
    </div>
    <div id="add-songs-list" style="max-height: 300px; overflow-y: auto; margin-bottom: 20px;">
      <!-- Populated by JS -->
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button type="button" class="btn btn-ghost btn-sm" onclick="closeModal('modal-add-songs-playlist')">Done</button>
    </div>
  </div>
</div>

<audio id="audio-player" preload="none"></audio>
<script>
  // User ID untuk isolasi data per akun
  window.NAMARIE_USER_ID = {{ Auth::id() }};
</script>
<script src="{{ asset('js/toast.js') }}?v=20"></script>
<script src="{{ asset('js/player.js') }}?v=20"></script>
<script src="{{ asset('js/music.js') }}?v=20"></script>

<script>
(function () {
  window.closeModal = function (id) { const el=document.getElementById(id); if(el) el.classList.remove('open'); };
  window.openModal  = function (id) { const el=document.getElementById(id); if(el) el.classList.add('open'); };

  document.querySelectorAll('.modal-overlay').forEach(o => {
    o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); });
  });

  // Flash message → Toast (dari server)
  (function() {
    const success = @json(session('success'));
    const error   = {{ session('error') ? json_encode(session('error')) : ($errors->any() ? json_encode($errors->first()) : 'null') }};
    if (success) setTimeout(() => Toast && Toast.success(success), 300);
    if (error)   setTimeout(() => Toast && Toast.error(error), 300);
  })();

  // ── Right panel tabs ────────────────────────────
  document.querySelectorAll('.right-panel-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.right-panel-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.right-panel-pane').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const pane = document.getElementById('pane-' + tab.dataset.tab);
      if (pane) pane.classList.add('active');
      // Render antrean saat tab dibuka
      if (tab.dataset.tab === 'queue') renderQueuePanel();
      if (tab.dataset.tab === 'playlist' && typeof window.renderPlaylistPanel === 'function') window.renderPlaylistPanel();
    });
  });

  // Render antrean di right panel
  function renderQueuePanel() {
    const listEl  = document.getElementById('queue-list');
    const metaEl  = document.getElementById('queue-meta');
    const badge   = document.getElementById('queue-badge');
    const queueData = (typeof window.getQueueList === 'function') ? window.getQueueList() : (window._queueData || []);

    if (!listEl) return;

    if (!queueData.length) {
      listEl.innerHTML =
        '<div class="right-panel-empty">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>' +
        '<p>No songs yet.<br>Click ≡+ next to a song<br>to add to queue.</p></div>';
      if (metaEl) metaEl.textContent = 'No songs in queue';
      if (badge)  badge.style.display = 'none';
      return;
    }

    if (metaEl) metaEl.textContent = queueData.length + ' songs in queue';
    if (badge)  { badge.textContent = queueData.length; badge.style.display = 'inline-flex'; }

    function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    listEl.innerHTML = queueData.map((t, i) =>
      '<div class="pl-track-item">' +
      '<div class="pl-track-num">' + (i+1) + '</div>' +
      '<div class="pl-track-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg></div>' +
      '<div class="pl-track-info"><div class="pl-track-title">' + escHtml(t.title) + '</div></div>' +
      '<button class="pl-track-remove" onclick="removeFromQueuePanel(' + i + ')" title="Remove from queue">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
      '</div>'
    ).join('');
  }

  window.renderQueuePanel = renderQueuePanel;

  // Kosongkan antrean
  const clearQueueBtn = document.getElementById('clear-queue-btn');
  if (clearQueueBtn) {
    clearQueueBtn.addEventListener('click', () => {
      if (typeof window.clearQueue === 'function') window.clearQueue();
      renderQueuePanel();
    });
  }

  // Hapus 1 item dari antrean
  window.removeFromQueuePanel = function(idx) {
    if (typeof window.removeFromQueue === 'function') window.removeFromQueue(idx);
    else renderQueuePanel();
  };

  // ── Sidebar toggle dihandle di player.js ──────────

  // ── Mini upload ─────────────────────────────────
  const sidebarInput   = document.getElementById('file-input-sidebar');
  const uploadBtn      = document.getElementById('mini-upload-btn');
  const uploadProgress = document.getElementById('upload-progress-sidebar');
  const uploadForm     = document.getElementById('sidebar-upload-form');
  if (uploadBtn && sidebarInput) uploadBtn.addEventListener('click', () => sidebarInput.click());
  if (sidebarInput) {
    sidebarInput.addEventListener('change', () => {
      if (!sidebarInput.files.length) return;
      if (uploadProgress) uploadProgress.classList.add('show');
      if (uploadForm)     uploadForm.submit();
    });
  }

  // ── Sidebar new playlist ────────────────────────
  const sidebarNew = document.getElementById('sidebar-new-playlist');
  if (sidebarNew) sidebarNew.addEventListener('click', () => openModal('modal-overlay'));

  // ── Load sidebar playlists ──────────────────────
  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function loadSidebarPlaylists() {
    const cont = document.getElementById('sidebar-playlists');
    if (!cont) return;
    const _plKey = 'namarie_playlists_' + (window.NAMARIE_USER_ID || 'guest');
    const _coverKeyPrefix = 'namarie_playlists_' + (window.NAMARIE_USER_ID || 'guest') + '_cover_';
    const pls = JSON.parse(localStorage.getItem(_plKey) || '[]');
    cont.innerHTML = pls.map(pl => {
      const coverData = localStorage.getItem(_coverKeyPrefix + pl.id) || '';
      const thumb = coverData
        ? `<img src="${coverData}" alt="cover" style="width:28px;height:28px;border-radius:6px;object-fit:cover;flex-shrink:0;">`
        : `<div style="width:28px;height:28px;border-radius:6px;background:var(--bg3);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
             <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--muted)"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
           </div>`;
      return `
        <div class="playlist-item" onclick="if(typeof viewPlaylist==='function')viewPlaylist(${pl.id})" style="gap:8px">
          ${thumb}
          <span class="playlist-name">${escHtml(pl.name)}</span>
          <span class="playlist-count">${(pl.tracks||[]).length}</span>
        </div>`;
    }).join('');
  }
  loadSidebarPlaylists();

  // Update saat localStorage berubah (antar tab)
  window.addEventListener('storage', e => {
    const key = 'namarie_playlists_' + (window.NAMARIE_USER_ID || 'guest');
    if (e.key === key) loadSidebarPlaylists();
  });

  // Expose global agar music.js bisa panggil
  window.reloadSidebarPlaylists = loadSidebarPlaylists;
})();
</script>

@stack('scripts')
</body>
</html>