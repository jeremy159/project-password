import csv, json

file = "./data/crackingTimes1000.csv"
percent_0 = 98
percent_1 = 100

data = {'data': []}

cumulatif = {'data': []}
raw_data = {'data': []}

# Modificateur
mod = 10000

with open(file) as csvfile:
    reader = csv.reader(csvfile)
    count = 0
    for row in reader:
        data['data'].append({'t': int(row[0]), 'n': int(row[1])})

# sort
data = sorted(data['data'], key=lambda x: x['t'])
s = sum(d['n'] for d in data)

count = 0
for d in data:
    count += d['n']
    percent = count / s 
    if percent >= percent_0/100 and percent <= percent_1/100:
        raw_data['data'].append({ 't': d['t'], 'n': d['n'] / s })
        cumulatif['data'].append({ 't': d['t'], 'n': count / s })


with open(f'cumulatif_{percent_0}_to_{percent_1}.json', 'w') as outfile:  
    json.dump(cumulatif, outfile)
with open(f'density_{percent_0}_to_{percent_1}.json', 'w') as outfile:  
    json.dump(raw_data, outfile)