<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->uuid('hv_join_token')->nullable()->unique();
        });

        foreach (DB::table('projects')->whereNull('hv_join_token')->get() as $project) {
            DB::table('projects')->where('id', $project->id)->update([
                'hv_join_token' => (string) Str::uuid(),
            ]);
        }

        DB::table('tickets')->where('status', 'in_progress')->update([
            'status' => 'awaiting_appointment',
        ]);
    }

    public function down(): void
    {
        DB::table('tickets')->where('status', 'awaiting_appointment')->update([
            'status' => 'in_progress',
        ]);

        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('hv_join_token');
        });
    }
};
