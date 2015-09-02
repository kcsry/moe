# Moe

A cute mobile schedule.

## Building

`npm i && npm run build`

No Browserify or Webpack, you ask? No fancy JS modules, just yucky concat?
You're absolutely right. We're not aiming for extreme extensibility, but
tiny file sizes instead :)

## Tunking

### Bootstrapping

See `moe.html` for instructions on how to tunk Moe to fit your project.

### Schedule format

The schedule JSON format should be approximately as follows.

```javascript
[
  {
    "status": 1,  // status. 1 = visible, 0 = not quite as visible
    "kind": "speshul",  // "kind". Used for filtering.
    "description": "HTML Description Of Your Program Here",
    "language": "fi",  // spoken language
    "title": "Avajaiset",  // visible title
    "start_time": "2015-06-05T17:30:00+03:00",  // ISO8601 start time
    "location": "Pääsali",  // location
    "kind_display": "Erikoisohjelma",  // human-readable "kind".
    "identifier": "avajaiset",  // unique identifier for the program (used for starring, etc)
    "location_slug": "paasali",  // slug form of the location above
    "end_time": "2015-06-05T18:00:00+03:00"  // ISO8601 end time
  },
  // ... moar programs ...
]
```

You might be able to get away with omitting some of these fields.