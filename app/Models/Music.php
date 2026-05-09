<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Music extends Model
{
    protected $fillable = ['user_id','title','original_name','file_path','file_size','duration'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function getDurationFormattedAttribute(): string
    {
        $mins = floor($this->duration / 60);
        $secs = $this->duration % 60;
        return sprintf('%d:%02d', $mins, $secs);
    }

    public function getFileSizeFormattedAttribute(): string
    {
        $kb = $this->file_size / 1024;
        if ($kb < 1024) return round($kb, 1) . ' KB';
        return round($kb / 1024, 1) . ' MB';
    }
}