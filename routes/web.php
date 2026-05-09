<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\MusicController;

// Auth routes
Route::middleware('guest')->group(function () {
    Route::get('/login',    [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login',   [AuthController::class, 'login']);
    Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
    Route::post('/register',[AuthController::class, 'register']);
});

Route::post('/logout', [AuthController::class, 'logout'])->name('logout')->middleware('auth');

// Authenticated routes
Route::middleware('auth')->group(function () {
    Route::get('/',                               [MusicController::class, 'index'])->name('home');
    Route::get('/music',                          [MusicController::class, 'index'])->name('music.index');
    Route::post('/music/upload',                  [MusicController::class, 'upload'])->name('music.upload');
    Route::patch('/music/{music}/rename',         [MusicController::class, 'rename'])->name('music.rename');
    Route::delete('/music/{music}',               [MusicController::class, 'destroy'])->name('music.destroy');
    Route::get('/music/{music}/stream',           [MusicController::class, 'stream'])->name('music.stream');

    Route::get('/profile',                        [ProfileController::class, 'show'])->name('profile.show');
    Route::patch('/profile',                      [ProfileController::class, 'update'])->name('profile.update');
    Route::patch('/profile/password',             [ProfileController::class, 'updatePassword'])->name('profile.password');
    Route::post('/profile/avatar',                [ProfileController::class, 'updateAvatar'])->name('profile.avatar');
});