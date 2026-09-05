# Architecture

Phase 7 adds a deterministic risk engine. Each semantic event has a base weight; cross-channel synergies and a 4+ channel bonus raise the score. Every change is recorded in a risk snapshot with reasons. Correlation edges link call↔message, message↔browser, browser↔identity, and device↔transaction. The engine is not an LLM judge. Scores are demo rules, not real probabilities.
