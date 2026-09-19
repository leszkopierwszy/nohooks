<?php

namespace App\Support;

/**
 * Category-specific garment attribute schemas.
 * Stored as JSON on items.garment_attributes; validated/serialized per clothing type.
 */
class GarmentAttributes
{
    public const OPACITY = ['ultra_sheer', 'sheer', 'semi_opaque', 'opaque'];

    public const FINISH = ['matte', 'satin', 'glossy'];

    /** Types that use the hosiery attribute schema. */
    public const HOSIERY_TYPES = ['tights'];

    /**
     * Primary visible structure of an outfit.
     *
     * @var list<string>
     */
    private const PRIMARY_TYPES = [
        'dress', 'skirt', 'pants', 'jeans', 'shorts', 'shirt', 'blouse', 'top',
        't-shirt', 'tshirt', 'polo', 'sweater', 'cardigan', 'hoodie', 'sweatshirt',
        'blazer', 'jacket', 'coat', 'suit', 'jumpsuit', 'tracksuit',
        'shoes', 'sneakers', 'boots',
    ];

    /**
     * Less-visible / base layers that can still make an outfit work.
     *
     * @var list<string>
     */
    private const SUPPORTING_TYPES = [
        'tights', 'socks', 'underwear', 'leggings', 'pajamas',
    ];

    /**
     * @var list<string>
     */
    private const ACCESSORY_TYPES = [
        'hat', 'scarf', 'gloves', 'glasses', 'earrings', 'jewelry', 'necklace',
    ];

    /**
     * Normalize raw attributes for a clothing category. Unknown keys dropped.
     * Returns null when empty / type has no schema.
     *
     * @param  array<string, mixed>|null  $raw
     * @return array<string, mixed>|null
     */
    public static function normalize(?string $category, ?array $raw): ?array
    {
        $type = ClothingBodyPlacement::resolveCanonicalType($category);
        if ($type === null || $raw === null) {
            return null;
        }

        if (in_array($type, self::HOSIERY_TYPES, true)) {
            return self::normalizeHosiery($raw);
        }

        // Future: shoes, underwear/bras, etc.
        return null;
    }

    /**
     * @param  array<string, mixed>  $raw
     * @return array<string, mixed>|null
     */
    private static function normalizeHosiery(array $raw): ?array
    {
        $out = [];

        if (array_key_exists('denier', $raw) && $raw['denier'] !== null && $raw['denier'] !== '') {
            if (is_numeric($raw['denier'])) {
                $denier = (int) round((float) $raw['denier']);
                if ($denier >= 0 && $denier <= 200) {
                    $out['denier'] = $denier;
                }
            }
        }

        $opacity = self::nullableEnum($raw['opacity'] ?? null, self::OPACITY);
        if ($opacity !== null) {
            $out['opacity'] = $opacity;
        }

        $finish = self::nullableEnum($raw['finish'] ?? null, self::FINISH);
        if ($finish !== null) {
            $out['finish'] = $finish;
        }

        foreach (['pattern', 'toe', 'waist'] as $key) {
            $val = self::nullableString($raw[$key] ?? null, 64);
            if ($val !== null) {
                $out[$key] = $val;
            }
        }

        return $out === [] ? null : $out;
    }

    /**
     * Attributes suitable for the stylist wardrobe catalog (typed + relevant only).
     *
     * @param  array<string, mixed>|null  $attrs
     * @return array<string, mixed>|null
     */
    public static function forCatalog(?string $category, ?array $attrs): ?array
    {
        return self::normalize($category, $attrs);
    }

    /**
     * Derive outfit visibility role from clothing type / placement.
     *
     * @return 'primary'|'supporting'|'accessory'
     */
    public static function visibilityRole(?string $category, ?string $bodyZone = null, ?string $wearLayer = null): string
    {
        $type = ClothingBodyPlacement::resolveCanonicalType($category);

        if ($type !== null) {
            if (in_array($type, self::ACCESSORY_TYPES, true)) {
                return 'accessory';
            }
            if (in_array($type, self::SUPPORTING_TYPES, true)) {
                return 'supporting';
            }
            if (in_array($type, self::PRIMARY_TYPES, true)) {
                return 'primary';
            }
        }

        $layer = strtolower(trim((string) $wearLayer));
        if ($layer === 'accent') {
            return 'accessory';
        }
        if ($layer === 'base') {
            return 'supporting';
        }

        $zone = strtolower(trim((string) $bodyZone));
        if ($zone === 'head') {
            return 'accessory';
        }

        return 'primary';
    }

    /**
     * Whether ItemForm should show hosiery fields for this category.
     */
    public static function isHosieryType(?string $category): bool
    {
        $type = ClothingBodyPlacement::resolveCanonicalType($category);

        return $type !== null && in_array($type, self::HOSIERY_TYPES, true);
    }

    /**
     * @param  list<string>  $allowed
     */
    private static function nullableEnum(mixed $value, array $allowed): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        $v = strtolower(trim((string) $value));

        return in_array($v, $allowed, true) ? $v : null;
    }

    private static function nullableString(mixed $value, int $max): ?string
    {
        if ($value === null) {
            return null;
        }
        $v = trim((string) $value);
        if ($v === '') {
            return null;
        }

        return mb_substr($v, 0, $max);
    }
}
