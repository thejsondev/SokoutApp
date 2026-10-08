<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'hausmeister_user_id',
    'hausverwaltung_user_id',
    'last_message_at',
])]
class Conversation extends Model
{
    protected function casts(): array
    {
        return [
            'last_message_at' => 'datetime',
        ];
    }

    public function hausmeister(): BelongsTo
    {
        return $this->belongsTo(User::class, 'hausmeister_user_id');
    }

    public function hausverwaltung(): BelongsTo
    {
        return $this->belongsTo(User::class, 'hausverwaltung_user_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(ChatMessage::class)->oldest();
    }

    public function latestMessage(): HasOne
    {
        return $this->hasOne(ChatMessage::class)->latestOfMany();
    }

    public function involves(User $user): bool
    {
        return (int) $this->hausmeister_user_id === (int) $user->id
            || (int) $this->hausverwaltung_user_id === (int) $user->id;
    }

    public function peerFor(User $user): ?User
    {
        if ((int) $this->hausmeister_user_id === (int) $user->id) {
            return $this->relationLoaded('hausverwaltung')
                ? $this->hausverwaltung
                : $this->hausverwaltung()->first();
        }

        if ((int) $this->hausverwaltung_user_id === (int) $user->id) {
            return $this->relationLoaded('hausmeister')
                ? $this->hausmeister
                : $this->hausmeister()->first();
        }

        return null;
    }
}
