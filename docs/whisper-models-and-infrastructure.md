## 1. Implementation Comparison

| Implementation | Speed | Accuracy | Integration | GPU Support |
|----------------|-------|----------|-------------|-------------|
| **@xenova/transformers** | 0.8x | Excellent | Easy (JS/TS) | Limited |
| **OpenAI Whisper** | 1x | Best | Medium (Python) | Yes |
| **Faster-Whisper** ⭐ | **3-6x** | Same as baseline | Medium (Python) | Yes (Metal/CUDA) |
| **whisper.cpp** ❌ | 0.5x | Poor (68% hallucinations) | Hard | Yes |
| **Groq Cloud** ⭐⭐ | **164x** | Best | Easy (HTTP API) | N/A |

---

## 2. Model Comparison

| Model | Parameters | Size | Quality | Speed (CPU) | Speed (GPU) | Recommendation |
|-------|-----------|------|---------|-------------|-------------|----------------|
| **tiny.en** ❌ | 39M | 75MB | Poor | 1-2s | ~1s | Testing only - repetition bugs |
| **base.en** | 74M | 140MB | Decent | 2-3s | ~1-2s | Basic use |
| **small.en** ⭐ | 244M | 460MB | Good | 4-6s | ~3-5s | **Best local balance** |
| **medium.en** | 769M | 1.5GB | Very Good | 8-12s | ~6-8s | High quality |
| **large-v3** | 1550M | 3GB | Best | 15-20s | ~10-15s | Cloud only |

---

## 3. Speed Benchmarks

### Local Processing

| Implementation | Model | Hardware | 30s Audio | 60s Audio | 2min Audio | 3min Audio |
|----------------|-------|----------|-----------|-----------|------------|------------|
| whisper.cpp | base.en | CPU | ~15s | ~30s | ~1m0s | ~1m30s |
| whisper.cpp | base.en | CoreML (ANE) | ~3s | ~5s | ~10s | ~15s |
| whisper.cpp | small.en | CPU | ~20s | ~40s | ~1m20s | ~2m0s |
| whisper.cpp | small.en | CoreML (ANE) | ~3s | ~6s | ~12s | ~18s |
| whisper.cpp | medium.en | CPU | ~38s | ~1m15s | ~2m30s | ~3m45s |
| whisper.cpp | medium.en | CoreML (ANE) | ~6s | ~12s | ~24s | ~36s |
| Faster-Whisper | base.en | CPU | ~10s | ~20s | ~40s | ~1m0s |
| Faster-Whisper | small.en | CPU | ~12s | ~24s | ~48s | ~1m12s |
| Faster-Whisper | medium.en | CPU | ~20s | ~40s | ~1m20s | ~2m0s |
| OpenAI Whisper | base.en | CPU | ~38s | ~1m15s | ~2m30s | ~3m45s |
| OpenAI Whisper | base.en | MPS (Metal) | ~10s | ~20s | ~40s | ~1m0s |
| OpenAI Whisper | small.en | CPU | ~50s | ~1m40s | ~3m20s | ~5m0s |
| OpenAI Whisper | small.en | MPS (Metal) | ~12s | ~24s | ~48s | ~1m12s |
| OpenAI Whisper | medium.en | CPU | ~1m15s | ~2m30s | ~5m0s | ~7m30s |
| OpenAI Whisper | medium.en | MPS (Metal) | ~20s | ~40s | ~1m20s | ~2m0s |

### Remote Processing (Cloud/GPU Servers)

#### Serverless Platforms (Recommended for Variable Workloads) ⭐

| Implementation | Model | Provider | 30s Audio | 60s Audio | 2min Audio | 3min Audio |
|----------------|-------|----------|-----------|-----------|------------|------------|
| <span style="color: #22c55e">**Groq Cloud**</span> | Distil-Whisper | Groq LPU | <span style="color: #22c55e">115ms</span> | <span style="color: #22c55e">229ms</span> | <span style="color: #22c55e">458ms</span> | <span style="color: #22c55e">687ms</span> |
| <span style="color: #22c55e">**Groq Cloud**</span> | Large v3 Turbo | Groq LPU | <span style="color: #22c55e">139ms</span> | <span style="color: #22c55e">278ms</span> | <span style="color: #22c55e">556ms</span> | <span style="color: #22c55e">833ms</span> |
| **OpenAI API** | Large v3 | OpenAI | ~3s | ~6s | ~12s | ~18s |
| **Baseten** ⭐ | small.en | T4 GPU | 500ms | ~1s | ~2s | ~3s |
| **Baseten** ⭐ | small.en | A10G GPU | 300ms | 600ms | ~1s | ~2s |
| **Baseten** ⭐ | medium.en | T4 GPU | 750ms | ~2s | ~3s | ~5s |
| **Baseten** ⭐ | medium.en | A10G GPU | 429ms | 857ms | ~2s | ~3s |
| **Baseten** ⭐ | large-v3 | T4 GPU | ~1s | ~2s | ~5s | ~7s |
| **Baseten** ⭐ | large-v3 | A10G GPU | 600ms | ~1s | ~2s | ~4s |
| **Modal** | small.en | T4 GPU | 500ms | ~1s | ~2s | ~3s |
| **Modal** | small.en | A10G GPU | 300ms | 600ms | ~1s | ~2s |
| **Modal** | medium.en | T4 GPU | 750ms | ~2s | ~3s | ~5s |
| **Modal** | medium.en | A10G GPU | 429ms | 857ms | ~2s | ~3s |
| **RunPod Serverless** | small.en | Auto-scaled GPU | 500ms | ~1s | ~2s | ~3s |
| **RunPod Serverless** | medium.en | Auto-scaled GPU | 750ms | ~2s | ~3s | ~5s |


## 4. Cost Per Hour of Audio Transcribed

### Serverless Platforms (Recommended) ⭐

| Implementation | Model | Provider | Cost/Hour Audio |
|----------------|-------|----------|-----------------|
| <span style="color: #22c55e">**Groq Cloud**</span> | Distil-Whisper | Groq LPU | <span style="color: #22c55e">**$0.02**</span> |
| <span style="color: #22c55e">**Groq Cloud**</span> | Large v3 Turbo | Groq LPU | <span style="color: #22c55e">**$0.04**</span> |
| **OpenAI API** | Large v3 | OpenAI | $0.36 |
| **Baseten** ⭐ | small.en | T4 GPU | $0.01 |
| **Baseten** ⭐ | small.en | A10G GPU | $0.01 |
| **Baseten** ⭐ | medium.en | T4 GPU | $0.02 |
| **Baseten** ⭐ | medium.en | A10G GPU | $0.01 |
| **Baseten** ⭐ | large-v3 | T4 GPU | $0.03 |
| **Baseten** ⭐ | large-v3 | A10G GPU | $0.02 |
| **Modal** | small.en | T4 GPU | $0.01 |
| **Modal** | small.en | A10G GPU | $0.01 |
| **Modal** | medium.en | T4 GPU | $0.01 |
| **Modal** | medium.en | A10G GPU | $0.02 |
| **RunPod Serverless** | small.en | Auto-scaled | $0.01 |
| **RunPod Serverless** | medium.en | Auto-scaled | $0.02 |
| **RunPod Serverless** | large-v3 | Auto-scaled | $0.04 |

