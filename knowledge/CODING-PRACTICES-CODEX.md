# Codex Summary (coding practices)

_Seeded from codex.md (833KB) — see canonical for full detail._

# THE CODING CODEX (living document)

Distilled, adversarially-verified coding practices. Loaded by `ai-coding-enforcement` at the
start of every coding session. Maintained by the Coding Practices Self-Improvement Loop
(cron 4771c74da880) — new verified findings land HERE, stale ones get patched/pruned here.

Format per entry: **Practice** — why it works / what it prevents · source · verified how.

---

## A. Catch bugs BEFORE implementation

- **A1. Read before write (targeted).** Never code from memory of a file; read the exact
  range you're changing. Prevents: edits against stale mental model, duplicate helpers,
  broken assumptions. Source: Hermes execution discipline (verified in-session repeatedly).
- **A2. 30-second pre-mortem.** Before a non-trivial change, name 2–3 ways it breaks:
  bad/empty input, concurrency/races, stale cached state, partial failure. Cheap; catches
  the dominant failure classes before they're written. (thinking-pre-mortem skill.)
- **A3. Failing test first where practical.** Write the test that proves the fix/feature,
  watch it fail, then minimal code to pass. (test-driven-development skill.)
- **A4. Stale-server check.** A running process caches old code; a "fix" that only works
  after restart = you tested stale code. Restart after backend edits, then re-verify.
  Source: DM admin loop, multi-day verified (autonomous-refinement-loops).
- **A5. Concurrent-edit races.** Parallel agents editing the same file produce transient,
  non-reproducible test failures. Re-run before deep diagnosis; if persistent, merge.
  Source: DM loop, verified.

## B. Adversarial self-review

- **B1. Cold-eyes diff pass.** Re-read your own diff as a hostile reviewer: "what breaks
  this?" — error paths, edge cases, secrets/injection, concurrency, and requirement
  line-by-line. Self-review right after writing is biased; the re-read changes representation.
  CAVEAT (2026 research): re-reading your OWN prior turn is the MOST biased framing —
  self-attribution bias makes a monitor 5× more likely to approve an injected/buggy patch
  when the action is implicitly framed as its own (arXiv 2603.04582). Cold-eyes catches
  blatant defects but is NEAR-USELESS on subtle semantic drift the author already "knows":
  self-review missed 31.7% of its own drift; models articulate the exact distinction then
  declare behavior preserved (arXiv 2605.21537). Cold-eyes = necessary-not-sufficient; pair
  with B2 + an executable oracle (B3/B4).
- **B2. Fresh-context critic subagent for large diffs.** delegate_task a critic given ONLY
  diff + requirement (no sunk-cost context). Its objections get real consideration.
  STRENGTHEN (2026): context-separation ALONE is insufficient — SAME-MODEL self-review adds
  ~0 value (Claude self-review left 91.4% pass unchanged, arXiv 2607.21656) because generator
  and reviewer share a training distribution and exhibit CORRELATED failures ("the review
  checks code against itself," arXiv 2603.25773). The independent signal

_— Last seeded: 2026-08-31 —_
