<?php

namespace App\Services\FashionAi;

/**
 * Future product-search integration point.
 *
 * The stylist emits structured wardrobe_needs; a separate search/crawler
 * should resolve real catalog products. Do not invent store inventory here.
 */
class ProductSearchService
{
    /**
     * @param  array<string, mixed>  $wardrobeNeed  Normalized wardrobe_need from FashionStylistService
     * @param  list<array{name: string, brand: ?string, url: string}>  $stores
     * @param  'female'|'male'|null  $gender
     * @param  array{min?: float|null, max?: float|null}|null  $priceRange
     * @return list<array<string, mixed>>
     */
    public function searchProducts(
        array $wardrobeNeed,
        array $stores = [],
        ?string $gender = null,
        ?array $priceRange = null,
    ): array {
        // Not implemented: wire to product DB / crawler later.
        return [];
    }
}
