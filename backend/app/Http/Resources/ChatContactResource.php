<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatContactResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'peer' => UserResource::make($this->resource['peer']),
            'conversation_id' => $this->resource['conversation_id'],
            'project_titles' => $this->resource['project_titles'] ?? [],
            'last_message' => isset($this->resource['last_message']) && $this->resource['last_message']
                ? ChatMessageResource::make($this->resource['last_message'])
                : null,
            'last_message_at' => $this->resource['last_message_at'] ?? null,
        ];
    }
}
