#!/bin/bash

# Specify the directory containing the benchmarks
filedir="../projects/"
outdir="../outputs/"

# Read the JSON file and extract keys where the value is above 50
benchmarks=($(jq -r 'to_entries | map(select(.value > 50) | .key) | .[]' dcg_edgecounts.json))


for benchmark in "${benchmarks[@]}"
do
bpath="$filedir/$benchmark"
current_time=$(date +"%T")
echo "Current Time: $current_time"
echo "Running Experiments for benchmark $benchmark"
    # Initialize variables
    total_time_benchmark=0

    # Run the command 10 times
    for ((i=1; i<=10; i++))
    do
        output=$(node --max-old-space-size=16384 ./lib/main.js -j "${outdir}/${benchmark}_scg.json" "$bpath" 2>&1 | grep -E "Analysis time:.*")
        wait
        # Check if the output contains "Analysis Time"
        if [ -n "$output" ]; then
            # Extract analysis time from output
            analysis_time=$(echo "$output" | grep -oP 'Analysis time: \K\d+')
        else
            break
        fi
        # Add analysis time to total
        total_time_benchmark=$((total_time_benchmark + analysis_time))
    done
    if [ "$total_time_benchmark" -gt 0 ]; then
        # Calculate average analysis time for this benchmark
        average_time_benchmark=$((total_time_benchmark / 10))
        # Add key-value pair to the object
        object="$object\"$benchmark\":\"$average_time_benchmark\","
        echo "Average analysis time for $benchmark: $average_time_benchmark ms" 
        echo "Analysis time:${average_time_benchmark}ms" > ${outdir}/${benchmark}_comp.txt
        wait
        output2=$(node --max-old-space-size=16384 ./lib/main.js --reachability --compare-callgraphs "${outdir}/${benchmark}_dcg.json" "${outdir}/${benchmark}_scg.json" 2>&1 | grep -E "Function->function edges.*\((.*)\)$|Call->function edges.*\((.*)\)$|Per-call average.*|Reachable functions in*|Functions in*|Reachability precision*")
        wait
        echo "$output2" >> ${outdir}/${benchmark}_comp.txt
    fi
done

