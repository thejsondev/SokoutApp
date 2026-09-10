<?php

namespace App\Mail;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class HvReferralMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Ticket $ticket,
        public User $hausmeister,
        public User $hausverwaltung,
        public string $originalBody,
        public string $messageBody,
    ) {}

    public function envelope(): Envelope
    {
        $title = $this->ticket->project?->title ?? 'Anfrage';

        return new Envelope(
            subject: 'Weiterleitung einer Bewohneranfrage – '.$title,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.hv-referral',
        );
    }
}
