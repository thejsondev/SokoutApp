<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Enums\TicketStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_project_member_ticket_and_message_crud(): void
    {
        $register = $this->postJson('/api/register', [
            'first_name' => 'Anna',
            'last_name' => 'Müller',
            'email' => 'anna@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'address' => 'Berliner Str. 1',
            'role' => Role::Hausverwaltung->value,
        ]);

        $token = $register->json('token');
        $annaId = $register->json('user.id');

        $this->withToken($token)->patchJson('/api/users/'.$annaId, [
            'phone' => '01511234567',
        ])->assertOk()->assertJsonPath('data.phone', '01511234567');

        $createdUser = $this->withToken($token)->postJson('/api/users', [
            'first_name' => 'Ben',
            'last_name' => 'Schmidt',
            'email' => 'ben@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'address' => 'Nebenstr. 2',
            'role' => Role::Bewohner->value,
        ]);

        $createdUser->assertCreated()->assertJsonPath('data.email', 'ben@example.com');
        $benId = $createdUser->json('data.id');

        $this->withToken($token)->getJson('/api/users')->assertOk();
        $this->withToken($token)->getJson('/api/users/'.$benId)->assertOk();

        $project = $this->withToken($token)->postJson('/api/projects', [
            'title' => 'Wohnanlage Nord',
            'address' => 'Hauptstraße 10',
        ]);
        $project->assertCreated();
        $projectId = $project->json('data.id');

        $this->withToken($token)->postJson("/api/projects/{$projectId}/members", [
            'user_id' => $benId,
        ])->assertOk();

        $this->withToken($token)->getJson("/api/projects/{$projectId}/members")
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->withToken($token)->putJson("/api/projects/{$projectId}/members", [
            'user_ids' => [$benId, $annaId],
        ])->assertOk()->assertJsonCount(2, 'data.members');

        $this->withToken($token)->deleteJson("/api/projects/{$projectId}/members/{$annaId}")
            ->assertNoContent();

        $ticket = $this->withToken($token)->postJson("/api/projects/{$projectId}/tickets", [
            'body' => 'Heizung defekt',
        ]);
        $ticket->assertCreated();
        $ticketId = $ticket->json('data.id');
        $messageId = $ticket->json('data.messages.0.id');

        $this->withToken($token)->postJson("/api/tickets/{$ticketId}/messages", [
            'body' => 'Update: Techniker kommt morgen',
        ])->assertForbidden();

        $hm = \App\Models\User::factory()->hausmeister()->create();
        $anna = \App\Models\User::query()->findOrFail($annaId);

        $this->actingAs($hm, 'sanctum')
            ->postJson("/api/tickets/{$ticketId}/respond", [
                'action' => 'qa',
                'body' => 'Wann genau tritt das auf?',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', TicketStatus::Qa->value);

        $this->actingAs($anna, 'sanctum')
            ->getJson("/api/tickets/{$ticketId}/messages")
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->actingAs($anna, 'sanctum')
            ->patchJson("/api/ticket-messages/{$messageId}", [
                'body' => 'Heizung immer noch defekt',
            ])->assertOk()->assertJsonPath('data.body', 'Heizung immer noch defekt');

        $followUp = $this->actingAs($anna, 'sanctum')->postJson("/api/tickets/{$ticketId}/messages", [
            'body' => 'Seit gestern Abend',
        ]);
        $followUp->assertCreated();
        $followUpId = $followUp->json('data.id');

        $this->actingAs($anna, 'sanctum')->deleteJson("/api/ticket-messages/{$followUpId}")
            ->assertNoContent();

        $this->actingAs($anna, 'sanctum')->deleteJson("/api/tickets/{$ticketId}")
            ->assertNoContent();

        $this->actingAs($anna, 'sanctum')->deleteJson("/api/projects/{$projectId}")
            ->assertNoContent();
    }
}
