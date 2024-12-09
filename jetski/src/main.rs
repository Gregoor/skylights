mod jetstream;

use dotenvy_macro::dotenv;
use jetstream::{
    event::{CommitEvent::*, JetstreamEvent::*},
    DefaultJetstreamEndpoints, JetstreamCompression, JetstreamConfig, JetstreamConnector,
};
use sqlx::{postgres::PgConnection, query, Connection};

async fn update_jetski_time(time: chrono::DateTime<chrono::Utc>) -> anyhow::Result<()> {
    let mut db = PgConnection::connect(dotenv!("POSTGRES_URL")).await?;
    query("INSERT INTO jetski_time (id, time) VALUES (42, $1) ON CONFLICT (id) DO UPDATE SET time = $1")
        .bind(time)
        .execute(&mut db)
        .await?;
    Ok(())
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let mut last_time = chrono::Utc::now();
    let config = JetstreamConfig {
        endpoint: DefaultJetstreamEndpoints::USEastOne.into(),
        wanted_collections: vec!["my.skylights.rel".into()],
        compression: JetstreamCompression::Zstd,
        // cursor: Some(last_time),
        ..Default::default()
    };

    let mut db = PgConnection::connect(dotenv!("POSTGRES_URL")).await?;
    println!("Connected to database");

    let receiver = JetstreamConnector::new(config)?.connect().await?;
    println!("Connected to Jetstream");
    while let Ok(event) = receiver.recv_async().await? {
        let time =
            chrono::DateTime::from_timestamp_millis((event.info().time_us / 1000) as i64).unwrap();
        let Commit(commit) = event else {
            if time.signed_duration_since(last_time).num_minutes() >= 2 {
                println!("Updating jetski_time to {:#?}", time);
                update_jetski_time(time).await?;
                last_time = time;
            }
            continue;
        };
        match commit {
            Create { info, commit } | Update { info, commit } => {
                println!("Create at {:#?}", time);
                query("INSERT INTO rels (did, key, value) VALUES ($1, $2, $3) ON CONFLICT (did, key) DO UPDATE SET value = $3")
                    .bind(info.did.to_string())
                    .bind(commit.info.rkey)
                    .bind(commit.record)
                    .execute(&mut db).await?;
            }
            Delete { info, commit } => {
                println!("Received delete event: {:#?}\n{:#?}", info, commit);
                query("DELETE FROM rels WHERE key = $1")
                    .bind(commit.rkey)
                    .execute(&mut db)
                    .await?;
            }
        }
    }
    Ok(())
}
