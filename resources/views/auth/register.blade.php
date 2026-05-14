{{-- resources/views/auth/register.blade.php --}}
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Register – Namárië</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{{ asset('css/app.css') }}">
  <link rel="stylesheet" href="{{ asset('css/auth.css') }}">
  <script>
    (function() {
      const theme = localStorage.getItem('namarie_theme');
      if (theme && theme !== 'default') {
        document.documentElement.classList.add('theme-' + theme);
      }
    })();
  </script>
</head>
<body class="auth-page">

<div class="auth-bg-decor">
  <div class="blob blob-tl"></div>
  <div class="blob blob-tl-2"></div>
  <div class="blob blob-tr"></div>
  <div class="blob blob-bl"></div>
  <div class="blob blob-br"></div>
  <svg class="floating-note note-1" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>
  <svg class="floating-note note-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>
  <svg class="floating-note note-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>
  <svg class="floating-note note-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>
  <svg class="floating-note note-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>
  <svg class="floating-note note-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>
  <svg class="floating-note note-7" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>
</div>

<div class="auth-card">
  <div class="logo">
    <svg viewBox="0 0 24 24"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>
    Namárië
  </div>

  <h2>Create new account</h2>
  <p class="sub">Free forever</p>

  @if($errors->any())
    <div class="alert alert-error">{{ $errors->first() }}</div>
  @endif

  <form method="POST" action="{{ route('register') }}">
    @csrf
    <div class="form-group">
      <label>Full Name</label>
      <input class="input" name="name" value="{{ old('name') }}" required autofocus>
      @error('name')<span class="err">{{ $message }}</span>@enderror
    </div>
    <div class="form-group">
      <label>Username</label>
      <input class="input" name="username" value="{{ old('username') }}" required placeholder="letters, numbers, _ or -">
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
      <label>Confirm Password</label>
      <div class="password-wrapper">
        <input class="input" type="password" name="password_confirmation" id="register-password-confirm" required>
        <button type="button" class="password-toggle" onclick="togglePassword('register-password-confirm', this)" title="Show/Hide Password">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </div>
      @error('password')<span class="err">{{ $message }}</span>@enderror
    </div>
    <button class="btn btn-primary" type="submit">Create Account</button>
  </form>

  <p class="alt">Already have an account? <a href="{{ route('login') }}">Login</a></p>
</div>

</body>
<script src="{{ asset('js/password.js') }}"></script>
</html>