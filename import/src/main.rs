mod base_tables;
mod ratings;
mod schema;
mod search;
mod utils;

use base_tables::import_base_tables;
use diesel::{result::Error, Connection, SqliteConnection};
use dotenv::dotenv;
use ratings::import_ratings;
use search::populate_search_index;

#[tokio::main]
async fn main() {
    dotenv().ok();
    let mut connection =
        SqliteConnection::establish("ol.sqlite").expect("Error connecting to ol.sqlite");
    connection
        .transaction::<_, Error, _>(|connection| {
            import_base_tables(connection);
            import_ratings(connection);
            Ok(())
        })
        .unwrap();
    populate_search_index().await;
}
