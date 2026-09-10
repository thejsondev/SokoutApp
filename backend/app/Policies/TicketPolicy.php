<?php

namespace App\Policies;

use App\Enums\Role;
use App\Enums\TicketStatus;
use App\Models\Ticket;
use App\Models\User;

class TicketPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->role === Role::Hausmeister;
    }

    public function view(User $user, Ticket $ticket): bool
    {
        return $user->canAccessProject($ticket->project);
    }

    public function update(User $user, Ticket $ticket): bool
    {
        return $user->role === Role::Hausmeister;
    }

    public function respond(User $user, Ticket $ticket): bool
    {
        return $user->role === Role::Hausmeister;
    }

    public function addMessage(User $user, Ticket $ticket): bool
    {
        return $ticket->status === TicketStatus::Qa
            && $user->canAccessProject($ticket->project);
    }

    public function delete(User $user, Ticket $ticket): bool
    {
        return $user->id === $ticket->user_id
            || $ticket->project->hausverwaltung_user_id === $user->id;
    }

    public function rate(User $user, Ticket $ticket): bool
    {
        return $ticket->status === TicketStatus::Done
            && $user->role === Role::Bewohner
            && $user->projects()->where('projects.id', $ticket->project_id)->exists();
    }
}
