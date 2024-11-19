// @generated automatically by Diesel CLI.

diesel::table! {
    ol_authors (rowid) {
        rowid -> Integer,
        key -> Text,
        name -> Nullable<Text>,
    }
}

diesel::table! {
    ol_editions (rowid) {
        rowid -> Integer,
        key -> Text,
        title -> Nullable<Text>,
        number_of_pages -> Nullable<Integer>,
        work_key -> Nullable<Text>,
    }
}

diesel::table! {
    ol_editions_isbn_10 (rowid) {
        rowid -> Integer,
        edition_key -> Text,
        isbn_10 -> Text,
    }
}

diesel::table! {
    ol_editions_isbn_13 (rowid) {
        rowid -> Integer,
        edition_key -> Text,
        isbn_13 -> Text,
    }
}

diesel::table! {
    ol_work_authors (rowid) {
        rowid -> Integer,
        work_key -> Text,
        author_key -> Text,
    }
}

diesel::table! {
    ol_works (rowid) {
        rowid -> Integer,
        key -> Text,
        rating -> Nullable<Float>,
    }
}

diesel::allow_tables_to_appear_in_same_query!(
    ol_authors,
    ol_editions,
    ol_editions_isbn_10,
    ol_editions_isbn_13,
    ol_work_authors,
    ol_works,
);
