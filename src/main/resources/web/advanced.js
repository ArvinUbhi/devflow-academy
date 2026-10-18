/* Advanced Java curriculum, reproducible variations and offline word-test generation. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.DevFlowAdvanced=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const definitions=[
    ['Strategy: switch behaviour','Design patterns','Strategy makes an algorithm interchangeable behind a stable interface. Java 8 functional interfaces are especially useful for small strategies.','Prefer explicit strategies when business rules change independently; a lambda is not automatically the best abstraction.',
      'java.util.function.IntUnaryOperator pricing = amount -> amount >= 100 ? amount - 5 : amount;\nSystem.out.println(pricing.applyAsInt(120));','115',
      'What enables changing the pricing rule without changing its caller?',['A stable strategy interface','A global mutable flag','A final class name'],0,
      'Apply pricing to an integer amount.','pricing.applyAsInt(120);','Keep ->, >= and method calls accurate.','pricing',['pricing','feeRule','discountRule']],
    ['Factory: construct behind an interface','Design patterns','A factory separates object creation from use. Supplier is a small Java 8 factory interface for objects that need no arguments.','Returning a List interface decouples callers from ArrayList; remember that a factory call may allocate.',
      'java.util.function.Supplier<java.util.List<String>> create = java.util.ArrayList::new;\njava.util.List<String> events = create.get();\nevents.add("accepted");\nSystem.out.println(events.size());','1',
      'What is the benefit of returning List rather than ArrayList?',['It removes all allocations','Callers depend on an abstraction','The list becomes immutable'],1,
      'Create a list using the factory.','java.util.List<String> list = create.get();','Type the method reference :: as a pair.','events',['events','orders','messages']],
    ['Builder: compose a request','Design patterns','A builder accumulates configuration with fluent operations before producing a result. For a complex immutable value, use a dedicated builder with validation.','StringBuilder demonstrates fluent composition, but the GoF Builder pattern commonly creates a separate product object.',
      'StringBuilder request = new StringBuilder(32).append("GET ").append("/orders");\nSystem.out.println(request.toString());','GET /orders',
      'What should a production builder usually validate?',['The developer keyboard layout','Only the package name','Required fields and invariants'],2,
      'Append a path to an existing builder.','request.append("/orders");','Match each opening parenthesis with its close.','request',['request','pathBuilder','commandBuilder']],
    ['Adapter: bridge incompatible APIs','Design patterns','An adapter converts one interface or representation to another without changing its consumer. Useful at vendor and legacy boundaries.','Keep unit conversion in the adapter and make the conversion explicit to prevent hidden rounding and scaling bugs.',
      'class LegacyFeed { int milliVolts() { return 3300; } }\nclass VoltageAdapter { double volts(LegacyFeed feed) { return feed.milliVolts() / 1000.0; } }\nSystem.out.println(new VoltageAdapter().volts(new LegacyFeed()));','3.3',
      'Where should conversion from millivolts to volts live?',['Every caller','The adapter boundary','A static global counter'],1,
      'Convert an integer in millivolts to volts.','double volts = milliVolts / 1000.0;','The decimal point matters: integer division would truncate.','LegacyFeed',['LegacyFeed','OldSensor','MeterFeed']],
    ['Decorator: layer responsibilities','Design patterns','A decorator wraps existing behaviour to add features while preserving the contract. Function.andThen can demonstrate layered transformation.','Decorator ordering matters: logging, validation and retries are not interchangeable.',
      'java.util.function.Function<String,String> core = value -> value;\njava.util.function.Function<String,String> decorated = core.andThen(value -> "[" + value + "]");\nSystem.out.println(decorated.apply("order"));','[order]',
      'Why do we compose decorators around a stable interface?',['To eliminate all errors','To keep added behaviour modular','To force inheritance'],1,
      'Apply the decorated function to a value.','decorated.apply("order");','Keep the two lambda arrows accurately aligned.','decorated',['decorated','audited','wrapped']],
    ['Observer: respond to events','Design patterns','Observers subscribe to events without tightly coupling publishers to each listener. Consider listener ordering and failure isolation.','Synchronous listeners execute on the publishing thread and can introduce latency into critical paths.',
      'java.util.List<java.util.function.Consumer<String>> listeners = new java.util.ArrayList<>();\nlisteners.add(event -> System.out.println("audit:" + event));\nlisteners.forEach(listener -> listener.accept("filled"));','audit:filled',
      'What is the latency risk of synchronous event callbacks?',['A slow listener blocks the publisher','They always run in parallel','They disable the GC'],0,
      'Notify each listener with the event name.','listeners.forEach(listener -> listener.accept("filled"));','Distinguish the outer forEach from the inner accept.','listeners',['listeners','subscribers','handlers']],
    ['Dependency injection and testing','Design patterns','Inject dependencies through constructors rather than constructing them inside business logic. This enables deterministic unit tests.','Use the smallest interface required by a consumer and avoid hidden global state.',
      'class QuoteService { private final java.util.function.Supplier<Integer> feed;\n    QuoteService(java.util.function.Supplier<Integer> feed) { this.feed = feed; }\n    int quote() { return feed.get(); } }\nSystem.out.println(new QuoteService(() -> 42).quote());','42',
      'What makes QuoteService easy to unit test?',['It reads global variables','It injects a controllable dependency','It starts its own thread'],1,
      'Supply a deterministic feed for a test.','new QuoteService(() -> 42);','Constructor parameters express dependencies clearly.','QuoteService',['QuoteService','PriceService','RateService']],
    ['Immutable value objects','Design patterns','Immutable objects hold valid state without mutation. final fields and defensive handling simplify reasoning across threads.','A final reference does not make objects referenced by that field automatically immutable.',
      'final class Price { private final long minor;\n    Price(long minor) { this.minor = minor; }\n    long getMinor() { return minor; } }\nSystem.out.println(new Price(250).getMinor());','250',
      'What does final on the minor field prevent?',['Changing its value after construction','All object allocation','Concurrent reads'],0,
      'Declare a final amount in minor currency units.','final long minor = 250;','Use integer minor units for exact monetary values.','minor',['minor','cents','units']],
    ['Allocation-aware hot loops','Low latency / GC','Primitive arrays and primitive arithmetic can avoid per-element object creation in a hot loop. Allocation elimination and performance depend on the JVM and workload.','Allocation-free source code is not a proof of zero garbage collection; profile allocation rate and GC pauses under representative load.',
      'long[] ticks = {100, 101, 102};\nlong total = 0;\nfor (long tick : ticks) { total += tick; }\nSystem.out.println(total);','303',
      'Which approach avoids boxing each tick into a Long?',['A primitive long[]','A List<Long>','String concatenation'],0,
      'Accumulate a primitive tick without boxing.','total += tick;','Avoid accidentally introducing Long boxing.','ticks',['ticks','samples','prices']],
    ['Power-of-two ring buffers','Low latency / GC','A preallocated primitive ring buffer uses a mask for bounded indices when capacity is a power of two. This example is sequential, not a thread-safe queue.','Before building a concurrent SPSC or MPSC queue, reason carefully about memory ordering, overwrite protection and backpressure.',
      'int[] ring = new int[8];\nint write = 0, read = 0;\nring[write++ & 7] = 42;\nSystem.out.println(ring[read++ & 7]);','42',
      'Why does index & 7 wrap an eight-slot ring buffer?',['The mask keeps only three low bits','It sorts entries','It creates a lock'],0,
      'Store a value using the circular index.','ring[write++ & 7] = 42;','Practise the bitwise & separately from logical &&.','ring',['ring','slots','buffer']],
    ['Preallocate and reuse buffers','Low latency / GC','Preallocating reusable mutable buffers can reduce repeated allocation in hot code. Reset between messages and avoid leaking mutable buffers across threads.','Calling toString, adding boxing, growing capacity or passing buffers to async consumers may still allocate or introduce bugs.',
      'StringBuilder buffer = new StringBuilder(32);\nbuffer.append("first");\nbuffer.setLength(0);\nbuffer.append("next");\nSystem.out.println(buffer.length());','4',
      'Which operation reuses the existing StringBuilder storage?',['new StringBuilder each time','setLength(0)','toString()'],1,
      'Reset a reusable StringBuilder.','buffer.setLength(0);','Reuse only when there is clear ownership of the buffer.','buffer',['buffer','scratch','workspace']],
    ['Volatile and visibility','Concurrency','volatile makes writes visible to other threads and restricts certain reorderings. It does not turn compound read-modify-write operations into atomic operations.','Use an AtomicInteger or a lock when you need a safe increment; volatile++ is not atomic.',
      'class Signal { volatile boolean ready; }\nSignal signal = new Signal();\nsignal.ready = true;\nSystem.out.println(signal.ready);','true',
      'Is a volatile counter++ operation atomic?',['Yes, on every JVM','Only with Java 8','No, it is a read-modify-write'],2,
      'Declare a class holding a volatile shutdown flag.','class Flags { volatile boolean running = true; }','Distinguish visibility from atomicity.','signal',['signal','state','flag']],
    ['CAS and atomic counters','Concurrency','Compare-and-set supports lock-free coordination for individual atomic variables. Contention and retry loops can still cause large tail latencies.','Atomic operations are not wait-free by default; consider LongAdder for contended statistics, not sequence publication.',
      'java.util.concurrent.atomic.AtomicLong sequence = new java.util.concurrent.atomic.AtomicLong();\nSystem.out.println(sequence.incrementAndGet());','1',
      'What does AtomicLong guarantee for incrementAndGet?',['An atomic increment','Zero GC in every program','No contention'],0,
      'Increment a sequence atomically.','sequence.incrementAndGet();','Pay attention to the method name and parentheses.','sequence',['sequence','counter','version']],
    ['Cache-local traversal','Low latency / GC','Contiguous primitive arrays often provide predictable traversal and fewer object pointers than boxed collections. Measure on realistic datasets.','Cache locality is hardware-dependent, and JIT optimizations can change which loop is faster.',
      'int[] prices = {10, 20, 30};\nint total = 0;\nfor (int i = 0; i < prices.length; i++) total += prices[i];\nSystem.out.println(total);','60',
      'Which representation tends to improve locality for primitive values?',['ArrayList<Integer>','int[]','LinkedList<Integer>'],1,
      'Read the current primitive-array element.','prices[i]','Indexing is another useful symbol-typing workout.','prices',['prices','levels','quantities']],
    ['Tail latency rather than averages','Low latency / GC','In a latency-sensitive system, the slowest requests can matter more than average throughput. Inspect percentile distributions and coordinated-omission pitfalls.','Sorting a few samples illustrates tail values but is not an accurate substitute for a proper p99 benchmark.',
      'long[] samples = {100, 300, 200, 900, 500};\njava.util.Arrays.sort(samples);\nSystem.out.println(samples[samples.length - 1]);','900',
      'Which metric highlights occasional slow responses?',['The median only','p99 latency','The sum of request IDs'],1,
      'Read the largest value after sorting.','samples[samples.length - 1]','Metrics are not meaningful without units and workloads.','samples',['samples','latencies','durations']],
    ['Off-heap direct buffers','Low latency / GC','A direct ByteBuffer stores its elements in native memory and can reduce intermediate copying for I/O. Create and size buffers outside latency-sensitive hot paths.','allocateDirect itself allocates a Java wrapper and native memory. Off-heap buffers have ownership, lifetime and cleanup costs and do not guarantee zero GC.',
      'java.nio.ByteBuffer direct = java.nio.ByteBuffer.allocateDirect(16);\ndirect.putLong(1234L);\ndirect.flip();\nSystem.out.println(direct.getLong());','1234',
      'Does ByteBuffer.allocateDirect guarantee an allocation-free call?',['Yes, always','No, it allocates a wrapper and native memory','Only on Linux'],1,
      'Clear a reusable direct buffer before the next message.','direct.clear();','Learn where the buffer comes from and who owns it.','direct',['direct','packet','frame']],
    ['Escape analysis and scalar replacement','Low latency / GC','A JIT may eliminate short-lived object allocations if an object does not escape and the optimisation is profitable. This is JVM, code-shape and workload dependent.','Do not assume new inside a hot loop must allocate, or that it never does. Confirm with allocation profiling, compiler diagnostics and realistic benchmarks.',
      'class ValuePair { final int left, right;\n    ValuePair(int left, int right) { this.left = left; this.right = right; }\n    int sum() { return left + right; } }\nSystem.out.println(new ValuePair(2, 3).sum());','5',
      'Who decides whether this temporary object is scalar-replaced?',['The JVM JIT under suitable conditions','The compiler always','The operating system scheduler'],0,
      'Call sum on a temporary value pair.','new ValuePair(2, 3).sum();','Avoid treating escape analysis as a portability guarantee.','ValuePair',['ValuePair','PairValue','PointValue']],
    ['Bounded queues and backpressure','Concurrency','A bounded queue caps buffered items. offer returns false instead of silently allowing unlimited growth, allowing a deliberate drop, retry or backpressure policy.','ArrayBlockingQueue uses locks, so it is illustrative rather than an automatically suitable low-latency queue. Understand producer/consumer ownership and measure contention.',
      'java.util.concurrent.ArrayBlockingQueue<String> queue = new java.util.concurrent.ArrayBlockingQueue<>(2);\nqueue.offer("one");\nqueue.offer("two");\nSystem.out.println(queue.offer("three"));','false',
      'What does offer return when this bounded queue is full?',['true','null','false'],2,
      'Attempt to enqueue the next event without blocking.','queue.offer("next");','A safe overload policy matters more than micro-optimisation.','queue',['queue','mailbox','inbox']],
    ['Contention-aware counters','Concurrency','LongAdder spreads contended statistical increments across cells. It can improve throughput for metrics under contention, but sum is not an atomic snapshot.','For sequences or control decisions requiring linearizable reads, use AtomicLong or a lock rather than LongAdder.',
      'java.util.concurrent.atomic.LongAdder adder = new java.util.concurrent.atomic.LongAdder();\nadder.add(3);\nadder.increment();\nSystem.out.println(adder.sum());','4',
      'Which scenario is LongAdder intended for?',['Generating strictly ordered IDs','Highly contended approximate statistics','Coordinating lock-free publication'],1,
      'Increment a statistical counter.','adder.increment();','Know the difference between telemetry counters and sequence numbers.','adder',['adder','metrics','hits']],
    ['Thread-local reusable scratch space','Low latency / GC','ThreadLocal can give each thread a reusable scratch buffer and avoid repeated per-operation allocation after initialisation. Ownership is per thread, not per task.','Buffers may grow and remain attached to long-lived pooled threads. ThreadLocal does not prevent other allocations or GC pauses elsewhere.',
      'ThreadLocal<StringBuilder> scratch = ThreadLocal.withInitial(() -> new StringBuilder(32));\nStringBuilder buffer = scratch.get();\nbuffer.append("ok");\nSystem.out.println(buffer.length());','2',
      'Does ThreadLocal automatically share one scratch buffer across threads?',['Yes','No, each thread has its own value','Only after a GC'],1,
      'Reset this thread’s scratch buffer.','scratch.get().setLength(0);','Think about lifecycle, maximum size and per-thread memory cost.','scratch',['scratch','threadCache','workspace']]
  ];
  const shortcuts={
    'Design patterns':['Navigate to Declaration','Ctrl+B','Cmd+B'],
    'Low latency / GC':['Run with Profiler','Ctrl+Alt+Shift+F10','Ctrl+Option+Shift+R'],
    Concurrency:['Find Usages','Alt+F7','Option+F7']
  };
  const lessons=definitions.map((x,i)=>{
    const shortcut=shortcuts[x[1]];
    return {id:'java-'+(i+25),number:i+25,title:x[0],chapter:x[1],concept:x[2],why:x[3],
      code:x[4],output:x[5],question:{prompt:x[6],options:x[7],answer:x[8]},
      recall:{prompt:x[9],code:x[10]},tip:x[11],rename:x[12],names:x[13],
      shortcut:{name:shortcut[0],windows:shortcut[1],mac:shortcut[2]},minutes:5,advanced:true};
  });
  // Each seed changes the identifiers AND meaningful data in the example, while
  // retaining the same validated teaching objective and expected Java behaviour.
  function variant(lesson,seed){
    const n=(Math.trunc(Number(seed)||0)>>>0);
    const choices=lesson.names||[lesson.rename];
    const base=choices[n%choices.length];
    const alias=base+'_'+Math.floor(n/choices.length).toString(36);
    const variable=new RegExp('\\b'+lesson.rename+'\\b','g');
    let code=lesson.code, output=lesson.output, recall=lesson.recall.code;
    const change=(oldText,newText)=>{if(!code.includes(oldText))throw Error('Bad challenge template: '+lesson.id);code=code.replace(oldText,newText);};
    const pick=items=>items[n%items.length];
    switch(lesson.id){
      case 'java-25':{
        const threshold=90+n%60,discount=3+n%8,offer=threshold+10+n%35;
        change('amount >= 100 ? amount - 5 : amount', 'amount >= '+threshold+' ? amount - '+discount+' : amount');
        change('applyAsInt(120)','applyAsInt('+offer+')');
        output=String(offer-discount);
        break;
      }
      case 'java-26':change('events.add("accepted")','events.add("'+pick(['queued','processed','filled','confirmed','validated'])+'")');break;
      case 'java-27':{
        const path=pick(['/prices','/trades','/orders','/quotes','/events']);
        change('append("/orders")','append("'+path+'")');
        output='GET '+path;
        break;
      }
      case 'java-28':{
        const milli=1200+(n%75)*100;
        change('return 3300;','return '+milli+';');
        output=(milli/1000).toFixed(1);
        break;
      }
      case 'java-29':{
        const word=pick(['trade','order','quote','event','price']);
        change('decorated.apply("order")','decorated.apply("'+word+'")');
        output='['+word+']';break;
      }
      case 'java-30':{
        const event=pick(['filled','placed','received','validated','settled']);
        change('listener.accept("filled")','listener.accept("'+event+'")');
        output='audit:'+event;break;
      }
      case 'java-31':{
        const value=10+n%900;change('() -> 42','() -> '+value);output=String(value);break;
      }
      case 'java-32':{
        const value=150+n%1900;change('new Price(250)','new Price('+value+')');
        recall=recall.replace('= 250','= '+value);
        output=String(value);break;
      }
      case 'java-33':{
        const baseValue=80+n%800;
        change('{100, 101, 102}','{'+baseValue+', '+(baseValue+1)+', '+(baseValue+2)+'}');
        output=String(baseValue*3+3);break;
      }
      case 'java-34':{
        const value=20+n%250;change('] = 42;','] = '+value+';');output=String(value);break;
      }
      case 'java-35':{
        const word=pick(['next','quote','tick','trade','event']);
        change('append("next")','append("'+word+'")');output=String(word.length);break;
      }
      case 'java-36':{
        const value=n%2===0?'true':'false';
        change('signal.ready = true;','signal.ready = '+value+';');output=value;break;
      }
      case 'java-37':{
        const start=n%900;
        change('new java.util.concurrent.atomic.AtomicLong();','new java.util.concurrent.atomic.AtomicLong('+start+');');
        output=String(start+1);break;
      }
      case 'java-38':{
        const first=10+n%40;change('{10, 20, 30}','{'+first+', '+(first+10)+', '+(first+20)+'}');
        output=String(first*3+30);break;
      }
      case 'java-39':{
        const high=600+n%2000;
        change('200, 900, 500','200, '+high+', 500');output=String(high);break;
      }
      case 'java-40':{
        const value=1000+n%8000;change('putLong(1234L)','putLong('+value+'L)');output=String(value);break;
      }
      case 'java-41':{
        const x=2+n%40,y=3+(n>>>8)%40;
        change('new ValuePair(2, 3)','new ValuePair('+x+', '+y+')');output=String(x+y);break;
      }
      case 'java-42':{
        change('queue.offer("three")','queue.offer("'+pick(['third','overflow','new','trade','next'])+'")');break;
      }
      case 'java-43':{
        const value=1+n%1000;change('adder.add(3)','adder.add('+value+')');output=String(value+1);break;
      }
      case 'java-44':{
        const word=pick(['ok','tick','quote','order','event']);
        change('buffer.append("ok")','buffer.append("'+word+'")');output=String(word.length);break;
      }
    }
    return {...lesson,code:code.replace(variable,alias),output,
      recall:{...lesson.recall,code:recall.replace(variable,alias)}};
  }
  const words=('about above accept action actor adapt agile alarm alpha always amount anchor answer apply array aside atomic '+
    'balance basic become before begin behind below bench better binary block branch brave break bridge browser buffer build '+
    'cache calm camera capture careful change check choice choose clean clear client cloud code coffee collect command common '+
    'compare compile complete concept connect constant control correct create credit cycle daily data debug decide deep default '+
    'define design detail develop device direct distance divide double draft drive dynamic early easily editor effect effort '+
    'element enable engine enough ensure equal error event example expect explain export extend factor family faster feature '+
    'field filter final finish first focus follow force format function future garden gather generate global goal growth guide '+
    'handle happy helper hidden history honest improve include index input insight install integer intent interface internal '+
    'iterate java journey keyboard knowledge language latency layout learn lesson level library limited local logic loop '+
    'machine major manage manual master memory method metric minute model module monitor motion move native narrow network '+
    'number object observe offline option order output package panel pattern pause people period place platform player point '+
    'practice prefer prepare process profile project promise proper protect public queue quick random reader ready record reduce '+
    'refactor regular release repeat reply result return review rhythm sample schema score search secure select server service '+
    'session share shift simple single smooth source space special speed stable stage start state static steady stream string '+
    'strong style system target teach template terminal test thread tick timing title today token touch track trade train '+
    'typing unique update useful value variable version verify visual weekly welcome window wisdom worker workflow write yield').split(' ');
  function generateWords(count=50,settings={},seed){
    const size=Math.max(10,Math.min(200,Math.floor(Number(count)||50)));
    let state=(seed===undefined?Math.floor(Math.random()*0xffffffff):Number(seed))>>>0;
    if(!state)state=0x9e3779b9;
    const next=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return state>>>0;};
    const focus=Array.isArray(settings.focusKeys)?settings.focusKeys.filter(k=>typeof k==='string'&&k.length===1&&/[a-z]/i.test(k)).map(k=>k.toLowerCase()):[];
    const targeted=focus.length?words.filter(word=>focus.some(key=>word.includes(key))):[];
    const result=[];
    for(let i=0;i<size;i++){
      const bank=targeted.length&&i%4!==0?targeted:words;
      let word=bank[next()%bank.length];
      if(settings.numbers&&i>0&&i%12===0)word=String(10+(next()%989));
      if(settings.punctuation&&i>0&&i%9===0)word+=i%18===0?'.':',';
      result.push(word);
    }
    return result.join(' ');
  }
  return {lessons,variant,generateWords,version:1};
});