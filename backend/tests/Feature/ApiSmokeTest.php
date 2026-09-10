<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Enums\TicketStatus;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiSmokeTest extends TestCase
{
    use RefreshDatabase;

    public function test_hausverwaltung_can_register_create_project_and_open_a_ticket(): void
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

        $register->assertCreated()
            ->assertJsonPath('user.role', Role::Hausverwaltung->value);

        $token = $register->json('token');

        $project = $this->withToken($token)->postJson('/api/projects', [
            'title' => 'Wohnanlage Nord',
            'address' => 'Hauptstraße 10',
            'latitude' => 52.520008,
            'longitude' => 13.404954,
        ]);

        $project->assertCreated()
            ->assertJsonPath('data.title', 'Wohnanlage Nord');

        $ticket = $this->withToken($token)->postJson(
            '/api/projects/'.$project->json('data.id').'/tickets',
            ['body' => 'Heizung im Keller defekt'],
        );

        $ticket->assertCreated()
            ->assertJsonPath('data.status', TicketStatus::Open->value)
            ->assertJsonPath('data.messages.0.body', 'Heizung im Keller defekt');
    }

    public function test_login_rejects_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'anna@example.com',
        ]);

        $this->postJson('/api/login', [
            'email' => 'anna@example.com',
            'password' => 'wrong-password',
        ])->assertUnprocessable();
    }
}
