# Local AI Ops Guide — setup + troubleshoot

> **Created:** 2026-09-10
> **Status:** 🟡 Skeleton — fill chi tiết khi Phase 1 bắt đầu
> **Hardware target:** RTX 4060 8GB VRAM + 24GB system RAM

---

## 1. Hardware check

### Verify GPU + driver + CUDA

```bash
# GPU detected?
nvidia-smi

# Expected output:
# +----------------------------------------------------------------------+
# | NVIDIA-SMI 5xx.xx    Driver Version: 5xx.xx    CUDA Version: 12.x    |
# | GPU  Name        Persistence-M | Bus-Id        Memory-Usage |
# | 0    NVIDIA GeForce RTX 4060    On             00000000:...  8GB total |
# +----------------------------------------------------------------------+

# CUDA toolkit
nvcc --version

# NVIDIA Container Toolkit (for Docker GPU access)
nvidia-ctk --version
```

### Docker NVIDIA runtime

```bash
# Check if NVIDIA runtime is default
docker info | grep -i runtime

# Should include "runc" and "nvidia"
# If not, install:
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | \
  sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list | \
  sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
  sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

### Verify GPU in container

```bash
docker run --rm --gpus all nvidia/cuda:12.3.1-base-ubuntu22.04 nvidia-smi
```

---

## 2. Ollama setup

### Pull + run

```bash
# Run via docker compose
docker compose up -d ollama

# Or standalone
docker run -d --gpus all \
  -v ollama_data:/root/.ollama \
  -p 11434:11434 \
  --name ollama \
  ollama/ollama:latest
```

### Pull models

```bash
# 3B for router (Phase 1)
docker exec ollama ollama pull qwen2.5:3b-instruct-q4_K_M

# 7B for vocab + moderation (Phase 2)
docker exec ollama ollama pull qwen2.5:7b-instruct-q4_K_M

# 14B for chatbot answer / grading experiments (Phase 3-4)
docker exec ollama ollama pull qwen2.5:14b-instruct-q4_K_M

# List installed models
docker exec ollama ollama list
```

### API endpoint

```
POST http://localhost:11434/api/generate
{
  "model": "qwen2.5:7b-instruct-q4_K_M",
  "prompt": "...",
  "stream": false,
  "options": {
    "temperature": 0.3,
    "num_predict": 500
  }
}
```

### Cold-start handling

```bash
# Keep model loaded (avoid 30-60s cold-start)
docker exec ollama ollama run qwen2.5:7b-instruct-q4_K_M --keepalive 24h

# Or set in Ollama env
OLLAMA_KEEP_ALIVE=24h
```

---

## 3. TEI (Text Embeddings Inference) setup

### Pull + run

```bash
docker run -d --gpus all \
  -p 8080:80 \
  -v tei_data:/data \
  --name tei-embed \
  ghcr.io/huggingface/text-embeddings-inference:latest \
  --model-id BAAI/bge-m3 \
  --revision main
```

### Verify

```bash
curl -X POST http://localhost:8080/embed \
  -H "Content-Type: application/json" \
  -d '{"inputs": ["hello world", "xin chào"]}'
```

### Schema migration (Supabase)

```sql
-- Check current dimension
SELECT atttypmod FROM pg_attribute
WHERE attrelid = 'rag_documents'::regclass
  AND attname = 'embedding';

-- Migrate to 1024-d (bge-m3)
ALTER TABLE rag_documents
ALTER COLUMN embedding TYPE vector(1024)
USING (embedding::vector(1024));

-- Or keep 768-d (nomic-embed-text-v1.5)
-- ALTER TABLE rag_documents
-- ALTER COLUMN embedding TYPE vector(768)
-- USING (embedding::vector(768));
```

Re-embed script: query all rows → call TEI → UPDATE.

---

## 4. faster-whisper setup

### Pull + run

```bash
docker run -d --gpus all \
  -p 9000:9000 \
  -v whisper_data:/root/.cache/huggingface \
  --name whisper-server \
  fedirz/faster-whisper-server:latest \
  --model Systran/faster-whisper-large-v3 \
  --model-type small  # int8 quantization
```

### API endpoint

```
POST http://localhost:9000/v1/audio/transcriptions
Content-Type: multipart/form-data
file: <audio>
```

---

## 5. Docker Compose integration

Add to `ielts_training_app/docker-compose.yml`:

```yaml
services:
  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    network_mode: host
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    volumes:
      - ollama_data:/root/.ollama
    environment:
      - OLLAMA_KEEP_ALIVE=24h

  tei-embed:
    image: ghcr.io/huggingface/text-embeddings-inference:latest
    container_name: tei-embed
    network_mode: host
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    volumes:
      - tei_data:/data
    command: --model-id BAAI/bge-m3

  whisper-server:
    image: fedirz/faster-whisper-server:latest
    container_name: whisper-server
    network_mode: host
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    volumes:
      - whisper_data:/root/.cache/huggingface

volumes:
  ollama_data:
  tei_data:
  whisper_data:
```

**VRAM allocation** (8GB total):
- TEI (bge-m3): ~1.5GB
- Ollama 3B router: ~2.5GB (Phase 1)
- Ollama 7B vocab+moderation: ~5GB (Phase 2)
- faster-whisper large-v3: ~2GB (Phase 1)
- Ollama 14B hybrid: ~6-8GB + ~6GB RAM offload (Phase 3-4)

**Concurrency**: Phase 1-2 share 8GB → run sequentially OR use Ollama's HTTP router with multiple models loaded (cộng dồn VRAM có thể vượt quota).

---

## 6. Fallback strategy

Mỗi worker check env var trước khi gọi:

```typescript
const useLocal = process.env.USE_LOCAL_MODEL === 'true';

if (useLocal) {
  return await callOllama(...);
} else {
  return await callGroq(...);
}
```

Env vars per worker:

| Worker | Env var | Local target |
|---|---|---|
| embedding-worker | `USE_LOCAL_EMBED` | TEI bge-m3 |
| chatbot-worker | `USE_LOCAL_ROUTER` | Ollama 3B router |
| chatbot-worker | `USE_LOCAL_ANSWER` | Ollama 14B answer |
| grading-worker | `USE_LOCAL_WHISPER` | faster-whisper |
| grading-worker | `USE_LOCAL_GRADING` | Ollama 14B grading |
| moderation-worker | `USE_LOCAL_VOCAB` | Ollama 7B vocab |
| moderation-worker | `USE_LOCAL_MODERATION` | Ollama 7B moderation |

**Quick rollback**: set env var = false → restart worker.

---

## 7. Common errors + fixes

### CUDA out of memory

```
RuntimeError: CUDA out of memory. Tried to allocate 2.00 GiB.
```

**Fix**: 
- Giảm model size (7B → 3B)
- Tăng CPU offload layers trong Ollama config
- Stop other GPU services tạm thời

### CUDA driver mismatch

```
NVIDIA driver on your system is too old
```

**Fix**:
```bash
# Check driver version
nvidia-smi | head -3
# Update driver nếu < 525
sudo apt-get upgrade nvidia-driver-535
```

### Ollama cold-start timeout

```
Error: model not loaded
```

**Fix**:
```bash
# Keep model warm
OLLAMA_KEEP_ALIVE=24h
# Or pre-warm
docker exec ollama ollama run qwen2.5:7b-instruct-q4_K_M ""
```

### TEI model not found

```
404: model not found
```

**Fix**: 
```bash
# Verify model downloaded
docker exec tei-embed ls /data
# Re-pull if missing
docker exec tei-embed text-embeddings-inference download-weights BAAI/bge-m3
```

### Whisper port conflict

```
bind: address already in use
```

**Fix**:
```bash
# Find process using port 9000
lsof -i :9000
# Kill hoặc đổi port
docker run -p 9001:9000 ...
```

---

## 8. Backup + restore

### Backup model cache

```bash
# Stop services first
docker compose down

# Backup volumes
docker run --rm \
  -v ollama_data:/source:ro \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/ollama-$(date +%F).tar.gz -C /source .

docker run --rm \
  -v tei_data:/source:ro \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/tei-$(date +%F).tar.gz -C /source .

docker run --rm \
  -v whisper_data:/source:ro \
  -v $(pwd)/backup:/backup \
  alpine tar czf /backup/whisper-$(date +%F).tar.gz -C /source .
```

### Restore

```bash
docker run --rm \
  -v ollama_data:/target \
  -v $(pwd)/backup:/backup \
  alpine tar xzf /backup/ollama-2026-09-10.tar.gz -C /target
```

---

## 9. Monitoring

### GPU metrics

```bash
# Real-time
watch -n 1 nvidia-smi

# Prometheus exporter (DCGM)
docker run -d --gpus all \
  -p 9400:9400 \
  nvcr.io/nvidia/k8s/dcgm-exporter:latest
```

### Service health

```bash
# Ollama
curl http://localhost:11434/api/tags

# TEI
curl http://localhost:8080/health

# faster-whisper
curl http://localhost:9000/
```

---

## Status

- [ ] Hardware check passed (CUDA + driver)
- [ ] Docker NVIDIA runtime working
- [ ] Ollama + models pulled
- [ ] TEI + embedding model pulled
- [ ] Whisper server running
- [ ] docker-compose.yml updated
- [ ] Fallback env vars wired in workers
- [ ] Backup strategy tested

---

## Cross-references

- [migration-plan.md](./migration-plan.md) — phases + decision gates
- [evaluation-framework.md](./evaluation-framework.md) — eval harness
- [ai-workers-inventory.md](./ai-workers-inventory.md) — call sites
