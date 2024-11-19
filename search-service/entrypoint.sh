#!/bin/sh

MARKER_FILE="/.setup_done"

quickwit "$@" &
QUICKWIT_PID=$!

if [ ! -f "$MARKER_FILE" ]; then
  while ! curl -s http://0.0.0.0:7280 > /dev/null; do
    sleep 0.5
  done

  echo "First run detected. Running setup..."

  quickwit index create --index-config /open-library-index.yml
  mv index.ndjson index.json
  quickwit index ingest --index open-library --input-path index.json --force
  rm index.ndjson.gz index.json

  touch "$MARKER_FILE"
else
  echo "Setup already completed. Skipping setup."
fi

wait $QUICKWIT_PID
