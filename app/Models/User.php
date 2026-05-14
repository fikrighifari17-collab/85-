<?php
// app/Models/User.php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Models\Music;

class User extends Authenticatable
{
    use Notifiable;

    protected $fillable = ['name', 'username', 'email', 'password', 'avatar', 'bio', 'gender', 'theme', 'google_id', 'social_type'];
    protected $hidden   = ['password', 'remember_token'];
    protected $casts    = ['password' => 'hashed'];

    public function music()
    {
        return $this->hasMany(Music::class);
    }

    public function getAvatarUrlAttribute(): string
    {
        if ($this->avatar) {
            // Return relative path to avoid APP_URL issues, with timestamp for cache-busting
            return '/storage/' . $this->avatar . '?t=' . time();
        }
        
        return 'https://ui-avatars.com/api/?name=' . urlencode($this->name) . '&background=1a1a2e&color=a78bfa&size=128';
    }
}