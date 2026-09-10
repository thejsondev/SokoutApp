Sokout – Dein Anmeldecode

Hallo,

mit diesem Code kannst du dich bei Sokout anmelden:

{{ $code }}

@if ($expiresAt)
Der Code ist 10 Minuten gültig (bis {{ $expiresAt->timezone('Europe/Berlin')->format('H:i') }} Uhr) und kann nur einmal verwendet werden.
@else
Der Code ist 10 Minuten gültig und kann nur einmal verwendet werden.
@endif

Falls du diesen Code nicht angefordert hast, ignoriere diese E-Mail.

Viele Grüße
Dein Sokout-Team

{{ $appName }}
@if (! empty($appUrl))
{{ $appUrl }}
@endif
