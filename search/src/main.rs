mod schema;
mod utils;

use std::{collections::HashMap, fs, io::BufRead};

use serde::Deserialize;
use tantivy::{doc, tokenizer::NgramTokenizer, Index, IndexWriter, TantivyDocument};

use crate::{
    schema::get_schema_with_fields,
    utils::{get_ol_dump_reader, process_file},
};

#[derive(Debug, Deserialize)]
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
struct Work {
    key: String,
    authors: Option<Vec<AuthorRef>>,
}

#[derive(Debug, Deserialize)]
struct KeyRef {
    key: String,
}

#[derive(Debug, Deserialize)]
struct Edition {
    key: String,
    title: Option<String>,
    number_of_pages: Option<i32>,
    works: Option<Vec<KeyRef>>,
    isbn_10: Option<Vec<String>>,
    isbn_13: Option<Vec<String>>,
}

#[derive(Debug)]
struct RatingAcc {
    sum: u128,
    count: u16,
}

fn process_authors() -> HashMap<String, String> {
    let mut authors = HashMap::new();
    for author in process_file::<Author>("authors") {
        if let Some(name) = author.name.clone() {
            authors.insert(author.key.to_string(), name);
        }
    }
    authors
}

fn process_work_authors() -> HashMap<String, Vec<String>> {
    let authors = process_authors();
    let mut work_authors = HashMap::new();
    for work in process_file::<Work>("works") {
        let Some(w_authors) = work.authors.as_ref() else {
            continue;
        };
        work_authors.insert(
            work.key,
            w_authors
                .iter()
                .filter_map(|author| {
                    author
                        .author
                        .as_ref()
                        .map(|key_ref| {
                            let key = match key_ref.clone() {
                                AuthorKeyRef::KeyRef { key } => key,
                                AuthorKeyRef::Key(key) => key,
                            };
                            authors.get(&key)
                        })
                        .flatten()
                        .cloned()
                })
                .collect::<Vec<String>>(),
        );
    }
    work_authors
}

fn process_ratings() -> HashMap<String, f32> {
    let mut work_ratings_acc = HashMap::<String, RatingAcc>::new();
    for line in get_ol_dump_reader("ratings").lines() {
        let Ok(line) = line else {
            continue;
        };
        let cols: Vec<&str> = line.split("\t").collect();
        let work_key = cols.get(0).expect("Missing work key");
        let rating = cols
            .get(2)
            .expect("Missing rating")
            .parse::<i8>()
            .expect("non integer rating");
        if work_key.len() == 0 {
            continue;
        }
        work_ratings_acc
            .entry(work_key.to_string())
            .and_modify(|acc| {
                acc.sum += rating as u128;
                acc.count += 1;
            })
            .or_insert(RatingAcc {
                sum: rating as u128,
                count: 1,
            });
    }
    work_ratings_acc
        .into_iter()
        .map(|(key, acc)| (key, acc.sum as f32 / acc.count as f32))
        .collect::<HashMap<_, _>>()
}

fn main() {
    let work_authors = process_work_authors();
    let ratings = process_ratings();

    let (schema, fields) = get_schema_with_fields();

    if fs::metadata("index").is_ok() {
        fs::remove_dir_all("index").unwrap();
    }
    fs::create_dir_all("index").unwrap();
    let index = Index::create_in_dir("index", schema).unwrap();
    index
        .tokenizers()
        .register("ngram3", NgramTokenizer::new(3, 3, false).unwrap());

    let mut index_writer: IndexWriter = index.writer(1_000_000_000).unwrap();

    for edition in process_file::<Edition>("editions") {
        let Some(title) = edition.title.as_ref() else {
            continue;
        };

        let mut doc = TantivyDocument::new();
        if let Some(work_key) = edition.works.as_ref().and_then(|works| works.first()) {
            doc.add_text(fields.work_key, &work_key.key);
            for author in work_authors.get(&work_key.key).unwrap_or(&vec![]) {
                doc.add_text(fields.authors, author);
            }
        }
        doc.add_text(fields.edition_key, &edition.key);
        doc.add_text(fields.title, title);
        if let Some(rating) = ratings.get(&edition.key) {
            doc.add_f64(fields.rating, *rating as f64);
        }
        for isbn in edition.isbn_10.as_ref().unwrap_or(&vec![]) {
            doc.add_text(fields.isbn_10, isbn);
        }
        for isbn in edition.isbn_13.as_ref().unwrap_or(&vec![]) {
            doc.add_text(fields.isbn_13, isbn);
        }

        index_writer.add_document(doc).unwrap();
    }
    index_writer.commit().unwrap();
}
