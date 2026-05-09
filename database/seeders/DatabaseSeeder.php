<?php
// database/seeders/DatabaseSeeder.php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Cek dulu agar tidak duplikat saat re-seed
        if (!User::where('email', 'admin@ainulindale.com')->exists()) {
            User::create([
                'name'     => 'Administrator Ainulindalë',
                'email'    => 'admin@ainulindale.com',
                'password' => Hash::make('password123'),
                'username' => 'admin',
                'avatar'   => null, // pakai kolom 'avatar', bukan 'avatar_url'
            ]);
        }
    }
}