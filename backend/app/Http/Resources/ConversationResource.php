<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var User|null $viewer */
        $viewer = $request->user();
        $peer = $viewer ? $this->peerFor($viewer) : null;

        return [
            'id' => $this->id,
            'peer' => $peer ? UserResource::make($peer) : null,
            'hausmeister' => UserResource::make($this->whenLoaded('hausmeister')),
            'hausverwaltung' => UserResource::make($this->whenLoaded('hausverwaltung')),
            'messages' => ChatMessageResource::collection($this->whenLoaded('messages')),
            'last_message' => $this->when(
                $this->relationLoaded('latestMessage') && $this->latestMessage,
                fn () => ChatMessageResource::make(
                    $this->latestMessage->loadMissing(['user', 'files']),
                ),
            ),
            'last_message_at' => $this->last_message_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
