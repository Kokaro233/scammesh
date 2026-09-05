# Architecture

Phase 5 adds Browser Agent and Identity Agent on the official Mozaik v4 runtime. After Message emits `suspicious_link_detected`, Browser switches to PRIORITY and re-checks the same page. Identity compares claimed domains against the local trusted registry mock and writes mismatches to shared session state. Identity is not a final judge. Device and Transaction are not implemented yet.
