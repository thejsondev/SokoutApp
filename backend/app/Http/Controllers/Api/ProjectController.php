<?php

namespace App\Http\Controllers\Api;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\Project\StoreProjectRequest;
use App\Http\Requests\Project\UpdateProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ProjectController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Project::class);

        $user = $request->user();

        $projects = Project::query()
            ->when(
                $user->role !== Role::Hausmeister,
                function ($query) use ($user) {
                    $query->where(function ($inner) use ($user) {
                        $inner->where('hausverwaltung_user_id', $user->id)
                            ->orWhereHas('members', fn ($members) => $members->where('users.id', $user->id));
                    });
                },
            )
            ->with(['hausverwaltung', 'members'])
            ->latest()
            ->paginate();

        return ProjectResource::collection($projects);
    }

    public function store(StoreProjectRequest $request): ProjectResource
    {
        $this->authorize('create', Project::class);

        $data = $request->validated();

        if ($request->user()->role === Role::Hausverwaltung) {
            $data['hausverwaltung_user_id'] ??= $request->user()->id;
        }

        $project = Project::query()->create($data);
        $project->load(['hausverwaltung', 'members']);

        return ProjectResource::make($project);
    }

    public function show(Project $project): ProjectResource
    {
        $this->authorize('view', $project);

        $project->load(['hausverwaltung', 'members']);

        return ProjectResource::make($project);
    }

    public function update(UpdateProjectRequest $request, Project $project): ProjectResource
    {
        $this->authorize('update', $project);

        $project->update($request->validated());
        $project->load(['hausverwaltung', 'members']);

        return ProjectResource::make($project);
    }

    public function destroy(Project $project): Response
    {
        $this->authorize('delete', $project);

        $project->purgeStoredFiles();
        $project->delete();

        return response()->noContent();
    }
}
