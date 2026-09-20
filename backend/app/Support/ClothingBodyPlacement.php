<?php

namespace App\Support;

/**
 * Hierarchia ubrań względem ciała — flat-lay.
 * Canonical clothing types are English; legacy PL values are aliased.
 */
class ClothingBodyPlacement
{
    public const ZONES = ['head', 'torso', 'legs', 'feet', 'full'];

    public const LAYERS = ['outer', 'mid', 'base', 'accent'];

    public const ZONE_ORDER = [
        'head' => 10,
        'torso' => 20,
        'full' => 25,
        'legs' => 30,
        'feet' => 40,
    ];

    public const LAYER_ORDER = [
        'outer' => 10,
        'mid' => 20,
        'base' => 30,
        'accent' => 40,
    ];

    /** @var array<string, array{0: string, 1: string}> */
    private const TYPE_PLACEMENT = [
        'hat' => ['head', 'outer'],
        'scarf' => ['head', 'mid'],
        'gloves' => ['head', 'accent'],
        'glasses' => ['head', 'accent'],
        'earrings' => ['head', 'accent'],
        'jewelry' => ['head', 'accent'],
        'necklace' => ['head', 'accent'],
        'jacket' => ['torso', 'outer'],
        'coat' => ['torso', 'outer'],
        'blazer' => ['torso', 'outer'],
        'hoodie' => ['torso', 'mid'],
        'sweatshirt' => ['torso', 'mid'],
        'sweater' => ['torso', 'mid'],
        'cardigan' => ['torso', 'mid'],
        't-shirt' => ['torso', 'base'],
        'tshirt' => ['torso', 'base'],
        'polo' => ['torso', 'base'],
        'shirt' => ['torso', 'base'],
        'top' => ['torso', 'base'],
        'underwear' => ['torso', 'base'],
        'pants' => ['legs', 'mid'],
        'jeans' => ['legs', 'mid'],
        'shorts' => ['legs', 'mid'],
        'skirt' => ['legs', 'mid'],
        'leggings' => ['legs', 'base'],
        'tights' => ['legs', 'base'],
        'socks' => ['feet', 'base'],
        'shoes' => ['feet', 'outer'],
        'sneakers' => ['feet', 'outer'],
        'boots' => ['feet', 'outer'],
        'dress' => ['full', 'mid'],
        'suit' => ['full', 'outer'],
        'tracksuit' => ['full', 'mid'],
        'pajamas' => ['full', 'base'],
        'jumpsuit' => ['full', 'mid'],
    ];

    /** @var array<string, string> legacy / PL → English */
    private const TYPE_ALIASES = [
        'bluza' => 'hoodie',
        'koszulka' => 't-shirt',
        'tshirt' => 't-shirt',
        'spodnie' => 'pants',
        'jeansy' => 'jeans',
        'szorty' => 'shorts',
        'kurtka' => 'jacket',
        'marynarka' => 'blazer',
        'polowka' => 'polo',
        'spodnica' => 'skirt',
        'legginsy' => 'leggings',
        'leggins' => 'leggings',
        'rajstopy' => 'tights',
        'pantyhose' => 'tights',
        'sukienka' => 'dress',
        'garnitur' => 'suit',
        'bielizna' => 'underwear',
        'skarpety' => 'socks',
        'pizama' => 'pajamas',
        'dres' => 'tracksuit',
        'czapka' => 'hat',
        'szalik' => 'scarf',
        'rekawiczki' => 'gloves',
        'sweter' => 'sweater',
        'plaszcz' => 'coat',
        'koszula' => 'shirt',
        'kombinezon' => 'jumpsuit',
        'buty' => 'shoes',
        'trampki' => 'sneakers',
        'spodnicospodnie' => 'skirt',
    ];

    /** @var list<array{0: string, 1: string}> */
    private const TEXT_RULES = [
        ['/pantyhose|hosiery|(^|[^a-z])tights([^a-z]|$)/', 'tights'],
        ['/leggings?/', 'leggings'],
        ['/skort|skirt/', 'skirt'],
        ['/(^|[^a-z])dress(es)?([^a-z]|$)/', 'dress'],
        ['/jumpsuit|romper/', 'jumpsuit'],
        ['/jeans/', 'jeans'],
        ['/trousers|pants|shorts/', 'pants'],
        ['/t-?shirts?|tee\\b/', 't-shirt'],
        ['/hoodie|sweatshirt/', 'hoodie'],
        ['/sweater|cardigan|jumper/', 'sweater'],
        ['/blazer/', 'blazer'],
        ['/\\bcoats?\\b|\\bjackets?\\b/', 'jacket'],
        ['/\\bboots?\\b|sneakers?|loafers?|heels?|sandals?/', 'shoes'],
        ['/\\bsocks?\\b/', 'socks'],
        ['/pajamas?|pyjamas?/', 'pajamas'],
        ['/\\bhats?\\b|\\bcaps?\\b/', 'hat'],
        ['/\\bscar(?:f|ves)\\b/', 'scarf'],
        ['/\\bgloves?\\b/', 'gloves'],
        // product-title language hints → English type
        ['/rajstop/', 'tights'],
        ['/leggins/', 'leggings'],
        ['/spodnicospod|spodnic/', 'skirt'],
        ['/sukienk/', 'dress'],
        ['/kombinezon/', 'jumpsuit'],
        ['/spodnie|szorty/', 'pants'],
        ['/koszulk/', 't-shirt'],
        ['/bluza/', 'hoodie'],
        ['/sweter/', 'sweater'],
        ['/kurtka|plaszcz|marynarka/', 'jacket'],
        ['/botki|trampki|buty/', 'shoes'],
        ['/skarpety/', 'socks'],
        ['/czapka/', 'hat'],
        ['/szalik/', 'scarf'],
        ['/rekawiczki/', 'gloves'],
        ['/pizama/', 'pajamas'],
        ['/dres/', 'tracksuit'],
        ['/bielizna/', 'underwear'],
    ];

    public static function normalizeKey(?string $value): string
    {
        $value = mb_strtolower(trim((string) $value), 'UTF-8');
        if ($value === '') {
            return '';
        }

        if (class_exists(\Normalizer::class)) {
            $value = \Normalizer::normalize($value, \Normalizer::FORM_D) ?: $value;
        }
        $value = preg_replace('/\p{M}/u', '', $value) ?? $value;

        return str_replace('ł', 'l', $value);
    }

    public static function resolveCanonicalType(?string $category): ?string
    {
        $key = self::normalizeKey($category);
        if ($key === '') {
            return null;
        }

        if (isset(self::TYPE_ALIASES[$key])) {
            return self::TYPE_ALIASES[$key];
        }

        if (isset(self::TYPE_PLACEMENT[$key])) {
            return $key;
        }

        $types = array_keys(self::TYPE_PLACEMENT);
        usort($types, fn ($a, $b) => strlen($b) <=> strlen($a));
        foreach ($types as $type) {
            if (str_starts_with($key, $type.'-') || str_starts_with($key, $type.'_')) {
                return $type;
            }
        }

        $aliases = array_keys(self::TYPE_ALIASES);
        usort($aliases, fn ($a, $b) => strlen($b) <=> strlen($a));
        foreach ($aliases as $alias) {
            if (str_starts_with($key, $alias.'-') || str_starts_with($key, $alias.'_')) {
                return self::TYPE_ALIASES[$alias];
            }
            if (strlen($alias) >= 5 && str_contains($key, $alias)) {
                return self::TYPE_ALIASES[$alias];
            }
        }

        return null;
    }

    public static function infer(?string $category, ?string $collectionName = null, ?string $itemName = null): array
    {
        $type = self::resolveCanonicalType($category);
        if ($type !== null && isset(self::TYPE_PLACEMENT[$type])) {
            return [
                'body_zone' => self::TYPE_PLACEMENT[$type][0],
                'wear_layer' => self::TYPE_PLACEMENT[$type][1],
            ];
        }

        $fromText = self::matchTextToType($itemName) ?? self::matchTextToType($category);
        if ($fromText !== null && isset(self::TYPE_PLACEMENT[$fromText])) {
            return [
                'body_zone' => self::TYPE_PLACEMENT[$fromText][0],
                'wear_layer' => self::TYPE_PLACEMENT[$fromText][1],
            ];
        }

        $group = self::normalizeKey($collectionName);
        if (in_array($group, ['shoes', 'obuwie', 'footwear'], true)) {
            return ['body_zone' => 'feet', 'wear_layer' => 'outer'];
        }
        if (preg_match('/accessor|bag|jewelry|jewellery|akcesor|torb|bizuter/', $group)) {
            return ['body_zone' => 'head', 'wear_layer' => 'accent'];
        }

        return ['body_zone' => null, 'wear_layer' => null];
    }

    private static function matchTextToType(?string $text): ?string
    {
        $n = self::normalizeKey($text);
        if ($n === '') {
            return null;
        }

        foreach (self::TEXT_RULES as [$pattern, $type]) {
            if (preg_match($pattern, $n)) {
                return $type;
            }
        }

        return null;
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
