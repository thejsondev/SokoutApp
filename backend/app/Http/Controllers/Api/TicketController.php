<?php

namespace App\Http\Controllers\Api;

use App\Enums\Role;
use App\Enums\TicketStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Ticket\RespondTicketRequest;
use App\Http\Requests\Ticket\StoreTicketRequest;
use App\Http\Requests\Ticket\UpdateTicketRequest;
use App\Http\Resources\TicketResource;
use App\Mail\HvReferralMail;
use App\Services\PushNotifier;
use App\Models\Project;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class TicketController extends Controller
{
    public function indexAll(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Ticket::class);

        $tickets = Ticket::query()
            ->with(['user', 'project', 'messages.user', 'messages.files'])
            ->latest()
            ->get();

        return TicketResource::collection($tickets);
    }

    public function index(Project $project): AnonymousResourceCollection
    {
        $this->authorize('view', $project);

        $tickets = $project->tickets()
            ->with(['user', 'messages.user', 'messages.files'])
            ->latest()
            ->paginate();

        return TicketResource::collection($tickets);
    }

    public function store(StoreTicketRequest $request, Project $project): JsonResponse
    {
        $this->authorize('view', $project);

        $ticket = DB::transaction(function () use ($request, $project) {
            $ticket = $project->tickets()->create([
                'user_id' => $request->user()->id,
                'status' => TicketStatus::Open,
            ]);

            $message = $ticket->messages()->create([
                'user_id' => $request->user()->id,
                'body' => $request->validated('body'),
            ]);

            $message->storeUploadedFiles(self::uploadedFiles($request->file('files')));

            return $ticket;
        });

        $ticket->load(['user', 'project.hausverwaltung', 'messages.user', 'messages.files']);

        app(PushNotifier::class)->notifyTicketLater(
            $ticket,
            $request->user(),
            'Neues Ticket',
            (string) $request->validated('body'),
        );

        return TicketResource::make($ticket)->response()->setStatusCode(201);
    }

    public function show(Request $request, Ticket $ticket): TicketResource
    {
        $ticket->load(['project.hausverwaltung', 'user', 'messages.user', 'messages.files']);

        $this->authorize('view', $ticket);
        $this->appendRatingFlags($ticket, $request->user());

        return TicketResource::make($ticket);
    }

    public function respond(RespondTicketRequest $request, Ticket $ticket): TicketResource
    {
        $ticket->load(['project.hausverwaltung', 'user', 'messages']);
        $this->authorize('respond', $ticket);

        $action = $request->validated('action');
        $this->assertRespondAllowed($ticket, $action);

        $note = trim((string) $request->validated('body', ''));
        $user = $request->user();

        if ($action === 'refer' && $ticket->project->hausverwaltung === null) {
            abort(422, 'Dieses Projekt hat keine Hausverwaltung.');
        }

        DB::transaction(function () use ($action, $note, $request, $ticket, $user) {
            $body = match ($action) {
                'appointment' => $this->appointmentMessage($request->validated('appointment_at'), $note),
                'refer' => $this->referMessage($ticket, $note),
                'qa' => $note,
                'done' => $note !== '' ? $note : 'Als erledigt markiert.',
                default => $note,
            };

            $ticket->messages()->create([
                'user_id' => $user->id,
                'body' => $body,
                'kind' => match ($action) {
                    'appointment' => 'appointment',
                    'done' => 'done',
                    default => 'message',
                },
            ]);

            $updates = match ($action) {
                'appointment' => [
                    'status' => TicketStatus::AwaitingAppointment,
                    'appointment_at' => $request->validated('appointment_at'),
                ],
                'refer' => ['status' => TicketStatus::Referred],
                'qa' => ['status' => TicketStatus::Qa],
                'done' => ['status' => TicketStatus::Done],
                default => [],
            };

            $ticket->update($updates);
        });

        if ($action === 'refer') {
            $original = $ticket->messages->first()?->body ?? '';

            Mail::to($ticket->project->hausverwaltung->email)->send(new HvReferralMail(
                ticket: $ticket,
                hausmeister: $user,
                hausverwaltung: $ticket->project->hausverwaltung,
                originalBody: $original,
                messageBody: $note,
            ));
        }

        $ticket->load(['user', 'project.hausverwaltung', 'messages.user', 'messages.files']);

        [$title, $preview] = match ($action) {
            'appointment' => ['Termin bestätigt', 'Ein Termin wurde vereinbart.'],
            'refer' => ['Ticket weitergeleitet', 'Die Anfrage ging an die Hausverwaltung.'],
            'qa' => ['Neue Nachricht', $note !== '' ? $note : 'Eine Rückfrage wartet auf dich.'],
            'done' => ['Ticket erledigt', 'Die Anfrage wurde abgeschlossen.'],
            default => ['Ticket-Update', $note],
        };
        app(PushNotifier::class)->notifyTicketLater($ticket, $user, $title, $preview);

        return TicketResource::make($ticket);
    }

    public function update(UpdateTicketRequest $request, Ticket $ticket): TicketResource
    {
        $ticket->load('project');
        $this->authorize('update', $ticket);

        $ticket->update($request->validated());
        $ticket->load(['user', 'project.hausverwaltung', 'messages.user', 'messages.files']);

        return TicketResource::make($ticket);
    }

    public function destroy(Ticket $ticket): Response
    {
        $ticket->load('project');
        $this->authorize('delete', $ticket);

        $ticket->purgeStoredFiles();
        $ticket->delete();

        return response()->noContent();
    }

    private function appointmentMessage(string $appointmentAt, string $note): string
    {
        $when = Carbon::parse($appointmentAt)
            ->timezone('Europe/Berlin')
            ->format('d.m.Y, H:i');

        $text = 'Termin vereinbart: '.$when.' Uhr';

        return $note !== '' ? $text."\n\n".$note : $text;
    }

    private function referMessage(Ticket $ticket, string $note): string
    {
        $hv = $ticket->project->hausverwaltung;
        $name = trim(($hv?->first_name ?? '').' '.($hv?->last_name ?? ''));
        $text = $name !== ''
            ? 'An die Hausverwaltung weitergeleitet ('.$name.').'
            : 'An die Hausverwaltung weitergeleitet.';

        return $note !== '' ? $text."\n\n".$note : $text;
    }

    private function assertRespondAllowed(Ticket $ticket, string $action): void
    {
        $allowed = match ($ticket->status) {
            TicketStatus::Open => true,
            TicketStatus::Qa => in_array($action, ['appointment', 'refer', 'done'], true),
            TicketStatus::AwaitingAppointment => $action === 'done',
            default => false,
        };

        abort_unless($allowed, 422, 'Dieses Ticket wurde bereits bearbeitet.');
    }

    private function appendRatingFlags(Ticket $ticket, ?User $user): void
    {
        if ($user === null) {
            $ticket->setAttribute('rated', false);
            $ticket->setAttribute('can_rate', false);

            return;
        }

        $isBewohner = $user->role === Role::Bewohner
            && $user->projects()->where('projects.id', $ticket->project_id)->exists();
        $rated = $ticket->ratings()->where('user_id', $user->id)->exists();

        $ticket->setAttribute('rated', $rated);
        $ticket->setAttribute(
            'can_rate',
            $ticket->status === TicketStatus::Done && $isBewohner && ! $rated,
        );
    }

    /**
     * @param  UploadedFile|array<int, UploadedFile>|null  $files
     * @return array<int, UploadedFile>
     */
    public static function uploadedFiles(UploadedFile|array|null $files): array
    {
        if ($files instanceof UploadedFile) {
            return [$files];
        }

        if (! is_array($files)) {
            return [];
        }

        return array_values(array_filter(
            $files,
            fn ($file) => $file instanceof UploadedFile,
        ));
    }
}
