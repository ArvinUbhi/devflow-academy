# DevFlow: optional JMH and Flight Recorder laboratory

This optional lab is separate from the normal DevFlow app. The browser app still
starts with Java 8+ and Node 22; the lab needs a full JDK 17+ and Maven, and
Maven will download the JMH dependencies when you build it.

## Exercise 1: benchmark and profile allocations

Run from the repository root:

~~~sh
mvn -f perf-lab/pom.xml -DskipTests package
java -jar perf-lab/target/benchmarks.jar AllocationBenchmark -prof gc
~~~

This compiles Java 8-compatible code and packages the self-contained JMH runner.
It benchmarks two approaches to summing the same primitive values:
a direct int[] reduction, and a boxed ArrayList intermediate per operation.

The comparison deliberately changes more than one operation: it measures a
choice of design, not universally which Java collection is fastest. Read the
generated output: average time in ns/op and gc.alloc.rate.norm in B/op.
Look at errors, fork-to-fork variance and data sizes, and repeat experiments.
No number is fabricated or promised here. JIT escape analysis, GC and hardware
can change what is actually allocated or measured.

## Exercise 2: find your own Java process and capture JFR

Under a representative workload, on a compatible full JDK:

~~~sh
jcmd -l
jcmd <PID> JFR.start name=devflow settings=profile duration=60s filename=devflow.jfr
jfr summary devflow.jfr
~~~

Replace <PID> with the actual running Java process ID. The profile recording
adds overhead and uses sampled events. Correlate allocation and pause events
with request timestamps in Java Mission Control or another compatible viewer.
A 60-second capture cannot prove the absence of allocations or GC pauses.

## Exercise 3: JDK 17+ GC logs

~~~sh
java -Xlog:gc*:file=gc.log:time,uptime,level,tags -jar your-app.jar
~~~

This logging command is for JDK 17+ applications, **not Java 8**.
Use your actual service JAR, not the JMH binary, to understand tail latency.

## Investigation checklist

1. Record the hypothesis, the real workload, hardware, Java version and heap.
2. Take a baseline (including correctness, throughput and p99/p99.9 response latency).
3. Measure allocations per operation or allocation hotspots with JMH/JFR.
4. Change one factor and repeat the exact workload with forks and warm-up.
5. Inspect time, bytes per operation, request errors, GC pauses and queueing.
6. Revert changes that improve one metric by harming the important service SLO.

These are engineering teaching tools, not automatic profiling of user projects.
The DevFlow UI does not run jcmd or Maven on your behalf, record other processes,
or guarantee zero garbage collection.

References:
- https://github.com/openjdk/jmh
- https://docs.oracle.com/en/java/javase/17/docs/specs/man/jcmd.html
- https://docs.oracle.com/en/java/javase/17/troubleshoot/diagnostic-tools.html
