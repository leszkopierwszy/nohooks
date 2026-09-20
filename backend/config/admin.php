<?php

return [
    /**
     * Comma-separated user IDs allowed to open Account → Backend
     * and manage the Fashion AI connector.
     */
    'user_ids' => array_values(array_filter(array_map(
        static fn ($v) => (int) trim($v),
        explode(',', (string) env('ADMIN_USER_IDS', '')),
    ), static fn ($id) => $id > 0)),
];
