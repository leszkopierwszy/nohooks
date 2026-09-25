<?php

return [
    /** XP required per level (level = floor(xp / xp_per_level) + 1). */
    'xp_per_level' => (int) env('STYLE_JOURNEY_XP_PER_LEVEL', 100),

    /** Max rows on public scoreboard. */
    'scoreboard_limit' => 10,
];
