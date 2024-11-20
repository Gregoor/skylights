use std::{
    env,
    fs::{self, File},
    io::{BufRead, BufReader},
    iter,
    path::Path,
    time::Instant,
};

use flate2::read::GzDecoder;
use num_format::{Locale, ToFormattedString};
use serde::de::DeserializeOwned;

pub fn get_ol_dump_reader(file_key: &str) -> BufReader<GzDecoder<File>> {
    let args: Vec<String> = env::args().collect();
    let dump_dir = &args.get(1).expect("Missing dump directory");
    let dump_path = Path::new(dump_dir);

    let entry = fs::read_dir(dump_path)
        .expect("Failed to read dump directory")
        .filter_map(|entry| entry.ok())
        .find(|entry| {
            let name = entry.file_name();
            let name = name.to_string_lossy();
            entry.metadata().map(|m| m.is_file()).unwrap_or(false)
                && name.starts_with(format!("ol_dump_{}_", file_key).as_str())
                && name.ends_with(".txt.gz")
        })
        .unwrap();

    let file = File::open(entry.path()).unwrap();
    BufReader::new(GzDecoder::new(file))
}

pub fn maybe_print_progress(key: &str, n: i64, start_at: Instant) {
    if n % 0x1000 == 0 {
        let elapsed = start_at.elapsed().as_secs_f64();
        println!(
            "{} #{} at {}/s",
            key,
            n.to_formatted_string(&Locale::en),
            (((n as f64) / elapsed).round() as usize).to_formatted_string(&Locale::en)
        );
    }
}

pub fn process_file<T>(file_key: &str) -> impl Iterator<Item = T> + '_
where
    T: std::fmt::Debug + Send + Sync + DeserializeOwned + 'static,
{
    let mut iter = get_ol_dump_reader(&file_key).lines().map(|line_result| {
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
    });

    let start_at = Instant::now();
    let mut n: i64 = 0;
    return iter::from_fn(move || {
        maybe_print_progress(file_key, n, start_at);
        n += 1;
        return iter.next();
    });
}
