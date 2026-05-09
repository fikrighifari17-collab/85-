<?php

namespace App\Http\Controllers;

use App\Models\Music;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
            $query->where('user_id', $userId)
                  ->orWhere('user_id', $adminId);
        })->latest()->get();

        return view('music.index', compact('music'));
    }

    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:mp3,mp4,m4a,ogg,wav,flac,mpeg|max:51200',
        ]);

        $file         = $request->file('file');
        $extension    = strtolower($file->getClientOriginalExtension());
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $tmpInput     = $file->getRealPath();
        $ffmpegAvailable = $this->ffmpegAvailable();

        // Logika konversi FFmpeg dipertahankan sepenuhnya[cite: 1]
        if ($extension === 'mp3' || !$ffmpegAvailable) {
            $storagePath = 'music/' . Auth::id() . '/' . Str::uuid() . '.mp3';
            Storage::disk('local')->put($storagePath, file_get_contents($tmpInput));
            $duration = $ffmpegAvailable ? $this->getDuration($tmpInput) : 0;
        } else {
            $tmpOutput = sys_get_temp_dir() . '/' . Str::uuid() . '.mp3';
            // Konversi file non-mp3 ke MP3[cite: 1]
            $cmd = sprintf(
                'ffmpeg -y -i %s -vn -acodec libmp3lame -q:a 2 %s 2>&1',
                escapeshellarg($tmpInput),
                escapeshellarg($tmpOutput)
            );
            exec($cmd, $output, $exitCode);

            if ($exitCode !== 0 || !file_exists($tmpOutput)) {
                return back()->withErrors(['file' => 'Konversi gagal.']);
            }

            $storagePath = 'music/' . Auth::id() . '/' . Str::uuid() . '.mp3';
            Storage::disk('local')->put($storagePath, file_get_contents($tmpOutput));
            @unlink($tmpOutput);
            $duration = $this->getDuration(Storage::disk('local')->path($storagePath));
        }

        $fileSize = Storage::disk('local')->size($storagePath);

        Auth::user()->music()->create([
            'title'         => $originalName,
            'original_name' => $file->getClientOriginalName(),
            'file_path'     => $storagePath,
            'file_size'     => $fileSize,
            'duration'      => $duration,
        ]);

        return back()->with('success', 'Musik berhasil diupload!');
    }

    /**
     * Menangani Rename (Update Judul)[cite: 1]
     */
    public function update(Request $request, Music $music)
    {
        // Hanya pemilik asli yang bisa mengubah judul lagu mereka[cite: 1]
        if ($music->user_id !== Auth::id()) abort(403);
        
        $data = $request->validate(['title' => 'required|string|max:200']);
        $music->update($data);

        if ($request->ajax()) {
            return response()->json(['success' => true, 'title' => $music->title]);
        }

        return back()->with('success', 'Judul musik berhasil diperbarui!');
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