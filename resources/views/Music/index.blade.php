{{-- resources/views/music/index.blade.php --}}
@extends('layouts.app')
@section('title', 'Music Library – Namárië')

@section('content')

{{-- ── STICKY HEADER ── --}}
<div class="page-header-sticky">
  <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;width:100%">
    <div style="display:flex; flex-direction:column;">
      <div class="page-title" style="margin:0 !important; height:auto; line-height:1.2;" id="main-page-title">Music Library</div>
      <div class="section-title" id="main-page-track-count" style="font-size:13px; color:var(--muted2); font-weight:500; margin-top:2px;">{{ $music->count() }} songs</div>
    </div>

    <div style="display:flex;align-items:center;gap:8px;margin-left:auto">
      {{-- Search --}}
      <div class="search-input-wrapper">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="music-search" placeholder="Search your music...">
      </div>

      {{-- Sort --}}
      <div class="sort-wrap">
        <button class="sort-btn" id="sort-btn" title="Sort">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="6" y1="12" x2="18" y2="12"/>
            <line x1="9" y1="18" x2="15" y2="18"/>
          </svg>
          <span class="sort-label" id="sort-label">Sort</span>
          <svg class="sort-dir-icon" id="sort-dir-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:11px;height:11px">
            <polyline points="18 15 12 9 6 15"/>
          </svg>
        </button>

        <div class="sort-dropdown" id="sort-dropdown" style="display:none">
          <div class="sort-dropdown-header">Sort By</div>

          <button class="sort-option active" data-sort="newest">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Date Added (Newest)
            <span class="sort-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></span>
          </button>

          <button class="sort-option" data-sort="oldest">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 8 14"/></svg>
            Date Added (Oldest)
            <span class="sort-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></span>
          </button>

          <div class="sort-divider"></div>

          <button class="sort-option" data-sort="az">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M3 7h4l-4 6h4"/><path d="M13 7l4 6m-4 0l4-6"/></svg>
            Name A → Z
            <span class="sort-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></span>
          </button>

          <button class="sort-option" data-sort="za">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M3 7h4l-4 6h4"/><path d="M13 13l4-6m-4 0l4 6"/></svg>
            Name Z → A
            <span class="sort-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></span>
          </button>

          <div class="sort-divider"></div>

          <button class="sort-option" data-sort="duration-asc">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><polyline points="17 11 21 7 17 3"/><path d="M21 7H9"/><polyline points="7 21 3 17 7 13"/><path d="M15 17H3"/></svg>
            Duration (Shortest)
            <span class="sort-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></span>
          </button>

          <button class="sort-option" data-sort="duration-desc">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><polyline points="7 11 3 7 7 3"/><path d="M3 7h12"/><polyline points="17 21 21 17 17 13"/><path d="M21 17H9"/></svg>
            Duration (Longest)
            <span class="sort-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></span>
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

{{-- ── TRACK LIST ── --}}
<div class="card">
  @if($music->isEmpty())
    <div style="text-align:center;padding:48px;color:var(--muted)">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
           style="margin:0 auto 10px;display:block;opacity:.4">
        <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
      </svg>
      <p style="font-size:13px">No music yet. Click <strong>Upload Music</strong> in the sidebar!</p>
    </div>
  @else
    <div class="music-list" id="track-list">
      @foreach($music as $i => $track)
      <div class="music-row"
           data-idx="{{ $i }}"
           data-id="{{ $track->id }}"
           data-url="{{ route('music.stream', $track) }}"
           data-title="{{ strtolower($track->title) }}">

        <div class="music-num">{{ $i + 1 }}</div>

        {{-- Area klik → play --}}
        <div class="music-info-click" style="display:flex;align-items:center;flex:1;gap:10px;cursor:pointer">
          <div class="music-icon">
            @if($track->cover_path)
              <img src="{{ $track->cover_url }}" alt="cover" style="width:100%; height:100%; object-fit:cover; border-radius:4px">
            @else
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>
            @endif
          </div>
          <div class="music-info">
            <div class="music-name music-title" id="title-{{ $track->id }}">{{ $track->title }}</div>
            <div class="music-meta">
              {{ $track->artist ?? 'Unknown Artist' }}
              • {{ $track->duration_formatted }}
            </div>
          </div>
        </div>

        {{-- Like --}}
        <button class="music-like" data-id="{{ $track->id }}" title="Like"
                onclick="event.stopPropagation();toggleLike({{ $track->id }})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>

        {{-- Quick add to playlist --}}
        <button class="add-to-pl-btn" data-idx="{{ $i }}" data-id="{{ $track->id }}" title="Add to playlist"
                onclick="event.stopPropagation();quickAddToPlaylist({{ $track->id }})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>

        <div class="music-dur">{{ $track->duration_formatted }}</div>

        {{-- Actions --}}
        <div class="music-actions" onclick="event.stopPropagation()">
          <button class="icon-btn" title="Add to queue" onclick="queueTrack({{ $track->id }})">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </button>
          <button class="icon-btn" title="Edit Metadata" onclick="openMetadataEditor({{ $track->id }})">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="icon-btn danger" title="Delete" onclick="confirmDelete({{ $track->id }})">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6m4-6v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>

        {{-- Hidden delete form --}}
        <form id="delete-form-{{ $track->id }}" method="POST"
              action="{{ route('music.destroy', $track) }}" style="display:none">
          @csrf @method('DELETE')
        </form>
      </div>
      @endforeach
    </div>

    <div id="no-results"
         style="display:none;text-align:center;padding:30px;color:var(--muted);font-size:13px">
      No songs found.
    </div>
  @endif
</div>

@endsection

@push('scripts')
<script>
  // Data lagu untuk halaman ini
  window._pageTracksData = [
    @foreach($music as $track)
    { 
      id: {{ $track->id }}, 
      title: @json($track->title), 
      artist: @json($track->artist), 
      album: @json($track->album), 
      genre: @json($track->genre),
      cover_url: "{{ $track->cover_url }}",
      url: "{{ route('music.stream', $track) }}" 
    },
    @endforeach
  ];
  // Panggil initMusicPage jika sudah tersedia
  if (typeof window.initMusicPage === 'function') {
    window.initMusicPage();
  }
</script>
@endpush