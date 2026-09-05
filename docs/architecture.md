# Architecture

Phase 4 adds Call Agent and Message Agent on the official Mozaik v4 runtime. Message starts in NORMAL, switches to HEIGHTENED when Call emits `coercion_detected`, and re-checks the same SMS. Other business agents are not implemented yet.
