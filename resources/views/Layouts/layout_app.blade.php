{{-- resources/views/layouts/app.blade.php --}}
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>@yield('title', 'SoundNest')</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{{ asset('css/app.css') }}">
  @stack('styles')
</head>
<body>

<div class="app-shell">
  <nav class="sidebar">
    <div class="logo">
      <svg viewBox="0 0 24 24"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>
      SoundNest
    </div>

    <div class="nav-section">Library</div>
    <a href="{{ route('music.index') }}" class="nav-link {{ request()->routeIs('music.*') ? 'active' : '' }}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
      Library Music
    </a>

    <div class="nav-section">Akun</div>
    <a href="{{ route('profile.show') }}" class="nav-link {{ request()->routeIs('profile.*') ? 'active' : '' }}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
      Profil
    </a>

    <div class="sidebar-bottom">
      <a href="{{ route('profile.show') }}" class="user-chip">
        <img src="{{ Auth::user()->avatar_url }}" alt="avatar">
        <div class="user-chip-info">
          <div class="user-chip-name">{{ Auth::user()->name }}</div>
          <div class="user-chip-email">{{ Auth::user()->email }}</div>
        </div>
      </a>
      <form method="POST" action="{{ route('logout') }}" style="margin-top:8px">
        @csrf
        <button type="submit" class="nav-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Keluar
        </button>
      </form>
    </div>
  </nav>

  <div class="main-area">
    <div class="content-area">
      @if(session('success'))
        <div class="alert alert-success fade-up">{{ session('success') }}</div>
      @endif
      @if($errors->any())
        <div class="alert alert-error fade-up">{{ $errors->first() }}</div>
      @endif
      @yield('content')
    </div>

    <div id="player-bar">
      <div class="player-info">
        <div class="player-title" id="now-playing-title">Pilih lagu untuk diputar</div>
        <div class="player-time"><span id="cur-time">0:00</span> / <span id="dur-time">0:00</span></div>
      </div>
      <div class="player-controls">
        <button class="ctrl-btn" id="btn-prev" title="Sebelumnya">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
        </button>
        <button class="ctrl-btn play-btn" id="btn-play" title="Putar / Jeda">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" id="play-icon"><path d="M8 5v14l11-7z"/></svg>
        </button>
        <button class="ctrl-btn" id="btn-next" title="Selanjutnya">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm2.5-6 8.5 6V6z"/></svg>
        </button>
      </div>
      <div class="progress-wrap">
        <input type="range" id="seek-bar" value="0" min="0" max="100" step="0.1">
      </div>
      <div style="display:flex;align-items:center;gap:6px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--muted)"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
        <input type="range" id="vol-bar" value="80" min="0" max="100" style="width:80px">
      </div>
    </div>
  </div>
</div>

<audio id="audio-player" preload="none"></audio>
<script src="{{ asset('js/player.js') }}"></script>
@stack('scripts')
</body>
</html>