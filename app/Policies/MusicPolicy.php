<?php
// app/Policies/MusicPolicy.php

namespace App\Policies;

use App\Models\Music;
use App\Models\User;

class MusicPolicy
{
    public function view(User $user, Music $music): bool   { return $user->id === $music->user_id; }
    public function update(User $user, Music $music): bool { return $user->id === $music->user_id; }
    public function delete(User $user, Music $music): bool { return $user->id === $music->user_id; }
}