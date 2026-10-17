package com.devflow.intellij;

import com.intellij.openapi.actionSystem.AnAction;
import com.intellij.openapi.actionSystem.AnActionEvent;
import com.intellij.openapi.project.DumbAware;
import com.intellij.openapi.wm.ToolWindow;
import com.intellij.openapi.wm.ToolWindowManager;
import org.jetbrains.annotations.NotNull;

public final class OpenDevFlowAction extends AnAction implements DumbAware {
    @Override public void actionPerformed(@NotNull AnActionEvent event) {
        if (event.getProject() == null) return;
        ToolWindow window = ToolWindowManager.getInstance(event.getProject()).getToolWindow("DevFlow");
        if (window != null) window.show(null);
    }
}
