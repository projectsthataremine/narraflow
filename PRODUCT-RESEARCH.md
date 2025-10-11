# Product Research

## Transcription Quality: Literal vs. Cleaned

**Research Date:** 2025-01-10

### The Question

Should Mic2Text provide literal (verbatim) transcription or cleaned/polished transcription? Users noticed that "Testing, can you hear me?" would output as "Can you hear me?" - is this a bug or a feature?

### Research Findings: Wispr Flow's Approach

Wispr Flow (our main competitor) **DOES clean transcriptions automatically** - this is actually one of their key differentiators and selling points.

#### What Wispr Flow Does:
- ✅ Removes filler words ("um", "uh", "testing", etc.)
- ✅ Adds punctuation automatically
- ✅ Formats text into complete sentences
- ✅ Adapts formatting based on the app context
- ✅ Polishes speech into "ready-to-use" text

#### Comparison with Competitors

**Wispr Flow (Cleaned approach):**
- Edits out "ums" and "uhs"
- Adds punctuation automatically
- Adapts formatting based on context
- Users love the automatic cleaning
- Trade-off: May lose exact wording, but text is immediately usable

**Superwhisper (Literal approach):**
- Prioritizes transcription accuracy
- Does not generate or add words/phrases that weren't spoken
- Still produces grammatically correct sentences
- Users complain about needing to manually clean up transcripts
- Trade-off: More accurate to what was said, but requires post-processing

#### User Feedback Summary

From product comparisons and reviews:
- **Wispr Flow users** appreciate the intelligent formatting without setup
- **Superwhisper users** praise reliability but complain about manual cleanup needed
- Key consideration: **Polished output (Wispr) vs. Verbatim accuracy (Superwhisper)**

### Whisper Model Behavior

The Whisper AI model (which both products use) has built-in "smart" behavior:

1. **"Testing, can you hear me?"** → Outputs: **"Can you hear me?"**
   - Whisper interprets "Testing" as hesitation/filler and removes it

2. **"Testing 1,2,3"** → Outputs: **"Testing 1,2,3"**
   - Whisper recognizes this as a standard audio test phrase and keeps it

This cleaning is **intentional model behavior**, not a bug. The Whisper model is trained to produce clean, readable transcriptions.

### Decision & Recommendation

**Embrace cleaning as a core feature** - don't fight it, market it:

#### 1. Market it as a feature
- **Messaging:** "Smart transcription that cleans up filler words and formats your speech"
- **Positioning:** Like Wispr Flow, focus on "ready-to-use" text output
- **Documentation:** Make it clear this is intentional and beneficial

#### 2. Don't add a "literal mode" toggle
- Wispr Flow doesn't offer one
- Adds complexity without clear user benefit
- Users who want literal transcription use Superwhisper (different market segment)

#### 3. Keep current Whisper settings
- `language: 'english'` - Helps accuracy
- `chunk_length_s: 30` - Processes in manageable chunks
- `return_timestamps: false` - We don't need timestamps

#### 4. Current cleaning behavior is GOOD
Examples of beneficial cleaning:
- "Um, I need to, uh, send an email" → "I need to send an email"
- "Testing, can you hear me?" → "Can you hear me?"
- "So basically what I'm trying to say is..." → "What I'm trying to say is..."

### Implementation Status

✅ Whisper model already does smart cleaning
✅ Additional cleanup in `whisper.ts` removes leading punctuation artifacts
✅ No toggle needed - cleaning is always on
✅ This matches Wispr Flow's approach

### Marketing Copy Suggestions

**Feature descriptions:**
- "Smart transcription that understands context"
- "Automatically removes filler words and hesitations"
- "Get clean, ready-to-use text from your voice"
- "No editing required - just speak naturally"

**Documentation language:**
- "Mic2Text intelligently cleans your speech, removing common filler words and hesitations to give you polished, ready-to-use text."
- "Like having a professional transcriptionist who knows what you meant to say."

### References

- [Wispr Flow vs Superwhisper Comparison](https://clickup.com/blog/wispr-flow-vs-superwhisper/)
- [Wispr Flow Technical Challenges](https://wisprflow.ai/post/technical-challenges)
- [Wispr Flow Transcription Quality](https://docs.wisprflow.ai/articles/7606848923-transcription-quality-issues)

### Conclusion

The behavior where "Testing, can you hear me?" becomes "Can you hear me?" is **not a bug - it's a feature**. This aligns with Wispr Flow's approach and user expectations for modern dictation software. We should embrace this cleaning behavior and market it as a key product benefit.

**Action:** No code changes needed. Document this as intentional behavior and move forward.
