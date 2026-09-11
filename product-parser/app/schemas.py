from pydantic import BaseModel, Field


class ParseRequest(BaseModel):
    url: str = Field(min_length=8, max_length=2048)
    is_footwear: bool = False
    product_class_hint: str | None = Field(default=None, max_length=32)
    trace_id: str | None = Field(default=None, max_length=64)


class ParsedProduct(BaseModel):
    source_url: str
    name: str | None = None
    brand: str | None = None
    description: str | None = None
    color: str | None = None
    size: str | None = None
    category: str | None = None
    season: str | None = None
    purchase_price: float | None = None
    purchase_currency: str | None = None
    current_value: float | None = None
    image_urls: list[str] = Field(default_factory=list)
    detected_product_class: str | None = None
    primary_sku: str | None = None
    store_profile: str | None = None
    image_meta: list[dict] = Field(default_factory=list)
    has_pair_image: bool | None = None
    pair_image_urls: list[str] = Field(default_factory=list)
    pair_image_count: int = 0
    image_catalog: dict | None = None
    trace_id: str | None = None
