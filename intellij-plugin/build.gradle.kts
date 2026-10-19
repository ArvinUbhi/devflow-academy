plugins {
    java
    id("org.jetbrains.intellij.platform") version "2.19.0"
}

group = "com.devflow"
version = "2.3.0"

repositories {
    mavenCentral()
    intellijPlatform { defaultRepositories() }
}

dependencies {
    intellijPlatform {
        val localIde = providers.gradleProperty("localIdePath")
        if (localIde.isPresent) local(localIde.get())
        else intellijIdea("2025.3.1") { useInstaller = false }
        bundledPlugin("com.intellij.modules.jcef")
    }
}

java {
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21
}

intellijPlatform {
    pluginConfiguration {
        id = "com.devflow.academy"
        name = "DevFlow - Java & Typing Academy"
        version = project.version.toString()
        ideaVersion {
            sinceBuild = "253.29346"
            untilBuild = provider { null }
        }
    }
}

tasks.processResources {
    // A single app powers the browser and IDE; lessons and score rules cannot drift.
    from("../devflow.jar") { into("app") }
    doFirst {
        require(file("../devflow.jar").isFile) { "Run sh build.sh in the repository root first" }
    }
}

// No Settings/Preferences configurable is registered, so there are no searchable options to index.
tasks.named("buildSearchableOptions") { enabled = false }

tasks.register<JavaExec>("runtimeSmoke") {
    dependsOn(tasks.testClasses)
    classpath = sourceSets.test.get().runtimeClasspath + sourceSets.main.get().compileClasspath
    mainClass = "com.devflow.intellij.RuntimeLifecycleSmoke"
    environment("DEVFLOW_HOME", layout.buildDirectory.dir("runtime-smoke-data").get().asFile.absolutePath)
}
