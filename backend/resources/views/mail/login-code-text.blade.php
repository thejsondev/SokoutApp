Sokout – Dein Anmeldecode

Hallo,

mit diesem Code kannst du dich bei Sokout anmelden:

{{ $code }}

Der Code ist 10 Minuten gültig@if($expiresAt) (bis {{ $expiresAt->timezone('Europe/Berlin')->format('H:i') }} Uhr)@endif und kann nur einmal verwendet werden.

Falls du diesen Code nicht angefordert hast, ignoriere diese E-Mail.

Viele Grüße
Dein Sokout-Team

{{ $appName }}
@if(!empty($appUrl))
{{ $appUrl }}
@endif
