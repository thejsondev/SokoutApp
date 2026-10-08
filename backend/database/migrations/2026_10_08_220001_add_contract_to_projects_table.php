<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->string('contract_path', 191)->nullable()->after('hv_join_token');
            $table->string('contract_original_name', 191)->nullable()->after('contract_path');
            $table->string('contract_mime_type', 191)->nullable()->after('contract_original_name');
            $table->unsignedBigInteger('contract_size')->nullable()->after('contract_mime_type');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn([
                'contract_path',
                'contract_original_name',
                'contract_mime_type',
                'contract_size',
            ]);
        });
    }
};
