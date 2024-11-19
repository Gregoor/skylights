use std::{fs, io::Write, time::Instant};

use futures::StreamExt;
use num_format::{Locale, ToFormattedString};
use sqlx::{Connection, SqliteConnection};

#[derive(Debug, sqlx::FromRow)]
struct EditionWithAuthors {
    edition_key: String,
    title: String,
    rating: Option<f32>,
    authors: Option<String>,
}

#[derive(Debug, serde::Serialize)]
struct IndexItem {
    edition_key: String,
    title: String,
    rating: f32,
    authors: Vec<String>,
}

pub async fn populate_search_index() {
    let mut connection = SqliteConnection::connect("ol.sqlite").await.unwrap();
    let stream = sqlx::query_as::<_, EditionWithAuthors>(
        r#"
            SELECT
                e.key AS edition_key,
                e.title,
                w.rating,
                json_group_array(a."name") AS authors
            FROM ol_editions e
            LEFT JOIN ol_works w ON e.work_key = w."key"
            LEFT JOIN ol_work_authors wa ON e.work_key = wa.work_key
            LEFT JOIN ol_authors a ON wa.author_key = a."key"
            WHERE e.title IS NOT NULL
            GROUP BY e.key
        "#,
    )
    .fetch(&mut connection);

    // let start_at = Instant::now();
    // let mut n = 0;
    // let chunk_size = 10_000;
    // let mut chunks = stream.chunks(chunk_size);
    // while let Some(chunk) = chunks.next().await {
    //     let chunk = chunk
    //         .into_iter()
    //         .map(|r| {
    //             let r = r.unwrap();
    //             IndexItem {
    //                 edition_key: r.edition_key,
    //                 title: r.title,
    //                 rating: r.rating.unwrap_or(2.5),
    //                 authors: r
    //                     .authors
    //                     .map(|a| serde_json::from_str(&a).unwrap_or(vec![]))
    //                     .unwrap_or(vec![]),
    //             }
    //         })
    //         .collect::<Vec<_>>();
    //     let elapsed = start_at.elapsed().as_secs_f64();
    //     let count = n * chunk_size + chunk.len();
    //     println!(
    //         "🚀 #{} items in index at at {}/s",
    //         (count).to_formatted_string(&Locale::en),
    //         (((count as f64) / elapsed).round() as usize).to_formatted_string(&Locale::en)
    //     );
    //     n += 1;
    // }
    //

    // stream into gzipped ndjson file
    let start_at = Instant::now();
    let mut n = 0;
    let mut stream = stream;
    let mut writer = flate2::write::GzEncoder::new(
        fs::File::create("index.ndjson.gz").unwrap(),
        flate2::Compression::default(),
    );
    while let Some(row) = stream.next().await {
        let row = row.unwrap();
        let item = IndexItem {
            edition_key: row.edition_key,
            title: row.title,
            rating: row.rating.unwrap_or(2.5),
            authors: row
                .authors
                .map(|a| serde_json::from_str(&a).unwrap_or(vec![]))
                .unwrap_or(vec![]),
        };
        serde_json::to_writer(&mut writer, &item).unwrap();
        writer.write_all(b"\n").unwrap();
        n += 1;
        if n % 10_000 == 0 {
            let elapsed = start_at.elapsed().as_secs_f64();
            println!(
                "#{} items in index at {}/s",
                n.to_formatted_string(&Locale::en),
                (((n as f64) / elapsed).round() as usize).to_formatted_string(&Locale::en)
            );
        }
    }
}
