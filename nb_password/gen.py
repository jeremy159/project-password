import csv, json

file = "./data/crackingTimes.csv"

data = {
    'minimum': 0,
    'maximum': 0,
    'total': 0,
    'data': 
        {
            'seconds': [],
            'minutes': [],
            'hours': [],
            'days': [],
            'months': [],
            'years': []
        }
}
with open(file) as csvfile:
    reader = csv.reader(csvfile)
    for row in reader:
        lts = row[0].find('less than a second')
        sec = row[0].find('second')
        minute = row[0].find('minute')
        hour = row[0].find('hour')
        day = row[0].find('day')
        month = row[0].find('month')
        year = row[0].find('year')
        
        if(lts >= 0):
            data['data']['seconds'].append({'t': 0, 'value': int(row[1])})
        elif (sec >= 0):
            data['data']['seconds'].append({'t': int(row[0].split(' ')[0]), 'value': int(row[1])})
        elif (minute >= 0):
            data['data']['minutes'].append({'t': int(row[0].split(' ')[0]), 'value': int(row[1])})
        elif (hour >= 0):
            data['data']['hours'].append({'t': int(row[0].split(' ')[0]), 'value': int(row[1])})
        elif (day >= 0):
            data['data']['days'].append({'t': int(row[0].split(' ')[0]), 'value': int(row[1])})
        elif (month >= 0):
            data['data']['months'].append({'t': int(row[0].split(' ')[0]), 'value': int(row[1])})
        elif (year >= 0):
            data['data']['years'].append({'t': int(row[0].split(' ')[0]), 'value': int(row[1])})

# stats
maximum = 0
minimum = 10000000
tot = 0
for d in data['data']:
    for e in data['data'][d]:
        tot += e['value']
        if e['value'] > maximum:
            maximum = e['value']
        if e['value'] < minimum:
            minimum = e['value']

# Append time 0 to every types
tot = 0
for t in data['data']:
    if t != 'seconds':
        data['data'][t].append({'t': 0, 'value': tot})
    for e in data['data'][t]:
        if e['t'] != 0 or t == 'seconds':
            tot += e['value']

#sort
for d in data['data']:
    data['data'][d] = sorted(data['data'][d], key=lambda k: k.get('t', 0), reverse=False)

data['minimum'] = minimum
data['maximum'] = maximum
data['total'] = tot

with open(f'data.json', 'w') as outfile:  
    json.dump(data, outfile)