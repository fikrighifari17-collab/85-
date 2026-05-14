<?php

namespace App\Http\Controllers;

use App\Models\Music;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse; // Perbaikan: 'use', bukan 'uses'

class MusicController extends Controller
{
    /**
     * Menampilkan lagu milik User sendiri DAN lagu milik Admin (ID: 1)
     */
    public function index()
    {
        $adminId = 1; // ID Akun Admin
        $userId = Auth::id();

        // Mengambil musik milik user atau milik admin agar muncul di semua akun[cite: 1]
        $music = Music::where(function($query) use ($userId, $adminId) {
            $query->where('user_id', $userId);
            if ($userId !== $adminId) {
                $query->orWhere('user_id', $adminId);
            }
        })->latest()->get();

        $artists = Music::where('user_id', $userId)->whereNotNull('artist')->distinct()->pluck('artist');
        $albums  = Music::where('user_id', $userId)->whereNotNull('album')->distinct()->pluck('album');
        $genres  = Music::where('user_id', $userId)->whereNotNull('genre')->distinct()->pluck('genre');

        return view('music.index', compact('music', 'artists', 'albums', 'genres'));
    }

    public function upload(Request $request)
    {
        $request->validate([
            'file'   => 'required|file|mimes:mp3,mp4,m4a,ogg,wav,flac,mpeg|max:51200',
            'title'  => 'nullable|string|max:200',
            'artist' => 'nullable|string|max:200',
            'album'  => 'nullable|string|max:200',
            'cover'  => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        $file         = $request->file('file');
        $extension    = strtolower($file->getClientOriginalExtension());
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $tmpInput     = $file->getRealPath();
        $ffmpegAvailable = $this->ffmpegAvailable();

        // FFmpeg conversion logic
        if ($extension === 'mp3' || !$ffmpegAvailable) {
            $storagePath = 'music/' . Auth::id() . '/' . Str::uuid() . '.mp3';
            Storage::disk('local')->put($storagePath, file_get_contents($tmpInput));
            $duration = $ffmpegAvailable ? $this->getDuration($tmpInput) : 0;
        } else {
            $tmpOutput = sys_get_temp_dir() . '/' . Str::uuid() . '.mp3';
            $cmd = sprintf(
                'ffmpeg -y -i %s -vn -acodec libmp3lame -q:a 2 %s 2>&1',
                escapeshellarg($tmpInput),
                escapeshellarg($tmpOutput)
            );
            exec($cmd, $output, $exitCode);

            if ($exitCode !== 0 || !file_exists($tmpOutput)) {
                return back()->withErrors(['file' => 'Conversion failed.']);
            }

            $storagePath = 'music/' . Auth::id() . '/' . Str::uuid() . '.mp3';
            Storage::disk('local')->put($storagePath, file_get_contents($tmpOutput));
            @unlink($tmpOutput);
            $duration = $this->getDuration(Storage::disk('local')->path($storagePath));
        }

        $fileSize = Storage::disk('local')->size($storagePath);

        // Process cover if uploaded
        $coverPath = null;
        if ($request->hasFile('cover')) {
            $coverPath = $request->file('cover')->store('covers', 'public');
        } else {
            // Auto-inherit cover if artist & album match an existing song in user library
            if ($request->artist && $request->album) {
                $existingCover = Auth::user()->music()
                    ->where('artist', $request->artist)
                    ->where('album', $request->album)
                    ->whereNotNull('cover_path')
                    ->where('cover_path', '!=', '')
                    ->orderBy('created_at', 'desc')
                    ->value('cover_path');

                if ($existingCover) {
                    $coverPath = $existingCover;
                }
            }
        }

        $genre = $request->genre ?: $this->identifyGenre($request->artist, $request->title ?: $originalName, Storage::disk('local')->path($storagePath));

        Auth::user()->music()->create([
            'title'         => $request->title ?? $originalName,
            'artist'        => $request->artist,
            'album'         => $request->album,
            'genre'         => $genre,
            'original_name' => $file->getClientOriginalName(),
            'file_path'     => $storagePath,
            'cover_path'    => $coverPath,
            'file_size'     => $fileSize,
            'duration'      => $duration,
        ]);

        if ($request->ajax() || $request->wantsJson()) {
            return response()->json(['success' => true, 'message' => 'Music uploaded successfully!']);
        }

        return back()->with('success', 'Musik berhasil diupload!');
    }

    /**
     * Menangani Rename (Update Judul)[cite: 1]
     */
    public function update(Request $request, Music $music)
    {
        if ($music->user_id !== Auth::id()) abort(403);
        
        $data = $request->validate([
            'title'  => 'required|string|max:200',
            'artist' => 'nullable|string|max:200',
            'album'  => 'nullable|string|max:200',
            'genre'  => 'nullable|string|max:200',
            'cover'  => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        // Auto-identify genre if missing during update
        if (empty($data['genre'])) {
            $data['genre'] = $this->identifyGenre($data['artist'], $data['title'], Storage::disk('local')->path($music->file_path));
        }

        if ($request->hasFile('cover')) {
            // Delete old cover if exists
            if ($music->cover_path) {
                Storage::disk('public')->delete($music->cover_path);
            }
            $data['cover_path'] = $request->file('cover')->store('covers', 'public');
        }

        $music->update($data);

        if ($request->ajax() || $request->wantsJson()) {
            return response()->json([
                'success' => true, 
                'title' => $music->title,
                'artist' => $music->artist,
                'album' => $music->album,
                'genre' => $music->genre,
                'cover_url' => $music->cover_url
            ]);
        }

        return back()->with('success', 'Metadata musik berhasil diperbarui!');
    }

    public function rename(Request $request, Music $music)
    {
        return $this->update($request, $music);
    }

    public function destroy(Music $music)
    {
        // Hanya pemilik asli yang bisa menghapus lagu mereka[cite: 1]
        if ($music->user_id !== Auth::id()) abort(403);
        
        Storage::disk('local')->delete($music->file_path);
        $music->delete();
        
        return back()->with('success', 'Musik dihapus.');
    }

    public function stream(Music $music): StreamedResponse
    {
        // User diizinkan streaming lagunya sendiri atau lagu milik admin[cite: 1]
        $adminId = 1;
        if ($music->user_id !== Auth::id() && $music->user_id !== $adminId) abort(403);

        $path = Storage::disk('local')->path($music->file_path);
        if (!file_exists($path)) abort(404, 'File tidak ditemukan.');

        $size    = filesize($path);
        $start   = 0;
        $end     = $size - 1;
        $status  = 200;
        $headers = [
            'Content-Type'        => 'audio/mpeg',
            'Accept-Ranges'       => 'bytes',
            'Content-Disposition' => 'inline',
            'Cache-Control'       => 'no-cache',
            'Content-Length'      => $size,
        ];

        // Mendukung Range Request untuk seeking audio[cite: 1]
        if (request()->hasHeader('Range')) {
            $range = request()->header('Range');
            preg_match('/bytes=(\d+)-(\d*)/', $range, $matches);
            $start  = (int) $matches[1];
            $end    = isset($matches[2]) && $matches[2] !== '' ? (int) $matches[2] : $size - 1;
            $status = 206;
            $headers['Content-Range']  = "bytes {$start}-{$end}/{$size}";
            $headers['Content-Length'] = $end - $start + 1;
        }

        return response()->stream(function () use ($path, $start, $end) {
            $fp        = fopen($path, 'rb');
            fseek($fp, $start);
            $remaining = $end - $start + 1;
            while (!feof($fp) && $remaining > 0) {
                $chunk = min(8192, $remaining);
                echo fread($fp, $chunk);
                $remaining -= $chunk;
                flush();
            }
            fclose($fp);
        }, $status, $headers);
    }

    private function identifyGenre($artist, $title, $filePath): ?string
    {
        // 1. Try getID3
        try {
            $getID3 = new \getID3;
            $fileInfo = $getID3->analyze($filePath);
            
            // Try different tag formats
            $genre = $fileInfo['tags']['id3v2']['genre'][0] 
                  ?? $fileInfo['tags']['id3v1']['genre'][0]
                  ?? $fileInfo['tags']['quicktime']['genre'][0]
                  ?? null;

            if ($genre) return $genre;
        } catch (\Exception $e) {}

        // 2. Fallback to iTunes API
        if ($artist && $title) {
            try {
                $response = Http::timeout(3)->get('https://itunes.apple.com/search', [
                    'term'   => $artist . ' ' . $title,
                    'entity' => 'song',
                    'limit'  => 1
                ]);
                if ($response->successful()) {
                    $results = $response->json('results');
                    if (!empty($results)) {
                        return $results[0]['primaryGenreName'];
                    }
                }
            } catch (\Exception $e) {}
        }

        return null;
    }

    private function ffmpegAvailable(): bool
    {
        exec('ffmpeg -version 2>&1', $out, $code);
        return $code === 0;
    }

    private function getDuration(string $filePath): int
    {
        $cmd = sprintf(
            'ffprobe -v quiet -show_entries format=duration -of csv=p=0 %s',
            escapeshellarg($filePath)
        );
        return (int) round((float) shell_exec($cmd));
    }
}