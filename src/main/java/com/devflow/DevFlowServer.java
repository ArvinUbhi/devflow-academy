package com.devflow;

import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import java.awt.Desktop;
import java.awt.GraphicsEnvironment;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.Executors;

/** Dependency-free, Java 8-compatible local web server for DevFlow. */
public final class DevFlowServer {
    private static final int MAX_STATE_BYTES = 8 * 1024 * 1024;
    private static final Map<String, String> TYPES = new HashMap<String, String>();
    static {
        TYPES.put(".html", "text/html; charset=utf-8");
        TYPES.put(".js", "application/javascript; charset=utf-8");
        TYPES.put(".css", "text/css; charset=utf-8");
        TYPES.put(".svg", "image/svg+xml");
        TYPES.put(".json", "application/json; charset=utf-8");
    }

    private DevFlowServer() {}

    public static void main(String[] args) throws Exception {
        int port = 8765;
        boolean noBrowser = false;
        boolean lan = false;
        for (String arg : args) {
            if (arg.startsWith("--port=")) {
                port = Integer.parseInt(arg.substring(7));
            } else if ("--no-browser".equals(arg)) {
                noBrowser = true;
            } else if ("--lan".equals(arg)) {
                lan = true;
            } else if ("--help".equals(arg)) {
                System.out.println("DevFlow: java -jar devflow.jar [--port=8765] [--no-browser] [--lan]");
                return;
            } else {
                System.err.println("Unknown option: " + arg);
                System.exit(2);
            }
        }
        if (port < 0 || port > 65535) throw new IllegalArgumentException("Invalid port");
        InetAddress host = InetAddress.getByName(lan ? "0.0.0.0" : "127.0.0.1");
        HttpServer server = HttpServer.create(new InetSocketAddress(host, port), 0);
        Path dataDir = System.getenv("DEVFLOW_HOME") == null ? Paths.get(System.getProperty("user.home"), ".devflow") : Paths.get(System.getenv("DEVFLOW_HOME"));
        server.createContext("/", new AppHandler(dataDir));
        server.setExecutor(Executors.newFixedThreadPool(4));
        server.start();
        int chosenPort = server.getAddress().getPort();
        String localUrl = "http://127.0.0.1:" + chosenPort;
        System.out.println("\n  DevFlow is running: " + localUrl);
        System.out.println("  Progress is stored in: " + dataDir.resolve("progress.json"));
        System.out.println("  Press Ctrl+C to stop.\n");
        if (lan) System.out.println("  WARNING: LAN mode has no login; use only on trusted networks.\n");
        if (!noBrowser && !GraphicsEnvironment.isHeadless() && Desktop.isDesktopSupported()) {
            try {
                Desktop.getDesktop().browse(new URI(localUrl));
            } catch (Exception ex) {
                System.out.println("  Open " + localUrl + " in a browser.");
            }
        }
    }

    private static final class AppHandler implements HttpHandler {
        private final Path file;
        AppHandler(Path dataDir) { this.file = dataDir.resolve("progress.json"); }

        @Override public void handle(HttpExchange ex) throws IOException {
            try {
                String path = ex.getRequestURI().getPath();
                Headers h = ex.getResponseHeaders();
                h.set("X-Content-Type-Options", "nosniff");
                h.set("X-Frame-Options", "DENY");
                h.set("Referrer-Policy", "no-referrer");
                h.set("Content-Security-Policy", "default-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
                if ("/api/health".equals(path)) {
                    if (!"GET".equals(ex.getRequestMethod())) { send(ex, 405, "Method not allowed", "text/plain"); return; }
                    send(ex, 200, "{\"ok\":true,\"app\":\"DevFlow\",\"version\":\"2.3.0\"}", "application/json");
                    return;
                }
                if ("/api/project".equals(path)) {
                    if (!"GET".equals(ex.getRequestMethod())) { send(ex, 405, "Method not allowed", "text/plain"); return; }
                    Path session = file.getParent().resolve("active-session.json");
                    Path past = file.getParent().resolve("repo-sessions.json");
                    String active = Files.exists(session) ? new String(Files.readAllBytes(session), StandardCharsets.UTF_8) : "null";
                    String history = Files.exists(past) ? new String(Files.readAllBytes(past), StandardCharsets.UTF_8) : "[]";
                    send(ex, 200, "{\"active\":" + active + ",\"sessions\":" + history + "}", "application/json");
                    return;
                }
                if ("/api/state".equals(path)) {
                    state(ex);
                    return;
                }
                if (!"GET".equals(ex.getRequestMethod()) && !"HEAD".equals(ex.getRequestMethod())) {
                    send(ex, 405, "Method not allowed", "text/plain"); return;
                }
                if ("/".equals(path)) path = "/index.html";
                if (!(path.equals("/index.html") || path.equals("/styles.css") || path.equals("/app.js") || path.equals("/keyboards.js") || path.equals("/typing.js") || path.equals("/studio.js") || path.equals("/studio.css") || path.equals("/engine.js") || path.equals("/curriculum.js") || path.equals("/advanced.js") || path.equals("/coaching.js") || path.equals("/performance-coach.js") || path.equals("/challenge.js") || path.equals("/experience.js") || path.equals("/favicon.svg") || path.equals("/manifest.webmanifest") || path.equals("/sw.js"))) {
                    send(ex, 404, "Not found", "text/plain"); return;
                }
                InputStream in = DevFlowServer.class.getResourceAsStream("/web" + path);
                if (in == null) { send(ex, 404, "Not found", "text/plain"); return; }
                byte[] content;
                try { content = readBounded(in, 5 * 1024 * 1024); } finally { in.close(); }
                String mime = "application/octet-stream";
                for (Map.Entry<String, String> entry : TYPES.entrySet()) if (path.endsWith(entry.getKey())) mime = entry.getValue();
                if (path.endsWith(".webmanifest")) mime = "application/manifest+json";
                h.set("Content-Type", mime);
                h.set("Cache-Control", "no-store");
                if ("HEAD".equals(ex.getRequestMethod())) { ex.sendResponseHeaders(200, -1); ex.close(); return; }
                ex.sendResponseHeaders(200, content.length);
                try (OutputStream out = ex.getResponseBody()) { out.write(content); }
            } catch (Exception err) {
                System.err.println("Request failed: " + err.getMessage());
                try { send(ex, 500, "Internal server error", "text/plain"); } catch (IOException ignored) { ex.close(); }
            }
        }

        private void state(HttpExchange ex) throws IOException {
            String method = ex.getRequestMethod();
            if ("GET".equals(method)) {
                if (!Files.exists(file)) { send(ex, 200, "null", "application/json"); return; }
                send(ex, 200, new String(Files.readAllBytes(file), StandardCharsets.UTF_8), "application/json");
                return;
            }
            if (!"PUT".equals(method)) { send(ex, 405, "Method not allowed", "text/plain"); return; }
            String type = ex.getRequestHeaders().getFirst("Content-Type");
            if (type == null || !type.toLowerCase().startsWith("application/json")) {
                send(ex, 415, "Expected application/json", "text/plain"); return;
            }
            String origin = ex.getRequestHeaders().getFirst("Origin");
            String authority = ex.getRequestHeaders().getFirst("Host");
            if (origin != null && (authority == null || !origin.equals("http://" + authority))) {
                send(ex, 403, "Origin denied", "text/plain"); return;
            }
            String json;
            try {
                json = new String(readBounded(ex.getRequestBody(), MAX_STATE_BYTES), StandardCharsets.UTF_8).trim();
            } catch (IOException tooLarge) { send(ex, 413, "State too large", "text/plain"); return; }
            if (!json.startsWith("{") || !json.endsWith("}")) {
                send(ex, 400, "Expected a JSON object", "text/plain"); return;
            }
            Files.createDirectories(file.getParent());
            Path temp = Files.createTempFile(file.getParent(), "progress-", ".tmp");
            try {
                Files.write(temp, json.getBytes(StandardCharsets.UTF_8));
                try { Files.move(temp, file, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE); }
                catch (java.nio.file.AtomicMoveNotSupportedException e) { Files.move(temp, file, StandardCopyOption.REPLACE_EXISTING); }
            } finally { Files.deleteIfExists(temp); }
            send(ex, 200, "{\"saved\":true}", "application/json");
        }
    }

    private static byte[] readBounded(InputStream stream, int max) throws IOException {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int n;
        while ((n = stream.read(buffer)) >= 0) {
            if (bytes.size() + n > max) throw new IOException("Body too large");
            bytes.write(buffer, 0, n);
        }
        return bytes.toByteArray();
    }

    private static void send(HttpExchange ex, int code, String message, String type) throws IOException {
        byte[] bytes = message.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().set("Content-Type", type + "; charset=utf-8");
        ex.getResponseHeaders().set("Cache-Control", "no-store");
        ex.sendResponseHeaders(code, bytes.length);
        try (OutputStream out = ex.getResponseBody()) { out.write(bytes); }
    }
}
