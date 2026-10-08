<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ChatFileController extends Controller
{
    public function show(Request $request, ChatFile $chatFile): StreamedResponse
    {
        $chatFile->load('message.conversation');
        $this->authorize('view', $chatFile);

        abort_unless(Storage::disk('local')->exists($chatFile->path), 404);

        $disposition = $request->boolean('download') ? 'attachment' : 'inline';

        return Storage::disk('local')->response(
            $chatFile->path,
            $chatFile->original_name,
            [
                'Content-Type' => $chatFile->mime_type ?: 'application/octet-stream',
            ],
            $disposition,
        );
    }
}
