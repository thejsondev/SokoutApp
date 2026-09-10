<x-mail::message>
# Sokout Hausmeisterservice

{{ $hausmeister->address }}  
{{ $hausmeister->phone }}  
{{ $hausmeister->email }}

Guten Tag {{ $hausverwaltung->first_name }} {{ $hausverwaltung->last_name }},

hiermit leiten wir eine Bewohneranfrage aus dem Objekt **{{ $ticket->project->title }}** an Sie weiter.

**Objekt:** {{ $ticket->project->address }}  
**Bewohner:** {{ $ticket->user->first_name }} {{ $ticket->user->last_name }}

**Anliegen des Bewohners:**

{{ $originalBody }}

**Mitteilung des Hausmeisters:**

{{ $messageBody }}

Bitte übernehmen Sie die weitere Bearbeitung.

Mit freundlichen Grüßen  
{{ $hausmeister->first_name }} {{ $hausmeister->last_name }}  
Sokout Hausmeisterservice
</x-mail::message>
