package com.devflow.intellij;

import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

/** Runs the real plugin service without creating an IDE UI or reading a user's project. */
public final class RuntimeLifecycleSmoke {
    private static final String URL = "http://127.0.0.1:8765";
    private static final HttpClient HTTP = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(1)).build();

    public static void main(String[] args) throws Exception {
        if (healthy()) throw new IllegalStateException("Port 8765 already has a DevFlow server; stop it before this isolated test");
        DevFlowRuntime owned = new DevFlowRuntime();
        try {
            String url = owned.start().get(25, TimeUnit.SECONDS);
            require(URL.equals(url) && healthy(), "Plugin must start the bundled app");
            require(URL.equals(owned.start().get(5, TimeUnit.SECONDS)), "Repeated startup must reuse the app");
        } finally { owned.dispose(); }
        waitForHealth(false);
        require(owned.start().isCompletedExceptionally(), "A disposed service must not restart");
        System.out.println("PASS: plugin starts, reuses and stops its own server");

        Path jar = Files.createTempFile("devflow-external-smoke-", ".jar");
        try (InputStream input = RuntimeLifecycleSmoke.class.getResourceAsStream("/app/devflow.jar")) {
            if (input == null) throw new IllegalStateException("Bundled app missing");
            Files.copy(input, jar, StandardCopyOption.REPLACE_EXISTING);
        }
        String executable = System.getProperty("os.name").startsWith("Windows") ? "java.exe" : "java";
        Process external = new ProcessBuilder(Path.of(System.getProperty("java.home"), "bin", executable).toString(),
                "-jar", jar.toString(), "--no-browser").redirectOutput(ProcessBuilder.Redirect.DISCARD)
                .redirectError(ProcessBuilder.Redirect.DISCARD).start();
        try {
            waitForHealth(true);
            DevFlowRuntime borrowed = new DevFlowRuntime();
            try { require(URL.equals(borrowed.start().get(5, TimeUnit.SECONDS)), "Must attach to the standalone app"); }
            finally { borrowed.dispose(); }
            require(external.isAlive() && healthy(), "Disposing plugin must leave a pre-existing server running");
            System.out.println("PASS: plugin attaches to standalone app and preserves its process");
        } finally {
            external.destroy();
            if (!external.waitFor(5, TimeUnit.SECONDS)) external.destroyForcibly().waitFor();
            Files.deleteIfExists(jar);
            HTTP.shutdownNow();
        }
    }

    private static boolean healthy() {
        try {
            HttpResponse<String> response = HTTP.send(HttpRequest.newBuilder(URI.create(URL + "/api/health"))
                    .timeout(Duration.ofSeconds(1)).GET().build(), HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200 && response.body().contains("\"version\":\"2.1.0\"");
        } catch (Exception ignored) { return false; }
    }

    private static void waitForHealth(boolean expected) throws Exception {
        long deadline = System.nanoTime() + Duration.ofSeconds(10).toNanos();
        while (System.nanoTime() < deadline) {
            if (healthy() == expected) return;
            Thread.sleep(100);
        }
        throw new AssertionError("Unexpected server lifecycle state");
    }

    private static void require(boolean condition, String message) { if (!condition) throw new AssertionError(message); }
}
