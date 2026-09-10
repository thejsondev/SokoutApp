<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Ticket\StoreTicketRatingRequest;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;

class TicketRatingController extends Controller
{
    public function store(StoreTicketRatingRequest $request, Ticket $ticket): JsonResponse
    {
        $ticket->load('project');
        $this->authorize('rate', $ticket);

        $exists = $ticket->ratings()->where('user_id', $request->user()->id)->exists();
        abort_if($exists, 422, 'Du hast bereits eine Bewertung abgegeben.');

        $ticket->ratings()->create([
            'user_id' => $request->user()->id,
            'rating' => $request->validated('rating'),
            'comment' => $request->validated('comment'),
        ]);

        return response()->json(['rated' => true]);
    }
}
