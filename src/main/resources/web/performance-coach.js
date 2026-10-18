/* Curated, practical Java performance investigations. No fabricated benchmark results. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.DevFlowPerformance=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const cases=[
    {
      id:'benchmark',track:'Benchmarking',title:'Measure the hot path properly',minutes:7,
      situation:'Your team claims a primitive-array order book is 5× faster than a boxed collection after measuring one tight loop with System.nanoTime().',
      learn:'The JIT may eliminate unused work or specialise code after warm-up. A sound microbenchmark must control warm-up, forks, input state, measurement mode and result consumption. JMH provides this harness.',
      steps:['Keep representative input setup outside the measured operation unless allocation during setup is part of the question.',
        'Use JMH forks and warm-up; return a computed result or consume it with Blackhole so the JVM cannot discard the work.',
        'Record ns/op, error estimates and B/op; check correctness and then test p99 latency separately in an end-to-end load scenario.'],
      trap:'A lower average ns/op in JMH does not establish lower p99 latency for a complete service.',
      code:'long total = 0;\nfor (int price : prices) {\n    total += price;\n}\nreturn total;',
      tip:'Type the loop, braces and return statement precisely. The example assumes an int[] prices argument.',
      question:'Which result proves a low-latency trading service meets its p99 target?',
      options:['The faster single JMH invocation','Representative end-to-end latency measurements including tail behaviour','A smaller jar file'],
      answer:1,explanation:'JMH isolates hot operations; full-service p99 needs representative request traffic, queueing and load. Use both measurements, not one as a substitute for the other.',
      command:'mvn -f perf-lab/pom.xml -DskipTests package\njava -jar perf-lab/target/benchmarks.jar AllocationBenchmark -prof gc',
      setup:'Optional JMH lab: JDK 17+ and Maven. Building this lab is not required to run DevFlow.',
      source:'https://github.com/openjdk/jmh'
    },
    {
      id:'jfr',track:'Allocation analysis',title:'Trace allocations with Flight Recorder',minutes:6,
      situation:'A quote-processing service sometimes pauses under peak load. Someone suggests changing the GC collector immediately.',
      learn:'Allocation profiles show where short-lived objects originate; GC pause events show when collection overlaps latency spikes. A flight recording is evidence, not a guarantee that every allocation is captured.',
      steps:['Reproduce the workload, capture a baseline and note the timestamps of slow requests.',
        'On a suitable JDK, use jcmd to record and inspect allocation samples, garbage collections and CPU utilisation.',
        'Correlate hot allocation sites and pause events with the same load before changing code or GC flags.'],
      trap:'A profiler can perturb the workload. Sampled allocations and a short recording can miss bursts, so validate with further captures.',
      code:'StringBuilder scratch = new StringBuilder(128);\nscratch.append("quote");\nscratch.setLength(0);',
      tip:'Reusable buffers require a safe ownership and lifecycle policy; the constructor still allocates.',
      question:'What should you do before switching garbage collectors?',
      options:['Measure allocation sites and GC pauses under the target workload','Assume GC caused every slow request','Disable all profiling'],
      answer:0,explanation:'Inspect allocations, GC events and actual slow-request timestamps first. Queueing, locks, IO and scheduling can also create latency spikes.',
      command:'jcmd <PID> JFR.start name=devflow settings=profile duration=60s filename=devflow.jfr\njfr summary devflow.jfr',
      setup:'Use the jcmd and jfr tools from a compatible full JDK (JDK 17+ recommended). Substitute your own Java process ID.',
      source:'https://docs.oracle.com/en/java/javase/17/docs/specs/man/jcmd.html'
    },
    {
      id:'allocations',track:'Zero-GC technique',title:'Reduce avoidable hot-path allocation',minutes:6,
      situation:'A market-feed parser creates a new ArrayList<Integer> for every incoming message, and allocation volume rises with message rate.',
      learn:'Primitive arrays, bounded storage and reusing owned buffers can reduce allocations. Some objects created in code may be optimised away by escape analysis; others will not be. Measure B/op rather than guessing.',
      steps:['Count allocations per message with a JMH GC profiler or a Java Flight Recorder capture.',
        'Replace avoidable boxed temporary storage with suitable primitive storage only if the semantics remain correct.',
        'Repeat the same workload, verify correctness and compare B/op together with throughput and p99 latency.'],
      trap:'zero B/op in one hot method does not mean zero heap allocation across the entire JVM, nor zero GC.',
      code:'long total = 0;\nfor (long price : prices) {\n    total += price;\n}',
      tip:'A primitive-array loop avoids explicit boxing, but still needs representative profiling.',
      question:'Which conclusion is warranted by a reproducible JMH result of 0 B/op?',
      options:['The JVM can never pause','This measured benchmark reported no allocation per operation','The process uses no memory'],
      answer:1,explanation:'Zero measured B/op applies to the measured operation and profiler sensitivity under those conditions, not the whole application.',
      command:'java -jar perf-lab/target/benchmarks.jar AllocationBenchmark -prof gc',
      setup:'Optional JMH benchmark. Check gc.alloc.rate.norm (bytes per operation), not just ops/s.',
      source:'https://github.com/openjdk/jmh'
    },
    {
      id:'ring',track:'Concurrency',title:'Ring buffers need correctness before speed',minutes:8,
      situation:'An event loop uses a primitive ring buffer. A second thread starts publishing quotes and intermittent stale values appear.',
      learn:'A power-of-two index mask is not a concurrency protocol. A correct queue needs an ownership model, published sequence/visibility rules, overwrite protection and backpressure.',
      steps:['Identify single-producer/single-consumer versus multi-producer access before choosing a queue design.',
        'Establish a publication order using suitable atomic or volatile operations; do not infer thread safety from a fast mask.',
        'Load-test wraparound, queue saturation, ordering and data loss before performance tuning.'],
      trap:'Volatile ensures visibility/order for relevant operations but does not make arbitrary compound updates atomic.',
      code:'int index = (int) (sequence & mask);\nring[index] = value;\nsequence++;',
      tip:'This code only demonstrates indexing. It is NOT a thread-safe publication algorithm.',
      question:'Does ring[sequence & mask] make a concurrent ring buffer safe?',
      options:['Yes, the bit mask is atomic','Only with a large capacity','No, index wrapping does not establish memory ordering'],
      answer:2,explanation:'Concurrency requires additional memory-ordering, ownership and capacity guarantees. Choose a proven queue before optimising a custom design.',
      command:'jcmd <PID> JFR.start name=queue settings=profile duration=60s filename=queue.jfr',
      setup:'For concurrency investigations, combine correctness tests and a representative load driver with JFR observations.',
      source:'https://docs.oracle.com/en/java/javase/17/docs/specs/man/jcmd.html'
    },
    {
      id:'tail',track:'Latency',title:'Read p99 and p99.9 without fooling yourself',minutes:6,
      situation:'A trading API averages 1 ms, but 2% of requests take 80 ms during bursts. The team reports only the mean.',
      learn:'Tail latency exposes rare slow requests hidden by an average. Define percentiles precisely, collect enough requests and beware coordinated omission in closed-loop load generators.',
      steps:['Measure end-to-end request latency with a representative offered rate and realistic pauses/traffic bursts.',
        'Report sample count, p50, p95, p99, p99.9, max and errors; separate warm-up from steady state.',
        'Correlate high-percentile intervals with queue occupancy, safepoints, GC, locks, CPU and I/O.'],
      trap:'A microbenchmark mean cannot be extrapolated into a real service p99. A small sample makes p99.9 unstable.',
      code:'long[] latencyMicros = {1000, 1100, 1200, 80000};\njava.util.Arrays.sort(latencyMicros);\nlong slowest = latencyMicros[latencyMicros.length - 1];',
      tip:'This code finds a maximum, NOT p99. Calculate percentiles from many representative measurements.',
      question:'With 2% of requests at 80 ms and the rest near 1 ms, what happens to p99?',
      options:['It may be near 80 ms','It must equal the mean','It will always be zero'],
      answer:0,explanation:'A slowest 2% cohort is represented in the 99th percentile. Exact results depend on the percentile convention and sufficient samples.',
      command:'jcmd <PID> JFR.start name=tail settings=profile duration=60s filename=tail.jfr',
      setup:'Capture latency histograms with your load driver; JFR helps investigate overlapping JVM events.',
      source:'https://docs.oracle.com/en/java/javase/17/docs/specs/man/jcmd.html'
    },
    {
      id:'gc',track:'GC investigation',title:'Tune the collector only after measuring',minutes:7,
      situation:'After a deployment, p99 latency climbs. A colleague suggests switching immediately to a different GC because it has lower advertised pause times.',
      learn:'GC collector choice trades throughput, footprint, pause goals and allocation pressure. Collector flags can mask an avoidable allocation issue and may differ across Java versions.',
      steps:['Record exact JDK, heap, collector, workload and baseline latency distribution.',
        'Examine GC logging, heap occupancy, allocation rate, safepoints and request traces together.',
        'Change one variable at a time. Recheck throughput, p99 and memory cost under the same conditions.'],
      trap:'No collector setting proves zero pauses, and a GC pause is not the only cause of high tail latency.',
      code:'long messageCount = 0;\nfor (int i = 0; i < batchSize; i++) {\n    messageCount++;\n}',
      tip:'A simple primitive counter does not create a new object on each iteration at source level; profile the actual service.',
      question:'Which comparison is useful when evaluating a GC change?',
      options:['Only the smallest observed pause','The same load with p99, throughput, allocation rate and heap footprint','A screenshot of a tuning blog'],
      answer:1,explanation:'Keep the workload, hardware and JDK comparable. Collect multiple runs and investigate trade-offs, not just one best-looking metric.',
      command:'java -Xlog:gc*:file=gc.log:time,uptime,level,tags -jar your-app.jar',
      setup:'The command shown uses unified GC logging on JDK 17+ and is not a Java 8 flag.',
      source:'https://docs.oracle.com/en/java/javase/17/troubleshoot/diagnostic-tools.html'
    }
  ];
  function byId(id){return cases.find(x=>x.id===id)||null;}
  return {cases,byId,version:1};
});