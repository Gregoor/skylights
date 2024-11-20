use std::time::Instant;

use tantivy::{
    collector::TopDocs, query::QueryParser, tokenizer::NgramTokenizer, DocAddress, Document, Index,
    ReloadPolicy, TantivyDocument,
};

use search::schema::get_schema_with_fields;

fn main() {
    let index = Index::open_in_dir("index").unwrap();
    index
        .tokenizers()
        .register("ngram3", NgramTokenizer::new(3, 3, false).unwrap());
    let reader = index
        .reader_builder()
        .reload_policy(ReloadPolicy::Manual)
        .try_into()
        .unwrap();
    let (schema, fields) = get_schema_with_fields();

    let mut query_parser = QueryParser::for_index(&index, vec![fields.title, fields.authors]);
    query_parser.set_conjunction_by_default();
    // query_parser.set_field_fuzzy(fields.title, false, 1, true);
    // query_parser.set_field_fuzzy(fields.authors, false, 1, true);
    let query = query_parser.parse_query("exhalation").unwrap();

    let searcher = reader.searcher();
    let top_by_rating = TopDocs::with_limit(20).order_by_fast_field("rating", tantivy::Order::Desc);

    let start_at = Instant::now();
    let docs: Vec<(f64, DocAddress)> = searcher.search(&query, &top_by_rating).unwrap();

    for (_score, doc_address) in docs {
        let retrieved_doc: TantivyDocument = searcher.doc(doc_address).unwrap();
        println!("{}", retrieved_doc.to_json(&schema));
    }

    println!("Search took {:?}", start_at.elapsed());
}
