<?php

namespace App\Mail;

use App\Models\LoginCode;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LoginCodeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public LoginCode $loginCode) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Dein Anmeldecode für Sokout',
        );
    }

    public function content(): Content
    {
        return new Content(
            html: 'mail.login-code',
            text: 'mail.login-code-text',
            with: [
                'code' => $this->loginCode->code,
                'expiresAt' => $this->loginCode->expires_at,
                'appName' => config('app.name', 'Sokout'),
                'appUrl' => rtrim((string) config('app.url'), '/'),
            ],
        );
    }
}
