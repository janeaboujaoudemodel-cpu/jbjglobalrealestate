import json
import subprocess
import re

def get_data():
    res = subprocess.run(["psql", "-At", "-c", "SELECT json_agg(p) FROM (SELECT name, slug, developer_name, description, cover_image_url, card_image_url, gallery_start_image_url, is_published FROM projects WHERE is_published = true) p"], capture_output=True, text=True)
    return json.loads(res.stdout)

projects = get_data()

GENERIC_DUPLICATE_WORDS = {
  "the", "in", "by", "at", "residence", "residences", "residential", "resort", "resorts", "tower", "towers",
  "apartments", "apartment", "villa", "villas", "first", "integrative", "wellness", "dubai", "uae", "phase",
  "edition", "collection",
}

def normalize(name):
    raw = str(name or "").lower()
    tokens = re.split(r'[^a-z0-9]+', re.sub(r'\b(residences?|residential|resorts?|towers?|apartments?|villas?|phase|edition|collection)\b', ' ', raw.replace('&', ' and ')))
    tokens = [t for t in tokens if t and t not in GENERIC_DUPLICATE_WORDS]
    return "".join(tokens) if tokens else re.sub(r'[^a-z0-9]+', '', raw)

def get_key(p):
    identity = normalize(p.get('name') or p.get('slug'))
    dev = re.sub(r'[^a-z0-9]+', '', str(p.get('developer_name') or "").lower())
    return f"{dev or 'unknown'}:{identity}"

def has_photo(p):
    return any([p.get('cover_image_url'), p.get('card_image_url'), p.get('gallery_start_image_url')])

def is_rental(p):
    name = (p.get('name') or "").lower()
    desc = (p.get('description') or "").lower()
    return 'rent' in name or 'for rent' in desc or 'rental' in desc

seen = set()
count_buy = 0
count_rent = 0
for p in projects:
    if not has_photo(p): continue
    key = get_key(p)
    if key in seen: continue
    seen.add(key)
    
    if is_rental(p):
        count_rent += 1
    else:
        count_buy += 1

print(f"Total Published: {len(projects)}")
print(f"Buy (Deduplicated with photo): {count_buy}")
print(f"Rent (Deduplicated with photo): {count_rent}")
