<?php

namespace App\Http\Resources;

use App\Http\Controllers\Api\ProjectPresenceController;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $presentUsers = ProjectPresenceController::presentUsers($this->resource);

        return [
            'id' => $this->id,
            'title' => $this->title,
            'address' => $this->address,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'join_token' => $this->when($request->user() !== null, $this->join_token),
            'hv_join_token' => $this->when(
                $request->user() !== null && $this->hausverwaltung_user_id !== null,
                $this->hv_join_token,
            ),
            'hausverwaltung' => UserResource::make($this->whenLoaded('hausverwaltung')),
            'members' => UserResource::collection($this->whenLoaded('members')),
            'presence' => [
                'is_present' => ProjectPresenceController::isPresent($this->resource, $request->user()),
                'anyone_present' => $presentUsers->isNotEmpty(),
                'present_users' => UserResource::collection($presentUsers),
            ],
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
