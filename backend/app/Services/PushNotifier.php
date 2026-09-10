<?php

namespace App\Services;

use App\Enums\Role;
use App\Models\PushSubscription;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;
use Throwable;

class PushNotifier
{
    public function notifyTicket(Ticket $ticket, User $actor, string $title, string $body): void
    {
        $ticket->loadMissing('project');
        $this->sendToUsers(
            $this->recipients($ticket, $actor),
            $title,
            $body,
            '/tickets/'.$ticket->id,
        );
    }

    public function notifyTicketLater(Ticket $ticket, User $actor, string $title, string $body): void
    {
        $this->notifyTicket($ticket, $actor, $title, $body);
    }

    /**
     * @param  Collection<int, User>  $users
     */
    public function sendToUsers(Collection $users, string $title, string $body, string $url): void
    {
        if ($users->isEmpty() || ! $this->configured()) {
            return;
        }

        $subscriptions = PushSubscription::query()
            ->whereIn('user_id', $users->pluck('id'))
            ->get();

        if ($subscriptions->isEmpty()) {
            return;
        }

        try {
            $webPush = new WebPush([
                'VAPID' => [
                    'subject' => config('services.vapid.subject'),
                    'publicKey' => config('services.vapid.public_key'),
                    'privateKey' => config('services.vapid.private_key'),
                ],
            ], [
                'TTL' => 604800,
                'urgency' => 'high',
            ]);
        } catch (Throwable $exception) {
            Log::warning('Web push init failed', ['error' => $exception->getMessage()]);

            return;
        }

        $payload = json_encode([
            'title' => $title,
            'body' => Str::limit($body, 140),
            'url' => $url,
        ], JSON_THROW_ON_ERROR);

        foreach ($subscriptions as $row) {
            try {
                $webPush->queueNotification(
                    Subscription::create([
                        'endpoint' => $row->endpoint,
                        'publicKey' => $row->public_key,
                        'authToken' => $row->auth_token,
                        'contentEncoding' => $row->content_encoding ?: 'aes128gcm',
                    ]),
                    $payload,
                );
            } catch (Throwable $exception) {
                Log::warning('Web push queue failed', ['error' => $exception->getMessage()]);
            }
        }

        try {
            foreach ($webPush->flush() as $report) {
                if ($report->isSuccess()) {
                    continue;
                }

                Log::warning('Web push delivery failed', [
                    'endpoint' => $report->getEndpoint(),
                    'reason' => $report->getReason(),
                ]);

                $reason = strtolower($report->getReason());
                $expired = $report->isSubscriptionExpired()
                    || str_contains($reason, '410')
                    || str_contains($reason, '404')
                    || str_contains($reason, 'unsubscribed or expired');

                if ($expired) {
                    PushSubscription::query()
                        ->where('endpoint', $report->getEndpoint())
                        ->delete();
                }
            }
        } catch (Throwable $exception) {
            Log::warning('Web push flush failed', ['error' => $exception->getMessage()]);
        }
    }

    /**
     * @return Collection<int, User>
     */
    public function recipients(Ticket $ticket, User $actor): Collection
    {
        $ticket->loadMissing('project');

        $ids = User::query()
            ->where('role', Role::Hausmeister)
            ->pluck('id');

        $ids = $ids->merge($ticket->project->members()->pluck('users.id'));

        if ($ticket->project->hausverwaltung_user_id) {
            $ids->push($ticket->project->hausverwaltung_user_id);
        }

        return User::query()
            ->whereIn('id', $ids->unique()->reject(fn ($id) => (int) $id === (int) $actor->id)->values())
            ->get();
    }

    private function configured(): bool
    {
        return filled(config('services.vapid.public_key'))
            && filled(config('services.vapid.private_key'))
            && ! app()->runningUnitTests();
    }
}
