# ComfyUI — lokalne przetwarzanie (awatar + try-on), bez wysyłki zdjęć na zewnątrz.
# ComfyUI-Manager: https://github.com/Comfy-Org/ComfyUI-Manager
#
# Mac / dev:  docker compose build comfyui && docker compose up -d comfyui
# Linux GPU:  docker compose build --build-arg TARGET=gpu comfyui

ARG TARGET=cpu

# -----------------------------------------------------------------------------
# CPU — python-slim (Mac / dev)
# -----------------------------------------------------------------------------
FROM python:3.11-slim-bookworm AS cpu

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV COMFYUI_DIR=/opt/ComfyUI

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    wget \
    ca-certificates \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt
RUN git clone --depth 1 https://github.com/comfyanonymous/ComfyUI.git ComfyUI

WORKDIR ${COMFYUI_DIR}

RUN pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r requirements.txt

COPY install-comfyui-manager.sh /tmp/install-comfyui-manager.sh
RUN chmod +x /tmp/install-comfyui-manager.sh && COMFYUI_DIR=${COMFYUI_DIR} /tmp/install-comfyui-manager.sh

RUN mkdir -p custom_workflows input/persona output/persona
COPY workflows/ custom_workflows/

COPY docker-entrypoint.sh /docker-entrypoint.sh
COPY ensure-model-dirs.sh /ensure-model-dirs.sh
RUN chmod +x /docker-entrypoint.sh /ensure-model-dirs.sh

WORKDIR ${COMFYUI_DIR}
EXPOSE 8188
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["--listen", "0.0.0.0", "--port", "8188", "--cpu", "--use-split-cross-attention", "--disable-smart-memory", "--input-directory", "input", "--output-directory", "output"]

# -----------------------------------------------------------------------------
# GPU — NVIDIA CUDA (Linux)
# -----------------------------------------------------------------------------
FROM nvidia/cuda:12.4.1-runtime-ubuntu22.04 AS gpu

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV COMFYUI_DIR=/opt/ComfyUI

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    wget \
    ca-certificates \
    python3 \
    python3-pip \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt
RUN git clone --depth 1 https://github.com/comfyanonymous/ComfyUI.git ComfyUI

WORKDIR ${COMFYUI_DIR}

RUN pip3 install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124 \
    && pip3 install --no-cache-dir -r requirements.txt

COPY install-comfyui-manager.sh /tmp/install-comfyui-manager.sh
RUN chmod +x /tmp/install-comfyui-manager.sh && COMFYUI_DIR=${COMFYUI_DIR} PIP=pip3 /tmp/install-comfyui-manager.sh

RUN mkdir -p custom_workflows input/persona output/persona
COPY workflows/ custom_workflows/

COPY docker-entrypoint.sh /docker-entrypoint.sh
COPY ensure-model-dirs.sh /ensure-model-dirs.sh
RUN chmod +x /docker-entrypoint.sh /ensure-model-dirs.sh

WORKDIR ${COMFYUI_DIR}
EXPOSE 8188
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["--listen", "0.0.0.0", "--port", "8188", "--disable-smart-memory", "--input-directory", "input", "--output-directory", "output"]
