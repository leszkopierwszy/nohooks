<?php

namespace App\Support;

/**
 * Hierarchia ubrań względem ciała — do flat-lay outfitów.
 *
 * body_zone: head | torso | legs | feet | full
 * wear_layer: outer | mid | base | accent
 */
class ClothingBodyPlacement
{
    public const ZONES = ['head', 'torso', 'legs', 'feet', 'full'];

    public const LAYERS = ['outer', 'mid', 'base', 'accent'];

    /** Kolejność wyświetlania stref (góra → dół). */
    public const ZONE_ORDER = [
        'head' => 10,
        'torso' => 20,
        'full' => 25,
        'legs' => 30,
        'feet' => 40,
    ];

    /** Warstwa: outer (na wierzchu / wyżej wizualnie) → accent. */
    public const LAYER_ORDER = [
        'outer' => 10,
        'mid' => 20,
        'base' => 30,
        'accent' => 40,
    ];

    /** @var array<string, array{0: string, 1: string}> */
    private const CATEGORY_MAP = [
        'czapka' => ['head', 'outer'],
        'szalik' => ['head', 'mid'],
        'rekawiczki' => ['head', 'accent'],
        'okulary' => ['head', 'accent'],
        'kolczyki' => ['head', 'accent'],
        'bizuteria' => ['head', 'accent'],
        'naszyjnik' => ['head', 'accent'],
        'kurtka' => ['torso', 'outer'],
        'marynarka' => ['torso', 'outer'],
        'plaszcz' => ['torso', 'outer'],
        'bluza' => ['torso', 'mid'],
        'sweter' => ['torso', 'mid'],
        'cardigan' => ['torso', 'mid'],
        'koszulka' => ['torso', 'base'],
        't-shirt' => ['torso', 'base'],
        'polowka' => ['torso', 'base'],
        'koszula' => ['torso', 'base'],
        'top' => ['torso', 'base'],
        'bielizna' => ['torso', 'base'],
        'spodnie' => ['legs', 'mid'],
        'jeansy' => ['legs', 'mid'],
        'szorty' => ['legs', 'mid'],
        'spodnica' => ['legs', 'mid'],
        'legginsy' => ['legs', 'base'],
        'rajstopy' => ['legs', 'base'],
        'skarpety' => ['feet', 'base'],
        'buty' => ['feet', 'outer'],
        'sneakers' => ['feet', 'outer'],
        'trampki' => ['feet', 'outer'],
        'sukienka' => ['full', 'mid'],
        'garnitur' => ['full', 'outer'],
        'dres' => ['full', 'mid'],
        'pizama' => ['full', 'base'],
        'kombinezon' => ['full', 'mid'],
    ];

    public static function infer(?string $category, ?string $collectionName = null): array
    {
        $cat = strtolower(trim((string) $category));
        if ($cat !== '' && isset(self::CATEGORY_MAP[$cat])) {
            return [
                'body_zone' => self::CATEGORY_MAP[$cat][0],
                'wear_layer' => self::CATEGORY_MAP[$cat][1],
            ];
        }

        $group = strtolower(trim((string) $collectionName));
        if (in_array($group, ['shoes', 'obuwie', 'footwear'], true)) {
            return ['body_zone' => 'feet', 'wear_layer' => 'outer'];
        }
        if (preg_match('/akcesor|accessor|bag|torb|bi[zż]uter/', $group)) {
            return ['body_zone' => 'head', 'wear_layer' => 'accent'];
        }

        return ['body_zone' => null, 'wear_layer' => null];
    }

    public static function normalizeZone(?string $zone): ?string
    {
        $z = strtolower(trim((string) $zone));

        return in_array($z, self::ZONES, true) ? $z : null;
    }

    public static function normalizeLayer(?string $layer): ?string
    {
        $l = strtolower(trim((string) $layer));

        return in_array($l, self::LAYERS, true) ? $l : null;
    }
}
