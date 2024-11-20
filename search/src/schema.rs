use tantivy::schema::{
    Field, IndexRecordOption, Schema, TextFieldIndexing, TextOptions, FAST, STORED, TEXT,
};

pub struct SchemaFields {
    pub edition_key: Field,
    pub work_key: Field,
    pub title: Field,
    pub rating: Field,
    pub authors: Field,
    pub isbn_10: Field,
    pub isbn_13: Field,
}

pub fn get_schema_with_fields() -> (Schema, SchemaFields) {
    let mut builder = Schema::builder();
    let text_field_indexing = TextFieldIndexing::default()
        .set_tokenizer("ngram3")
        .set_index_option(IndexRecordOption::WithFreqsAndPositions);
    let text_options = TextOptions::default()
        .set_indexing_options(text_field_indexing)
        .set_stored();
    let fields = SchemaFields {
        edition_key: builder.add_text_field("edition_key", STORED),
        work_key: builder.add_text_field("work_key", TEXT | STORED),
        title: builder.add_text_field("title", text_options.clone()),
        rating: builder.add_f64_field("rating", STORED | FAST),
        authors: builder.add_text_field("authors", text_options),
        isbn_10: builder.add_text_field("isbn_10", TEXT | STORED),
        isbn_13: builder.add_text_field("isbn_13", TEXT | STORED),
    };
    (builder.build(), fields)
}
