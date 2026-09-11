Character Sheet.json — Z-Image Turbo (safetensors z Model Assistanta)

Dlaczego UnetLoaderGGUFAdvanced miał pustą listę:
  - Ten węzeł pokazuje tylko pliki .gguf
  - Model Assistant pobiera .safetensors do diffusion_models/
  - Na dysku nie ma żadnego .gguf w models/unet/

Ten workflow używa:
  - UNETLoader → z_image_turbo_bf16.safetensors
  - CLIPLoader (typ qwen_image) → qwen_3_4b_fp8_mixed.safetensors
  - VAELoader → ae.safetensors

Po załadowaniu w ComfyUI: odśwież stronę (F5) jeśli listy były puste wcześniej.

Alternatywa: blueprint „Text to Image (Z-Image-Turbo)” w menu ComfyUI.

Persona Turnaround Sheet.json — fotorealistyczny turnaround użytkownika w 3 pozach:
  - Wejście 1: gotowy character sheet (layout / pozy)
  - Wejście 2: zdjęcie użytkownika (tożsamość twarzy i ciała)
  - Pole „Parametry persony” — wklej dane z profilu (wzrost, waga, wymiary)
  - API (tymczasowo): ./scripts/fetch-persona-prompt-snippet.sh <entity_id>
    → GET http://localhost:8000/api/entity/{id}/body-snapshots/prompt-snippet

Character Sheet from Photo.json — character sheet na podstawie zdjęcia:
  - Load Image → wybierz portret / zdjęcie postaci
  - TextEncodeQwenImageEdit (ten sam model qwen_image co Z-Image)
  - VAEEncode + KSampler — generuje sheet z zachowaniem wyglądu z referencji
  - Domyślna rozdzielczość 768×768 (MPS na Macu); prompt możesz edytować w węźle
