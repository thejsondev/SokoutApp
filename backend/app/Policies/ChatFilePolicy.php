<?php

namespace App\Policies;

use App\Models\ChatFile;
use App\Models\User;

class ChatFilePolicy
{
    public function view(User $user, ChatFile $chatFile): bool
    {
        $chatFile->loadMissing('message.conversation');

        return $chatFile->message?->conversation
            && $chatFile->message->conversation->involves($user);
    }
}
