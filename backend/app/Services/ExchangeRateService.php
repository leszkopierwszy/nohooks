<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class ExchangeRateService
{
    public const SUPPORTED = ['PLN', 'EUR', 'USD', 'GBP', 'CHF', 'CZK'];

    private const FALLBACK_RATES = [
        'EUR' => 4.30,
        'USD' => 3.95,
        'GBP' => 5.05,
        'CHF' => 4.90,
        'CZK' => 0.17,
    ];

    public function normalizeCurrency(?string $currency): string
    {
        $code = strtoupper(trim((string) $currency));

        return in_array($code, self::SUPPORTED, true) ? $code : 'PLN';
    }

    public function plnPerUnit(string $currency): float
    {
        $currency = $this->normalizeCurrency($currency);

        if ($currency === 'PLN') {
            return 1.0;
        }

        return Cache::remember(
            "exchange_rate_pln_per_{$currency}",
            now()->addHour(),
            fn () => $this->fetchNbpRate($currency) ?? self::FALLBACK_RATES[$currency] ?? 1.0
        );
    }

    public function convertToPln(?float $amount, ?string $currency): ?float
    {
        if ($amount === null) {
            return null;
        }

        $code = $this->normalizeCurrency($currency);

        return round($amount * $this->plnPerUnit($code), 2);
    }

    /** @return array<string, float> */
    public function rates(): array
    {
        $rates = ['PLN' => 1.0];

        foreach (self::SUPPORTED as $code) {
            if ($code === 'PLN') {
                continue;
            }
            $rates[$code] = $this->plnPerUnit($code);
        }

        return $rates;
    }

    private function fetchNbpRate(string $currency): ?float
    {
        try {
            $response = Http::timeout(6)
                ->withHeaders(['Accept' => 'application/json'])
                ->get('https://api.nbp.pl/api/exchangerates/rates/a/'.strtolower($currency).'/');

            if (! $response->successful()) {
                return null;
            }

            $mid = $response->json('rates.0.mid');

            return is_numeric($mid) ? (float) $mid : null;
        } catch (\Throwable) {
            return null;
        }
    }
}
