#!/bin/bash

# Specify the directory containing the benchmarks
filedir="../projects/"
outdir="../outputs/"

# Get the list of top-level directories inside filedir
benchmarks=($(find "$filedir" -type f -name '*_dcg.json' \;))


out={}
# Iterate through the files in the directory
for benchmark in benchmarks:
    if os.path.exists(file_path):
        # Read the JSON content from the file
        with open(file_path, 'r') as file:
                data = json.load(file)

        # Check if the 'call2fun' key exists in the JSON data
        if 'call2fun' in data:
                call2fun = data['call2fun']
                count = len(call2fun)  # Count of items in call2fun array
                total_count += count
                out[prefix]=count
file_path = "dcg_edgecounts.json"
# Write the object to the JSON file
with open(file_path, "w") as json_file:
    json.dump(out, json_file, indent=4)
#print("Total count of call2fun edges in DCGs:", total_count)
