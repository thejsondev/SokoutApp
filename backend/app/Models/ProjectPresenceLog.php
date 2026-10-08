<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'project_id',
    'user_id',
    'event',
])]
class ProjectPresenceLog extends Model
{
    public const EVENT_ARRIVE = 'arrive';

    public const EVENT_LEAVE = 'leave';

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isArrive(): bool
    {
        return $this->event === self::EVENT_ARRIVE;
    }
}
