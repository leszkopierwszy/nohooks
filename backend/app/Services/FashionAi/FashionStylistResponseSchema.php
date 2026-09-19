<?php

namespace App\Services\FashionAi;

/**
 * OpenAI Structured Outputs JSON Schema for the fashion stylist response.
 * Strict mode: all object properties required; use nullable union types.
 */
class FashionStylistResponseSchema
{
    public const NAME = 'fashion_stylist_response';

    /**
     * Payload for chat/completions response_format.
     *
     * @return array{type: string, json_schema: array<string, mixed>}
     */
    public static function chatResponseFormat(): array
    {
        return [
            'type' => 'json_schema',
            'json_schema' => [
                'name' => self::NAME,
                'strict' => true,
                'schema' => self::schema(),
            ],
        ];
    }

    /**
     * Payload for Responses API text.format.
     *
     * @return array{type: string, name: string, strict: bool, schema: array<string, mixed>}
     */
    public static function responsesTextFormat(): array
    {
        return [
            'type' => 'json_schema',
            'name' => self::NAME,
            'strict' => true,
            'schema' => self::schema(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function schema(): array
    {
        return [
            'type' => 'object',
            'additionalProperties' => false,
            'properties' => [
                'analysis' => [
                    'type' => 'object',
                    'additionalProperties' => false,
                    'properties' => [
                        'wardrobe_overview' => ['type' => 'string'],
                        'strengths' => [
                            'type' => 'array',
                            'items' => ['type' => 'string'],
                        ],
                        'limitations' => [
                            'type' => 'array',
                            'items' => ['type' => 'string'],
                        ],
                        'possible_sets_estimate' => ['type' => 'integer'],
                        'possible_sets_note' => ['type' => 'string'],
                    ],
                    'required' => [
                        'wardrobe_overview',
                        'strengths',
                        'limitations',
                        'possible_sets_estimate',
                        'possible_sets_note',
                    ],
                ],
                'suggestions' => [
                    'type' => 'array',
                    'items' => [
                        'type' => 'object',
                        'additionalProperties' => false,
                        'properties' => [
                            'label' => ['type' => 'string'],
                            'occasion' => ['type' => ['string', 'null']],
                            'formality' => ['type' => ['number', 'null']],
                            'notes' => ['type' => ['string', 'null']],
                            'primary_item_ids' => [
                                'type' => 'array',
                                'items' => ['type' => 'integer'],
                            ],
                            'supporting_item_ids' => [
                                'type' => 'array',
                                'items' => ['type' => 'integer'],
                            ],
                            'accessory_item_ids' => [
                                'type' => 'array',
                                'items' => ['type' => 'integer'],
                            ],
                            'rationale' => ['type' => 'string'],
                        ],
                        'required' => [
                            'label',
                            'occasion',
                            'formality',
                            'notes',
                            'primary_item_ids',
                            'supporting_item_ids',
                            'accessory_item_ids',
                            'rationale',
                        ],
                    ],
                ],
                'wardrobe_needs' => [
                    'type' => 'array',
                    'items' => self::wardrobeNeedItemSchema(),
                ],
            ],
            'required' => ['analysis', 'suggestions', 'wardrobe_needs'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private static function wardrobeNeedItemSchema(): array
    {
        return [
            'type' => 'object',
            'additionalProperties' => false,
            'properties' => [
                'need_id' => ['type' => 'string'],
                'item_type' => ['type' => 'string'],
                'subtype' => [
                    'type' => 'array',
                    'items' => ['type' => 'string'],
                ],
                'colors' => [
                    'type' => 'array',
                    'items' => ['type' => 'string'],
                ],
                'formality' => [
                    'type' => ['object', 'null'],
                    'additionalProperties' => false,
                    'properties' => [
                        'min' => ['type' => ['number', 'null']],
                        'max' => ['type' => ['number', 'null']],
                    ],
                    'required' => ['min', 'max'],
                ],
                'styles' => [
                    'type' => 'array',
                    'items' => ['type' => 'string'],
                ],
                'materials' => [
                    'type' => 'array',
                    'items' => ['type' => 'string'],
                ],
                'details' => [
                    'type' => ['object', 'null'],
                    'additionalProperties' => false,
                    'properties' => [
                        'denier' => [
                            'type' => ['object', 'null'],
                            'additionalProperties' => false,
                            'properties' => [
                                'min' => ['type' => ['number', 'null']],
                                'max' => ['type' => ['number', 'null']],
                            ],
                            'required' => ['min', 'max'],
                        ],
                        'opacity' => [
                            'type' => ['array', 'null'],
                            'items' => [
                                'type' => 'string',
                                'enum' => ['ultra_sheer', 'sheer', 'semi_opaque', 'opaque'],
                            ],
                        ],
                        'finish' => [
                            'type' => ['array', 'null'],
                            'items' => [
                                'type' => 'string',
                                'enum' => ['matte', 'satin', 'glossy'],
                            ],
                        ],
                        'heel_height_cm' => [
                            'type' => ['object', 'null'],
                            'additionalProperties' => false,
                            'properties' => [
                                'min' => ['type' => ['number', 'null']],
                                'max' => ['type' => ['number', 'null']],
                            ],
                            'required' => ['min', 'max'],
                        ],
                        'toe' => [
                            'type' => ['array', 'null'],
                            'items' => ['type' => 'string'],
                        ],
                        'pattern' => ['type' => ['string', 'null']],
                        'waist' => ['type' => ['string', 'null']],
                        'notes' => ['type' => ['string', 'null']],
                    ],
                    'required' => [
                        'denier',
                        'opacity',
                        'finish',
                        'heel_height_cm',
                        'toe',
                        'pattern',
                        'waist',
                        'notes',
                    ],
                ],
                'avoid' => [
                    'type' => 'array',
                    'items' => ['type' => 'string'],
                ],
                'reason' => ['type' => 'string'],
                'priority' => [
                    'type' => 'string',
                    'enum' => ['low', 'medium', 'high'],
                ],
                'pairs_with_item_ids' => [
                    'type' => 'array',
                    'items' => ['type' => 'integer'],
                ],
                'preferred_stores' => [
                    'type' => 'array',
                    'items' => ['type' => 'string'],
                ],
                'search_query' => ['type' => ['string', 'null']],
            ],
            'required' => [
                'need_id',
                'item_type',
                'subtype',
                'colors',
                'formality',
                'styles',
                'materials',
                'details',
                'avoid',
                'reason',
                'priority',
                'pairs_with_item_ids',
                'preferred_stores',
                'search_query',
            ],
        ];
    }
}
