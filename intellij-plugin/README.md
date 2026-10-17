# DevFlow for IntelliJ IDEA

The full DevFlow daily challenge, Java path, typing academy and handicap in an IntelliJ tool window. The plugin bundles the same Java 8 application as the standalone JAR, so its curriculum and score rules are identical.

## Install

Use IntelliJ IDEA **2025.3.1 or later** with the bundled JetBrains Runtime and Web Browser (JCEF) plugin enabled.

1. Download the [prebuilt plugin ZIP](../downloads/devflow-intellij-2.0.0.zip), or download `devflow-intellij` from a successful build in [GitHub Actions](https://github.com/ArvinUbhi/devflow-academy/actions). Extract the artifact ZIP once to obtain the installable `devflow-intellij-2.0.0.zip`.
2. Open **Settings → Plugins → gear menu → Install Plugin from Disk**. Select the plugin ZIP.
3. Open **View → Tool Windows → DevFlow**, or find **DevFlow: Daily Java & Typing Practice** through Search Everywhere.

The tool window starts the bundled local server automatically. No separate Java, Node installation or terminal command is required for the plugin. The **Open in browser** button opens the same app in your system browser, which is also a fallback for IDE runtimes without an embedded browser.

## Progress and privacy

The app binds to `127.0.0.1:8765`, uses `~/.devflow/progress.json` (or the inherited `DEVFLOW_HOME`), and shares progress with standalone DevFlow on that computer. A matching v2 server already running on that port is reused. An older DevFlow instance must be stopped before opening v2. Keep one practice window active at a time; simultaneous full-state writes from separate windows are not merged.

No source files are read, no system-wide keystrokes are recorded, and nothing is uploaded. Typing metrics cover the DevFlow practice fields. This release does not measure normal coding activity or claim to verify shortcuts you use in a project. The project stays untouched.

The IDE application owns the server process, rather than an individual project: opening another project reuses it. Closing the IDE stops only a server it started, leaving a pre-existing standalone server running.

## Build

From the repository root, build the app with a JDK 17 or later:

```sh
sh build.sh
```

Build the plugin with JDK 21 and Gradle 9.1.0:

```sh
cd intellij-plugin
gradle buildPlugin verifyPluginStructure runtimeSmoke -x buildSearchableOptions
```

The installable archive is in `build/distributions/`. The plugin itself runs on the IDE's Java 21 runtime; the standalone app remains Java 8 compatible. The Gradle dependency is pinned to IntelliJ IDEA 2025.3.1. JetBrains introduced the `com.intellij.modules.jcef` dependency alias in that version, so earlier IDEs require a separate legacy build.

`buildPlugin` compiles and packages the plugin. `verifyPluginStructure` validates its descriptor and archive. `runtimeSmoke` checks that the actual plugin service starts/stops its own app, reuses an existing server and leaves a standalone server alive when disposed. It needs port 8765 free. An interactive IDE smoke test is a separate check. Use `gradle runIde` with an installer SDK including JCEF to perform it. Headless builds can use a non-installer SDK. Compatibility outside the pinned SDK must be checked with JetBrains Plugin Verifier before advertising a wider tested range.

Official references: [tool windows](https://plugins.jetbrains.com/docs/intellij/tool-windows.html), [JCEF lifecycle and dependency](https://plugins.jetbrains.com/docs/intellij/embedded-browser-jcef.html), [Gradle plugin](https://plugins.jetbrains.com/docs/intellij/tools-intellij-platform-gradle-plugin.html).
