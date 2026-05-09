{{-- resources/views/profile/show.blade.php --}}
@extends('layouts.app')
@section('title','Profil – SoundNest')

@section('content')
<div class="page-title">Profile</div>

<div class="profile-grid">

  {{-- Header: avatar + info --}}
  <div class="card profile-header">
    <img src="{{ $user->avatar_url }}" alt="avatar">
    <div class="profile-header-info">
      <div class="name">{{ $user->name }}</div>
      <div class="meta">@{{ $user->username }} · {{ $user->email }}</div>
      <div class="count">{{ $user->music()->count() }} songs uploaded</div>
    </div>
    <div style="margin-left:auto">
      <form method="POST" action="{{ route('profile.avatar') }}" enctype="multipart/form-data" id="avatar-form">
        @csrf
        <input type="file" id="avatar-input" name="avatar" accept="image/*" style="display:none">
        <button type="button" class="btn btn-ghost" onclick="document.getElementById('avatar-input').click()">
          Change Photo
        </button>
      </form>
    </div>
  </div>

  {{-- Edit info --}}
  <div class="card">
    <div class="card-title">Account Information</div>
    <form method="POST" action="{{ route('profile.update') }}">
      @csrf @method('PATCH')
      <div class="form-group">
        <label>Full Name</label>
        <input class="input" name="name" value="{{ old('name', $user->name) }}" required>
        @error('name')<span class="err">{{ $message }}</span>@enderror
      </div>
      <div class="form-group">
        <label>Username</label>
        <input class="input" name="username" value="{{ old('username', $user->username) }}" required>
        @error('username')<span class="err">{{ $message }}</span>@enderror
      </div>
      <div class="form-group">
        <label>Email</label>
        <input class="input" type="email" name="email" value="{{ old('email', $user->email) }}" required>
        @error('email')<span class="err">{{ $message }}</span>@enderror
      </div>
      <button class="btn btn-primary" type="submit">Save</button>
    </form>
  </div>

  {{-- Change password --}}
  <div class="card">
    <div class="card-title">Change Password</div>
    <form method="POST" action="{{ route('profile.password') }}">
      @csrf @method('PATCH')
      <div class="form-group">
        <label>Current Password</label>
        <div class="password-wrapper">
          <input class="input" type="password" name="current_password" id="profile-current-password" required>
          <button type="button" class="password-toggle" onclick="togglePassword('profile-current-password', this)" title="Show/Hide Password">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
        @error('current_password')<span class="err">{{ $message }}</span>@enderror
      </div>
      <div class="form-group">
        <label>New Password</label>
        <div class="password-wrapper">
          <input class="input" type="password" name="password" id="profile-new-password" required>
          <button type="button" class="password-toggle" onclick="togglePassword('profile-new-password', this)" title="Show/Hide Password">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
      </div>
      <div class="form-group">
        <label>Confirm New Password</label>
        <div class="password-wrapper">
          <input class="input" type="password" name="password_confirmation" id="profile-confirm-password" required>
          <button type="button" class="password-toggle" onclick="togglePassword('profile-confirm-password', this)" title="Show/Hide Password">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
        @error('password')<span class="err">{{ $message }}</span>@enderror
      </div>
      <button class="btn btn-primary" type="submit">Update Password</button>
    </form>
  </div>

</div>
@endsection

@push('scripts')
<script src="{{ asset('js/profile.js') }}"></script>
<script src="{{ asset('js/password.js') }}"></script>
@endpush