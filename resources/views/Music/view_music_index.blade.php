{{-- resources/views/music/index.blade.php --}}
@extends('layouts.app')
@section('title','Musik Saya – SoundNest')

@section('content')
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
  <div class="page-title" style="margin-bottom:0">Musik Saya</div>

  {{-- Mini Upload Button --}}
  <form method="POST" action="{{ route('music.upload') }}" enctype="multipart/form-data" id="upload-form">
    @csrf
    <input type="file" id="file-input" name="file" accept=".mp3,.mp4,.m4a,.wav,.flac,.ogg" style="display:none">
    <button type="button" class="btn btn-primary btn-sm" id="mini-upload-btn">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      Upload Musik
    </button>
  </form>
</div>

{{-- Upload progress (hidden by default) --}}
<div class="upload-progress" id="upload-progress">
  <div class="upload-spinner"></div>
  <span id="upload-label">Mengupload & mengkonversi…</span>
</div>

{{-- Track list --}}
<div class="card">
  @if($music->isEmpty())
    <div style="text-align:center;padding:40px;color:var(--muted)">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 10px;display:block;opacity:.4">
        <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
      </svg>
      <p style="font-size:13px">Belum ada musik. Klik <strong>Upload Musik</strong> untuk mulai!</p>
    </div>
  @else
    <div class="section-header">
      <span class="section-title">{{ $music->count() }} lagu</span>
      <span style="font-size:12px;color:var(--muted)">Klik lagu untuk memutar</span>
    </div>
    <div class="music-list" id="track-list">
      @foreach($music as $i => $track)
      <div class="music-row" data-idx="{{ $i }}" data-id="{{ $track->id }}">
        <div class="music-num">{{ $i + 1 }}</div>
        <div class="music-icon">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>
        </div>
        <div class="music-info">
          <div class="music-name" id="title-{{ $track->id }}">{{ $track->title }}</div>
          <div class="music-meta">{{ $track->file_size_formatted }}</div>
        </div>

        {{-- Like button --}}
        <button class="music-like" data-id="{{ $track->id }}" title="Suka" onclick="event.stopPropagation();toggleLike({{ $track->id }})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>

        <div class="music-dur">{{ $track->duration_formatted }}</div>

        {{-- Actions --}}
        <div class="music-actions" onclick="event.stopPropagation()">
          {{-- Add to queue --}}
          <button class="icon-btn" title="Tambah ke antrean" onclick="queueTrack({{ $i }})">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          </button>
          {{-- Add to playlist --}}
          <button class="icon-btn" title="Tambah ke playlist" onclick="addToPlaylist({{ $i }})">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          {{-- Rename --}}
          <button class="icon-btn" title="Ganti nama" onclick="startRename({{ $track->id }})">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          {{-- Delete --}}
          <form method="POST" action="{{ route('music.destroy', $track) }}" onsubmit="return confirm('Hapus lagu ini?')" style="display:inline">
            @csrf @method('DELETE')
            <button type="submit" class="icon-btn danger" title="Hapus">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6m4-6v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </form>
        </div>
      </div>
      @endforeach
    </div>
  @endif
</div>
@endsection

@push('scripts')
<script>
  const tracks    = [
    @foreach($music as $track)
    { id: {{ $track->id }}, title: @json($track->title), url: "{{ route('music.stream', $track) }}" },
    @endforeach
  ];
  const csrfToken = document.querySelector('meta[name=csrf-token]').content;
</script>
<script src="{{ asset('js/music.js') }}"></script>
@endpush