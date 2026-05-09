{{-- resources/views/profile/show.blade.php --}}
@extends('layouts.app')
@section('title','Profil – SoundNest')

@section('content')
<div class="page-title">Profil</div>

<div class="profile-grid">

  {{-- Header: avatar + info --}}
  <div class="card profile-header">
    <img src="{{ $user->avatar_url }}" alt="avatar">
    <div class="profile-header-info">
      <div class="name">{{ $user->name }}</div>
      <div class="meta">@{{ $user->username }} · {{ $user->email }}</div>
      <div class="count">{{ $user->music()->count() }} lagu diupload</div>
    </div>
    <div style="margin-left:auto">
      <form method="POST" action="{{ route('profile.avatar') }}" enctype="multipart/form-data" id="avatar-form">
        @csrf
        <input type="file" id="avatar-input" name="avatar" accept="image/*" style="display:none">
        <button type="button" class="btn btn-ghost" onclick="document.getElementById('avatar-input').click()">
          Ganti Foto
        </button>
      </form>
    </div>
  </div>

  {{-- Edit info --}}
  <div class="card">
    <div class="card-title">Informasi Akun</div>
    <form method="POST" action="{{ route('profile.update') }}">
      @csrf @method('PATCH')
      <div class="form-group">
        <label>Nama Lengkap</label>
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
      <button class="btn btn-primary" type="submit">Simpan</button>
    </form>
  </div>

  {{-- Change password --}}
  <div class="card">
    <div class="card-title">Ganti Password</div>
    <form method="POST" action="{{ route('profile.password') }}">
      @csrf @method('PATCH')
      <div class="form-group">
        <label>Password Saat Ini</label>
        <input class="input" type="password" name="current_password" required>
        @error('current_password')<span class="err">{{ $message }}</span>@enderror
      </div>
      <div class="form-group">
        <label>Password Baru</label>
        <input class="input" type="password" name="password" required>
      </div>
      <div class="form-group">
        <label>Konfirmasi Password Baru</label>
        <input class="input" type="password" name="password_confirmation" required>
        @error('password')<span class="err">{{ $message }}</span>@enderror
      </div>
      <button class="btn btn-primary" type="submit">Ubah Password</button>
    </form>
  </div>

</div>
@endsection

@push('scripts')
<script src="{{ asset('js/profile.js') }}"></script>
@endpush