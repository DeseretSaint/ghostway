# Open-Source UI Reference Stack (2026-09-12)

Research loop triggered by Keaton: "run a research loop to find open source options" — open-source /
self-hostable / free replacements for the paid app-inspiration libraries (Mobbin, Gummble, Pageflows,
Refero, ScreensDesign, Appshots).

**Headline finding: there is no open-source Mobbin.** Four independent search angles found zero
self-hostable app-screenshot-gallery projects with a real library. The OSS path is two-pronged:
**(A) generate your own corpus** from your own app (screenshots-as-CI), or **(B) mine academic
datasets** of real Android screens. Everything else is a paid clone or a ToS violation.

All star counts / licences / dates below verified via the GitHub API on 2026-09-12.

---

## Tier 1 — ADOPT: build your own reference library (free, license-clean, CI-able)

These make JP-Lingo's *own* screens the reference corpus instead of borrowing someone else's.

| Tool | Repo | Licence | ★ | Last push | What it does |
|---|---|---|---|---|---|
| **Paparazzi** | cashapp/paparazzi | Apache-2.0 | 2.6k | 2026-09-11 | Renders Compose/View screens to PNG **on the JVM, no emulator**. Baseline + diff = visual regression CI. |
| **Roborazzi** | takahirom/roborazzi | Apache-2.0 | 1.0k | 2026-09-08 | Same idea via Robolectric/instrumented tests; adds image-diff verification and Gradle report output. |
| **Showkase** | airbnb/Showkase | Apache-2.0 | 2.3k | 2026-03-27 | Annotation processor that auto-generates a **browsable gallery of every Compose component** in the app. Your component library, generated from code. |
| **Maestro** | mobile-dev-inc/maestro | Apache-2.0 | 15.6k | 2026-09-12 | YAML E2E flows on emulator/device, plus CLI + desktop app. This is the "capture real user flows" piece Pageflows sells. |
| **Material Theme Builder** | material-foundation/material-theme-builder | Apache-2.0 | 597 | **archived 2025-05** | Dynamic-color + type scale → Compose theme code export. Archived; maintained fork: `abernier/material-theme-builder` (npm). |
| **Penpot** | penpot/penpot | MPL-2.0 | 59.9k | 2026-09-11 | Self-hosted Figma replacement. SVG-native, no per-seat cost, real-time collab. |
| **Penpot MCP (official)** | penpot/penpot-mcp | MPL-2.0 | 497 | 2026-03-19 | 5 tools: `execute_code`, `high_level_overview`, `penpot_api_info`, `export_shape`, `import_image`. Agent-editable design files on your own infra. |
| **scrcpy** | Genymobile/scrcpy | Apache-2.0 | 149k | 2026-09-11 | Mirror/record a real Android device (pair with `adb screencap` for captures). |
| **Playwright** | microsoft/playwright | Apache-2.0 | 96k | 2026-09-11 | Screenshot any web UI (incl. Play listing pages) headlessly. |
| **screenshot-to-code** | abi/screenshot-to-code | MIT | 78.6k | 2026-09-09 | Screenshot → HTML/Tailwind/React/Vue. Web stacks only — nothing for Compose. Useful for the DM site, not JP-Lingo. |

## Tier 2 — Academic datasets of real Android screens (free, terms caveats)

| Dataset | Source | Licence / terms | Size |
|---|---|---|---|
| **Rico** | interactionmining.org/rico | **Research terms, not OSS.** Downloader agrees: screenshots "may contain copyrighted work"; researcher indemnifies U of Illinois; a for-profit employer is bound by the same terms. | 66k–72k screens, 9.3k–9.7k apps, 27 categories + view hierarchies |
| **Enrico** | luileito/enrico | MIT (★75, last push 2021-09) | 1,460 human-curated screens, 20 design topics |
| **CLAY** | google-research-datasets/clay | **No licence file, archived 2022** (★54) | 59,555 human-annotated Android layouts |
| **screen2words** | google-research-datasets/screen2words | **No licence file, archived** (★67) | 112,085 summaries for 22,417 Rico screens → enables NL search over screens |
| **MobileViews** | HF `mllmTeam/MobileViews` | **MIT** (cleanest of the set) | 600k+ screenshot/view-hierarchy pairs, 20k+ Play apps; expanded to 1.2M pairs / 30k apps |
| **AndroidControl** | google-research/google-research | Apache-2.0 | 15,283 task demos, 833 apps — interaction traces, not design reference |
| **Design2Code** | NoviScl/Design2Code | MIT (★599, last push 2024-11) | 484 real webpages; screenshot→code benchmark |
| **UI-Clip** | HF `biglab/uiclip_human_data-paired_hf` | **unverified** | well-designed vs poorly-designed UI pairs (design-quality signal) |

**Caveat:** Rico/Enrico/CLAY/screen2words are 2016–2017-era Android — pre-Material 3. Fine for layout
statistics; stale as visual reference for a watercolour kids app.

## Tier 3 — Scrape the stores yourself (free, legally grey)

- **google-play-scraper** (facundoolano, MIT, ★3.0k, active 2026-09-03) — Node. Pulls name/icon/description/**screenshots** for any Play app (e.g. Duolingo Japanese). Python port: JoMingyu/google-play-scraper (MIT, ★1.0k, last push 2024-08).
  **Risk:** Play's ToS prohibits scraping; screenshots aren't licensed for redistribution. Exposure is the user's, not the library's.
- **F-Droid** — the only store where every screenshot is of a **FLOSS app**. F-Droid's docs confirm app metadata carries localized descriptions, feature graphics and screenshots; the index is public JSON. Cleanest store-sourced screenshots.
- (Unverified lead: Google's **Play Catalog Access Program**, from 2026-07-22, reportedly shares listings incl. screenshots with third-party US stores — post-*Epic v. Google*. Not confirmed from a primary source.)

## Tier 4 — REJECT / dead ends (do not re-litigate)

- **Reverse-engineered Mobbin MCP servers** — `pdcolandrea/mobbin-mcp` (archived 2026-05-15), `aos-engineer/mobbin-mcp`, `Jelil-ah/mobbin-forge`, `opencoredev/mobbin-cli`, `lobehub/jelil-ah-mobbin-forge`. They hit Mobbin's internal endpoints to serve 600k screens free. **ToS violation, and Mobbin now ships an official MCP (`mobbin.com/mcp`, paid plan required)** — the unofficial ones are already breaking. Rejected on principle and on durability.
- **"flaude.app"** claims MIT + self-hostable in its own comparison table — vendor AI-SEO, no repo verified. Treat as marketing.
- **collectui.com / emerald-ui / kevindeasis-awesome-ui** — website/component inspiration, not app screen libraries. Not a fit.
- **No self-hosted Mobbin clone exists.** Confirmed across four query angles; stop searching for one.

## Recommendation for JP-Lingo (Kotlin/Compose, phone + 10-foot TV, kids 2–5)

1. **Paparazzi or Roborazzi** → snapshot every screen and every state; publish to a static gallery. That is a self-hosted, licence-clean, always-current Mobbin for JP-Lingo, and the same runs double as visual-regression CI.
2. **Showkase** → browsable gallery of every Compose component (the component-library half of Mobbin).
3. **Maestro** → record the real onboarding / parent-dashboard flows that the paid libraries sell.
4. **Penpot + penpot-mcp** (self-hosted) if agents should read/write design files rather than just code.
5. Datasets (Rico/MobileViews) are for statistics and agent grounding, **not** visual reference — they're adult, dated, and iOS-free.

## Sources
- GitHub REST API (`/repos/<owner>/<name>`), 2026-09-12 — stars, licence SPDX, archived flag, pushed_at.
- interactionmining.org/legal/copyright (Rico terms), huggingface.co/datasets/mllmTeam/MobileViews (licence: mit).
- f-droid.org/docs/All_About_Descriptions_Graphics_and_Screenshots.
- Search-snippet only (not primary-verified): Mobbin/Mobbin-alternative pricing roundups (lazyweb.com, gummble.com blog), Google Play Catalog Access Program coverage (foxdata.com).