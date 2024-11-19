#!/bin/sh
set -e

quickwit run &

while ! curl -s http://localhost:7280 > /dev/null; do
    sleep 0.5
done

quickwit index create --index-config open-library-index.yml
mv index.ndjson index.json
quickwit index ingest --index open-library --input-path index.json --force
rm index.json
