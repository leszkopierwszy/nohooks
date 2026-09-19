<?php

namespace App\Support;

/**
 * Mirrors frontend outfitCollections.js — clothes / shoes / accessories only.
 */
class FashionCollection
{
    public static function isFashion(?string $name): bool
    {
        if ($name === null) {
            return false;
        }

        $n = mb_strtolower(trim($name));
        if ($n === '') {
            return false;
        }

        if (preg_match('/electron|gadget|tech|audio|gaming|book|ksi[aą][zż]|media|software|laptop|phone|tablet|kamera|camera/u', $n)) {
            return false;
        }

        if (preg_match('/^clothes?$|^clothing$|^ubrania$|^wardrobe$|^szafa$|^shoes?$|^obuwie$|^footwear$/u', $n)) {
            return true;
        }

        if (preg_match('/accessor|akcesor|bag|torb|bi[zż]uter|jewel|watch|zegar|scarf|hat|belt|pasek/u', $n)) {
            return true;
        }

        if (preg_match('/cloth|ubrania|wear|apparel|dress|skirt|shirt|pant|jeans|jacket|coat|sweater/u', $n)) {
            return true;
        }

        if (preg_match('/shoe|boot|sneaker|heel|sandal|obuwie|buty/u', $n)) {
            return true;
        }

        return false;
    }
}
