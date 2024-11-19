use std::{collections::HashMap, io::BufRead};

use diesel::{ExpressionMethods, RunQueryDsl, SqliteConnection};

use crate::{schema::ol_works, utils::get_ol_dump_reader};

#[derive(Debug)]
struct RatingAcc {
    sum: u128,
    count: u16,
}

pub fn import_ratings(connection: &mut SqliteConnection) {
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
    let work_ratings = work_ratings_acc
        .into_iter()
        .map(|(key, acc)| (key, acc.sum as f32 / acc.count as f32));
    for (key, rating) in work_ratings {
        diesel::update(ol_works::table)
            .filter(ol_works::key.eq(&key))
            .set(ol_works::rating.eq(rating))
            .execute(connection)
            .unwrap();
    }
    println!("✅ ratings imported");
}
