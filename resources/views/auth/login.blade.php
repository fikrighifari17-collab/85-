{{-- resources/views/auth/login.blade.php --}}
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Login – Ainulindalë</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{{ asset('css/app.css') }}">
  <link rel="stylesheet" href="{{ asset('css/auth.css') }}">
</head>
<body class="auth-page">

<div class="auth-card">
  <div class="logo">
    <svg viewBox="0 0 24 24"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>
    Ainulindalë
  </div>

  <h2>Welcome back</h2>
  <p class="sub">Log in to your account</p>

  @if($errors->any())
    <div class="alert alert-error">{{ $errors->first() }}</div>
  @endif

  <form method="POST" action="{{ route('login') }}">
    @csrf
    <div class="form-group">
      <label>Email</label>
      <input class="input" type="email" name="email" value="{{ old('email') }}" required autofocus>
    </div>
    <div class="form-group">
      <label>Password</label>
      <div class="password-wrapper">
        <input class="input" type="password" name="password" id="login-password" required>
        <button type="button" class="password-toggle" onclick="togglePassword('login-password', this)" title="Show/Hide Password">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </div>
    </div>
    <button class="btn btn-primary" type="submit">Log in</button>
  </form>

  <p class="alt">Don't have an account? <a href="{{ route('register') }}">Register now</a></p>
</div>

</body>
<script src="{{ asset('js/password.js') }}"></script>
</html>