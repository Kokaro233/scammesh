# Architecture

Phase 8 adds a live simulation controller. Start launches all six agent loops at once and injects scenario feeds by timestamp offset. Reset clears timers, leaves participants, and creates a fresh runtime so a second demo cannot stack on the first. SSE publishes observations, semantic events, adaptations, and risk snapshots. Risk fusion stays on the server.
