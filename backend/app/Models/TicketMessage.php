<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\UploadedFile;

#[Fillable([
    'ticket_id',
    'user_id',
    'body',
    'kind',
])]
class TicketMessage extends Model
{
    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function files(): HasMany
    {
        return $this->hasMany(TicketFile::class);
    }

    /**
     * @param  array<int, UploadedFile>  $files
     */
    public function storeUploadedFiles(array $files): void
    {
        $this->loadMissing('ticket');
        $directory = "tickets/{$this->ticket_id}";

        foreach ($files as $file) {
            $path = $file->store($directory, 'local');

            $this->files()->create([
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getClientMimeType() ?: 'application/octet-stream',
                'size' => $file->getSize(),
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
