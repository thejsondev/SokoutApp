<?php

namespace Tests\Feature;

use App\Enums\TicketStatus;
use App\Models\Project;
use App\Models\PushSubscription;
use App\Models\User;
use App\Services\PushNotifier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PushNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_subscribe_and_reassign_endpoint(): void
    {
        $anna = User::factory()->create();
        $ben = User::factory()->create();

        $payload = [
            'endpoint' => 'https://push.example.test/endpoint-anna',
            'keys' => [
                'p256dh' => 'public-key-value',
                'auth' => 'auth-token-value',
            ],
            'content_encoding' => 'aes128gcm',
        ];

        $this->actingAs($anna, 'sanctum')
            ->postJson('/api/push/subscribe', $payload)
            ->assertCreated()
            ->assertJsonPath('ok', true);

        $this->assertDatabaseHas('push_subscriptions', [
            'user_id' => $anna->id,
            'endpoint' => $payload['endpoint'],
        ]);

        $this->actingAs($ben, 'sanctum')
            ->postJson('/api/push/subscribe', $payload)
            ->assertCreated();

        $this->assertDatabaseHas('push_subscriptions', [
            'user_id' => $ben->id,
            'endpoint' => $payload['endpoint'],
        ]);
        $this->assertSame(1, PushSubscription::query()->count());
    }

    public function test_creating_a_ticket_succeeds_without_subscriptions(): void
    {
        $bewohner = User::factory()->create();
        $project = Project::query()->create([
            'title' => 'Hof 1',
            'address' => 'Hauptstraße 1',
        ]);
        $project->members()->attach($bewohner);

        $this->actingAs($bewohner, 'sanctum')
            ->postJson('/api/projects/'.$project->id.'/tickets', [
                'body' => 'Wasserfleck an der Decke',
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', TicketStatus::Open->value);
    }

    public function test_new_ticket_notifies_hausmeister_hv_and_neighbors_not_actor(): void
    {
        $hm = User::factory()->hausmeister()->create();
        $hv = User::factory()->hausverwaltung()->create();
        $actor = User::factory()->create();
        $neighbor = User::factory()->create();

        $project = Project::query()->create([
            'title' => 'Hof 1',
            'address' => 'Hauptstraße 1',
            'hausverwaltung_user_id' => $hv->id,
        ]);
        $project->members()->attach([$actor->id, $neighbor->id]);

        $ticket = $project->tickets()->create([
            'user_id' => $actor->id,
            'status' => TicketStatus::Open,
        ]);

        $ids = app(PushNotifier::class)
            ->recipients($ticket, $actor)
            ->pluck('id')
            ->sort()
            ->values()
            ->all();

        $this->assertEqualsCanonicalizing(
            [$hm->id, $hv->id, $neighbor->id],
            $ids,
        );
        $this->assertNotContains($actor->id, $ids);
    }

    public function test_vapid_public_key_is_available_when_authenticated(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/push/vapid-public-key')
            ->assertOk()
            ->assertJsonStructure(['publicKey']);
    }
}
