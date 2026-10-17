# devflow.

**A Java 8-compatible Java and typing academy for software engineers.** Master touch typing, train in Java/Python/JavaScript/C#/SQL, develop editor fluency, improve a golf-inspired Typing Handicap, and track project-linked practice in the local CLI.

## Download at work. Start with one command.

Download [DevFlow for work (ZIP)](downloads/devflow-work-2.1.0.zip), extract it, and open a terminal in the extracted `devflow` folder. With **Java 8+ and Node 22+ on PATH**, run:

```sh
node start.cjs
```

That's it. The launcher starts Java, waits until the app is ready, and opens your default browser. **No `npm install`, Git, build tools, admin rights or internet connection is needed after downloading.** Keep the terminal open; `Ctrl+C` stops the app. On Windows, you can also double-click `run.bat`.

Launching again opens the existing matching app. If another application occupies the default port, DevFlow tries a nearby free port. Use `node start.cjs --port=8877` to choose a specific port. An older running DevFlow must be closed before starting an update. If browser launching is blocked by your work environment, the terminal shows the local URL.

The same command works from a downloaded source ZIP. `npm start` is an alias and also requires no installation step. A Java-only alternative remains `java -jar devflow.jar`.

For a fresh network download in one command (npm included with Node; no Git required):

```sh
npx --yes --package=https://codeload.github.com/ArvinUbhi/devflow-academy/tar.gz/refs/heads/main devflow
```

The downloadable ZIP is the offline option. All app content is bundled. Progress stays in `~/.devflow`; replacing the app folder for an update preserves it.

## New in v2.1

- **Dependency-free launcher:** one command, readiness checking, automatic browser opening, reuse of an existing app, helpful errors and Windows/macOS/Linux support. Java's heap is capped at 128 MB for this launch path; the browser uses additional memory.
- **Debug Dojo:** 12 Java 8 bug-fixing exercises covering string equality, array bounds, integer arithmetic, null guards, collections, loops, Optional, streams and method returns. Type the correction, request a hint if needed, and learn why it works. Formatting is flexible; checks recognise the taught solution, without running arbitrary code.
- **Practice studio:** short, targeted drills for your weakest keys, including Java punctuation, Space, Enter and UK symbols. Pick an individual key to work on.
- **Visible progress:** a daily minute goal, seven-day activity strip and six earned milestones. Clean fixes require no hints and no failed checks.
- **Safer shared progress:** browser/IntelliJ saves use revisions and merge new completed work. Concurrent settings changes merge by field; an existing daily result wins. Offline work has a browser backup and a retry button. Reset conflicts are reported, and stale windows cannot restore cleared history. Backup import merges into current progress.

## New in v2

- **Daily Flow:** three short Java typing rounds and a comprehension check. Identical, versioned prompts for each UTC date, weighted accuracy/pace scoring, reload-and-resume and a saved first finish. Replays are practice and cannot replace that day's result.
- **Score sharing:** spoiler-free Wordle-style tiles, native sharing or clipboard copy, a manual-copy fallback, and downloadable SVG score cards. Sharing is always initiated by the user.
- **24 Java lessons:** learn the concept, type a working example, recall a small pattern without copying, and explain the behaviour. Covers fundamentals, flow control, collections, objects, reliability and Java 8 streams/lambdas.
- **Real mastery:** at least 94% typing accuracy, unassisted recall and a correct first comprehension answer. Hints support learning; spaced reviews return after 1–14 days.
- **IntelliJ plugin:** the full app inside a tool window, bundled local server, shared local progress, automatic startup, browser fallback and proper process/browser disposal. See [installation](intellij-plugin/README.md).
- **Deliberate practice UX:** a focused daily entry point, Java chapter filters, practice streaks, earned XP, keyboard focus states, reduced-motion support and UK/US symbol-key guidance.

Touch typing still comes first: the 16 foundation lessons, multilingual code lab, Editor Gym, Typing Handicap, insights and repo-linked CLI are retained. Existing v1 progress migrates automatically, and v1/v2 backups can both be imported.

Download the [installable IntelliJ plugin ZIP](downloads/devflow-intellij-2.1.0.zip), or run the standalone app below.

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

Or call each command without installing globally: `npx --yes github:ArvinUbhi/devflow-academy start`.

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
- Local JSON progress (up to 10,000 recent drills, 1,000 daily results and 24 Java mastery records) and repository-session history (up to 10,000 sessions), with manual backup/export and restore.
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

GitHub Actions rebuilds the JAR on each commit and executes Node 22 tests. CI uploads the JAR, a portable work ZIP and the IntelliJ plugin. CI smoke-tests the launcher on Java 8 for Windows, Linux and Intel macOS, plus Java 17 for Apple Silicon macOS. Local `npm test` uses temporary data folders and does not touch your actual history.

You can also launch with `./run.sh` on Linux/macOS or `run.bat` on Windows.

## MIT License

See [LICENSE](LICENSE).

## Daily scores

Each daily runs on a UTC date and uses the same three prompts regardless of skill level or timezone. The score is out of 1,000: 600 points for typing accuracy, 300 for pace (capped at 100 WPM), and 100 for a correct first Java answer. Overall WPM weights typed characters by total elapsed typing time, rather than averaging stage speeds. The timer begins on the first key; breaks within a round remain part of that round's elapsed time.

Each tile row summarises one round's accuracy: more green squares mean fewer corrections. Tiles do not reveal Java answers. A first completed result is stored for that date; additional finishes are marked practice. Completed rounds and the first Java answer survive a reload. You may restart an unfinished typing round. The curriculum rotates across 24 concepts, with a changing warm-up value.

Scores and streaks are local and self-reported. There is no global leaderboard, account, server-side anti-cheat or cross-device sync in this release. Friends can compare the same daily number by sharing their cards. Normal editor work and Editor Gym estimates do not count as daily typing speeds.

## Verification

`npm test` checks one-command startup, simultaneous saves, offline recovery, Debug Dojo, adaptive practice, scoring and migration, input correction metrics, UK/US symbol guidance, CLI lifecycle, HTTP persistence and complete DOM interactions for the daily/Java/sharing flows. It also compiles all 24 teaching examples and all 12 Debug Dojo solutions with `--release 8` and runs them to verify their documented output. The interface example is a complete program; other examples are snippets inside a `main` method with standard library imports.

The IntelliJ workflow compiles and packages the plugin against the pinned SDK. A successful build alone does not establish interactive JCEF behaviour on every OS; that is a separate IDE smoke test. See [plugin verification notes](intellij-plugin/README.md).
