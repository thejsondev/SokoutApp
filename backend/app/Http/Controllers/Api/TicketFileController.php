<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Ticket\StoreTicketFileRequest;
use App\Http\Resources\TicketFileResource;
use App\Models\TicketFile;
use App\Models\TicketMessage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TicketFileController extends Controller
{
    public function index(TicketMessage $ticketMessage): AnonymousResourceCollection
    {
        $ticketMessage->load('ticket.project');
        $this->authorize('view', $ticketMessage);

        return TicketFileResource::collection($ticketMessage->files()->latest()->get());
    }

    public function store(StoreTicketFileRequest $request, TicketMessage $ticketMessage): AnonymousResourceCollection
    {
        $ticketMessage->load('ticket.project');
        $this->authorize('addMessage', $ticketMessage->ticket);

        $files = $request->file('files', []);
        $ticketMessage->storeUploadedFiles(TicketController::uploadedFiles($files));

        return TicketFileResource::collection($ticketMessage->files()->latest()->get());
    }

    public function show(Request $request, TicketFile $ticketFile): StreamedResponse
    {
        $ticketFile->load('message.ticket.project');
        $this->authorize('view', $ticketFile);

        abort_unless(Storage::disk('local')->exists($ticketFile->path), 404);

        $disposition = $request->boolean('download') ? 'attachment' : 'inline';

        return Storage::disk('local')->response(
            $ticketFile->path,
            $ticketFile->original_name,
            [
                'Content-Type' => $ticketFile->mime_type ?: 'application/octet-stream',
            ],
            $disposition,
        );
    }

    public function destroy(TicketFile $ticketFile): Response
    {
        $ticketFile->load('message.ticket.project');
        $this->authorize('delete', $ticketFile);

        $ticketFile->deleteStored();

        return response()->noContent();
    }
}
