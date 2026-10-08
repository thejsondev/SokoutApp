<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Chat\StoreChatMessageRequest;
use App\Http\Resources\ChatMessageResource;
use App\Models\Conversation;
use App\Services\PushNotifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ChatMessageController extends Controller
{
    public function index(Conversation $conversation): AnonymousResourceCollection
    {
        $this->authorize('view', $conversation);

        $messages = $conversation->messages()
            ->with(['user', 'files'])
            ->oldest()
            ->get();

        return ChatMessageResource::collection($messages);
    }

    public function store(StoreChatMessageRequest $request, Conversation $conversation): JsonResponse
    {
        $this->authorize('addMessage', $conversation);

        $body = trim((string) $request->validated('body', ''));

        $message = $conversation->messages()->create([
            'user_id' => $request->user()->id,
            'body' => $body !== '' ? $body : null,
        ]);

        $message->storeUploadedFiles(TicketController::uploadedFiles($request->file('files')));
        $message->load(['user', 'files']);

        $conversation->forceFill([
            'last_message_at' => $message->created_at,
        ])->save();

        $preview = $body !== ''
            ? $body
            : ($message->files->contains(fn ($file) => $file->isAudio())
                ? 'Sprachnachricht'
                : 'Neues Foto');

        app(PushNotifier::class)->notifyChat(
            $conversation,
            $request->user(),
            'Neue Chat-Nachricht',
            $preview,
        );

        return ChatMessageResource::make($message)->response()->setStatusCode(201);
    }
}
