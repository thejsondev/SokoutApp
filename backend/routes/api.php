<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\ProjectJoinController;
use App\Http\Controllers\Api\PushSubscriptionController;
use App\Http\Controllers\Api\ProjectMemberController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\TicketRatingController;
use App\Http\Controllers\Api\TicketFileController;
use App\Http\Controllers\Api\TicketMessageController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/auth/request-code', [AuthController::class, 'requestCode'])->middleware('throttle:5,1');
Route::post('/auth/verify-code', [AuthController::class, 'verifyCode'])->middleware('throttle:10,1');
Route::post('/auth/complete-profile', [AuthController::class, 'completeProfile'])->middleware('throttle:10,1');
Route::get('/join/{token}', [ProjectJoinController::class, 'show']);
Route::get('/push/vapid-public-key', [PushSubscriptionController::class, 'vapidKey']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::post('/push/subscribe', [PushSubscriptionController::class, 'store']);
    Route::delete('/push/subscribe', [PushSubscriptionController::class, 'destroy']);

    Route::post('/join/{token}', [ProjectJoinController::class, 'store']);

    Route::apiResource('users', UserController::class);

    Route::apiResource('projects', ProjectController::class);

    Route::get('projects/{project}/members', [ProjectMemberController::class, 'index']);
    Route::post('projects/{project}/members', [ProjectMemberController::class, 'store']);
    Route::put('projects/{project}/members', [ProjectMemberController::class, 'update']);
    Route::delete('projects/{project}/members/{user}', [ProjectMemberController::class, 'destroy']);

    Route::get('projects/{project}/tickets', [TicketController::class, 'index']);
    Route::post('projects/{project}/tickets', [TicketController::class, 'store']);
    Route::get('tickets', [TicketController::class, 'indexAll']);
    Route::get('tickets/{ticket}', [TicketController::class, 'show']);
    Route::post('tickets/{ticket}/respond', [TicketController::class, 'respond']);
    Route::post('tickets/{ticket}/ratings', [TicketRatingController::class, 'store']);
    Route::patch('tickets/{ticket}', [TicketController::class, 'update']);
    Route::delete('tickets/{ticket}', [TicketController::class, 'destroy']);

    Route::get('tickets/{ticket}/messages', [TicketMessageController::class, 'index']);
    Route::post('tickets/{ticket}/messages', [TicketMessageController::class, 'store']);
    Route::get('ticket-messages/{ticketMessage}', [TicketMessageController::class, 'show']);
    Route::patch('ticket-messages/{ticketMessage}', [TicketMessageController::class, 'update']);
    Route::delete('ticket-messages/{ticketMessage}', [TicketMessageController::class, 'destroy']);

    Route::get('ticket-messages/{ticketMessage}/files', [TicketFileController::class, 'index']);
    Route::post('ticket-messages/{ticketMessage}/files', [TicketFileController::class, 'store']);
    Route::get('ticket-files/{ticketFile}', [TicketFileController::class, 'show'])->name('ticket-files.show');
    Route::delete('ticket-files/{ticketFile}', [TicketFileController::class, 'destroy']);
});
