"""Convert an Overpass `out geom` dump into FloodScout road segments.

Ways are split at every point shared with another way (an intersection),
so each segment is one routable edge between two graph nodes.
Usage: python3 -I build_fixture.py <osm.json> <out.json>
"""
import json
import math
import sys
from collections import Counter

src, out = sys.argv[1], sys.argv[2]
data = json.load(open(src))
ways = [w for w in data["elements"] if w["type"] == "way" and len(w.get("geometry", [])) >= 2]


def key(p):
    return (round(p["lat"], 6), round(p["lon"], 6))


def dist(a, b):
    r = 6371000
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


use = Counter()
for w in ways:
    pts = [key(p) for p in w["geometry"]]
    for p in set(pts):
        use[p] += 1
    use[pts[0]] += 1
    use[pts[-1]] += 1

node_index = {}
nodes = []


def node(p):
    if p not in node_index:
        node_index[p] = len(nodes)
        nodes.append([p[0], p[1]])
    return node_index[p]


segments = []
for w in ways:
    pts = [key(p) for p in w["geometry"]]
    tags = w.get("tags", {})
    start = 0
    part = 0
    for i in range(1, len(pts)):
        if i == len(pts) - 1 or use[pts[i]] > 1:
            geom = pts[start : i + 1]
            length = sum(dist(geom[j], geom[j + 1]) for j in range(len(geom) - 1))
            if length > 0.5:
                segments.append(
                    {
                        "id": f"{w['id']}:{part}",
                        "w": w["id"],
                        "n": tags.get("name"),
                        "h": tags.get("highway"),
                        "a": node(geom[0]),
                        "b": node(geom[-1]),
                        "o": tags.get("oneway") == "yes",
                        "len": round(length, 1),
                        "g": [[p[0], p[1]] for p in geom],
                    }
                )
                part += 1
            start = i

lats = [n[0] for n in nodes]
lons = [n[1] for n in nodes]
result = {
    "source": "OpenStreetMap contributors, via Overpass API",
    "license": "ODbL 1.0 — https://www.openstreetmap.org/copyright",
    "retrieved_at": data.get("osm3s", {}).get("timestamp_osm_base"),
    "area": "Hải Châu, Đà Nẵng (pilot slice)",
    "bbox": [min(lats), min(lons), max(lats), max(lons)],
    "nodes": nodes,
    "segments": segments,
}
json.dump(result, open(out, "w"), ensure_ascii=False, separators=(",", ":"))
print(len(nodes), "nodes", len(segments), "segments")
