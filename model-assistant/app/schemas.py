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
