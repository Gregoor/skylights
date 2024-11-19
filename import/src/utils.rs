use std::{
    env,
    fs::{self, File},
    io::BufReader,
    path::Path,
};

use flate2::read::GzDecoder;

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
