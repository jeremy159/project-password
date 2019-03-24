import csv, os, json, io

path = './data/'
files = os.listdir(path)

SPLIT = 100
DIVIDER = 50

value = 0
count = 1

data = { "name": "catégories", "children": [] }

meanings_name = 'significations'

for file in files:
    if file != 'meanings.csv' and os.path.isfile(path + file):
        with io.open(path + file, encoding='utf-8') as csvFile:
            name = next(csvFile).split(',')[0]
            children = []
            reader = csv.reader(csvFile)
            for row in reader:
                children.append({'name': row[value], 'value': int(row[count])})
            data["children"].append({'name': name, 'children': children})

# with open(path + 'meanings.csv') as csvFile:
#     reader = csv.reader(csvFile)
#     children = []
#     for row in reader:
#         t = row[value].split(".")[0]
#         obj = row[value].split(".")[1]

#         children_childrens = {'name': obj, 'value': int(row[count])}

#         hasType = False
#         for child in children:
#             hasType |= child['name'] == t

#         if not hasType:             
#             children.append({'name': t, 'children': [children_childrens]})
#         else:
#             for child in children:
#                 if child['name'] == t:
#                     child['children'].append(children_childrens)

#     data["children"].append({'name': meanings_name, 'children': children})

# Tri par 'count'
for child in data['children']:
    if child['name'] == meanings_name:
        for children_child in child['children']:
            children_child['children'] = sorted(children_child['children'], key=lambda k: k.get('value', 0), reverse=True)
    else:
        child['children'] = sorted(child['children'], key=lambda k: k.get('value', 0), reverse=True)

# split
for child in data['children']:
    if child['name'] == meanings_name:
        for children_child in child['children']:
            children_child = children_child['children'][:SPLIT]
    else:
        child['children'] = child['children'][:SPLIT]

# Réarrangement arborescent
def twenty(data):
    children = { 'name': 'restants ('+data['name']+')', 'children': data['children'][DIVIDER:] }
    if(len(children['children']) > DIVIDER):
        twenty(children)
    data_children = data['children'][:DIVIDER]
    data_children.append(children)
    data['children'] = data_children

for child in data['children']:
    twenty(child)


with io.open(f'data_{SPLIT}.json', 'w', encoding='utf8') as outfile:  
    json.dump(data, outfile, ensure_ascii=False)