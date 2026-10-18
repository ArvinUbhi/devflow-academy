package com.devflow.bench;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import org.openjdk.jmh.annotations.Benchmark;
import org.openjdk.jmh.annotations.BenchmarkMode;
import org.openjdk.jmh.annotations.Fork;
import org.openjdk.jmh.annotations.Level;
import org.openjdk.jmh.annotations.Measurement;
import org.openjdk.jmh.annotations.Mode;
import org.openjdk.jmh.annotations.OutputTimeUnit;
import org.openjdk.jmh.annotations.Param;
import org.openjdk.jmh.annotations.Scope;
import org.openjdk.jmh.annotations.Setup;
import org.openjdk.jmh.annotations.State;
import org.openjdk.jmh.annotations.Warmup;

/** Measures a primitive hot path against an intentionally allocation-heavy design.
 * The two methods do different amounts of work; no claimed universal speedup.
 */
@State(Scope.Thread)
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
@Fork(2)
@Warmup(iterations = 4, time = 1)
@Measurement(iterations = 5, time = 1)
public class AllocationBenchmark {
    @Param({"128", "1024"})
    public int batchSize;
    private int[] prices;
    @Setup(Level.Trial)
    public void setup() {
        prices = new int[batchSize];
        for (int i = 0; i < prices.length; i++) prices[i] = 10_000 + (i % 137);
    }
    @Benchmark
    public long primitiveReduction() {
        long sum = 0;
        for (int value : prices) sum += value;
        return sum;
    }
    @Benchmark
    public long boxedIntermediateList() {
        List<Integer> boxed = new ArrayList<Integer>(prices.length);
        for (int value : prices) boxed.add(value);
        long sum = 0;
        for (int value : boxed) sum += value;
        return sum;
    }
}
