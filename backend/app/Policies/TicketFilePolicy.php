<?php

namespace App\Policies;

use App\Models\TicketFile;
use App\Models\User;

class TicketFilePolicy
{
    public function view(User $user, TicketFile $ticketFile): bool
    {
        return $user->canAccessProject($ticketFile->message->ticket->project);
    }

    public function create(User $user, TicketFile $ticketFile): bool
    {
        return $user->canAccessProject($ticketFile->message->ticket->project);
    }

    public function delete(User $user, TicketFile $ticketFile): bool
    {
        $message = $ticketFile->message;
        $project = $message->ticket->project;

        return $user->id === $message->user_id
            || $project->hausverwaltung_user_id === $user->id;
    }
}
