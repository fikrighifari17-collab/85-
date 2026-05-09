{{-- resources/views/auth/register.blade.php --}}
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Daftar – SoundNest</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{{ asset('css/app.css') }}">
  <link rel="stylesheet" href="{{ asset('css/auth.css') }}">
</head>
<body class="auth-page">

<div class="auth-card">
  <div class="logo">
    <svg viewBox="0 0 24 24"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>
    SoundNest
  </div>

  <h2>Buat akun baru</h2>
  <p class="sub">Gratis selamanya</p>

  @if($errors->any())
    <div class="alert alert-error">{{ $errors->first() }}</div>
  @endif

  <form method="POST" action="{{ route('register') }}">
    @csrf
    <div class="form-group">
      <label>Nama Lengkap</label>
      <input class="input" name="name" value="{{ old('name') }}" required autofocus>
      @error('name')<span class="err">{{ $message }}</span>@enderror
    </div>
    <div class="form-group">
      <label>Username</label>
      <input class="input" name="username" value="{{ old('username') }}" required placeholder="hanya huruf, angka, _ atau -">
      @error('username')<span class="err">{{ $message }}</span>@enderror
    </div>
    <div class="form-group">
      <label>Email</label>
      <input class="input" type="email" name="email" value="{{ old('email') }}" required>
      @error('email')<span class="err">{{ $message }}</span>@enderror
    </div>
    <div class="form-group">
      <label>Password</label>
      <div class="password-wrapper">
        <input class="input" type="password" name="password" id="register-password" required>
        <button type="button" class="password-toggle" onclick="togglePassword('register-password', this)" title="Show/Hide Password">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </div>
    </div>
    <div class="form-group">
      <label>Konfirmasi Password</label>
      <div class="password-wrapper">
        <input class="input" type="password" name="password_confirmation" id="register-password-confirm" required>
        <button type="button" class="password-toggle" onclick="togglePassword('register-password-confirm', this)" title="Show/Hide Password">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </div>
      @error('password')<span class="err">{{ $message }}</span>@enderror
    </div>
    <button class="btn btn-primary" type="submit">Buat Akun</button>
  </form>

  <p class="alt">Sudah punya akun? <a href="{{ route('login') }}">Masuk</a></p>
</div>

</body>
<script src="{{ asset('js/password.js') }}"></script>
</html>