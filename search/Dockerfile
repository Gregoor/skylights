FROM quickwit/quickwit

RUN curl -O https://open-library-uploads.s3.eu-north-1.amazonaws.com/index.json.gz
RUN gunzip index.json.gz

WORKDIR /quickwit

COPY open-library-index.yml .
COPY setup-index.sh .
RUN chmod +x setup-index.sh
RUN ./setup-index.sh

ENTRYPOINT ["quickwit"]
CMD ["run"]
