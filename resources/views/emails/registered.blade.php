<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to Namárië</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f0f1a; color: #ffffff; padding: 20px; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; background: #1a1a2e; border-radius: 12px; padding: 30px; border: 1px solid #a78bfa33; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #a78bfa; margin: 0; font-size: 24px; }
        .content { margin-bottom: 30px; }
        .credentials { background: #252545; padding: 20px; border-radius: 8px; border-left: 4px solid #a78bfa; margin: 20px 0; }
        .credentials p { margin: 5px 0; font-family: monospace; font-size: 14px; }
        .footer { text-align: center; font-size: 12px; color: #888; }
        .btn { display: inline-block; background: #a78bfa; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Namárië Music</h1>
        </div>
        <div class="content">
            <p>Hello <strong>{{ $user->name }}</strong>,</p>
            <p>Welcome to Namárië! Your account has been successfully created. You can now start exploring and managing your music library.</p>
            
            <p>Here are your login credentials for manual access:</p>
            <div class="credentials">
                <p><strong>Email:</strong> {{ $user->email }}</p>
                <p><strong>Username:</strong> {{ $user->username }}</p>
                <p><strong>Password:</strong> {{ $password }}</p>
            </div>
            
            <p style="color: #fb7185; font-size: 12px;">*Please change your password after logging in for the first time.</p>

            <div style="text-align: center;">
                <a href="{{ url('/login') }}" class="btn">Start Listening</a>
            </div>
        </div>
        <div class="footer">
            <p>&copy; {{ date('Y') }} Namárië Music Player. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
