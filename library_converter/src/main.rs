mod playlist_converter;
mod library_converter;
mod utils;
use std::env;

use playlist_converter::convert_playlists;
use library_converter::{convert_library, remove_leftover_files, count_missing, run_coverter_loop, run_converter_indefinately};

async fn music_converter(uncompressed_path:&String, compressed_path:&String,mode:&String, verbose:bool){
    if mode == "convert"{
        convert_library(&uncompressed_path,&compressed_path,verbose);
    }
    else if mode == "leftover"{
        remove_leftover_files(&uncompressed_path, &compressed_path, verbose)
    }
    else if mode == "count"{
        count_missing(&uncompressed_path, &compressed_path);
        return;
    }
    else if mode=="both"{
        convert_library(&uncompressed_path,&compressed_path,verbose);
        remove_leftover_files(&uncompressed_path, &compressed_path, verbose)
    }
    else if mode=="convert_loop"{
        run_coverter_loop(uncompressed_path.to_string(), compressed_path.to_string(), verbose);
    }
    else if mode=="infinite_convert"{
        run_converter_indefinately(uncompressed_path, compressed_path, verbose, None);
    }
    else if mode=="playlist"{
        let relative_paths= true;
        convert_playlists(uncompressed_path, compressed_path,relative_paths).await;
    }
    else{
        println!("Invalid mode: {mode}");
        println!("Vaid modes are convert_loop,both,count,leftover,convert,infinite_convert");
        return;
    }
    println!("Success");
}
#[tokio::main]
async fn main() {
    let args: Vec<String> = env::args().collect();
    let mut uncompressed_path= &String::from("/mnt/Data/Music/Library/");
    let mut compressed_path = &String::from("/mnt/Data/mp3Lib/");
    let mut verbose = false;
    let mut mode = &String::from("both");
    if args.len() == 5 {
        uncompressed_path = &args[1];
        compressed_path = &args[2];
        mode = &args[3];
        verbose = &args[4] == "true";
    }
    else if args.len() == 2 {
        mode = &args[1];
    }
    else if args.len() == 3 {
        mode = &args[1];
        verbose = &args[2] == "true";
    }
    else if args.len() == 4 {
        uncompressed_path = &args[1];
        compressed_path = &args[2];
        mode = &args[3];       
    }
    music_converter(&uncompressed_path, &compressed_path,&mode, verbose).await;
}

