<?php

namespace App\Http\Controllers\Api;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectPresenceLogResource;
use App\Http\Resources\UserResource;
use App\Models\Project;
use App\Models\ProjectPresenceLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class ProjectPresenceController extends Controller
{
    public function show(Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $logs = $project->presenceLogs()
            ->with('user')
            ->latest()
            ->limit(200)
            ->get();

        return response()->json([
            'data' => [
                'present_users' => UserResource::collection($this->presentUsers($project)),
                'is_present' => $this->isPresent($project, request()->user()),
                'logs' => ProjectPresenceLogResource::collection($logs),
            ],
        ]);
    }

    public function index(Project $project): AnonymousResourceCollection
    {
        $this->authorize('view', $project);

        $logs = $project->presenceLogs()
            ->with('user')
            ->latest()
            ->paginate(100);

        return ProjectPresenceLogResource::collection($logs);
    }

    public function toggle(Request $request, Project $project): JsonResponse
    {
        $this->authorize('togglePresence', $project);

        /** @var User $user */
        $user = $request->user();

        $log = DB::transaction(function () use ($project, $user) {
            $latest = $project->presenceLogs()
                ->where('user_id', $user->id)
                ->latest('id')
                ->lockForUpdate()
                ->first();

            $nextEvent = $latest && $latest->event === ProjectPresenceLog::EVENT_ARRIVE
                ? ProjectPresenceLog::EVENT_LEAVE
                : ProjectPresenceLog::EVENT_ARRIVE;

            return $project->presenceLogs()->create([
                'user_id' => $user->id,
                'event' => $nextEvent,
            ]);
        });

        $log->load('user');

        return response()->json([
            'data' => [
                'log' => ProjectPresenceLogResource::make($log),
                'present_users' => UserResource::collection($this->presentUsers($project->fresh())),
                'is_present' => $log->event === ProjectPresenceLog::EVENT_ARRIVE,
            ],
        ], 201);
    }

    /**
     * @return \Illuminate\Support\Collection<int, User>
     */
    public static function presentUsers(Project $project)
    {
        $latestIds = ProjectPresenceLog::query()
            ->selectRaw('MAX(id) as id')
            ->where('project_id', $project->id)
            ->groupBy('user_id');

        $userIds = ProjectPresenceLog::query()
            ->whereIn('id', $latestIds)
            ->where('event', ProjectPresenceLog::EVENT_ARRIVE)
            ->pluck('user_id');

        return User::query()
            ->whereIn('id', $userIds)
            ->where('role', Role::Hausmeister)
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();
    }

    public static function isPresent(Project $project, ?User $user): bool
    {
        if (! $user || $user->role !== Role::Hausmeister) {
            return false;
        }

        $latest = $project->presenceLogs()
            ->where('user_id', $user->id)
            ->latest('id')
            ->first();

        return $latest?->event === ProjectPresenceLog::EVENT_ARRIVE;
    }
}
