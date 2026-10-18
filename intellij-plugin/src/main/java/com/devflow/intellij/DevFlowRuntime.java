package com.devflow.intellij;

import com.intellij.openapi.Disposable;
import com.intellij.openapi.application.ApplicationManager;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** One local server per IDE application, shared by every open project. */
public final class DevFlowRuntime implements Disposable {
    private final ExecutorService worker = Executors.newSingleThreadExecutor(r -> {
        Thread thread = new Thread(r, "DevFlow local app");
        thread.setDaemon(true);
        return thread;
    });
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(1)).build();
    private CompletableFuture<String> startup;
    private Process ownedProcess;
    private Path extractedJar;
    private boolean disposed;
    private static final String URL = "http://127.0.0.1:8765";

    public static DevFlowRuntime getInstance() {
        return ApplicationManager.getApplication().getService(DevFlowRuntime.class);
    }

    public synchronized CompletableFuture<String> start() {
        if (disposed) return CompletableFuture.failedFuture(new IllegalStateException("DevFlow was closed"));
        if (startup == null || startup.isDone()) startup = CompletableFuture.supplyAsync(this::connect, worker);
        return startup;
    }

    private String connect() {
        try {
            if (healthy()) return URL;
            synchronized (this) {
                if (disposed) throw new IllegalStateException("DevFlow was closed");
                if (ownedProcess != null) ownedProcess.destroy();
                if (extractedJar != null) Files.deleteIfExists(extractedJar);
                extractedJar = Files.createTempFile("devflow-2-2-", ".jar");
                try (InputStream input = getClass().getResourceAsStream("/app/devflow.jar")) {
                    if (input == null) throw new IllegalStateException("Bundled app is missing; reinstall the plugin");
                    Files.copy(input, extractedJar, StandardCopyOption.REPLACE_EXISTING);
                }
                String executable = System.getProperty("os.name").startsWith("Windows") ? "java.exe" : "java";
                String java = Path.of(System.getProperty("java.home"), "bin", executable).toString();
                // Loopback only. The app inherits the standard ~/.devflow progress location.
                ownedProcess = new ProcessBuilder(java, "-jar", extractedJar.toString(), "--no-browser")
                        .redirectOutput(ProcessBuilder.Redirect.DISCARD)
                        .redirectError(ProcessBuilder.Redirect.DISCARD).start();
            }
            long deadline = System.nanoTime() + Duration.ofSeconds(15).toNanos();
            while (System.nanoTime() < deadline) {
                synchronized (this) {
                    if (disposed) throw new IllegalStateException("DevFlow was closed");
                }
                if (healthy()) return URL;
                Process process;
                synchronized (this) { process = ownedProcess; }
                if (process == null || !process.isAlive()) throw new IllegalStateException("Port 8765 is in use or the local app could not start");
                Thread.sleep(200);
            }
            throw new IllegalStateException("The local app took too long to start. Retry or run devflow from a terminal");
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Startup interrupted", interrupted);
        } catch (Exception error) {
            throw new IllegalStateException(error.getMessage(), error);
        }
    }

    private boolean healthy() {
        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(URL + "/api/health")).timeout(Duration.ofSeconds(1)).GET().build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200 && response.body().contains("\"app\":\"DevFlow\"")
                    && response.body().contains("\"version\":\"2.2.0\"");
        } catch (Exception ignored) { return false; }
    }

    @Override public synchronized void dispose() {
        disposed = true;
        worker.shutdownNow();
        client.shutdownNow();
        if (ownedProcess != null) {
            // Never stop a server that was already running when the plugin connected.
            ownedProcess.destroy();
            try { ownedProcess.onExit().thenRun(() -> deleteExtractedJar()); }
            catch (Exception ignored) { deleteExtractedJar(); }
        } else deleteExtractedJar();
    }

    private synchronized void deleteExtractedJar() {
        if (extractedJar != null) try { Files.deleteIfExists(extractedJar); } catch (Exception ignored) { extractedJar.toFile().deleteOnExit(); }
    }
}
