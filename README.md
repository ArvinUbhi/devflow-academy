# devflow.

**A typing-first training academy for software engineers, with advanced Java teaching.** Build touch-typing fluency with random words and evidence-led coaching, learn design patterns and low-latency engineering by typing real Java, and track progress locally.

## New in v2.3: typing studio and Glove80

- **15 / 30 / 60-second tests**, starting with the first character. The deadline continues through idle time and tab switches; late inputs are rejected. Fresh words replenish throughout a timed test. Existing 25 / 50 / 100-word tests remain available.
- **Word-level feedback:** clean, corrected, incorrect and unfinished words; raw mistakes, deleted characters, character substitutions and word timing. Space advances to the next word; Backspace corrects the current word. Practise your missed words directly from results or Progress.
- **Progress:** comparable speed/accuracy charts, per-configuration personal bests, latest-five versus preceding-five trends, a 28-day activity grid, keyboard/duration/date filters and CSV export. Key error rates include attempt counts and flag small samples. Focused drills are excluded from standard records. Imported/old sessions without a keyboard are labelled as earlier unassigned sessions.
- **Two keyboard journeys:** standard US/UK QWERTY and an 80-key MoErgo Glove80 schematic, layer selector, position/finger hints, character-error colouring and selected-key drills. Keyboard, mapping fingerprint, selected layer, test duration, word count, numbers and punctuation distinguish comparable records.
- **Import your MoErgo mapping:** in [MoErgo Layout Editor](https://my.moergo.com/glove80), enable **Settings → Local Backup and Restore**, then **Export → JSON**. In DevFlow choose **My keyboards → Import MoErgo JSON**. Up to eight layouts are saved with local progress. Renaming an unchanged mapping preserves its identity; changing bindings creates a separate baseline.
- **Sharing:** copy a compact typing score with its keyboard and test options, with a manual-copy fallback. No account or global leaderboard is needed.

### Glove80 support boundaries

The importer reads the MoErgo `layers` / `layer_names` JSON format and nested `value` / `params` bindings (including numeric parameters), with 80 keys per layer, up to 32 layers, and a 1 MB input limit. It decodes `&kp`, standard `&mt` / `&lt` tap characters, layer-key labels, transparent/disabled keys, common ZMK keycode aliases and Shift wrappers. It does **not** execute source code. Unknown custom behaviours, macros, combos, tap dances and non-English locales stay visibly labelled as reference-only. The selected layer is shown over the base layer for transparent-key previews; the browser cannot discover the physical firmware layer stack, distinguish duplicate bindings, measure hold-tap timing or flash firmware. Import JSON, not `.uf2` firmware or `.keymap` source. English US and UK Windows/Linux output are supported; UK macOS and other locales need manual reference.

The bundled factory map follows MoErgo's [official configuration](https://github.com/moergo-sc/glove80-zmk-config/blob/main/config/glove80.keymap). The schematic follows the official [position numbering](https://docs.moergo.com/layout-editor-guide/advanced-usage-custom-defined-behaviors/#key-positions) and [finger columns](https://docs.moergo.com/glove80-user-guide/typing-with-glove80/). Export workflow: [MoErgo JSON documentation](https://docs.moergo.com/layout-editor-guide/advanced-usage-export-import/). Binding semantics: [ZMK hold-taps](https://zmk.dev/docs/keymaps/behaviors/hold-tap). These sources were checked on 18 October 2026; MoErgo describes its JSON format as experimental. Factory binding data is MIT-licensed; attribution is in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

### Typing measurements and storage

Effective WPM = (characters in correctly finished words, including their submitted spaces, plus the correct prefix of the current word) ÷ 5 ÷ elapsed minutes. An incorrect finished word contributes no effective characters. Raw WPM counts attempted characters, including corrections. Raw accuracy counts correct insertion attempts / all insertion attempts; a premature word delimiter is a mistake. A word interrupted by the timer is marked unfinished, not failed. Word duration includes pauses and corrections. Consistency is `max(0, 100 × (1 − standard deviation / mean))` of per-second attempt rates, available after three samples; it is a descriptive measure, not a standardised typing rating. Scores are local and self-reported; this is not an anti-cheat system.

Summary history retains up to 10,000 sessions. Word/key/sample diagnostics are retained for the latest 100 word tests (maximum 300 word rows per test). Progress JSON includes saved keyboard mappings. Earlier summary scores remain available after detailed diagnostics age out. Nothing is sent to MoErgo or a cloud service when importing a layout.

## New in v2.2

- **Typing comes first:** the main dashboard now leads with a random-word test, your latest WPM/accuracy and a concrete next action. The daily Java challenge remains prominent.
- **Evidence-led touch-typing coaching:** uses the latest five completed word tests, raw error counts, typing rhythm and user target. New learners receive baseline guidance rather than invented scores. Frequent missed keys drive optional focused word samples. **Focused practice is not counted as a standard WPM personal best**; counts of missed keys are not statistically adjusted for key frequency.
- **Personalised post-test feedback:** 25/50/100-word tests include raw-accuracy advice, observed missed keys, next normal test and focused follow-up. The test uses the established paste-disabled input and locally saved history.
- **Performance investigation workshops:** six realistic Java engineering scenarios about JMH validity, Flight Recorder, allocation elimination, concurrent ring buffers, percentile latency and GC decisions. Each includes measured-evidence guidance, a failure mode, code to type, an interactive decision question and a saved comprehension outcome.
- **Optional real performance tooling:** a Maven/JMH sample in [perf-lab](perf-lab/README.md) comparing an allocation-heavy design with a primitive reduction, plus commands for JFR and GC logging. Requires a full JDK 17+ and Maven **only for the optional lab**, not for running DevFlow.
- **Privacy and honesty:** the browser cannot benchmark a user's trading service, access IDE keystrokes, claim zero GC or automatically run JFR. Recommendations explain what was and was not measured.

## New in v2.1

- **Advanced Java first:** 20 new Java 8-compatible lessons on Strategy, Factory, Builder, Adapter, Decorator, Observer, dependency injection, immutable value objects, concurrency and allocation-aware design. The original 24 foundation lessons remain accessible as refreshers.
- **Low latency / GC track:** primitive hot loops, ring buffers, reusable buffers, volatile and CAS, cache locality and tail-latency trade-offs. These are teaching examples, **not promises of zero allocation or zero GC**; benchmark production code under representative load.
- **Fresh generated scenarios:** seeded, offline variations of identifiers, values and outputs. New Daily Flow prompts from 19 October 2026 use advanced concepts and remain identical for all users on that UTC day. Earlier daily challenges keep their original content.
- **Random-word typing test:** a Monkeytype-inspired test with 25/50/100 words, optional numbers and punctuation, replay and stored typing metrics.
- **Focus tools:** Caps Lock warning and a persistent optional blur of already-completed text. Upcoming text always remains readable.
- **No AI subscription required:** challenge templates and sample variations run entirely offline. Concepts remain finite and deliberately curated; generated samples can be varied substantially without claiming endless genuinely new topics.

## New in v2

- **Daily Flow:** three short Java typing rounds and a comprehension check. Identical, versioned prompts for each UTC date, weighted accuracy/pace scoring, reload-and-resume and a saved first finish. Replays are practice and cannot replace that day's result.
- **Score sharing:** spoiler-free Wordle-style tiles, native sharing or clipboard copy, a manual-copy fallback, and downloadable SVG score cards. Sharing is always initiated by the user.
- **24 foundation Java lessons plus 20 advanced modules:** learn the concept, type a working example, recall a small pattern without copying, and explain the behaviour. Covers fundamentals, flow control, collections, objects, reliability and Java 8 streams/lambdas.
- **Real mastery:** at least 94% typing accuracy, unassisted recall and a correct first comprehension answer. Hints support learning; spaced reviews return after 1–14 days.
- **IntelliJ plugin:** the full app inside a tool window, bundled local server, shared local progress, automatic startup, browser fallback and proper process/browser disposal. See [installation](intellij-plugin/README.md).
- **Deliberate practice UX:** a focused daily entry point, Java chapter filters, practice streaks, earned XP, keyboard focus states, reduced-motion support and UK/US symbol-key guidance.

Touch typing still comes first: the 16 foundation lessons, multilingual code lab, Editor Gym, Typing Handicap, insights and repo-linked CLI are retained. Existing v1 progress migrates automatically, and v1/v2 backups can both be imported.

Download the [installable IntelliJ plugin ZIP](downloads/devflow-intellij-2.3.0.zip), or run the standalone app below.

## Run in one command

With Java 8+ on your PATH and Node 22 installed:

```sh
npx --yes github:ArvinUbhi/devflow-academy
```

This runs the bundled Java executable and opens the DevFlow web app locally at `http://127.0.0.1:8765`. `Ctrl+C` stops a foreground launch. No Java build tools, database, cloud account or npm build are needed to **run** the project. It runs locally from any OS with Java, Node and npm available. It is not a hosted public service. The source repository contains a prebuilt JAR; the release workflow rebuilds and publishes the refreshed JAR and IntelliJ plugin to the repository after a successful main-branch build.

Alternative: download `devflow.jar` from the repository and run `java -jar devflow.jar`.

## Repo-linked typing sessions: init, start, status, stop

Install the command once (requires Git, Node 22 and Java 8+):

```sh
npm install -g github:ArvinUbhi/devflow-academy
cd /path/to/your/git/repo
devflow init
devflow start
devflow status
devflow stop
devflow history
```

Or call each command without installing globally: `npx --yes github:ArvinUbhi/devflow-academy#devflow-v2-java-daily-intellij start`.

- `devflow init [--repo PATH]` links a local Git repository by resolving its root. Git remote metadata is captured if available. It does **not** commit changes to that repository.
- `devflow start [--repo PATH] [--no-browser]` starts the Java web UI in the background and associates completed **DevFlow drills** with the linked repository.
- `devflow status [--json]` prints the number of completed drills, average WPM, accuracy and practice time for this active session.
- `devflow stop` ends tracking, persists a summary and terminates the Java server process started for that session.
- `devflow history [--json]` shows historical repo-linked sessions.
- `devflow serve` launches without repo tracking. `devflow --help` lists commands.

**Scope and accuracy:** Typing statistics are measured when you complete an exercise inside the DevFlow browser UI. Linking a repo identifies the session, but does **not** spy on system-wide keystrokes, access source files, or measure typing in VS Code, IntelliJ or terminals. The included IntelliJ integration brings these practice fields into the IDE; it does not monitor everyday coding. Idle time and uncompleted exercises do not count as completed drills. Editing challenges' WPM is an approximate editing-efficiency measure, not equivalent to character transcription WPM.

## Features

- 16 progressive touch-typing lessons and per-key virtual finger guidance.
- 20 code typing challenges (Java, Python, JavaScript, C#, SQL).
- 8 editing challenges teaching keyboard-driven changes.
- Personalized weak-key drills and guided daily training.
- Three-part official typing handicap assessments with rolling best-3-of-8 index (0 best, 54 worst).
- Dark responsive interface with dashboards, speed charts, accuracy, activity history and repo-linked activity.
- Local JSON progress (up to 10,000 recent drills, 1,000 daily results and 44 Java mastery records) and repository-session history (up to 10,000 sessions), with manual backup/export and restore.
- No external resources at runtime. Content stays on the device running Java.

### How handicap is calculated

Each segment's custom score (0 best to 54 worst) is `27 × clamp((55 − WPM)/55,0,1) + 21.6 × clamp((100 − accuracy%)/20,0,1) + 5.4 × clamp((100 − rhythm%)/100,0,1)`. A round comprises prose, symbols and code. The index is the average of the best three of your most recent eight completed rounds. Fewer than three rounds produce a provisional index. This is not a standardised or externally calibrated index.

### Data and privacy

- `~/.devflow/progress.json`: individual practice/handicap results, settings and weak-key analytics.
- `~/.devflow/project.json`: locally linked Git repo.
- `~/.devflow/active-session.json`: metadata about an active session (if started by CLI).
- `~/.devflow/repo-sessions.json`: completed project sessions.
- `~/.devflow/server.log`: Java server log during CLI repo sessions.

On `devflow start`, no source code is captured or uploaded. The local Java server binds to loopback by default. Using `java -jar devflow.jar --lan` exposes an unauthenticated browser interface to the LAN and is **not recommended** on untrusted networks. Progress is stored on **each individual computer**; connecting the same repo from another computer does not sync the data.

## Build and test

The bundled `devflow.jar` runs on Java **8+**. Rebuilding requires **JDK 9+** (for `javac --release 8`; JDK 17+ recommended):

```sh
sh build.sh
npm ci
npm test
```

GitHub Actions rebuilds the JAR on each commit and executes Node 22 tests. CI uploads the JAR artifact for downloading. Local `npm test` uses temporary data folders and does not touch your actual history.

You can also launch with `./run.sh` on Linux/macOS or `run.bat` on Windows.

## MIT License

See [LICENSE](LICENSE).

## Daily scores

Each daily runs on a UTC date and uses the same three prompts regardless of skill level or timezone. The score is out of 1,000: 600 points for typing accuracy, 300 for pace (capped at 100 WPM), and 100 for a correct first Java answer. Overall WPM weights typed characters by total elapsed typing time, rather than averaging stage speeds. The timer begins on the first key; breaks within a round remain part of that round's elapsed time.

Each tile row summarises one round's accuracy: more green squares mean fewer corrections. Tiles do not reveal Java answers. A first completed result is stored for that date; additional finishes are marked practice. Completed rounds and the first Java answer survive a reload. You may restart an unfinished typing round. From 19 October 2026, official Daily Flow rotates through advanced Java concepts with deterministic generated samples; earlier Daily Flow days are unchanged. The warm-up also changes by date.

Scores and streaks are local and self-reported. There is no global leaderboard, account, server-side anti-cheat or cross-device sync in this release. Friends can compare the same daily number by sharing their cards. Normal editor work and Editor Gym estimates do not count as daily typing speeds.

## Verification

`npm test` checks scoring and migration, input correction metrics, UK/US symbol guidance, CLI lifecycle, HTTP persistence and complete DOM interactions for the daily/Java/sharing flows. It also compiles all 24 teaching examples with `--release 8` and runs them to verify their documented output. The interface example is a complete program; other examples are snippets inside a `main` method with standard library imports.

The IntelliJ workflow compiles and packages the plugin against the pinned SDK. A successful build alone does not establish interactive JCEF behaviour on every OS; that is a separate IDE smoke test. See [plugin verification notes](intellij-plugin/README.md).
