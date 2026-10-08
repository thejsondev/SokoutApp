<?php

namespace App\Models;

use App\Enums\Role;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

#[Fillable([
    'title',
    'address',
    'latitude',
    'longitude',
    'hausverwaltung_user_id',
    'created_by_user_id',
    'join_token',
    'hv_join_token',
    'contract_path',
    'contract_original_name',
    'contract_mime_type',
    'contract_size',
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

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withTimestamps();
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    public function presenceLogs(): HasMany
    {
        return $this->hasMany(ProjectPresenceLog::class);
    }

    /**
     * Hausmeisters connected to this project (creator, presence, ticket activity).
     * Falls back to all Hausmeister accounts when none are linked yet.
     *
     * @return EloquentCollection<int, User>
     */
    public function linkedHausmeisters(): EloquentCollection
    {
        $ids = $this->linkedHausmeisterIds();

        if ($ids->isEmpty()) {
            return User::query()
                ->where('role', Role::Hausmeister)
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get();
        }

        return User::query()
            ->where('role', Role::Hausmeister)
            ->whereIn('id', $ids)
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();
    }

    /**
     * @return Collection<int, int>
     */
    public function linkedHausmeisterIds(): Collection
    {
        $ids = collect();

        if ($this->created_by_user_id) {
            $ids->push((int) $this->created_by_user_id);
        }

        $ids = $ids->merge(
            ProjectPresenceLog::query()
                ->where('project_id', $this->id)
                ->whereHas('user', fn ($query) => $query->where('role', Role::Hausmeister))
                ->pluck('user_id'),
        );

        $ids = $ids->merge(
            TicketMessage::query()
                ->whereHas('ticket', fn ($query) => $query->where('project_id', $this->id))
                ->whereHas('user', fn ($query) => $query->where('role', Role::Hausmeister))
                ->pluck('user_id'),
        );

        return $ids->map(fn ($id) => (int) $id)->unique()->values();
    }

    public function hasContract(): bool
    {
        return filled($this->contract_path);
    }

    public function storeContract(UploadedFile $file): void
    {
        $this->deleteContractFile();

        $path = $file->store("projects/{$this->id}/contracts", 'local');

        $this->forceFill([
            'contract_path' => $path,
            'contract_original_name' => $file->getClientOriginalName(),
            'contract_mime_type' => $file->getClientMimeType() ?: 'application/pdf',
            'contract_size' => $file->getSize() ?: 0,
        ])->save();
    }

    public function deleteContract(): void
    {
        $this->deleteContractFile();

        $this->forceFill([
            'contract_path' => null,
            'contract_original_name' => null,
            'contract_mime_type' => null,
            'contract_size' => null,
        ])->save();
    }

    public function purgeStoredFiles(): void
    {
        $this->deleteContractFile();
        Storage::disk('local')->deleteDirectory("projects/{$this->id}");

        $this->loadMissing('tickets.messages.files');

        foreach ($this->tickets as $ticket) {
            $ticket->purgeStoredFiles();
        }
    }

    private function deleteContractFile(): void
    {
        if ($this->contract_path) {
            Storage::disk('local')->delete($this->contract_path);
        }
    }
}
