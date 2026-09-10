<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Project $project): bool
    {
        return $user->canAccessProject($project);
    }

    public function create(User $user): bool
    {
        return $user->role === Role::Hausmeister
            || $user->role === Role::Hausverwaltung;
    }

    public function update(User $user, Project $project): bool
    {
        return $user->role === Role::Hausmeister
            || $project->hausverwaltung_user_id === $user->id;
    }

    public function delete(User $user, Project $project): bool
    {
        return $user->role === Role::Hausmeister
            || $project->hausverwaltung_user_id === $user->id;
    }

    public function manageMembers(User $user, Project $project): bool
    {
        return $user->role === Role::Hausmeister
            || $project->hausverwaltung_user_id === $user->id;
    }
}
