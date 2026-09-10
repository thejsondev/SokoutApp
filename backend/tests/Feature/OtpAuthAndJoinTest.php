<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Enums\TicketStatus;
use App\Models\LoginCode;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class OtpAuthAndJoinTest extends TestCase
{
    use RefreshDatabase;

    public function test_existing_user_logs_in_with_email_code(): void
    {
        Mail::fake();

        $user = User::factory()->hausmeister()->create([
            'email' => 'hm@sokout.app',
        ]);

        $request = $this->postJson('/api/auth/request-code', [
            'email' => 'hm@sokout.app',
        ]);

        $request->assertOk();

        $code = LoginCode::query()->where('email', 'hm@sokout.app')->latest()->firstOrFail()->code;

        $login = $this->postJson('/api/auth/verify-code', [
            'email' => 'hm@sokout.app',
            'code' => $code,
        ]);

        $login->assertOk()
            ->assertJsonPath('needs_registration', false)
            ->assertJsonPath('user.id', $user->id);

        $this->assertNotNull(LoginCode::query()->whereNotNull('used_at')->first());
    }

    public function test_new_user_completes_profile_as_bewohner(): void
    {
        Mail::fake();

        $this->postJson('/api/auth/request-code', [
            'email' => 'neu@example.com',
        ])->assertOk();

        $code = LoginCode::query()->where('email', 'neu@example.com')->latest()->firstOrFail()->code;

        $this->postJson('/api/auth/verify-code', [
            'email' => 'neu@example.com',
            'code' => $code,
        ])->assertOk()->assertJsonPath('needs_registration', true);

        $complete = $this->postJson('/api/auth/complete-profile', [
            'email' => 'neu@example.com',
            'code' => $code,
            'first_name' => 'Lea',
            'last_name' => 'Bauer',
            'address' => 'Gartenweg 4',
        ]);

        $complete->assertCreated()
            ->assertJsonPath('user.role', Role::Bewohner->value)
            ->assertJsonPath('user.email', 'neu@example.com');
    }

    public function test_expired_code_is_rejected(): void
    {
        Mail::fake();

        $this->postJson('/api/auth/request-code', [
            'email' => 'lea@example.com',
        ]);

        LoginCode::query()->update([
            'expires_at' => now()->subMinute(),
        ]);

        $code = LoginCode::query()->first()->code;

        $this->postJson('/api/auth/verify-code', [
            'email' => 'lea@example.com',
            'code' => $code,
        ])->assertUnprocessable();
    }

    public function test_bewohner_joins_project_via_token(): void
    {
        $hm = User::factory()->hausmeister()->create();
        $project = Project::query()->create([
            'title' => 'Hof 1',
            'address' => 'Hauptstraße 1',
        ]);

        $bewohner = User::factory()->create();

        $this->actingAs($bewohner, 'sanctum')
            ->postJson('/api/join/'.$project->join_token)
            ->assertOk();

        $this->assertTrue($project->members()->where('users.id', $bewohner->id)->exists());

        $this->actingAs($hm, 'sanctum')
            ->postJson('/api/join/'.$project->join_token)
            ->assertForbidden();
    }

    public function test_hausmeister_can_list_all_tickets(): void
    {
        $hm = User::factory()->hausmeister()->create();
        $bewohner = User::factory()->create();
        $project = Project::query()->create([
            'title' => 'Hof 1',
            'address' => 'Hauptstraße 1',
        ]);
        $ticket = $project->tickets()->create([
            'user_id' => $bewohner->id,
            'status' => TicketStatus::Open,
        ]);

        $this->actingAs($hm, 'sanctum')
            ->getJson('/api/tickets')
            ->assertOk()
            ->assertJsonPath('data.0.id', $ticket->id)
            ->assertJsonPath('data.0.project.title', 'Hof 1');

        $this->actingAs($bewohner, 'sanctum')
            ->getJson('/api/tickets')
            ->assertForbidden();
    }

    public function test_hausmeister_can_create_a_ticket(): void
    {
        $hm = User::factory()->hausmeister()->create();
        $project = Project::query()->create([
            'title' => 'Hof 1',
            'address' => 'Hauptstraße 1',
        ]);

        $this->actingAs($hm, 'sanctum')
            ->postJson('/api/projects/'.$project->id.'/tickets', [
                'body' => 'Dachrinne verstopft',
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', TicketStatus::Open->value)
            ->assertJsonPath('data.messages.0.body', 'Dachrinne verstopft');
    }
}
