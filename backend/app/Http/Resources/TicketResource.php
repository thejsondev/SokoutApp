<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status?->value,
            'project_id' => $this->project_id,
            'appointment_at' => $this->appointment_at,
            'user' => UserResource::make($this->whenLoaded('user')),
            'project' => ProjectResource::make($this->whenLoaded('project')),
            'messages' => TicketMessageResource::collection($this->whenLoaded('messages')),
            ...($this->mergeRatingFlags()),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    /**
     * @return array<string, bool>
     */
    private function mergeRatingFlags(): array
    {
        $attributes = $this->resource->getAttributes();
        if (! array_key_exists('can_rate', $attributes)) {
            return [];
        }

        return [
            'can_rate' => (bool) $this->can_rate,
            'rated' => (bool) $this->rated,
        ];
    }
}
