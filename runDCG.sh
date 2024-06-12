#!/bin/bash

# Specify the directory containing the benchmarks
filedir="../projects/"
outdir="../outputs/"
missed_timeline_file="missed_timeline.txt"
timeout_duration=3600  # 60 minutes in seconds

# Get the list of top-level directories inside filedir
benchmarks=($(find "$filedir" -mindepth 1 -maxdepth 1 -type d -exec basename {} \;))

for benchmark in "${benchmarks[@]}"
do
    bpath="$filedir/$benchmark"
    current_time=$(date +"%T")
    echo "Current Time: $current_time"
    echo "Running Experiments for benchmark $benchmark"

    # Run node with timeout
    timeout $timeout_duration node --max-old-space-size=40960 ~/jelly/lib/main.js --npm-test "${bpath}" -d "${outdir}/${benchmark}_dcg.json"
    
    # Check the exit status of the previous command
    if [ $? -eq 124 ]; then
        echo "Experiment for benchmark $benchmark timed out after 60 minutes." >> "$missed_timeline_file"
    fi
    
    # Ensure a newline separator between iterations
    echo ""
done
