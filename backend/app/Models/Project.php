<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

#[Fillable([
    'title',
    'address',
    'latitude',
    'longitude',
    'hausverwaltung_user_id',
    'join_token',
    'hv_join_token',
])]
class Project extends Model
{
    protected static function booted(): void
    {
        static::creating(function (Project $project): void {
            if (! $project->join_token) {
                $project->join_token = (string) Str::uuid();
            }
            if (! $project->hv_join_token) {
                $project->hv_join_token = (string) Str::uuid();
            }
        });
    }

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
        ];
    }

    public function hausverwaltung(): BelongsTo
    {
        return $this->belongsTo(User::class, 'hausverwaltung_user_id');
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withTimestamps();
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    public function purgeStoredFiles(): void
    {
        $this->loadMissing('tickets.messages.files');

        foreach ($this->tickets as $ticket) {
            $ticket->purgeStoredFiles();
        }
    }
}
