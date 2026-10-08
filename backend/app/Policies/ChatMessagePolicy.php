<?php

namespace App\Policies;

use App\Models\ChatMessage;
use App\Models\User;

class ChatMessagePolicy
{
    public function view(User $user, ChatMessage $chatMessage): bool
    {
        $chatMessage->loadMissing('conversation');

        return $chatMessage->conversation
            && $chatMessage->conversation->involves($user);
    }
}
