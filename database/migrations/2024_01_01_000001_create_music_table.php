<?php
// database/migrations/2024_01_01_000001_create_music_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('music', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');           // user-editable name
            $table->string('original_name');   // original filename
            $table->string('file_path');       // stored mp3 path
            $table->unsignedBigInteger('file_size')->default(0); // bytes
            $table->unsignedInteger('duration')->default(0);     // seconds
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('music'); }
};