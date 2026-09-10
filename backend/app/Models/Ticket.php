<?php

namespace App\Models;

use App\Enums\TicketStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

#[Fillable([
    'project_id',
    'user_id',
    'status',
    'appointment_at',
])]
class Ticket extends Model
{
    protected function casts(): array
    {
        return [
            'status' => TicketStatus::class,
            'appointment_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(TicketMessage::class)->orderBy('created_at');
    }

    public function ratings(): HasMany
    {
        return $this->hasMany(TicketRating::class);
    }

    public function purgeStoredFiles(): void
    {
        $this->loadMissing('messages.files');

        foreach ($this->messages as $message) {
            $message->purgeStoredFiles();
        }

        Storage::disk('local')->deleteDirectory("tickets/{$this->id}");
    }
}
