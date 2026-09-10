<?php

namespace App\Http\Controllers\Api;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectJoinController extends Controller
{
    public function show(string $token): JsonResponse
    {
        $project = $this->findByToken($token);
        $kind = $project->hv_join_token === $token ? 'hausverwaltung' : 'bewohner';

        return response()->json([
            'data' => ProjectResource::make($project)->resolve(),
            'join_kind' => $kind,
        ]);
    }

    public function store(Request $request, string $token): JsonResponse
    {
        $user = $request->user();
        $project = $this->findByToken($token);
        $isHvQr = $project->hv_join_token === $token;

        if ($isHvQr) {
            if ($user->role !== Role::Hausverwaltung) {
                return response()->json([
                    'message' => 'Nur Hausverwaltung kann diesem QR beitreten.',
                ], 403);
            }

            if ($project->hausverwaltung_user_id && $project->hausverwaltung_user_id !== $user->id) {
                return response()->json([
                    'message' => 'Dieses Projekt hat bereits eine Hausverwaltung.',
                ], 403);
            }

            $project->hausverwaltung_user_id = $user->id;
            $project->save();
        } else {
            if ($user->role !== Role::Bewohner) {
                return response()->json([
                    'message' => 'Nur Bewohner können einem Projekt per QR beitreten.',
                ], 403);
            }

            $project->members()->syncWithoutDetaching([$user->id]);
        }

        $project->load(['hausverwaltung', 'members']);

        return response()->json([
            'project' => ProjectResource::make($project)->resolve(),
        ]);
    }

    private function findByToken(string $token): Project
    {
        return Project::query()
            ->where('join_token', $token)
            ->orWhere('hv_join_token', $token)
            ->with(['hausverwaltung'])
            ->firstOrFail();
    }
}
