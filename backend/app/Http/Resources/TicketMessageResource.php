<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketMessageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ticket_id' => $this->ticket_id,
            'kind' => $this->kind ?: 'message',
            'body' => $this->body,
            'user' => UserResource::make($this->whenLoaded('user')),
            'files' => TicketFileResource::collection($this->whenLoaded('files')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
