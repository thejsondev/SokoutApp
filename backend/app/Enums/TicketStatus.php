<?php

namespace App\Enums;

enum TicketStatus: string
{
    case Open = 'open';
    case AwaitingAppointment = 'awaiting_appointment';
    case Referred = 'referred';
    case Qa = 'qa';
    case Done = 'done';
}
