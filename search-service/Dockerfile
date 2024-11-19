FROM quickwit/quickwit

WORKDIR /quickwit

COPY entrypoint.sh /entrypoint.sh
COPY open-library-index.yml /open-library-index.yml
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["run"]
