import os
import json
from glob import glob


# Specify the directory containing the benchmarks
filedir="../projects/"
outdir="../outputs/"

total_count = 0

benchmarks = glob(os.path.join(filedir, '*_dcg.json'))
print(benchmarks)

out={}
# Iterate through the files in the directory
for benchmark in benchmarks:
    prefix = os.path.basename(benchmark).split('/')[-1].replace('_dcg.json', '')
    # Read the JSON content from the file
    with open(benchmark, 'r') as file:
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
