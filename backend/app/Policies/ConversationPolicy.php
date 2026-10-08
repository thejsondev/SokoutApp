<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Conversation;
use App\Models\User;

class ConversationPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, [Role::Hausmeister, Role::Hausverwaltung], true);
    }

    public function view(User $user, Conversation $conversation): bool
    {
        return $this->viewAny($user) && $conversation->involves($user);
    }

    public function create(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function addMessage(User $user, Conversation $conversation): bool
    {
        return $this->view($user, $conversation);
    }
}
