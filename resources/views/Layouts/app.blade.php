{{-- resources/views/layouts/app.blade.php --}}
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>@yield('title', 'Namárië')</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{{ asset('css/app.css') }}?v=41">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css">
  @stack('styles')
</head>
<body class="{{ Auth::user()->theme !== 'default' ? 'theme-' . Auth::user()->theme : '' }}">

<div class="app-shell">

  {{-- ── 1. LEFT SIDEBAR ── --}}
  <nav class="sidebar" id="main-sidebar">
    <script>
      if (localStorage.getItem('sn_sidebar_collapsed') === 'true') {
        document.getElementById('main-sidebar').classList.add('collapsed');
      }
    </script>

    {{-- Logo + Toggle (always visible, even when collapsed) --}}
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

    {{-- All sidebar content wrapped in .sidebar-body --}}
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

      {{-- Playlist Link --}}
      <a href="javascript:void(0)" class="nav-link" id="nav-view-all-playlists" onclick="window.viewAllPlaylists()" style="margin-top: 10px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
        <span>Playlist</span>
      </a>
      <div class="sidebar-playlists-wrap">
        <div id="sidebar-playlists"></div>
      </div>

    </div>{{-- end .sidebar-body --}}

    {{-- Account section – always fixed at bottom --}}
    <div class="sidebar-footer">
      <div class="nav-section">Account</div>
      <a href="javascript:void(0)" class="nav-link" id="nav-stats" onclick="window.viewStats()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        <span>Stats For Nerds</span>
      </a>

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
      {{-- Flash messages handled by Toast JS below --}}
      @yield('content')
    </div>

    {{-- ── 3. PLAYER BAR ── --}}
    <div id="player-bar">
      <div class="player-info">
        <div class="player-thumb">
          <img id="player-cover-display" src="" alt="cover" style="width:100%; height:100%; object-fit:cover; border-radius:4px; display:none">
          <div id="player-default-icon">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>
          </div>
        </div>
        <div class="player-text" onclick="window.showTrackInfo()" style="cursor:pointer" title="View Track Info">
          <div class="player-title" id="now-playing-title">Select a song to play</div>
          <div class="player-artist-album" id="now-playing-meta"></div>
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
        <span id="cur-time" class="time-stamp">0:00</span>
        <input type="range" id="seek-bar" value="0" min="0" max="100" step="0.1">
        <span id="dur-time" class="time-stamp">0:00</span>
      </div>

      <div class="vol-wrap">
        <svg viewBox="0 0 24 24" fill="currentColor" style="width:16px"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
        <input type="range" id="vol-bar" value="80" min="0" max="100">
      </div>
    </div>
  </main>

  {{-- ── 4. RIGHT PANEL ── --}}
  <aside class="right-panel" id="right-panel">

    {{-- Tabs: Discover, Top, Queue --}}
    <div class="right-panel-tabs">
      <button id="right-panel-toggle" class="right-panel-toggle-btn" title="Toggle Right Panel">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      <button class="right-panel-tab active" data-tab="discover">
        Discover
      </button>
      <button class="right-panel-tab" data-tab="top">
        Top
      </button>
      <button class="right-panel-tab" data-tab="queue">
        Queue <span class="queue-badge" id="queue-badge" style="display:none">0</span>
      </button>
    </div>

    {{-- Pane: Discover (Recommendations) --}}
    <div class="right-panel-pane active" id="pane-discover">
      <div class="right-panel-header">
        <div>
          <div class="right-panel-title">Recommended</div>
          <div class="right-panel-meta">Based on your library</div>
        </div>
        <button class="btn btn-ghost btn-sm" id="refresh-recommend-btn"
                style="margin-left:auto;font-size:11px;padding:4px 8px" title="Refresh Recommendations">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        </button>
      </div>
      <div class="right-panel-tracks" id="discover-list">
         <div class="right-panel-empty">
           <p>No recommendations available.</p>
         </div>
      </div>
    </div>

    {{-- Pane: Top (Frequently heard) --}}
    <div class="right-panel-pane" id="pane-top">
      <div class="right-panel-header">
        <div>
          <div class="right-panel-title">Frequently Heard</div>
          <div class="right-panel-meta">Your most played tracks</div>
        </div>
      </div>
      <div class="right-panel-tracks" id="top-list">
         <div class="right-panel-empty">
           <p>No play history yet.</p>
         </div>
      </div>
    </div>

    <div class="right-panel-pane" id="pane-track-info">
      <div class="right-panel-header" style="position: relative; display: flex; justify-content: center; border-bottom: none; padding-bottom: 0; padding-top: 15px;">
        <button class="btn btn-ghost btn-sm track-info-toggle" onclick="window.toggleRightPanel()" style="position: absolute; left: 12px; top: 12px; padding: 4px; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03);" title="Toggle Sidebar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div class="right-panel-title" style="margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8;">Track Info</div>
        <button class="btn btn-ghost btn-sm" onclick="window.hideTrackInfo()" style="position: absolute; right: 12px; top: 12px; padding: 4px; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03);" title="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      
      <div class="track-info-content" style="padding: 24px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 20px;">
        <div class="track-info-cover-wrap" style="width: 100%; aspect-ratio: 1; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3); background: var(--bg2); display: flex; align-items: center; justify-content: center;">
          <img id="track-info-cover" src="" alt="cover" style="width: 100%; height: 100%; object-fit: cover; display: none;">
          <div id="track-info-default-icon" style="color: var(--accent); opacity: 0.3;">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>
          </div>
        </div>
        
        <div style="width: 100%;">
          <h2 id="track-info-title" style="font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 6px; line-height: 1.3;">-</h2>
          <div id="track-info-artist" style="font-size: 14px; color: var(--accent); font-weight: 600; margin-bottom: 12px;">-</div>
          <div id="track-info-album" style="font-size: 13px; color: var(--muted2); font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 6px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"/><circle cx="12" cy="12" r="3"/></svg>
            <span id="track-info-album-text">-</span>
          </div>
        </div>
        
        <div class="track-info-actions">
          <button class="btn btn-ghost" onclick="window.queueTrack(window._currentTrackId)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Queue
          </button>
          <button class="btn btn-ghost music-like" id="track-info-like" onclick="window.toggleLike(window._currentTrackId)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span class="like-label">Like</span>
          </button>
        </div>
      </div>
    </div>

    {{-- Pane: Queue --}}
    <div class="right-panel-pane" id="pane-queue">
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

    {{-- Right Panel Footer (Sleep Timer) --}}
    <div class="right-panel-footer" id="sleep-timer-section">
      <button class="sleep-timer-btn" id="open-sleep-timer-btn" title="Set Sleep Timer">
        <div class="clockwork-timer-ui">
          <div class="ticker">
            <div class="hand"></div>
          </div>
          <div class="ticks">
            <div class="tick"></div>
            <div class="tick"></div>
            <div class="tick"></div>
            <div class="tick"></div>
            <div class="tick"></div>
            <div class="tick"></div>
            <div class="tick"></div>
            <div class="tick"></div>
            <div class="tick"></div>
            <div class="tick"></div>
            <div class="tick"></div>
            <div class="tick"></div>
          </div>
        </div>
        <span id="sleep-timer-label">Sleep Timer</span>
        <span id="sleep-timer-countdown" style="display:none; font-family:var(--mono); margin-left:auto; color:var(--accent)">00:00</span>
      </button>
    </div>

  </aside>

</div>

<div class="modal-overlay" id="modal-overlay">
  <div class="modal">
    <div class="modal-title">Create New Playlist</div>
    <form id="playlist-form">
      <div class="form-group">
        <label>Playlist Name</label>
        <input class="input" id="pl-name" placeholder="Playlist Name..." required>
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

<div class="modal-overlay" id="modal-rename-playlist">
  <div class="modal">
    <div class="modal-title">Rename Playlist</div>
    <form id="rename-playlist-form">
      <div class="form-group">
        <label>Playlist Name</label>
        <input class="input" id="rename-playlist-input" placeholder="Playlist Name..." required>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
        <button type="button" class="btn btn-ghost btn-sm" onclick="closeModal('modal-rename-playlist')">Cancel</button>
        <button type="submit" class="btn btn-primary btn-sm">Save</button>
      </div>
    </form>
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

<audio id="audio-player" preload="metadata"></audio>
<script>
  // User ID for data isolation per account
  window.NAMARIE_USER_ID = {{ Auth::id() ?? 'null' }};
  // Store theme in localStorage for persistence on guest pages (login/register)
  localStorage.setItem('namarie_theme', '{{ Auth::user()->theme }}');
</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<script src="{{ asset('js/toast.js') }}?v=27"></script>
<script src="{{ asset('js/player.js') }}?v=30"></script>
<script src="{{ asset('js/music.js') }}?v=30"></script>
<script src="{{ asset('js/sleep-timer.js') }}?v=1"></script>

<script>
(function () {
  window.closeModal = function (id) { const el=document.getElementById(id); if(el) el.classList.remove('open'); };
  window.openModal  = function (id) { const el=document.getElementById(id); if(el) el.classList.add('open'); };

  document.querySelectorAll('.modal-overlay').forEach(o => {
    o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); });
  });

  // Flash message → Toast (from server)
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

      localStorage.setItem('namarie_active_tab', tab.dataset.tab);
      localStorage.setItem('namarie_right_panel_mode', 'tabs');

      // Render content
      if (tab.dataset.tab === 'queue') renderQueuePanel();
      if (tab.dataset.tab === 'top') {
        if (typeof window.renderTopPanel === 'function') window.renderTopPanel();
      }
      if (tab.dataset.tab === 'discover') {
        if (typeof window.renderDiscoverPanel === 'function') window.renderDiscoverPanel();
      }
      if (tab.dataset.tab === 'playlist' && typeof window.renderPlaylistPanel === 'function') window.renderPlaylistPanel();
    });
  });

  // Render default tab or restore state
  setTimeout(() => {
    const savedMode = localStorage.getItem('namarie_right_panel_mode');
    const savedTab  = localStorage.getItem('namarie_active_tab') || 'discover';

    if (savedMode === 'track_info') {
      if (typeof window.showTrackInfo === 'function') window.showTrackInfo();
    } else {
      const tabBtn = document.querySelector('.right-panel-tab[data-tab="' + savedTab + '"]');
      if (tabBtn) tabBtn.click();
      else if (typeof window.renderDiscoverPanel === 'function') window.renderDiscoverPanel();
    }
  }, 150);

  const refreshDiscoverBtn = document.getElementById('refresh-recommend-btn');
  if (refreshDiscoverBtn) {
    refreshDiscoverBtn.addEventListener('click', () => {
      // Putar ikon
      const icon = refreshDiscoverBtn.querySelector('svg');
      if (icon) {
        icon.classList.remove('refresh-anim');
        void icon.offsetWidth; // trigger reflow
        icon.classList.add('refresh-anim');
      }
      
      if (typeof window.renderDiscoverPanel === 'function') {
        window.renderDiscoverPanel(true);
      }
    });
  }

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

    listEl.innerHTML = queueData.map((t, i) => {
      const coverHTML = t.cover_url 
        ? '<img src="' + t.cover_url + '" alt="cover" style="width:100%;height:100%;object-fit:cover;border-radius:4px">'
        : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>';

      return '<div class="pl-track-item">' +
        '<div class="pl-track-num">' + (i+1) + '</div>' +
        '<div class="pl-track-icon" style="overflow:hidden;border-radius:4px">' + coverHTML + '</div>' +
        '<div class="pl-track-info">' +
          '<div class="pl-track-title">' + escHtml(t.title) + '</div>' +
          '<div class="pl-track-meta" style="font-size:10px;color:var(--muted)">' + escHtml(t.artist || 'Unknown Artist') + '</div>' +
        '</div>' +
        '<button class="pl-track-remove" onclick="removeFromQueuePanel(' + i + ')" title="Remove from queue">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
        '</div>';
    }).join('');
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

  // ── Sidebar toggle handled in player.js ──────────

  // ── Mini upload ─────────────────────────────────
  const sidebarInput   = document.getElementById('file-input-sidebar');
  const uploadBtn      = document.getElementById('mini-upload-btn');
  if (uploadBtn && sidebarInput) uploadBtn.addEventListener('click', () => sidebarInput.click());
  if (sidebarInput) {
    sidebarInput.addEventListener('change', () => {
      if (typeof window.handleMusicSelect === 'function') {
        window.handleMusicSelect(sidebarInput);
      }
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

{{-- Cropper Modal (Global) --}}
<div class="cropper-modal-overlay" id="cropper-modal">
  <div class="cropper-container-box">
    <div class="cropper-modal-header">
      <h3 id="cropper-modal-title">Crop Photo</h3>
      <button type="button" class="cropper-modal-close" onclick="closeCropModal()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>
    <div class="cropper-modal-body">
      <div class="cropper-img-area">
        <img id="cropper-image" src="" alt="Source">
      </div>
      <div class="cropper-zoom-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m-3-3h6"/></svg>
        <input type="range" class="cropper-range" id="cropper-zoom-slider" min="0" max="1" step="0.01" value="0">
      </div>
    </div>
    <div class="cropper-modal-footer">
      <button type="button" class="cropper-btn cropper-btn-cancel" onclick="closeCropModal()">Cancel</button>
      <button type="button" class="cropper-btn cropper-btn-save" id="crop-save-btn">Save Photo</button>
    </div>
  </div>
</div>
  {{-- Modal: Sleep Timer --}}
  <div class="modal-overlay" id="modal-sleep-timer-overlay">
    <div class="modal" id="modal-sleep-timer" style="width:320px">
      <div class="modal-title">Sleep Timer</div>
      <div class="sleep-timer-options" style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
        <button class="timer-option btn btn-ghost" data-mins="5">5 Mins</button>
        <button class="timer-option btn btn-ghost" data-mins="10">10 Mins</button>
        <button class="timer-option btn btn-ghost" data-mins="30">30 Mins</button>
        <button class="timer-option btn btn-ghost" data-mins="60">60 Mins</button>
      </div>
      <div class="timer-custom" style="margin-top:10px; display:flex; gap:8px;">
        <input type="number" id="custom-timer-input" class="input" placeholder="Custom mins" min="1" max="999">
        <button class="btn btn-primary btn-sm" id="set-custom-timer-btn">Set</button>
      </div>
      <div style="margin-top:20px; display:flex; gap:10px; border-top:1px solid var(--border); padding-top:15px;">
        <button class="btn btn-danger btn-sm" id="stop-timer-btn" style="display:none">Stop Timer</button>
        <button class="btn btn-ghost btn-sm" onclick="closeModal('modal-sleep-timer-overlay')" style="margin-left:auto">Close</button>
      </div>
    </div>
  </div>

  {{-- Modal: Metadata Editor --}}
  <div class="modal-overlay" id="modal-metadata-editor-overlay">
    <div class="modal" id="modal-metadata-editor" style="width:450px">
      <div class="modal-title" id="meta-editor-title">Edit Song Metadata</div>
      
      <form id="metadata-editor-form" enctype="multipart/form-data">
        <div class="meta-editor-layout" style="display:flex; gap:20px; margin-top:15px;">
          <div class="meta-editor-cover-side">
            <div class="cover-preview-wrapper" style="width:120px; height:120px; background:var(--bg3); border:1px solid var(--border); border-radius:8px; overflow:hidden; position:relative; cursor:pointer;" onclick="document.getElementById('meta-cover-input').click()">
              <img id="meta-cover-preview" src="" alt="cover" style="width:100%; height:100%; object-fit:cover; display:none">
              <div id="meta-cover-placeholder" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:var(--muted)">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </div>
              <div style="position:absolute; bottom:0; left:0; right:0; background:rgba(0,0,0,0.5); font-size:10px; color:white; text-align:center; padding:4px">Change Cover</div>
            </div>
            <input type="file" id="meta-cover-input" name="cover" accept="image/*" style="display:none">
          </div>
          
          <div class="meta-editor-fields-side" style="flex:1">
            <input type="hidden" id="meta-track-id">
            <div class="form-group">
              <label>Title</label>
              <input class="input" name="title" id="meta-title" placeholder="Song Title" required>
            </div>
            <div class="form-group">
              <label>Artist</label>
              <input class="input" name="artist" id="meta-artist" placeholder="Artist Name" list="artist-list">
            </div>
            <div class="form-group">
              <label>Album</label>
              <input class="input" name="album" id="meta-album" placeholder="Album Name" list="album-list">
            </div>
            <div class="form-group">
              <label>Genre</label>
              <input class="input" name="genre" id="meta-genre" placeholder="e.g. Pop, Rock, Lo-Fi" list="genre-list">
            </div>
          </div>
        </div>

        <div id="upload-file-section" style="margin-top:15px; padding-top:15px; border-top:1px solid var(--border); display:none">
           <div class="form-group">
             <label>Music File</label>
             <div id="selected-file-info" style="font-size:12px; color:var(--accent); margin-bottom:8px">No file selected</div>
           </div>
        </div>

        <div style="display:flex; gap:10px; margin-top:25px; border-top:1px solid var(--border); padding-top:20px;">
          <div id="upload-progress-container" style="flex:1; display:none">
            <div style="font-size:11px; color:var(--muted); margin-bottom:5px">Uploading... <span id="upload-progress-percent">0%</span></div>
            <div style="height:4px; background:var(--bg3); border-radius:2px; overflow:hidden">
              <div id="upload-progress-bar" style="height:100%; width:0%; background:var(--accent); transition:width 0.1s"></div>
            </div>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" onclick="closeModal('modal-metadata-editor-overlay')" id="meta-cancel-btn">Cancel</button>
          <button type="submit" class="btn btn-primary btn-sm" id="meta-save-btn">Save Changes</button>
        </div>
      </form>
    </div>
  </div>

  {{-- Datalists for Autocomplete --}}
  <datalist id="artist-list">
    @if(isset($artists))
      @foreach($artists as $artist)
        <option value="{{ $artist }}">
      @endforeach
    @endif
  </datalist>

  <datalist id="album-list">
    @if(isset($albums))
      @foreach($albums as $album)
        <option value="{{ $album }}">
      @endforeach
    @endif
  </datalist>
  
  <datalist id="genre-list">
    @if(isset($genres))
      @foreach($genres as $genre)
        <option value="{{ $genre }}">
      @endforeach
    @endif
  </datalist>

<script src="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js"></script>
@stack('scripts')
</body>
</html>