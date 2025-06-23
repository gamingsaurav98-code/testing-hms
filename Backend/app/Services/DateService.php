<?php

namespace App\Services;

use AnuzPandey\LaravelNepaliDate\NepaliDate;

class DateService
{
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
