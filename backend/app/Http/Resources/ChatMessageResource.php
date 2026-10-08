<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatMessageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'body' => $this->body,
            'user' => UserResource::make($this->whenLoaded('user')),
            'files' => ChatFileResource::collection($this->whenLoaded('files')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
