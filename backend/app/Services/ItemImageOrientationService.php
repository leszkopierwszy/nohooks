<?php

namespace App\Services;

use App\Models\ItemImage;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class ItemImageOrientationService
{
    public const FACING_LEFT = 'left';

    public const FACING_RIGHT = 'right';

    public const FACING_NEUTRAL = 'neutral';

    private const ANALYSIS_MAX = 320;

    private const BG_DISTANCE = 26;

    private const MIN_FG_RATIO = 0.015;

    /**
     * @return array{direction: string, confidence: float, score: float, should_mirror: bool, mirrored: bool, url: ?string}
     */
    public function orientToRight(ItemImage $image, bool $force = false): array
    {
        $binary = $this->loadImageBinary($image);
        $detection = $this->detectFacing($binary);

        $shouldMirror = $force
            || $detection['should_mirror']
            || $detection['direction'] === self::FACING_LEFT
            || $detection['score'] < -0.03;

        if (! $shouldMirror) {
            return [
                ...$detection,
                'mirrored' => false,
                'direction_after' => $detection['direction'],
                'url' => $image->url,
            ];
        }

        $flipped = $this->flipHorizontal($binary);
        $mime = $this->guessMime($binary);
        $extension = $mime === 'image/png' ? 'png' : ($mime === 'image/webp' ? 'webp' : 'jpg');
        $path = 'items/'.uniqid('orient_', true).'.'.$extension;

        Storage::disk('public')->put($path, $flipped);

        if ($image->image_path) {
            Storage::disk('public')->delete($image->image_path);
        }

        $image->update([
            'image_path' => $path,
            'external_url' => null,
        ]);

        $after = $this->detectFacing($flipped);

        return [
            ...$detection,
            'mirrored' => true,
            'direction_after' => $after['direction'],
            'confidence_after' => $after['confidence'],
            'url' => $image->fresh()->url,
        ];
    }

    /**
     * @return array{direction: string, confidence: float, score: float, should_mirror: bool}
     */
    public function detectFacingForImage(ItemImage $image): array
    {
        return $this->detectFacing($this->loadImageBinary($image));
    }

    /**
     * @return array{direction: string, confidence: float, score: float, should_mirror: bool}
     */
    public function detectFacing(string $binary): array
    {
        $img = $this->createImage($binary);
        $width = imagesx($img);
        $height = imagesy($img);

        $scale = min(1, self::ANALYSIS_MAX / max($width, $height));
        $aw = max(1, (int) round($width * $scale));
        $ah = max(1, (int) round($height * $scale));

        $analysis = imagecreatetruecolor($aw, $ah);
        imagecopyresampled($analysis, $img, 0, 0, 0, 0, $aw, $ah, $width, $height);
        imagedestroy($img);

        $bg = $this->sampleEdgeBackground($analysis, $aw, $ah);

        $xs = [];

        for ($y = 0; $y < $ah; $y++) {
            for ($x = 0; $x < $aw; $x++) {
                $rgba = imagecolorat($analysis, $x, $y);
                $a = ($rgba >> 24) & 0x7F;
                if ($a > 60) {
                    continue;
                }

                $r = ($rgba >> 16) & 0xFF;
                $g = ($rgba >> 8) & 0xFF;
                $b = $rgba & 0xFF;

                if ($this->colorDistance($r, $g, $b, $bg) < self::BG_DISTANCE) {
                    continue;
                }

                $xs[] = $x;
            }
        }

        imagedestroy($analysis);

        $total = count($xs);
        $fgRatio = $total / ($aw * $ah);

        if ($total < $aw * $ah * self::MIN_FG_RATIO) {
            return [
                'direction' => self::FACING_NEUTRAL,
                'confidence' => 0.0,
                'score' => 0.0,
                'should_mirror' => false,
            ];
        }

        $leftExtent = $aw;
        $rightExtent = 0;
        $comX = 0;

        foreach ($xs as $x) {
            $comX += $x;
            $leftExtent = min($leftExtent, $x);
            $rightExtent = max($rightExtent, $x);
        }

        $comX /= $total;
        $span = max(1, $rightExtent - $leftExtent);

        $stripCounts = [0, 0, 0];
        foreach ($xs as $x) {
            $t = min(2, max(0, (int) floor((($x - $leftExtent) / $span) * 3)));
            $stripCounts[$t]++;
        }

        $minStrip = min($stripCounts);
        $minIdx = array_search($minStrip, $stripCounts, true);

        $toeScore = 0.0;
        if ($minIdx === 0 && $stripCounts[0] < $stripCounts[2] * 0.92) {
            $toeScore = -1.0;
        } elseif ($minIdx === 2 && $stripCounts[2] < $stripCounts[0] * 0.92) {
            $toeScore = 1.0;
        }

        $extentBias = ($rightExtent - $comX - ($comX - $leftExtent)) / $span;
        $geoCenter = ($leftExtent + $rightExtent) / 2;
        $comBias = ($comX - $geoCenter) / $span;

        $mid = ($leftExtent + $rightExtent) / 2;
        $leftMass = 0;
        $rightMass = 0;
        foreach ($xs as $x) {
            if ($x < $mid) {
                $leftMass++;
            } else {
                $rightMass++;
            }
        }
        $massRatio = ($rightMass - $leftMass) / $total;

        $score = 0.35 * $toeScore + 0.35 * $extentBias + 0.2 * $comBias + 0.1 * $massRatio;
        $confidence = min(1.0, abs($score) * 2.2 + ($fgRatio > 0.03 ? 0.2 : 0.0) + ($toeScore !== 0.0 ? 0.15 : 0.0));

        $direction = self::FACING_NEUTRAL;
        if ($score > 0.05) {
            $direction = self::FACING_RIGHT;
        } elseif ($score < -0.05) {
            $direction = self::FACING_LEFT;
        }

        $shouldMirror = $direction === self::FACING_LEFT
            || $score < -0.02
            || ($massRatio < -0.05 && $confidence >= 0.1);

        return [
            'direction' => $direction,
            'confidence' => round($confidence, 3),
            'score' => round($score, 3),
            'should_mirror' => $shouldMirror,
        ];
    }

    public function orientCoverIfNeeded(ItemImage $image): ?array
    {
        if (! $image->image_path && ! $image->external_url) {
            return null;
        }

        $detection = $this->detectFacingForImage($image);

        if (! $detection['should_mirror'] && $detection['direction'] !== self::FACING_LEFT && $detection['score'] >= -0.03) {
            return [
                ...$detection,
                'mirrored' => false,
            ];
        }

        return $this->orientToRight($image);
    }

    private function loadImageBinary(ItemImage $image): string
    {
        if ($image->image_path) {
            $contents = Storage::disk('public')->get($image->image_path);
            if ($contents === null || $contents === '') {
                throw new RuntimeException('Brak pliku zdjęcia na dysku.');
            }

            return $contents;
        }

        if ($image->external_url) {
            $response = Http::timeout(30)->get($image->external_url);
            $response->throw();

            return $response->body();
        }

        throw new RuntimeException('Zdjęcie nie ma źródła do odczytu.');
    }

    private function flipHorizontal(string $binary): string
    {
        $img = $this->createImage($binary);
        if (! imageflip($img, IMG_FLIP_HORIZONTAL)) {
            imagedestroy($img);
            throw new RuntimeException('Nie udało się odbić obrazu.');
        }

        ob_start();
        $mime = $this->guessMime($binary);
        $ok = match ($mime) {
            'image/png' => imagepng($img),
            'image/webp' => function_exists('imagewebp') ? imagewebp($img, null, 90) : imagejpeg($img, null, 92),
            default => imagejpeg($img, null, 92),
        };
        imagedestroy($img);
        $out = ob_get_clean();

        if (! $ok || $out === false) {
            throw new RuntimeException('Nie udało się zapisać odbitego obrazu.');
        }

        return $out;
    }

    private function createImage(string $binary): \GdImage
    {
        $img = @imagecreatefromstring($binary);
        if ($img === false) {
            throw new RuntimeException('Nieobsługiwany format obrazu.');
        }

        return $img;
    }

    private function guessMime(string $binary): string
    {
        if (str_starts_with($binary, "\x89PNG\r\n\x1a\n")) {
            return 'image/png';
        }
        if (str_starts_with($binary, 'RIFF') && str_contains(substr($binary, 0, 16), 'WEBP')) {
            return 'image/webp';
        }

        return 'image/jpeg';
    }

    /**
     * @return array{0: float, 1: float, 2: float}
     */
    private function sampleEdgeBackground(\GdImage $img, int $width, int $height): array
    {
        $strip = max(1, min(10, (int) floor(min($width, $height) * 0.05)));
        $step = max(1, (int) floor(min($width, $height) / 20));
        $samples = [];

        $add = function (int $x, int $y) use ($img, &$samples): void {
            $rgba = imagecolorat($img, $x, $y);
            $a = ($rgba >> 24) & 0x7F;
            if ($a > 60) {
                return;
            }
            $samples[] = [
                ($rgba >> 16) & 0xFF,
                ($rgba >> 8) & 0xFF,
                $rgba & 0xFF,
            ];
        };

        for ($x = 0; $x < $width; $x += $step) {
            for ($y = 0; $y < $strip; $y++) {
                $add($x, $y);
            }
            for ($y = $height - $strip; $y < $height; $y++) {
                $add($x, $y);
            }
        }

        for ($y = $strip; $y < $height - $strip; $y += $step) {
            for ($x = 0; $x < $strip; $x++) {
                $add($x, $y);
            }
            for ($x = $width - $strip; $x < $width; $x++) {
                $add($x, $y);
            }
        }

        if ($samples === []) {
            return [255.0, 255.0, 255.0];
        }

        $r = $g = $b = 0.0;
        foreach ($samples as [$sr, $sg, $sb]) {
            $r += $sr;
            $g += $sg;
            $b += $sb;
        }

        $n = count($samples);

        return [$r / $n, $g / $n, $b / $n];
    }

    /**
     * @param  array{0: float, 1: float, 2: float}  $bg
     */
    private function colorDistance(int $r, int $g, int $b, array $bg): float
    {
        return sqrt(($r - $bg[0]) ** 2 + ($g - $bg[1]) ** 2 + ($b - $bg[2]) ** 2);
    }
}
