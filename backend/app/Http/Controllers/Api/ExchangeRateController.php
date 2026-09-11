<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ExchangeRateService;

class ExchangeRateController extends Controller
{
    public function index(ExchangeRateService $exchangeRates)
    {
        return response()->json([
            'base' => 'PLN',
            'source' => 'NBP',
            'rates' => $exchangeRates->rates(),
            'currencies' => ExchangeRateService::SUPPORTED,
        ]);
    }
}
