<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Ticket\StoreTicketMessageRequest;
use App\Http\Requests\Ticket\UpdateTicketMessageRequest;
use App\Http\Resources\TicketMessageResource;
use App\Models\Ticket;
use App\Models\TicketMessage;
use App\Services\PushNotifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class TicketMessageController extends Controller
{
    public function index(Ticket $ticket): AnonymousResourceCollection
    {
        $ticket->load('project');
        $this->authorize('view', $ticket);

        $messages = $ticket->messages()
            ->with(['user', 'files'])
            ->oldest()
            ->get();

        return TicketMessageResource::collection($messages);
    }

    public function store(StoreTicketMessageRequest $request, Ticket $ticket): JsonResponse
    {
        $ticket->load('project');
        $this->authorize('addMessage', $ticket);

        $message = $ticket->messages()->create([
            'user_id' => $request->user()->id,
            'body' => trim((string) $request->validated('body', '')),
        ]);

        $message->storeUploadedFiles(TicketController::uploadedFiles($request->file('files')));
        $message->load(['user', 'files']);

        $preview = $message->body !== '' ? $message->body : 'Neues Foto';
        app(PushNotifier::class)->notifyTicketLater($ticket, $request->user(), 'Neue Nachricht', $preview);

        return TicketMessageResource::make($message)->response()->setStatusCode(201);
    }

    public function show(TicketMessage $ticketMessage): TicketMessageResource
    {
        $ticketMessage->load(['ticket.project', 'user', 'files']);
        $this->authorize('view', $ticketMessage);

        return TicketMessageResource::make($ticketMessage);
    }

    public function update(UpdateTicketMessageRequest $request, TicketMessage $ticketMessage): TicketMessageResource
    {
        $ticketMessage->load('ticket.project');
        $this->authorize('update', $ticketMessage);

        $ticketMessage->update($request->validated());
        $ticketMessage->load(['user', 'files']);

        return TicketMessageResource::make($ticketMessage);
    }

    public function destroy(TicketMessage $ticketMessage): Response
    {
        $ticketMessage->load('ticket.project');
        $this->authorize('delete', $ticketMessage);

        $ticketMessage->purgeStoredFiles();
        $ticketMessage->delete();

        return response()->noContent();
    }
}
