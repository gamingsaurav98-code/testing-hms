<?php

namespace App\Providers;

use App\Services\DateService;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(DateService::class, function ($app) {
            return new DateService();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register a DB query listener to surface slow queries in logs for debugging/optimization.
        // Uses SLOW_QUERY_MS env var (milliseconds) defaulting to 100 ms.
        try {
            $threshold = (int) env('SLOW_QUERY_MS', 100);
            DB::listen(function ($query) use ($threshold) {
                try {
                    $time = isset($query->time) ? (int)$query->time : 0;
                    if ($time > $threshold) {
                        Log::warning('Slow query detected', [
                            'time_ms' => $time,
                            'sql' => $query->sql ?? '',
                            'bindings' => $query->bindings ?? [],
                        ]);
                    }
                } catch (\Throwable $_) {
                    // ignore listener errors
                }
            });
        } catch (\Throwable $_) {
            // DB facade may not be available in some contexts (early bootstrap) — ignore
        }
    }
}
