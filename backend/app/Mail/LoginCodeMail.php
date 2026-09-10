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
            subject: 'Dein Sokout-Code',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.login-code',
        );
    }
}
