FROM quickwit/quickwit

RUN curl -O https://open-library-uploads.s3.eu-north-1.amazonaws.com/index.ndjson.gz
COPY index.ndjson.gz /quickwit/index.ndjson.gz

WORKDIR /quickwit

COPY entrypoint.sh /entrypoint.sh
COPY open-library-index.yml /open-library-index.yml
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["run"]
