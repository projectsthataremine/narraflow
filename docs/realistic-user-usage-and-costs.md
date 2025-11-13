# Realistic User Usage & Cost Analysis

**Date:** January 2025
**Purpose:** Accurate cost projections based on real usage data

---

## Actual Usage Data

**Real Heavy User (Top 2%):**
- 402,000 words in 9 weeks
- At 132 words/minute: 3,045 minutes = **50.76 hours total**
- Per month: **24.4 hours/month**

**This user is in the TOP 2% of all users.**

## Realistic User Segments (Conservative)

| Segment | Hours/Month | % of Users | Words/Week | Profile |
|---------|-------------|------------|------------|---------|
| **Light User** | 3-5 hours | 40% | 1,500-2,500 | Occasional dictation |
| **Average User** | 8-12 hours | 50% | 4,000-6,000 | Regular daily use |
| **Heavy User** | 20-25 hours | 10% | 10,000-12,500 | Power user |

**Blended Average:** 9.2 hours/month

*Note: More conservative distribution with higher percentage of average and heavy users*

## Cost Analysis by User Segment

### Light User (5 hours/month)

| Provider | Cost/Month | Profit @ $6 | Margin |
|----------|-----------|-------------|---------|
| <span style="color: #22c55e">**Groq Distil-Whisper**</span> | <span style="color: #22c55e">$0.10</span> | <span style="color: #22c55e">$5.90</span> | <span style="color: #22c55e">**98%**</span> |
| <span style="color: #22c55e">**Groq Large v3 Turbo**</span> | <span style="color: #22c55e">$0.20</span> | <span style="color: #22c55e">$5.80</span> | <span style="color: #22c55e">**97%**</span> |
| **Baseten T4** | $0.05 | $5.95 | **99%** |
| **Baseten A10G** | $0.04 | $5.96 | **99%** |
| **Modal T4** | $0.05 | $5.95 | **99%** |
| **Modal A10G** | $0.06 | $5.95 | **99%** |
| **RunPod Serverless** | $0.07 | $5.92 | **99%** |

### Average User (10 hours/month)

| Provider | Cost/Month | Profit @ $6 | Margin |
|----------|-----------|-------------|---------|
| <span style="color: #22c55e">**Groq Distil-Whisper**</span> | <span style="color: #22c55e">$0.20</span> | <span style="color: #22c55e">$5.80</span> | <span style="color: #22c55e">**97%**</span> |
| <span style="color: #22c55e">**Groq Large v3 Turbo**</span> | <span style="color: #22c55e">$0.40</span> | <span style="color: #22c55e">$5.60</span> | <span style="color: #22c55e">**93%**</span> |
| **Baseten T4** | $0.11 | $5.89 | **98%** |
| **Baseten A10G** | $0.08 | $5.92 | **99%** |
| **Modal T4** | $0.10 | $5.90 | **98%** |
| **Modal A10G** | $0.11 | $5.89 | **98%** |
| **RunPod Serverless** | $0.15 | $5.85 | **98%** |

### Heavy User (22 hours/month)

| Provider | Cost/Month | Profit @ $6 | Margin |
|----------|-----------|-------------|---------|
| <span style="color: #22c55e">**Groq Distil-Whisper**</span> | <span style="color: #22c55e">$0.44</span> | <span style="color: #22c55e">$5.56</span> | <span style="color: #22c55e">**93%**</span> |
| <span style="color: #22c55e">**Groq Large v3 Turbo**</span> | <span style="color: #22c55e">$0.88</span> | <span style="color: #22c55e">$5.12</span> | <span style="color: #22c55e">**85%**</span> |
| **Baseten T4** | $0.23 | $5.77 | **96%** |
| **Baseten A10G** | $0.19 | $5.81 | **97%** |
| **Modal T4** | $0.22 | $5.78 | **96%** |
| **Modal A10G** | $0.24 | $5.76 | **96%** |
| **RunPod Serverless** | $0.33 | $5.67 | **95%** |

## Blended Cost (Weighted Average)

**User Mix:**
- 40% Light User (5h) = 2.00 hours
- 50% Average User (10h) = 5.00 hours
- 10% Heavy User (22h) = 2.20 hours
- **Blended Total: 9.2 hours/month**

### Blended Costs Per User

| Provider | Blended Cost | Profit @ $6 | Margin |
|----------|-------------|-------------|---------|
| <span style="color: #22c55e">**Groq Distil-Whisper**</span> | <span style="color: #22c55e">**$0.18**</span> | <span style="color: #22c55e">**$5.82**</span> | <span style="color: #22c55e">**97%**</span> |
| <span style="color: #22c55e">**Groq Large v3 Turbo**</span> | <span style="color: #22c55e">**$0.37**</span> | <span style="color: #22c55e">**$5.63**</span> | <span style="color: #22c55e">**94%**</span> |
| **Baseten T4** | **$0.10** | **$5.90** | **98%** |
| **Baseten A10G** | **$0.08** | **$5.92** | **99%** |
| **Modal T4** | **$0.09** | **$5.91** | **98%** |
| **Modal A10G** | **$0.10** | **$5.90** | **98%** |
| **RunPod Serverless** | **$0.14** | **$5.86** | **98%** |


## Business Implications

### Year 1 Target: 10% of Wispr Flow's Market

**Target Users:**
- Total users: 12,350 (10% of 123,500)
- Paying users: 2,347 (19% conversion rate)
- Pricing: $6/month

### At 2,347 Paying Users ($6/month)

| Provider | Monthly Revenue | Monthly Costs | Monthly Profit | Annual Profit | Margin |
|----------|----------------|---------------|----------------|---------------|--------|
| <span style="color: #22c55e">**Groq Distil-Whisper**</span> | <span style="color: #22c55e">$14,082</span> | <span style="color: #22c55e">$432</span> | <span style="color: #22c55e">**$13,650**</span> | <span style="color: #22c55e">**$163,800**</span> | <span style="color: #22c55e">**97%**</span> |
| <span style="color: #22c55e">**Groq Large v3 Turbo**</span> | <span style="color: #22c55e">$14,082</span> | <span style="color: #22c55e">$864</span> | <span style="color: #22c55e">**$13,218**</span> | <span style="color: #22c55e">**$158,616**</span> | <span style="color: #22c55e">**94%**</span> |
| **Baseten T4** | $14,082 | $227 | **$13,855** | **$166,260** | **98%** |
| **Baseten A10G** | $14,082 | $183 | **$13,899** | **$166,788** | **99%** |
| **Modal T4** | $14,082 | $212 | **$13,870** | **$166,440** | **98%** |
| **Modal A10G** | $14,082 | $238 | **$13,844** | **$166,128** | **98%** |
| **RunPod Serverless** | $14,082 | $324 | **$13,758** | **$165,096** | **98%** |


## Post-Processing with Meta Llama Models


### Token Usage for Blended User (9.2 hours/month)

**Calculation:**
- 9.2 hours = 552 minutes
- At 132 words/minute: **72,864 words/month**
- Input tokens: ~97,000 tokens (1.33 tokens per word)
- Output tokens: ~100,000 tokens (similar length for cleaned transcript)

### Llama Cost Per User

| Model | Input Cost | Output Cost | Total Cost/User |
|-------|-----------|-------------|-----------------|
| <span style="color: #22c55e">**Llama 3.1 8B**</span> | <span style="color: #22c55e">$0.05/M tokens</span> | <span style="color: #22c55e">$0.08/M tokens</span> | <span style="color: #22c55e">**$0.01**</span> |
| <span style="color: #22c55e">**Llama 3.3 70B**</span> | <span style="color: #22c55e">$0.59/M tokens</span> | <span style="color: #22c55e">$0.79/M tokens</span> | <span style="color: #22c55e">**$0.14**</span> |

*Note: Groq offers both Whisper and Llama APIs, enabling single-vendor integration*

### Combined Costs: Whisper + Llama (Groq)

| Whisper Model | Llama Model | Transcription Cost | Post-Processing Cost | Total Cost | Profit @ $6 | Margin |
|---------------|-------------|-------------------|---------------------|-----------|-------------|---------|
| <span style="color: #22c55e">**Distil-Whisper**</span> | <span style="color: #22c55e">**Llama 3.1 8B**</span> | <span style="color: #22c55e">$0.18</span> | <span style="color: #22c55e">$0.01</span> | <span style="color: #22c55e">**$0.19**</span> | <span style="color: #22c55e">**$5.81**</span> | <span style="color: #22c55e">**97%**</span> |
| <span style="color: #22c55e">**Distil-Whisper**</span> | <span style="color: #22c55e">**Llama 3.3 70B**</span> | <span style="color: #22c55e">$0.18</span> | <span style="color: #22c55e">$0.14</span> | <span style="color: #22c55e">**$0.32**</span> | <span style="color: #22c55e">**$5.68**</span> | <span style="color: #22c55e">**95%**</span> |
| <span style="color: #22c55e">**Large v3 Turbo**</span> | <span style="color: #22c55e">**Llama 3.1 8B**</span> | <span style="color: #22c55e">$0.37</span> | <span style="color: #22c55e">$0.01</span> | <span style="color: #22c55e">**$0.38**</span> | <span style="color: #22c55e">**$5.62**</span> | <span style="color: #22c55e">**94%**</span> |
| <span style="color: #22c55e">**Large v3 Turbo**</span> | <span style="color: #22c55e">**Llama 3.3 70B**</span> | <span style="color: #22c55e">$0.37</span> | <span style="color: #22c55e">$0.14</span> | <span style="color: #22c55e">**$0.51**</span> | <span style="color: #22c55e">**$5.49**</span> | <span style="color: #22c55e">**92%**</span> |

### Impact on Business Metrics (2,347 Paying Users)

| Configuration | Monthly Costs | Monthly Profit | Annual Profit | Margin |
|---------------|---------------|----------------|---------------|---------|
| <span style="color: #22c55e">**Distil-Whisper + Llama 8B**</span> | <span style="color: #22c55e">$446</span> | <span style="color: #22c55e">**$13,636**</span> | <span style="color: #22c55e">**$163,632**</span> | <span style="color: #22c55e">**97%**</span> |
| <span style="color: #22c55e">**Distil-Whisper + Llama 70B**</span> | <span style="color: #22c55e">$751</span> | <span style="color: #22c55e">**$13,331**</span> | <span style="color: #22c55e">**$159,972**</span> | <span style="color: #22c55e">**95%**</span> |
| <span style="color: #22c55e">**Large v3 Turbo + Llama 8B**</span> | <span style="color: #22c55e">$892</span> | <span style="color: #22c55e">**$13,190**</span> | <span style="color: #22c55e">**$158,280**</span> | <span style="color: #22c55e">**94%**</span> |
| <span style="color: #22c55e">**Large v3 Turbo + Llama 70B**</span> | <span style="color: #22c55e">$1,197</span> | <span style="color: #22c55e">**$12,885**</span> | <span style="color: #22c55e">**$154,620**</span> | <span style="color: #22c55e">**92%**</span> |

**Key Insights:**
- Adding Llama 8B post-processing adds only **$0.01/user** (minimal impact on margins)
- Adding Llama 70B post-processing adds **$0.14/user** (still maintains 92%+ margins)
- Groq's single-vendor solution simplifies integration (both Whisper + Llama APIs)
- All configurations maintain excellent profitability (92-97% margins)

## Groq Account Funding (Distil-Whisper + Llama 8B)

At 2,347 paying users, monthly costs: **$446**

**Burn rate:**
- **Daily**: ~$15/day
- **Weekly**: ~$103/week
- **Monthly**: $446/month

**$100 replenishment cadence:**
- Lasts ~6-7 days
- Need ~4-5 replenishments per month
- Set auto-reload threshold at $50-100 to avoid interruptions

**Recommendation:** Start with $200 seed, set auto-reload at $75 threshold for $100 top-ups.

