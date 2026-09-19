from pydantic import BaseModel, Field


class CreateCustomBundleRequest(BaseModel):
    hf_url: str | None = Field(None, description="Jeden link HF")
    hf_urls: list[str] | None = Field(None, description="Wiele linków (alternatywa)")
    name: str | None = Field(None, max_length=120)
    description: str | None = Field(None, max_length=500)
    target_subdir: str | None = Field(
        None,
        description="Wymuszenie folderu: diffusion_models, text_encoders, vae, loras, …",
    )


class FashionAiSettingsUpdate(BaseModel):
    api_key: str | None = Field(None, max_length=512)
    clear_api_key: bool = False
    model: str | None = Field(None, max_length=120)
    base_url: str | None = Field(None, max_length=255)
    label: str | None = Field(None, max_length=120)
    invocation_mode: str | None = Field(
        None,
        max_length=32,
        description="chat = chat/completions + system prompt; agent = Responses API + OpenAI Prompt/Agent id",
    )
    agent_id: str | None = Field(
        None,
        max_length=255,
        description="OpenAI Prompt/Agent id (pmpt_…) used when invocation_mode=agent",
    )
    clear_agent_id: bool = False


class FashionAiKeyCreate(BaseModel):
    api_key: str = Field(..., min_length=1, max_length=512)
    label: str | None = Field(None, max_length=120)
    activate: bool = True


class FashionAiPromptUpdate(BaseModel):
    system_prompt: str | None = Field(None, max_length=20000)
    reset: bool = False


class FashionAiLogCreate(BaseModel):
    status: str = Field("ok", max_length=32)
    model: str | None = Field(None, max_length=120)
    base_url_host: str | None = Field(None, max_length=255)
    duration_ms: int | None = None
    entity_id: int | None = None
    user_id: int | None = None
    occasion: str | None = Field(None, max_length=64)
    notes: str | None = Field(None, max_length=4000)
    catalog_count: int | None = None
    http_status: int | None = None
    request: dict | list | None = None
    response: dict | list | str | None = None
    usage: dict | None = None
    error: str | None = Field(None, max_length=20000)

