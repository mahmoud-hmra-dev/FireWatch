<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('fire_risk_predictions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('region_id')->constrained()->cascadeOnDelete();
            $table->decimal('risk_score', 5, 2);
            $table->string('risk_level');
            $table->decimal('confidence', 4, 3);
            $table->text('explanation');
            $table->string('source');
            $table->timestamp('created_at')->useCurrent();

            $table->index(['region_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fire_risk_predictions');
    }
};
