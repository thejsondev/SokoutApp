<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

#[Fillable([
    'ticket_message_id',
    'path',
    'original_name',
    'mime_type',
    'size',
])]
class TicketFile extends Model
{
    public function message(): BelongsTo
    {
        return $this->belongsTo(TicketMessage::class, 'ticket_message_id');
    }

    public function deleteStored(): void
    {
        Storage::disk('local')->delete($this->path);
        $this->delete();
    }
}
