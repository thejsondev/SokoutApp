<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectPresenceLogResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'event' => $this->event,
            'user' => UserResource::make($this->whenLoaded('user')),
            'created_at' => $this->created_at,
        ];
    }
}
