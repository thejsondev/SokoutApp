<?php

namespace App\Http\Requests\Ticket;

use Illuminate\Foundation\Http\FormRequest;

class RespondTicketRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'action' => ['required', 'in:appointment,refer,qa,done'],
            'appointment_at' => ['required_if:action,appointment', 'nullable', 'date'],
            'body' => ['required_if:action,refer', 'required_if:action,qa', 'nullable', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'appointment_at.required_if' => 'Bitte einen Termin angeben.',
            'body.required_if' => 'Bitte einen Text angeben.',
        ];
    }
}
