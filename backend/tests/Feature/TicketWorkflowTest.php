<?php

namespace Tests\Feature;

use App\Enums\TicketStatus;
use App\Mail\HvReferralMail;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TicketWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_ticket_can_be_created_with_photos(): void
    {
        Storage::fake('local');

        $bewohner = User::factory()->create();
        $project = Project::query()->create([
            'title' => 'Hof 1',
            'address' => 'Hauptstraße 1',
        ]);
        $project->members()->attach($bewohner);

        $photo = UploadedFile::fake()->image('schaden.jpg', 400, 300);

        $response = $this->actingAs($bewohner, 'sanctum')
            ->post('/api/projects/'.$project->id.'/tickets', [
                'body' => 'Wasserfleck an der Decke',
                'files' => [$photo],
            ], ['Accept' => 'application/json']);

        $response->assertCreated()
            ->assertJsonPath('data.status', TicketStatus::Open->value)
            ->assertJsonPath('data.messages.0.body', 'Wasserfleck an der Decke');

        $this->assertCount(1, $response->json('data.messages.0.files'));
        Storage::disk('local')->assertExists($this->storedPath($response->json('data.messages.0.files.0.id')));
    }

    public function test_bewohner_cannot_reply_until_hausmeister_opens_qa(): void
    {
        [$hm, $bewohner, $ticket] = $this->openTicket();

        $this->actingAs($bewohner, 'sanctum')
            ->postJson('/api/tickets/'.$ticket->id.'/messages', [
                'body' => 'Noch etwas',
            ])
            ->assertForbidden();

        $this->actingAs($hm, 'sanctum')
            ->postJson('/api/tickets/'.$ticket->id.'/respond', [
                'action' => 'qa',
                'body' => 'Seit wann tritt das auf?',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', TicketStatus::Qa->value);

        $this->actingAs($bewohner, 'sanctum')
            ->postJson('/api/tickets/'.$ticket->id.'/messages', [
                'body' => 'Seit gestern Abend',
            ])
            ->assertCreated()
            ->assertJsonPath('data.body', 'Seit gestern Abend');
    }

    public function test_other_project_bewohner_can_join_qa_chat(): void
    {
        [$hm, $bewohner, $ticket] = $this->openTicket();
        $neighbor = User::factory()->create();
        $ticket->project->members()->attach($neighbor);

        $this->actingAs($hm, 'sanctum')
            ->postJson('/api/tickets/'.$ticket->id.'/respond', [
                'action' => 'qa',
                'body' => 'Kann jemand den Keller prüfen?',
            ])
            ->assertOk();

        $this->actingAs($neighbor, 'sanctum')
            ->postJson('/api/tickets/'.$ticket->id.'/messages', [
                'body' => 'Ich schaue nach.',
            ])
            ->assertCreated();
    }

    public function test_hausmeister_can_set_an_appointment(): void
    {
        [$hm, , $ticket] = $this->openTicket();

        $this->actingAs($hm, 'sanctum')
            ->postJson('/api/tickets/'.$ticket->id.'/respond', [
                'action' => 'appointment',
                'appointment_at' => now()->addDay()->setTime(14, 0)->toIso8601String(),
            ])
            ->assertOk()
            ->assertJsonPath('data.status', TicketStatus::AwaitingAppointment->value)
            ->assertJsonPath('data.messages.1.kind', 'appointment');

        $this->assertNotNull($ticket->fresh()->appointment_at);
    }

    public function test_hausmeister_can_complete_ticket_after_appointment(): void
    {
        [$hm, , $ticket] = $this->openTicket();

        $this->actingAs($hm, 'sanctum')
            ->postJson('/api/tickets/'.$ticket->id.'/respond', [
                'action' => 'appointment',
                'appointment_at' => now()->addDay()->setTime(14, 0)->toIso8601String(),
            ])
            ->assertOk();

        $this->actingAs($hm, 'sanctum')
            ->postJson('/api/tickets/'.$ticket->id.'/respond', [
                'action' => 'done',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', TicketStatus::Done->value);
    }

    public function test_weiterleiten_sends_muster_mail_to_hv(): void
    {
        Mail::fake();

        [$hm, , $ticket] = $this->openTicket();
        $hv = User::factory()->hausverwaltung()->create([
            'email' => 'hv@example.com',
            'first_name' => 'Clara',
            'last_name' => 'Vogel',
        ]);
        $ticket->project->update(['hausverwaltung_user_id' => $hv->id]);

        $this->actingAs($hm, 'sanctum')
            ->postJson('/api/tickets/'.$ticket->id.'/respond', [
                'action' => 'refer',
                'body' => 'Bitte die Heizung prüfen lassen.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', TicketStatus::Referred->value);

        Mail::assertSent(HvReferralMail::class, function (HvReferralMail $mail) use ($hv) {
            return $mail->hasTo($hv->email)
                && $mail->messageBody === 'Bitte die Heizung prüfen lassen.';
        });
    }

    public function test_weiterleiten_fails_without_hausverwaltung(): void
    {
        [$hm, , $ticket] = $this->openTicket();

        $this->actingAs($hm, 'sanctum')
            ->postJson('/api/tickets/'.$ticket->id.'/respond', [
                'action' => 'refer',
                'body' => 'Bitte übernehmen.',
            ])
            ->assertStatus(422);
    }

    public function test_hausmeister_can_mark_ticket_done(): void
    {
        [$hm, , $ticket] = $this->openTicket();

        $this->actingAs($hm, 'sanctum')
            ->postJson('/api/tickets/'.$ticket->id.'/respond', [
                'action' => 'done',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', TicketStatus::Done->value);
    }

    public function test_hausmeister_can_decide_from_qa_chat(): void
    {
        Mail::fake();

        [$hm, , $ticket] = $this->openTicket();
        $hv = User::factory()->hausverwaltung()->create(['email' => 'hv@example.com']);
        $ticket->project->update(['hausverwaltung_user_id' => $hv->id]);

        $this->actingAs($hm, 'sanctum')
            ->postJson('/api/tickets/'.$ticket->id.'/respond', [
                'action' => 'qa',
                'body' => 'Seit wann?',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', TicketStatus::Qa->value);

        $this->actingAs($hm, 'sanctum')
            ->postJson('/api/tickets/'.$ticket->id.'/respond', [
                'action' => 'appointment',
                'appointment_at' => now()->addDay()->setTime(10, 0)->toIso8601String(),
            ])
            ->assertOk()
            ->assertJsonPath('data.status', TicketStatus::AwaitingAppointment->value);
    }

    public function test_hausmeister_can_refer_and_complete_from_qa(): void
    {
        Mail::fake();

        [$hm, , $ticket] = $this->openTicket();
        $hv = User::factory()->hausverwaltung()->create(['email' => 'hv@example.com']);
        $ticket->project->update(['hausverwaltung_user_id' => $hv->id]);

        $this->actingAs($hm, 'sanctum')
            ->postJson('/api/tickets/'.$ticket->id.'/respond', [
                'action' => 'qa',
                'body' => 'Kurze Rückfrage',
            ])
            ->assertOk();

        $this->actingAs($hm, 'sanctum')
            ->postJson('/api/tickets/'.$ticket->id.'/respond', [
                'action' => 'done',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', TicketStatus::Done->value);

        [$hm2, , $ticket2] = $this->openTicket();
        $ticket2->project->update(['hausverwaltung_user_id' => $hv->id]);

        $this->actingAs($hm2, 'sanctum')
            ->postJson('/api/tickets/'.$ticket2->id.'/respond', [
                'action' => 'qa',
                'body' => 'Passt das zum Hausmeister?',
            ])
            ->assertOk();

        $this->actingAs($hm2, 'sanctum')
            ->postJson('/api/tickets/'.$ticket2->id.'/respond', [
                'action' => 'refer',
                'body' => 'Bitte übernehmen.',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', TicketStatus::Referred->value);
    }

    public function test_bewohner_can_rate_a_done_ticket_once_without_exposing_ratings(): void
    {
        [$hm, $bewohner, $ticket] = $this->openTicket();
        $neighbor = User::factory()->create();
        $ticket->project->members()->attach($neighbor);

        $this->actingAs($hm, 'sanctum')
            ->postJson('/api/tickets/'.$ticket->id.'/respond', [
                'action' => 'done',
            ])
            ->assertOk();

        $this->actingAs($bewohner, 'sanctum')
            ->getJson('/api/tickets/'.$ticket->id)
            ->assertOk()
            ->assertJsonPath('data.can_rate', true)
            ->assertJsonMissingPath('data.ratings');

        $this->actingAs($bewohner, 'sanctum')
            ->postJson('/api/tickets/'.$ticket->id.'/ratings', [
                'rating' => 5,
                'comment' => 'Sehr schnell erledigt.',
            ])
            ->assertOk()
            ->assertJsonPath('rated', true)
            ->assertJsonMissingPath('rating');

        $this->actingAs($bewohner, 'sanctum')
            ->postJson('/api/tickets/'.$ticket->id.'/ratings', [
                'rating' => 4,
            ])
            ->assertStatus(422);

        $this->actingAs($bewohner, 'sanctum')
            ->getJson('/api/tickets/'.$ticket->id)
            ->assertOk()
            ->assertJsonPath('data.can_rate', false)
            ->assertJsonPath('data.rated', true)
            ->assertJsonMissingPath('data.ratings');

        $this->actingAs($neighbor, 'sanctum')
            ->getJson('/api/tickets/'.$ticket->id)
            ->assertOk()
            ->assertJsonPath('data.can_rate', true);

        $this->actingAs($hm, 'sanctum')
            ->postJson('/api/tickets/'.$ticket->id.'/ratings', [
                'rating' => 3,
            ])
            ->assertForbidden();
    }

    public function test_bewohner_cannot_rate_an_open_ticket(): void
    {
        [, $bewohner, $ticket] = $this->openTicket();

        $this->actingAs($bewohner, 'sanctum')
            ->postJson('/api/tickets/'.$ticket->id.'/ratings', [
                'rating' => 5,
            ])
            ->assertForbidden();
    }

    public function test_ticket_file_is_only_visible_with_project_access(): void
    {
        Storage::fake('local');

        [, $bewohner, $ticket] = $this->openTicket();
        $stranger = User::factory()->create();

        $photo = UploadedFile::fake()->image('foto.jpg');

        $created = $this->actingAs($bewohner, 'sanctum')
            ->post('/api/projects/'.$ticket->project_id.'/tickets', [
                'body' => 'Foto dabei',
                'files' => [$photo],
            ], ['Accept' => 'application/json']);

        $fileId = $created->json('data.messages.0.files.0.id');

        $this->actingAs($bewohner, 'sanctum')
            ->get('/api/ticket-files/'.$fileId)
            ->assertOk();

        $this->actingAs($stranger, 'sanctum')
            ->getJson('/api/ticket-files/'.$fileId)
            ->assertForbidden();
    }

    /**
     * @return array{0: \App\Models\User, 1: \App\Models\User, 2: \App\Models\Ticket}
     */
    private function openTicket(): array
    {
        $hm = User::factory()->hausmeister()->create();
        $bewohner = User::factory()->create();
        $project = Project::query()->create([
            'title' => 'Hof 1',
            'address' => 'Hauptstraße 1',
        ]);
        $project->members()->attach($bewohner);

        $ticket = $project->tickets()->create([
            'user_id' => $bewohner->id,
            'status' => TicketStatus::Open,
        ]);
        $ticket->messages()->create([
            'user_id' => $bewohner->id,
            'body' => 'Heizung defekt',
        ]);

        return [$hm, $bewohner, $ticket->load('project')];
    }

    private function storedPath(int $fileId): string
    {
        return \App\Models\TicketFile::query()->findOrFail($fileId)->path;
    }
}
