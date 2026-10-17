# devflow.

**A Java 8-compatible typing academy for software engineers.** Master touch typing, train in Java/Python/JavaScript/C#/SQL, develop editor fluency, improve a golf-inspired Typing Handicap, and track project-linked practice in the local CLI.

## Run in one command

With Java 8+ on your PATH and Node 22 installed:

```sh
npx --yes github:ArvinUbhi/devflow-academy
```

This runs the bundled Java executable and opens the DevFlow web app locally at `http://127.0.0.1:8765`. `Ctrl+C` stops a foreground launch. No Java build tools, database, cloud account or npm build are needed to **run** the project. It runs locally from any OS with Java, Node and npm available. It is not a hosted public service.

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

Or call each command without installing globally: `npx --yes github:ArvinUbhi/devflow-academy start`.

- `devflow init [--repo PATH]` links a local Git repository by resolving its root. Git remote metadata is captured if available. It does **not** commit changes to that repository.
- `devflow start [--repo PATH] [--no-browser]` starts the Java web UI in the background and associates completed **DevFlow drills** with the linked repository.
- `devflow status [--json]` prints the number of completed drills, average WPM, accuracy and practice time for this active session.
- `devflow stop` ends tracking, persists a summary and terminates the Java server process started for that session.
- `devflow history [--json]` shows historical repo-linked sessions.
- `devflow serve` launches without repo tracking. `devflow --help` lists commands.

**Scope and accuracy:** Typing statistics are measured when you complete an exercise inside the DevFlow browser UI. Linking a repo identifies the session, but does **not** spy on system-wide keystrokes, access source files, or measure typing in VS Code, IntelliJ or terminals. That requires an optional editor integration, which is not part of this release. Idle time and uncompleted exercises do not count as completed drills. Editing challenges' WPM is an approximate editing-efficiency measure, not equivalent to character transcription WPM.

## Features

- 16 progressive touch-typing lessons and per-key virtual finger guidance.
- 20 code typing challenges (Java, Python, JavaScript, C#, SQL).
- 8 editing challenges teaching keyboard-driven changes.
- Personalized weak-key drills and guided daily training.
- Three-part official typing handicap assessments with rolling best-3-of-8 index (0 best, 54 worst).
- Dark responsive interface with dashboards, speed charts, accuracy, activity history and repo-linked activity.
- Local JSON progress (up to 10,000 recent drills) and repository-session history (up to 10,000 sessions), with manual backup/export and restore.
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
npm test
```

GitHub Actions rebuilds the JAR on each commit and executes Node 22 tests. CI uploads the JAR artifact for downloading. Local `npm test` uses temporary data folders and does not touch your actual history.

You can also launch with `./run.sh` on Linux/macOS or `run.bat` on Windows.

## MIT License

See [LICENSE](LICENSE).
