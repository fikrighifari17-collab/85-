{{-- resources/views/profile/show.blade.php --}}
@extends('layouts.app')
@section('title','Profile – Namárië')

@push('styles')
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css">
@endpush

@section('content')
<div class="page-title">Profile Settings</div>

<div class="profile-grid">
  {{-- Header --}}
  <div class="card profile-header premium-header">
    <div class="header-bg-accent"></div>
    <div class="header-content-wrapper">
      <div class="avatar-container">
        <img src="{{ $user->avatar_url }}" alt="avatar" id="profile-avatar-display">
        <button type="button" class="avatar-edit-btn" onclick="document.getElementById('avatar-input').click()" title="Change Photo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        </button>
      </div>
      <div class="profile-header-info">
        <div class="name-badge-row">
          <div class="name">{{ $user->name }}</div>
          <span class="status-badge">Active</span>
        </div>
        <div class="meta">
          <div class="gender-tag">{{ $user->gender ?? 'No gender set' }}</div>
          <div class="bio-text">{{ $user->bio ?? 'No bio description yet' }}</div>
        </div>
        <div class="stats-row">
          <div class="stat-item">
            <span class="val">{{ $user->music()->count() }}</span>
            <span class="lab">Songs Uploaded</span>
          </div>
        </div>
      </div>
      <form id="avatar-form" action="{{ route('profile.avatar') }}" method="POST" enctype="multipart/form-data" style="display:none">
        @csrf
        <input type="file" id="avatar-input" name="avatar" accept="image/*">
      </form>
    </div>
  </div>

  {{-- Sections --}}
  <div class="profile-grid-layout">
    <div class="profile-col">
      {{-- Account Info --}}
    <div class="card accordion-item" id="section-info">
      <div class="accordion-header" onclick="toggleSection('section-info')">
        <div class="header-title-group">
          <div class="icon-wrap info"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
          <h3 class="card-title">Account Information</h3>
        </div>
        <svg class="chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>
      <div class="accordion-content">
        <form action="{{ route('profile.update') }}" method="POST" style="margin-top: 15px;">
          @csrf @method('PATCH')
          <div class="form-group">
            <label>Display Name</label>
            <input class="input" name="name" value="{{ old('name', $user->name) }}" required>
          </div>
          <div class="form-group">
            <label>Username</label>
            <input class="input" name="username" value="{{ old('username', $user->username) }}" required>
          </div>
          <div class="form-group">
            <label>Gender</label>
            <select class="input" name="gender">
              <option value="Male" {{ old('gender', $user->gender) == 'Male' ? 'selected' : '' }}>Male</option>
              <option value="Female" {{ old('gender', $user->gender) == 'Female' ? 'selected' : '' }}>Female</option>
              <option value="Other" {{ old('gender', $user->gender) == 'Other' ? 'selected' : '' }}>Other</option>
            </select>
          </div>
          <div class="form-group">
            <label>Bio</label>
            <textarea class="input" name="bio" rows="3" style="resize:none">{{ old('bio', $user->bio) }}</textarea>
          </div>
          <button type="submit" class="btn btn-primary w-full">Update Info</button>
        </form>
      </div>
    </div>

    {{-- Security --}}
    <div class="card accordion-item" id="section-security">
      <div class="accordion-header" onclick="toggleSection('section-security')">
        <div class="header-title-group">
          <div class="icon-wrap security"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
          <h3 class="card-title">Security & Password</h3>
        </div>
        <svg class="chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>
      <div class="accordion-content">
        <form action="{{ route('profile.password') }}" method="POST" style="margin-top: 15px;">
          @csrf @method('PATCH')
          <div class="form-group">
            <label>Current Password</label>
            <div class="password-wrap">
              <input class="input" type="password" name="current_password" required>
              <button type="button" class="password-toggle" title="Show/Hide Password">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>New Password</label>
            <div class="password-wrap">
              <input class="input" type="password" name="password" required>
              <button type="button" class="password-toggle" title="Show/Hide Password">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>Confirm Password</label>
            <div class="password-wrap">
              <input class="input" type="password" name="password_confirmation" required>
              <button type="button" class="password-toggle" title="Show/Hide Password">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </div>
          <button type="submit" class="btn btn-primary w-full">Change Password</button>
        </form>
      </div>
    </div>
  </div>

  <div class="profile-col">
    {{-- Theme Settings --}}
    <div class="card accordion-item" id="section-theme">
      <div class="accordion-header" onclick="toggleSection('section-theme')">
        <div class="header-title-group">
          <div class="icon-wrap info" style="background: rgba(167, 139, 250, 0.1); color: var(--accent);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <h3 class="card-title">Background Theme</h3>
        </div>
        <svg class="chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>
      <div class="accordion-content">
        <form action="{{ route('profile.update') }}" method="POST" style="margin-top: 15px;">
          @csrf @method('PATCH')
          <p style="font-size: 12px; color: var(--muted); margin-bottom: 16px;">Choose your preferred background color theme.</p>
          
          <div class="theme-selector">
            {{-- Default --}}
            <label class="theme-option">
              <input type="radio" name="theme" value="default" {{ $user->theme == 'default' ? 'checked' : '' }} onchange="this.form.submit()">
              <div class="theme-card">
                <div class="theme-preview preview-default">
                  <div class="preview-split">
                    <div class="preview-top"></div>
                    <div class="preview-bottom-left"></div>
                    <div class="preview-bottom-right"></div>
                  </div>
                </div>
                <span class="theme-label">Default</span>
              </div>
            </label>

            {{-- Red --}}
            <label class="theme-option">
              <input type="radio" name="theme" value="red" {{ $user->theme == 'red' ? 'checked' : '' }} onchange="this.form.submit()">
              <div class="theme-card">
                <div class="theme-preview preview-red">
                  <div class="preview-split">
                    <div class="preview-top"></div>
                    <div class="preview-bottom-left"></div>
                    <div class="preview-bottom-right"></div>
                  </div>
                </div>
                <span class="theme-label">Maroon</span>
              </div>
            </label>

            {{-- Blue --}}
            <label class="theme-option">
              <input type="radio" name="theme" value="blue" {{ $user->theme == 'blue' ? 'checked' : '' }} onchange="this.form.submit()">
              <div class="theme-card">
                <div class="theme-preview preview-blue">
                  <div class="preview-split">
                    <div class="preview-top"></div>
                    <div class="preview-bottom-left"></div>
                    <div class="preview-bottom-right"></div>
                  </div>
                </div>
                <span class="theme-label">Deep Blue</span>
              </div>
            </label>

            {{-- Green --}}
            <label class="theme-option">
              <input type="radio" name="theme" value="green" {{ $user->theme == 'green' ? 'checked' : '' }} onchange="this.form.submit()">
              <div class="theme-card">
                <div class="theme-preview preview-green">
                  <div class="preview-split">
                    <div class="preview-top"></div>
                    <div class="preview-bottom-left"></div>
                    <div class="preview-bottom-right"></div>
                  </div>
                </div>
                <span class="theme-label">Emerald</span>
              </div>
            </label>

            {{-- Purple --}}
            <label class="theme-option">
              <input type="radio" name="theme" value="purple" {{ $user->theme == 'purple' ? 'checked' : '' }} onchange="this.form.submit()">
              <div class="theme-card">
                <div class="theme-preview preview-purple">
                  <div class="preview-split">
                    <div class="preview-top"></div>
                    <div class="preview-bottom-left"></div>
                    <div class="preview-bottom-right"></div>
                  </div>
                </div>
                <span class="theme-label">Midnight Purple</span>
              </div>
            </label>

            {{-- Slate --}}
            <label class="theme-option">
              <input type="radio" name="theme" value="slate" {{ $user->theme == 'slate' ? 'checked' : '' }} onchange="this.form.submit()">
              <div class="theme-card">
                <div class="theme-preview preview-slate">
                  <div class="preview-split">
                    <div class="preview-top"></div>
                    <div class="preview-bottom-left"></div>
                    <div class="preview-bottom-right"></div>
                  </div>
                </div>
                <span class="theme-label">Slate Grey</span>
              </div>
            </label>
          </div>
        </form>
      </div>
    </div>

    </div>
  </div>
</div>

@endsection

@push('scripts')
<script>
  // Auto-init tracks if needed
  window._pageTracksData = [
    @foreach($music as $track)
    { 
      id: {{ $track->id }}, 
      title: @json($track->title), 
      artist: @json($track->artist), 
      album: @json($track->album), 
      cover_url: "{{ $track->cover_url }}",
      url: "{{ route('music.stream', $track) }}" 
    },
    @endforeach
  ];
  if (typeof window.initMusicPage === 'function') window.initMusicPage();
</script>
@endpush