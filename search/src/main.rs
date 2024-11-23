mod utils;

use std::{collections::HashMap, fs, io::BufRead, time::Duration};

use itertools::Itertools;
use serde::{Deserialize, Serialize};

use crate::utils::{get_ol_dump_reader, process_file};

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

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let work_authors = process_work_authors();
    let ratings = process_ratings();

    let client = meilisearch_sdk::client::Client::new(
        "http://0.0.0.0:7700",
        Some("e4aff46be7573a52e6c7869e8504396a8fe9a6a3869d7838a9ea88a893ef0bbe"),
    )
    .unwrap();
    if let Some(index) = client
        .list_all_indexes()
        .await
        .unwrap()
        .results
        .iter()
        .find(|index| index.uid == "open-library")
        .cloned()
    {
        index
            .delete()
            .await
            .unwrap()
            .wait_for_completion(&client, None, None)
            .await
            .unwrap();
    }
    let index_task = client
        .create_index("open-library", None)
        .await
        .unwrap()
        .wait_for_completion(&client, None, None)
        .await
        .unwrap();
    let index = index_task.try_make_index(&client).unwrap();
    index
        .set_sortable_attributes(["rating"])
        .await
        .unwrap()
        .wait_for_completion(&client, None, None)
        .await
        .unwrap();
    index
        .set_filterable_attributes(["edition_key", "work_key", "isbn_10", "isbn_13"])
        .await
        .unwrap()
        .wait_for_completion(&client, None, None)
        .await
        .unwrap();
    index
        .set_searchable_attributes(["title", "authors"])
        .await
        .unwrap()
        .wait_for_completion(&client, None, None)
        .await
        .unwrap();

    // at 500k
    // batched
    // 25k/25k => 9.5k/s
    // 50k/25k => 10k/s
    // 50k/50k => 13k/s
    // 100k/100k => 16k/s
    // not batched
    // 50k => 13k/s
    // 100k => 18k/s
    // 250k => 19k/s
    for editions in &process_file::<Edition>("editions").chunks(250_000) {
        #[derive(Debug, Serialize)]
        struct Book {
            edition_key: String,
            title: String,
            work_key: Option<String>,
            authors: Vec<String>,
            rating: Option<f32>,
            isbn_10: Vec<String>,
            isbn_13: Vec<String>,
        }
        let editions: Vec<Book> = editions
            .into_iter()
            .filter_map(|edition| {
                let Some(title) = edition.title.as_ref() else {
                    return None;
                };
                let work_key = edition
                    .works
                    .as_ref()
                    .and_then(|works| works.first().map(|key| key.key.clone()));
                Some(Book {
                    edition_key: edition.key.split("/").last().unwrap().to_string(),
                    title: title.into(),
                    work_key: work_key
                        .clone()
                        .map(|k| k.split("/").last().map(str::to_string))
                        .flatten(),
                    authors: work_key
                        .as_ref()
                        .map(|key| work_authors.get(key))
                        .flatten()
                        .unwrap_or(&vec![])
                        .clone(),
                    rating: work_key.and_then(|key| ratings.get(&key).cloned()),
                    isbn_10: edition.isbn_10.clone().unwrap_or_default(),
                    isbn_13: edition.isbn_13.clone().unwrap_or_default(),
                })
            })
            .collect();

        index
            .add_documents(editions.as_slice(), Some("edition_key"))
            .await
            .unwrap()
            .wait_for_completion(
                &client,
                Some(Duration::from_millis(500)),
                Some(Duration::from_secs(3600)),
            )
            .await
            .unwrap();
        // futures::future::join_all(tasks.into_iter().map(|t| {
        //     t.wait_for_completion(
        //         &client,
        //         Some(Duration::from_secs(1)),
        //         Some(Duration::from_secs(360)),
        //     )
        // }))
        // .await
        // .into_iter()
        // .for_each(|r| {
        //     r.unwrap();
        // });
    }
}
