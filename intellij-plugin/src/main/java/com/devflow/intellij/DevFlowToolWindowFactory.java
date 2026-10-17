package com.devflow.intellij;

import com.intellij.ide.BrowserUtil;
import com.intellij.openapi.project.DumbAware;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.util.Disposer;
import com.intellij.openapi.wm.ToolWindow;
import com.intellij.openapi.wm.ToolWindowFactory;
import com.intellij.openapi.wm.ToolWindowManager;
import com.intellij.ui.content.Content;
import com.intellij.ui.content.ContentFactory;
import com.intellij.ui.jcef.JBCefApp;
import com.intellij.ui.jcef.JBCefBrowser;
import java.awt.BorderLayout;
import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.SwingConstants;
import org.jetbrains.annotations.NotNull;
import org.cef.browser.CefBrowser;
import org.cef.browser.CefFrame;
import org.cef.callback.CefBeforeDownloadCallback;
import org.cef.callback.CefDownloadItem;
import org.cef.handler.CefDownloadHandlerAdapter;
import org.cef.handler.CefLifeSpanHandlerAdapter;

public final class DevFlowToolWindowFactory implements ToolWindowFactory, DumbAware {
    @Override public void createToolWindowContent(@NotNull Project project, @NotNull ToolWindow toolWindow) {
        JPanel panel = new JPanel(new BorderLayout());
        JLabel status = new JLabel("Starting your local Java & typing academy…", SwingConstants.CENTER);
        panel.add(status, BorderLayout.CENTER);
        JPanel toolbar = new JPanel(new BorderLayout());
        toolbar.setBorder(BorderFactory.createEmptyBorder(5, 8, 5, 8));
        toolbar.add(new JLabel("Local practice"), BorderLayout.CENTER);
        JButton external = new JButton("Open in browser ↗");
        external.addActionListener(event -> DevFlowRuntime.getInstance().start().thenAccept(BrowserUtil::browse));
        toolbar.add(external, BorderLayout.EAST);
        panel.add(toolbar, BorderLayout.NORTH);
        Content content = ContentFactory.getInstance().createContent(panel, "", false);
        toolWindow.getContentManager().addContent(content);
        load(project, toolWindow, panel, status, content);
    }

    private void load(Project project, ToolWindow toolWindow, JPanel panel, JLabel status, Content content) {
        DevFlowRuntime.getInstance().start().whenComplete((url, failure) ->
            ToolWindowManager.getInstance(project).invokeLater(() -> {
                if (project.isDisposed() || !content.isValid()) return;
                panel.remove(status);
                if (failure != null) {
                    JPanel error = new JPanel(new BorderLayout(10, 10));
                    error.setBorder(BorderFactory.createEmptyBorder(20, 20, 20, 20));
                    JLabel message = new JLabel("Could not start DevFlow. Close other apps using port 8765, then retry.");
                    JButton retry = new JButton("Retry");
                    retry.addActionListener(event -> { panel.remove(error);panel.add(status,BorderLayout.CENTER);load(project,toolWindow,panel,status,content); });
                    error.add(message,BorderLayout.CENTER);error.add(retry,BorderLayout.SOUTH);panel.add(error,BorderLayout.CENTER);
                } else if (!JBCefApp.isSupported()) {
                    status.setText("Embedded browser unavailable. Use Open in browser above, or the IDE's bundled JetBrains Runtime.");
                    panel.add(status,BorderLayout.CENTER);
                } else {
                    JBCefBrowser browser = new JBCefBrowser(url + "/?ide=1");
                    Disposer.register(content, browser);
                    browser.getJBCefClient().getCefClient().addDownloadHandler(new CefDownloadHandlerAdapter() {
                        @Override public boolean onBeforeDownload(CefBrowser source, CefDownloadItem item,
                                String name, CefBeforeDownloadCallback callback) {
                            // The OS save dialog lets the user choose where their score/backup goes.
                            callback.Continue(name, true);
                            return true;
                        }
                    });
                    browser.getJBCefClient().getCefClient().addLifeSpanHandler(new CefLifeSpanHandlerAdapter() {
                        @Override public boolean onBeforePopup(CefBrowser source, CefFrame frame,
                                String targetUrl, String targetFrameName) {
                            if (targetUrl.startsWith("https://")) BrowserUtil.browse(targetUrl);
                            return true;
                        }
                    });
                    panel.add(browser.getComponent(),BorderLayout.CENTER);
                    content.setPreferredFocusableComponent(browser.getComponent());
                }
                panel.revalidate();panel.repaint();
            })
        );
    }
}
