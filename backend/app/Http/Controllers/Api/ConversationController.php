<?php

namespace App\Http\Controllers\Api;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\Chat\StoreConversationRequest;
use App\Http\Resources\ChatContactResource;
use App\Http\Resources\ConversationResource;
use App\Models\Conversation;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class ConversationController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Conversation::class);

        /** @var User $user */
        $user = $request->user();
        $contacts = $this->contactsFor($user);

        return ChatContactResource::collection($contacts);
    }

    public function store(StoreConversationRequest $request): JsonResponse
    {
        $this->authorize('create', Conversation::class);

        /** @var User $user */
        $user = $request->user();
        $peer = User::query()->findOrFail((int) $request->validated('peer_user_id'));

        [$hausmeisterId, $hausverwaltungId] = $this->pairIds($user, $peer);

        $conversation = Conversation::query()->firstOrCreate([
            'hausmeister_user_id' => $hausmeisterId,
            'hausverwaltung_user_id' => $hausverwaltungId,
        ]);

        $conversation->load(['hausmeister', 'hausverwaltung', 'latestMessage.user', 'latestMessage.files']);

        return ConversationResource::make($conversation)->response()->setStatusCode(
            $conversation->wasRecentlyCreated ? 201 : 200,
        );
    }

    public function show(Conversation $conversation): ConversationResource
    {
        $this->authorize('view', $conversation);

        $conversation->load([
            'hausmeister',
            'hausverwaltung',
            'messages.user',
            'messages.files',
        ]);

        return ConversationResource::make($conversation);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function contactsFor(User $user): array
    {
        if ($user->role === Role::Hausmeister) {
            $hvIds = Project::query()
                ->whereNotNull('hausverwaltung_user_id')
                ->distinct()
                ->pluck('hausverwaltung_user_id');

            $peers = User::query()
                ->where('role', Role::Hausverwaltung)
                ->whereIn('id', $hvIds)
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get();

            $conversations = Conversation::query()
                ->where('hausmeister_user_id', $user->id)
                ->with(['latestMessage.user', 'latestMessage.files', 'hausverwaltung'])
                ->get()
                ->keyBy('hausverwaltung_user_id');

            return $peers->map(function (User $peer) use ($conversations) {
                $conversation = $conversations->get($peer->id);
                $titles = Project::query()
                    ->where('hausverwaltung_user_id', $peer->id)
                    ->orderBy('title')
                    ->pluck('title')
                    ->all();

                return [
                    'peer' => $peer,
                    'conversation_id' => $conversation?->id,
                    'project_titles' => $titles,
                    'last_message' => $conversation?->latestMessage,
                    'last_message_at' => $conversation?->last_message_at,
                ];
            })->sortByDesc(fn (array $row) => optional($row['last_message_at'])->timestamp ?? 0)
                ->values()
                ->all();
        }

        $peers = User::query()
            ->where('role', Role::Hausmeister)
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();

        $conversations = Conversation::query()
            ->where('hausverwaltung_user_id', $user->id)
            ->with(['latestMessage.user', 'latestMessage.files', 'hausmeister'])
            ->get()
            ->keyBy('hausmeister_user_id');

        $titles = Project::query()
            ->where('hausverwaltung_user_id', $user->id)
            ->orderBy('title')
            ->pluck('title')
            ->all();

        return $peers->map(function (User $peer) use ($conversations, $titles) {
            $conversation = $conversations->get($peer->id);

            return [
                'peer' => $peer,
                'conversation_id' => $conversation?->id,
                'project_titles' => $titles,
                'last_message' => $conversation?->latestMessage,
                'last_message_at' => $conversation?->last_message_at,
            ];
        })->sortByDesc(fn (array $row) => optional($row['last_message_at'])->timestamp ?? 0)
            ->values()
            ->all();
    }

    /**
     * @return array{0: int, 1: int}
     */
    private function pairIds(User $user, User $peer): array
    {
        if ($user->role === Role::Hausmeister && $peer->role === Role::Hausverwaltung) {
            $allowed = Project::query()
                ->where('hausverwaltung_user_id', $peer->id)
                ->exists();

            if (! $allowed) {
                throw ValidationException::withMessages([
                    'peer_user_id' => 'Keine gemeinsame Projektverbindung.',
                ]);
            }

            return [(int) $user->id, (int) $peer->id];
        }

        if ($user->role === Role::Hausverwaltung && $peer->role === Role::Hausmeister) {
            return [(int) $peer->id, (int) $user->id];
        }

        throw ValidationException::withMessages([
            'peer_user_id' => 'Chat nur zwischen Hausmeister und Hausverwaltung.',
        ]);
    }
}
