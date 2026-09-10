<?php

namespace App\Policies;

use App\Models\TicketMessage;
use App\Models\User;

class TicketMessagePolicy
{
    public function view(User $user, TicketMessage $ticketMessage): bool
    {
        return $user->canAccessProject($ticketMessage->ticket->project);
    }

    public function update(User $user, TicketMessage $ticketMessage): bool
    {
        return $user->id === $ticketMessage->user_id;
    }

    public function delete(User $user, TicketMessage $ticketMessage): bool
    {
        $project = $ticketMessage->ticket->project;

        return $user->id === $ticketMessage->user_id
            || $project->hausverwaltung_user_id === $user->id;
    }
}
