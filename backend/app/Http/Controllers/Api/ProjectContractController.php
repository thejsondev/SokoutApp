<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Project\StoreProjectContractRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProjectContractController extends Controller
{
    public function show(Request $request, Project $project): StreamedResponse
    {
        $this->authorize('view', $project);

        abort_unless($project->hasContract(), 404);
        abort_unless(Storage::disk('local')->exists((string) $project->contract_path), 404);

        $disposition = $request->boolean('download') ? 'attachment' : 'inline';

        return Storage::disk('local')->response(
            (string) $project->contract_path,
            (string) ($project->contract_original_name ?: 'vertrag.pdf'),
            [
                'Content-Type' => $project->contract_mime_type ?: 'application/pdf',
            ],
            $disposition,
        );
    }

    public function store(StoreProjectContractRequest $request, Project $project): ProjectResource
    {
        $this->authorize('manageContract', $project);

        $project->storeContract($request->file('contract'));
        $project->load(['hausverwaltung', 'members']);

        return ProjectResource::make($project);
    }

    public function destroy(Project $project): Response
    {
        $this->authorize('manageContract', $project);

        $project->deleteContract();

        return response()->noContent();
    }
}
