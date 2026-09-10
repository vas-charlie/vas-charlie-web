# VAŠ CHARLIE OS offline routing package

The app accepts a local JSON package with schema `1`.

```json
{
  "schema": 1,
  "name": "Croatia / Zadar",
  "version": "2026-08",
  "nodes": [
    {"id":1,"lat":44.1194,"lon":15.2314},
    {"id":2,"lat":44.1200,"lon":15.2320}
  ],
  "edges": [
    {"from":1,"to":2,"distance":80,"oneway":false}
  ],
  "places": [
    {"name":"Primjer","lat":44.1200,"lon":15.2320}
  ]
}
```

`nodes` and `edges` form the routable road graph. `places` is an optional offline destination index. A destination can also be entered as `latitude,longitude`.

For an OSM-derived production package, preserve OpenStreetMap attribution and ODbL information. Do not ship a fabricated road graph as real navigation data.
