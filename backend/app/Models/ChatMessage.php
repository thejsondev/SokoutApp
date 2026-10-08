<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\UploadedFile;

#[Fillable([
    'conversation_id',
    'user_id',
    'body',
])]
class ChatMessage extends Model
{
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function files(): HasMany
    {
        return $this->hasMany(ChatFile::class);
    }

    /**
     * @param  array<int, UploadedFile>  $files
     */
    public function storeUploadedFiles(array $files): void
    {
        $directory = "chats/{$this->conversation_id}";

        foreach ($files as $file) {
            $path = $file->store($directory, 'local');

            $this->files()->create([
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getClientMimeType() ?: 'application/octet-stream',
                'size' => $file->getSize() ?: 0,
            ]);
        }
    }

    public function purgeStoredFiles(): void
    {
        $this->loadMissing('files');

        foreach ($this->files as $file) {
            $file->deleteStored();
        }
    }
}
