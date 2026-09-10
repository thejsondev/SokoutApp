<x-mail::message>
# Dein Sokout-Code

dein Anmeldecode lautet:

<x-mail::panel>
{{ $loginCode->code }}
</x-mail::panel>

Der Code ist 10 Minuten gültig.

Falls du das nicht angefordert hast, kannst du diese E-Mail ignorieren.

Vielen Dank,<br>
{{ config('app.name') }}
</x-mail::message>
