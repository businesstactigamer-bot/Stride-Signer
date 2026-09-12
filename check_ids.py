import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

ids_in_html = set(re.findall(r'id=["\']([^"\']+)["\']', html))
print(f"Total IDs in HTML: {len(ids_in_html)}")

with open('js/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

get_elem_ids = re.findall(r'getElementById\(["\']([^"\']+)["\']\)', js)

missing = []
for gid in get_elem_ids:
    if gid not in ids_in_html:
        missing.append(gid)

print("IDs in JS that are NOT in HTML:", set(missing))
