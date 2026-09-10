<?php

namespace App\Enums;

enum Role: string
{
    case Hausmeister = 'hausmeister';
    case Bewohner = 'bewohner';
    case Hausverwaltung = 'hausverwaltung';
}
