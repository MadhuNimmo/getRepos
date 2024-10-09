#!/bin/bash

# Specify the directory containing the benchmarks
filedir="../projects/"
outdir="../outputs/"
missed_timeline_file="missed_timeline.txt"
summary_file="benchmark_summary.txt"
timeout_duration=3600  # 60 minutes in seconds

# Initialize counters and arrays
successful_benchmarks=0
failed_benchmarks=0
benchmark_times=()

# Get the list of top-level directories inside filedir
benchmarks=($(find "$filedir" -mindepth 1 -maxdepth 1 -type d -exec basename {} \;))

# Create or clear the summary file
echo "Benchmark Summary" > "$summary_file"
echo "==================" >> "$summary_file"
echo "Total Benchmarks: ${#benchmarks[@]}" >> "$summary_file"

for benchmark in "${benchmarks[@]}"
do
    bpath="$filedir/$benchmark"
    current_time=$(date +"%T")
    echo "Current Time: $current_time"
    echo "Running Experiments for benchmark $benchmark"

    # Start the timer
    start_time=$(date +%s)

    # Run node with timeout
    timeout $timeout_duration node --max-old-space-size=40960 ~/jelly/lib/main.js --npm-test "${bpath}" -d "${outdir}/${benchmark}_dcg.json"
    
    # Capture exit status
    exit_status=$?

    # Calculate elapsed time
    end_time=$(date +%s)
    elapsed_time=$((end_time - start_time))
    benchmark_times+=("$elapsed_time")

    if [ $exit_status -eq 0 ]; then
        echo "Experiment for benchmark $benchmark completed successfully."
        ((successful_benchmarks++))
    elif [ $exit_status -eq 124 ]; then
        echo "Experiment for benchmark $benchmark timed out after 60 minutes." >> "$missed_timeline_file"
        ((failed_benchmarks++))
    else
        echo "Experiment for benchmark $benchmark failed with exit code $exit_status."
        ((failed_benchmarks++))
    fi

    # Log the time taken for this benchmark
    echo "Time taken for $benchmark: $elapsed_time seconds" >> "$summary_file"

    # Ensure a newline separator between iterations
    echo ""
done

# Summary statistics
echo "Summary of Benchmark Results" >> "$summary_file"
echo "=============================" >> "$summary_file"
echo "Successful Benchmarks: $successful_benchmarks" >> "$summary_file"
echo "Failed Benchmarks: $failed_benchmarks" >> "$summary_file"
echo "Total Benchmarks: ${#benchmarks[@]}" >> "$summary_file"
echo "Average Time per Benchmark: $(bc -l <<< "scale=2; $(IFS=+; echo "${benchmark_times[*]}")/${#benchmark_times[@]}") seconds" >> "$summary_file"

# Notify completion
echo "Benchmarking complete. Summary written to $summary_file."
