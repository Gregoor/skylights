extern crate diesel;

use std::{io::BufRead, sync::mpsc::sync_channel, time::Instant};

use diesel::{connection::SimpleConnection, prelude::*, sqlite::SqliteConnection};
use itertools::Itertools;
use num_format::{Locale, ToFormattedString};
use rayon::prelude::*;
use serde::{de::DeserializeOwned, Deserialize};

use crate::{
    schema::{
        ol_authors, ol_editions, ol_editions_isbn_10, ol_editions_isbn_13, ol_work_authors,
        ol_works,
    },
    utils::get_ol_dump_reader,
};

#[derive(Debug, Deserialize, Insertable, Queryable)]
#[diesel(table_name = ol_authors)]
struct Author {
    key: String,
    name: Option<String>,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(untagged)]
enum AuthorKeyRef {
    KeyRef { key: String },
    Key(String),
}

#[derive(Debug, Deserialize)]
struct AuthorRef {
    author: Option<AuthorKeyRef>,
}

#[derive(Debug, Deserialize)]
struct WorkIn {
    key: String,
    authors: Option<Vec<AuthorRef>>,
}

#[derive(Debug, Insertable, Queryable)]
#[diesel(table_name = ol_work_authors)]
struct WorkAuthor {
    work_key: String,
    author_key: String,
}

#[derive(Debug, Insertable, Queryable)]
#[diesel(table_name = ol_works)]
struct WorkOut {
    key: String,
}

#[derive(Debug, Deserialize)]
struct KeyRef {
    key: String,
}

#[derive(Debug, Deserialize)]
struct EditionIn {
    key: String,
    title: Option<String>,
    number_of_pages: Option<i32>,
    works: Option<Vec<KeyRef>>,
    isbn_10: Option<Vec<String>>,
    isbn_13: Option<Vec<String>>,
}

#[derive(Debug, Insertable, Queryable)]
#[diesel(table_name = ol_editions_isbn_10)]
struct EditionIsbn10 {
    edition_key: String,
    isbn_10: String,
}

#[derive(Debug, Insertable, Queryable)]
#[diesel(table_name = ol_editions_isbn_13)]
struct EditionIsbn13 {
    edition_key: String,
    isbn_13: String,
}

#[derive(Insertable, Queryable)]
#[diesel(table_name = ol_editions)]
struct EditionOut {
    key: String,
    title: Option<String>,
    number_of_pages: Option<i32>,
    work_key: Option<String>,
}

#[derive(Deserialize)]
struct Rating {}

pub fn collect_into_db<T>(
    connection: &mut SqliteConnection,
    file_key: &str,
    insert_fn: impl Fn(&mut SqliteConnection, &[T]),
) where
    T: std::fmt::Debug + Send + Sync + DeserializeOwned + 'static,
{
    let (sender, receiver) = sync_channel(2048);
    let inner_file_key = file_key.to_string();
    rayon::spawn(move || {
        get_ol_dump_reader(&inner_file_key)
            .lines()
            .par_bridge()
            .panic_fuse()
            .map(|line_result| {
                let line = line_result.unwrap();
                let json_str = line.split('\t').nth(4).unwrap().trim();
                // println!(
                //     "{}",
                //     jsonformat::format(json_str, jsonformat::Indentation::TwoSpace)
                // );
                serde_json::from_str::<T>(json_str).unwrap_or_else(|err| {
                    dbg!(json_str, err);
                    panic!();
                })
            })
            .try_for_each_with(sender, |s, ed| s.send(ed))
            .unwrap();
    });
    let start_at = Instant::now();
    let mut n = 0;
    for items in receiver.iter().chunks(64).into_iter() {
        let items = items.collect::<Vec<T>>();
        n += items.len();
        if n > 0 && n % 0x1000 == 0 {
            let elapsed = start_at.elapsed().as_secs_f64();
            println!(
                "{} #{} at {}/s",
                file_key,
                n.to_formatted_string(&Locale::en),
                (((n as f64) / elapsed).round() as usize).to_formatted_string(&Locale::en)
            );
        }
        insert_fn(connection, &items);
    }
}

pub fn import_base_tables(connection: &mut SqliteConnection) {
    collect_into_db::<Author>(connection, "authors", |connection, authors| {
        diesel::insert_into(ol_authors::table)
            .values(authors)
            .execute(connection)
            .unwrap();
    });
    collect_into_db::<WorkIn>(connection, "works", |connection, works| {
        for work in works {
            let Some(authors) = work.authors.as_ref() else {
                continue;
            };
            for author in authors {
                if let Some(key_ref) = author.author.as_ref() {
                    diesel::insert_into(ol_work_authors::table)
                        .values(WorkAuthor {
                            work_key: work.key.clone(),
                            author_key: match key_ref.clone() {
                                AuthorKeyRef::KeyRef { key } => key,
                                AuthorKeyRef::Key(key) => key,
                            },
                        })
                        .execute(connection)
                        .unwrap();
                }
            }
        }
        diesel::insert_into(ol_works::table)
            .values(
                works
                    .into_iter()
                    .map(|work| WorkOut {
                        key: work.key.clone(),
                    })
                    .collect::<Vec<_>>(),
            )
            .execute(connection)
            .unwrap();
    });
    collect_into_db::<EditionIn>(connection, "editions", |connection, editions| {
        for edition in editions {
            diesel::insert_into(ol_editions_isbn_10::table)
                .values(
                    edition
                        .isbn_10
                        .as_ref()
                        .unwrap_or(&vec![])
                        .iter()
                        .map(|isbn| EditionIsbn10 {
                            edition_key: edition.key.clone(),
                            isbn_10: isbn.clone(),
                        })
                        .collect::<Vec<_>>(),
                )
                .execute(connection)
                .unwrap();
            diesel::insert_into(ol_editions_isbn_13::table)
                .values(
                    edition
                        .isbn_13
                        .as_ref()
                        .unwrap_or(&vec![])
                        .iter()
                        .map(|isbn| EditionIsbn13 {
                            edition_key: edition.key.clone(),
                            isbn_13: isbn.clone(),
                        })
                        .collect::<Vec<_>>(),
                )
                .execute(connection)
                .unwrap();
        }
        diesel::insert_into(ol_editions::table)
            .values(
                editions
                    .iter()
                    .map(|e| EditionOut {
                        key: e.key.clone(),
                        title: e.title.clone(),
                        number_of_pages: e.number_of_pages,
                        work_key: e
                            .works
                            .as_ref()
                            .map(|w| w.iter().nth(0))
                            .flatten()
                            .map(|r| r.key.clone()),
                    })
                    .collect::<Vec<_>>(),
            )
            .execute(connection)
            .unwrap();
    });

    connection
        .batch_execute(
            r#"
            CREATE INDEX ol_authors_key_idx ON ol_authors (key);
            CREATE INDEX ol_works_key_idx ON ol_works (key);
            CREATE INDEX ol_work_authors_work_key_idx ON ol_work_authors (work_key);
            CREATE INDEX ol_work_authors_author_key_idx ON ol_work_authors (author_key);
            CREATE INDEX ol_editions_key_idx ON ol_editions(key);
            CREATE INDEX ol_editions_title_idx ON ol_editions(title);
        "#,
        )
        .unwrap();
    println!("✅ indexes created");
}
