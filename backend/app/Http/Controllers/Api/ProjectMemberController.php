<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Project\StoreProjectMemberRequest;
use App\Http\Requests\Project\UpdateProjectMembersRequest;
use App\Http\Resources\ProjectResource;
use App\Http\Resources\UserResource;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ProjectMemberController extends Controller
{
    public function index(Project $project): AnonymousResourceCollection
    {
        $this->authorize('view', $project);

        return UserResource::collection($project->members()->orderBy('last_name')->get());
    }

    public function store(StoreProjectMemberRequest $request, Project $project): ProjectResource
    {
        $this->authorize('manageMembers', $project);

        $project->members()->syncWithoutDetaching([$request->integer('user_id')]);
        $project->load(['hausverwaltung', 'members']);

        return ProjectResource::make($project);
    }

    public function update(UpdateProjectMembersRequest $request, Project $project): ProjectResource
    {
        $this->authorize('manageMembers', $project);

        $project->members()->sync($request->validated('user_ids'));
        $project->load(['hausverwaltung', 'members']);

        return ProjectResource::make($project);
    }

    public function destroy(Project $project, User $user): Response
    {
        $this->authorize('manageMembers', $project);

        $project->members()->detach($user->id);

        return response()->noContent();
    }
}
