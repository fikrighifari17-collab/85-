<?php
// app/Http/Controllers/ProfileController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    public function show()
    {
        $user = Auth::user();
        $adminId = 1;
        $userId = $user->id;

        // Same isolation logic as MusicController to prevent leaks
        $music = \App\Models\Music::where(function($query) use ($userId, $adminId) {
            $query->where('user_id', $userId)
                  ->orWhere('user_id', $adminId);
        })->get();

        $artists = \App\Models\Music::where('user_id', $userId)->whereNotNull('artist')->distinct()->pluck('artist');
        $albums  = \App\Models\Music::where('user_id', $userId)->whereNotNull('album')->distinct()->pluck('album');

        return view('profile.show', compact('user', 'music', 'artists', 'albums'));
    }

    public function update(Request $request)
    {
        $user = Auth::user();
        $data = $request->validate([
            'name'     => 'sometimes|required|string|max:100',
            'username' => 'sometimes|required|string|max:50|alpha_dash|unique:users,username,' . $user->id,
            'bio'      => 'nullable|string|max:500',
            'gender'   => 'nullable|in:Male,Female',
            'theme'    => 'nullable|in:default,red,blue,green,purple,slate',
        ]);
        
        $user->update($data);
        return back()->with('success', 'Profile successfully updated.');
    }

    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'password'         => ['required', 'confirmed', Password::min(8)],
        ]);

        $user = Auth::user();
        if (!Hash::check($request->current_password, $user->password)) {
            return back()->withErrors(['current_password' => 'Password saat ini salah.']);
        }
        $user->update(['password' => $request->password]);
        return back()->with('success', 'Password successfully changed.');
    }

    public function updateAvatar(Request $request)
    {
        $request->validate(['avatar' => 'required|image|mimes:jpg,png,jpeg|max:2048']);
        $user = Auth::user();

        try {
            // Delete old avatar
            if ($user->avatar) Storage::disk('public')->delete($user->avatar);

            $path = $request->file('avatar')->store('avatars', 'public');
            $user->update(['avatar' => $path]);

            if ($request->ajax() || $request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Profile photo updated.',
                    'avatar_url' => $user->avatar_url
                ]);
            }

            return back()->with('success', 'Profile photo updated.');
        } catch (\Exception $e) {
            if ($request->ajax() || $request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to upload photo: ' . $e->getMessage()
                ], 500);
            }
            return back()->with('error', 'Failed to upload photo.');
        }
    }
}