#!/bin/sh
set -e

quickwit run &

while ! curl -s http://localhost:7280 > /dev/null; do
    sleep 0.5
done

quickwit index create --index-config open-library-index.yml
quickwit index ingest --index open-library --input-path search-items-*.json --force
rm search-items-*
