#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
mkdir -p build/classes
java com.sun.tools.javac.Main --release 8 -d build/classes src/main/java/com/devflow/DevFlowServer.java
cp -R src/main/resources/web build/classes/
printf 'Main-Class: com.devflow.DevFlowServer\n' > build/manifest.mf
java sun.tools.jar.Main cfm devflow.jar build/manifest.mf -C build/classes .
printf '\nBuilt %s/devflow.jar (Java 8 compatible)\n' "$PWD"
