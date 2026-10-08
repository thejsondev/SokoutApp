<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

#[Fillable([
    'chat_message_id',
    'path',
    'original_name',
    'mime_type',
    'size',
])]
class ChatFile extends Model
{
    public function message(): BelongsTo
    {
        return $this->belongsTo(ChatMessage::class, 'chat_message_id');
    }

    public function deleteStored(): void
    {
        Storage::disk('local')->delete($this->path);
        $this->delete();
    }

    public function isAudio(): bool
    {
        return str_starts_with((string) $this->mime_type, 'audio/');
    }

    public function isImage(): bool
    {
        return str_starts_with((string) $this->mime_type, 'image/');
    }
}
