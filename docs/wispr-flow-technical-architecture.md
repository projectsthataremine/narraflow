# Wispr Flow Technical Architecture

**Date:** January 2025
**Purpose:** Understanding Wispr Flow's technology stack and approach

---

## Executive Summary

**Key Finding:** Wispr Flow does NOT use OpenAI's Whisper model at all. They built proprietary context-aware ASR models from scratch and use Meta's Llama for post-processing.

**Architecture:** 100% cloud-based with custom ASR models + LLM formatting
**Performance Target:** <700ms end-to-end latency (p99)
**Infrastructure:** Baseten + AWS with TensorRT-LLM optimization

---

## 1. What They DON'T Use

### ❌ NOT Using Whisper

Despite the company name "Wispr," they do NOT use OpenAI's Whisper model:
- Not Whisper tiny, base, small, medium, or large
- Not whisper.cpp
- Not Faster-Whisper
- Not any Whisper variant

**Quote from CEO:**
> "We're building the world's best ASR models (context aware, personalized, and code-switched). Advancements in ASR models...have hardly made a dent on our hardest test cases."

They acknowledge that generic Whisper models don't meet their quality bar for context-aware transcription.

---

## 2. What They DO Use

### Proprietary Context-Aware ASR Models

**Technology:**
- Custom-built ASR models (not Whisper-based)
- Multi-modal architecture
- Context-driven approach

**Key Features:**

#### Speaker Personalization
- Conditions on individual voice characteristics
- Learns user-specific pronunciation
- Adapts to accents and speech patterns

#### Contextual Awareness
- Incorporates surrounding context
- User history and patterns
- Application context (what app user is in)
- Historical topic data

#### Code-Switching Support
- Handles multilingual utterances in single recording
- Seamless language transitions
- 104 languages supported

**Architecture Philosophy:**
> "We treat speech recognition as a mixed-modal, context driven problem rather than pure acoustic modeling"

This means they're not just listening to audio - they're using:
- Voice embeddings
- Application context
- Historical user data
- Topic/domain knowledge

---

## 3. Post-Processing: Meta Llama Models

### LLM Integration

**Model:** Fine-tuned Meta Llama models
**Purpose:** Real-time transcript cleanup and formatting
**Optimization:** TensorRT-LLM on Baseten

**What it does:**
- "Personalized token-level LLM formatting"
- Grammar correction
- Punctuation
- Capitalization
- Context-aware corrections
- Local reinforcement learning from user corrections

**Performance:**
- LLM inference: <200ms
- Uses Baseten's TensorRT-LLM C++ runtime
- 100+ tokens in <250ms

---

## 4. Infrastructure Stack

### Cloud Architecture

**Platform:** Baseten + AWS
- ASR models: Custom deployment
- LLM models: Baseten with TensorRT-LLM
- Orchestration: Chains framework
- Workload planes: AWS

### Performance Targets (p99, not p50)

| Component | Target Latency |
|-----------|---------------|
| ASR Inference | <200ms |
| LLM Formatting | <200ms |
| Network Budget | <200ms |
| **Total End-to-End** | **<700ms** |

**Note:** They optimize for p99 (worst-case), not p50 (average)

### Optimization Techniques

#### TensorRT-LLM
- C++ runtime (18% faster than Python)
- Eliminates Python GIL overhead
- Batch processing optimizations

#### In-Flight Batching
- vs dynamic batching = 2x faster
- Continuous processing of requests
- No waiting for batch to fill

#### Component Scaling
- Independent scaling of ASR and LLM
- ASR can run on different hardware than LLM
- Cost optimization per component

#### Chains Framework
- Multi-step inference pipeline orchestration
- Handles complex workflows
- Manages dependencies between models

---

## 5. Scale & Performance

### Current Scale (October 2025)

**Volume:**
- 1 billion words/month currently processed
- Expected 10x growth in next 6 months (10B words/month)
- Multiple requests per user daily

**Uptime:**
- 99.99% uptime requirement
- Production-grade SLAs
- Global infrastructure

### Hardware

**Inference GPUs:**
- Likely using high-end NVIDIA GPUs (A100, H100)
- TensorRT optimization for maximum throughput
- 100-200x faster than local M1/M2 processing
- <200ms ASR inference (vs 15-20s locally for large model)

**Why Cloud:**
- Consistent performance regardless of user's hardware
- Access to powerful inference accelerators
- Better cost structure at scale
- Can use largest models without user constraints

---

## 6. Local vs Cloud Components

### What's Local (Client-Side)

**Small ONNX Models Found:**
- `silero_vad.onnx` (1.7 MB) - Voice Activity Detection
- `melspectrogram.onnx` (1.0 MB) - Audio preprocessing
- `hey_flow_whisper_rnn_10k.onnx` (720 KB) - Wake word detection
- `hey_jarvis_v0.1.onnx` (1.2 MB) - Wake word detection
- `embedding_model.onnx` (1.3 MB) - Context embeddings

**Purpose:**
- Detect when user is speaking (VAD)
- Wake word detection ("Hey Flow")
- Audio preprocessing before sending to cloud
- Generate context embeddings locally

### What's Cloud (Server-Side)

**Everything Else:**
- ASR transcription (proprietary models)
- LLM post-processing (Llama)
- Context integration
- All the heavy lifting

---

## 7. Why They Went Cloud-Only

### Technical Reasons

1. **Performance:** 100-200x faster than local
2. **Model Size:** Can use massive models (no RAM limits)
3. **Context:** Server-side context is richer
4. **Updates:** Deploy improvements without user updates
5. **Scale:** Handle any load

### Business Reasons

1. **Consistent UX:** Same fast experience for all users
2. **Quality Control:** Full control over model quality
3. **Iteration Speed:** Update models in real-time
4. **Data Moat:** User corrections improve models
5. **Network Effects:** More users = better models

### Trade-offs Accepted

**Privacy:**
- Audio goes to their servers
- "Zero data retention" claims
- But data leaves device

**Internet Required:**
- No offline mode
- Requires connection
- Network latency in total time

**Cost:**
- Must pay for inference infrastructure
- Scales with user growth
- But margins likely good at scale

---

## 8. Competitive Advantages

### Why Their Approach Works

**Context Wins:**
- Generic Whisper models lack context
- Their models know:
  - What app you're in
  - Your personal vocabulary
  - Your speaking patterns
  - Historical topics

**Example:**
- You: "Send email to John about the quarterly report"
- Whisper: Might mishear "quarterly" as "courtly"
- Wispr Flow: Knows you work with John, knows "quarterly report" is common in your vocab

**Personalization:**
- Learns your accent
- Learns your vocabulary
- Learns your speech patterns
- Gets better over time

**Multi-modal:**
- Not just audio → text
- Audio + app context + history + user profile → text

---

## 9. Their Tech Stack Summary

```
User Audio
    ↓
[Local VAD Detection] (1.7MB ONNX)
    ↓
[Local Audio Preprocessing] (1MB ONNX)
    ↓
[Send to Cloud via API]
    ↓
[Proprietary Context-Aware ASR] (<200ms)
    ↓
[Meta Llama LLM Formatting] (<200ms)
    ↓
[Return Transcription] (<200ms network)
    ↓
Total: <700ms
```

**Not Used:**
- ❌ OpenAI Whisper
- ❌ whisper.cpp
- ❌ Faster-Whisper
- ❌ Any open-source ASR

**Used:**
- ✅ Custom ASR models
- ✅ Meta Llama (fine-tuned)
- ✅ TensorRT-LLM
- ✅ Baseten + AWS
- ✅ Context integration

---

## 10. Implications for NarraFlow

### Can We Compete?

**Their Advantages:**
- Proprietary models built over 2 years
- $56M in funding
- 52 engineers
- Custom infrastructure
- Context-aware transcription
- Personalization

**Our Advantages:**
- Can use best open-source models (Whisper Large v3 via Groq)
- Lower cost structure (Groq is cheaper than custom infra)
- Faster time to market (no need to train models)
- Privacy angle (can offer local option)
- Better margins (73% vs unknown for them)

### Key Takeaway

**You don't need to beat their technology to compete.**

Their approach:
- 2+ years of development
- Tens of millions in infrastructure
- Custom models
- Requires massive scale to justify

Your approach:
- Use best available models (Whisper Large v3)
- Pay per use (Groq)
- Get 90% of the quality at 1% of the cost
- Ship in weeks, not years

**For 90% of users, Whisper Large v3 is "good enough"** - especially at half the price.

---

## 11. What We Learned

### About Whisper Models

Their decision to NOT use Whisper validates our research:
- Generic models have limitations
- Context matters more than raw accuracy
- Personalization is valuable
- Multi-modal beats audio-only

**BUT:** Most users don't need perfection. They need "good enough, fast, cheap."

### About Infrastructure

Their cloud-only approach shows:
- Local processing can't match cloud speed
- <700ms latency is achievable with proper infra
- GPUs + optimization = huge performance gains
- But it requires significant investment

**Our path:** Use existing cloud infrastructure (Groq) to get 80% of the benefit at 2% of the cost.

### About Market Positioning

Their $12/month pricing with context-aware features shows:
- Market will pay for quality
- Premium features justify premium pricing
- But there's room for a "good enough" competitor at $6

**Strategy:** Position as the affordable alternative with great quality, not as the cutting-edge tech leader.

---

## 12. Sources

- Wispr Flow technical blog posts
- Baseten case study
- Funding announcements (Menlo Ventures)
- App bundle analysis (`/Applications/Wispr Flow.app/`)
- ProductHunt discussions
- CEO interviews and tweets

---

## Conclusion

**Wispr Flow's Secret Sauce:** Proprietary context-aware ASR + Llama LLM post-processing on optimized cloud infrastructure.

**Why it works:** Context and personalization beat raw transcription accuracy for their use case.

**Why we can still compete:** 90% of users don't need perfection - they need good transcription at a fair price. Whisper Large v3 via Groq gets us there.

**Our differentiation:** Better price, privacy options, faster shipping, and "good enough" quality for most users.
