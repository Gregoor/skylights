FROM quickwit/quickwit

RUN curl -O https://open-library-uploads.s3.eu-north-1.amazonaws.com/search-items-2024-11-19T14%3A27%3A06.430Z.json.gz
RUN gunzip search-items-*.json.gz

WORKDIR /quickwit

COPY open-library-index.yml .
COPY setup-index.sh .
RUN chmod +x setup-index.sh
RUN ./setup-index.sh

ENTRYPOINT ["quickwit"]
CMD ["run"]
