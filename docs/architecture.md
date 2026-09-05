# Architecture

Phase 6 adds Device Agent and Transaction Agent on the official Mozaik v4 runtime. Transaction starts in NORMAL, switches to HEIGHTENED after `remote_control_detected`, then PRIORITY after a beneficiary identity mismatch, and re-checks the same transfer. It only writes a prototype pause recommendation. No payment is executed or blocked.
