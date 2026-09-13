<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserWorkspaceDocument;
use Illuminate\Http\Request;

class WorkspaceDocumentController extends Controller
{
    /** Allowed client workspace keys (formerly localStorage-only). */
    public const KEYS = [
        'nohooks.financeAccounts.v1',
        'nohooks.petExpenseAccounts',
        'nohooks.lotteryTickets.v1',
        'nohooks_user_assets_v2',
        'nohooks_user_assets_v1',
        'nohooks.growthGoals.v1',
        'nohooks.growthWellbeing.v1',
        'nohooks.growthSleep.v1',
        'nohooks.growthHealth.v1',
        'nohooks.activePersonaId',
        'nohooks_savings_targets_v1',
        'nohooks.salaryJobs.v1',
    ];

    public function index()
    {
        $docs = UserWorkspaceDocument::query()
            ->whereIn('document_key', self::KEYS)
            ->get()
            ->mapWithKeys(fn (UserWorkspaceDocument $doc) => [
                $doc->document_key => $doc->payload,
            ]);

        return response()->json([
            'documents' => (object) $docs->all(),
        ]);
    }

    public function upsert(Request $request)
    {
        $data = $request->validate([
            'document_key' => 'required|string|in:'.implode(',', self::KEYS),
            'payload' => 'present',
        ]);

        $doc = UserWorkspaceDocument::query()->updateOrCreate(
            [
                'user_id' => auth()->id(),
                'document_key' => $data['document_key'],
            ],
            [
                'payload' => $data['payload'],
            ]
        );

        return response()->json([
            'document_key' => $doc->document_key,
            'payload' => $doc->payload,
        ]);
    }

    public function import(Request $request)
    {
        $data = $request->validate([
            'documents' => 'required|array',
            'only_missing' => 'sometimes|boolean',
        ]);

        $onlyMissing = (bool) ($data['only_missing'] ?? true);
        $imported = [];

        foreach ($data['documents'] as $key => $payload) {
            if (! is_string($key) || ! in_array($key, self::KEYS, true)) {
                continue;
            }
            if ($payload === null) {
                continue;
            }

            $existing = UserWorkspaceDocument::query()
                ->where('document_key', $key)
                ->exists();

            if ($onlyMissing && $existing) {
                continue;
            }

            UserWorkspaceDocument::query()->updateOrCreate(
                [
                    'user_id' => auth()->id(),
                    'document_key' => $key,
                ],
                ['payload' => $payload]
            );
            $imported[] = $key;
        }

        $docs = UserWorkspaceDocument::query()
            ->whereIn('document_key', self::KEYS)
            ->get()
            ->mapWithKeys(fn (UserWorkspaceDocument $doc) => [
                $doc->document_key => $doc->payload,
            ]);

        return response()->json([
            'imported' => $imported,
            'documents' => (object) $docs->all(),
        ]);
    }
}
