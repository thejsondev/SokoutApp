<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePushSubscriptionRequest;
use App\Models\PushSubscription;
use App\Services\PushNotifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class PushSubscriptionController extends Controller
{
    public function vapidKey(): JsonResponse
    {
        return response()->json([
            'publicKey' => trim((string) config('services.vapid.public_key')),
        ]);
    }

    public function store(StorePushSubscriptionRequest $request): JsonResponse
    {
        $subscription = PushSubscription::query()->updateOrCreate(
            ['endpoint' => $request->validated('endpoint')],
            [
                'user_id' => $request->user()->id,
                'public_key' => $request->validated('keys.p256dh'),
                'auth_token' => $request->validated('keys.auth'),
                'content_encoding' => $request->validated('content_encoding') ?: 'aes128gcm',
            ],
        );

        PushSubscription::query()
            ->where('user_id', $request->user()->id)
            ->where('id', '!=', $subscription->id)
            ->delete();

        $shouldConfirm = $subscription->wasRecentlyCreated || $subscription->wasChanged('user_id');
        if ($shouldConfirm) {
            app(PushNotifier::class)->sendToUsers(
                collect([$request->user()]),
                'Mitteilungen aktiv',
                'Du wirst bei neuen Tickets und Nachrichten benachrichtigt.',
                '/',
            );
        }

        return response()->json(['ok' => true, 'id' => $subscription->id], 201);
    }

    public function destroy(Request $request): Response
    {
        $endpoint = $request->string('endpoint')->toString();
        abort_unless($endpoint !== '', 422);

        PushSubscription::query()
            ->where('user_id', $request->user()->id)
            ->where('endpoint', $endpoint)
            ->delete();

        return response()->noContent();
    }
}
