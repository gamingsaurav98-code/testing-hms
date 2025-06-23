<?php

namespace App\Services;

use AnuzPandey\LaravelNepaliDate\NepaliDate;
use Carbon\Carbon;

class DateService
{
    /**
     * Get current date and time
     *
     * @param string $format
     * @return string
     */
    public function getCurrentDateTime($format = 'Y-m-d H:i:s')
    {
        return Carbon::now()->format($format);
    }
    
    /**
     * Format a date
     *
     * @param string $date
     * @param string $format
     * @return string
     */
    public function formatDate($date, $format = 'Y-m-d')
    {
        return Carbon::parse($date)->format($format);
    }
    
    /**
     * Calculate difference between two dates in days
     *
     * @param string $fromDate
     * @param string $toDate
     * @return int
     */
    public function getDaysDifference($fromDate, $toDate)
    {
        return Carbon::parse($fromDate)->diffInDays(Carbon::parse($toDate));
    }
    
    /**
     * Add days to a date
     *
     * @param string $date
     * @param int $days
     * @param string $format
     * @return string
     */
    public function addDays($date, $days, $format = 'Y-m-d')
    {
        return Carbon::parse($date)->addDays($days)->format($format);
    }

    /**
     * Format a date either in Bikram Sambat (BS) or Gregorian (AD) format
     * based on global config value
     *
     * @param mixed $date
     * @return string
     */
    public function format($date)
    {
        if (config('app.use_bs_date', false)) {
            return $this->toBs($date);
        }
        
        return $date->format('Y-m-d');
    }

    /**
     * Convert AD date to BS format
     *
     * @param mixed $date
     * @return string
     */
    public function toBs($date)
    {
        return NepaliDate::create($date)->toBS();
    }

    /**
     * Convert BS date to AD format
     *
     * @param string $bsDate
     * @return string
     */
    public function toAd($bsDate)
    {
        return NepaliDate::create($bsDate)->toAD();
    }
}
