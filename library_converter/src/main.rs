mod playlist_converter;
mod library_converter;
mod utils;
use clap::Parser;

use playlist_converter::convert_playlists;
use library_converter::{convert_library, remove_leftover_files, count_missing, run_coverter_loop, run_converter_indefinately, sync_playlist_libaries};
use utils::remove_last_n_characters;

/// A music library helper tool. It can convert a music library from flac to mp3 allowing for 2
/// libraries 2 exist in sync with the same music files, also supports automatic playlist importing
/// from sqlite database to a m3u, and converting library will also convert the playlists in m3u format.
/// uses ffmpeg to achieve music file converting and getting metadata from music files.
#[derive(Parser,Debug)]
#[command(version,about,long_about=None)]
struct Args {
    /// Mode for the program to operate in, valid options are, convert, removeLeftover, count,
    /// playlist, convert_loop, infinite_convert, both, save_config, sync_playlist_libaries
    #[arg(short,long, default_value_t = String::from("both"))]
    mode: String,
    /// Verbose - boolean, print more information as program is running
    #[arg(short,long, default_value_t=false)]
    verbose: bool,
    /// Location of music library containing the original files
    #[arg(short,long, default_value_t=String::from("/mnt/Data/Music/Library/"))]
    uncompressed_path : String,
    /// Location of the folder containing where the compressed files are/ should be outputed 
    #[arg(short,long, default_value_t=String::from("/mnt/Data/mp3Lib/"))]
    compressed_path: String,
    /// Location for the config file path
    #[arg(long, default_value_t=String::from("/home/eli/.config/library_converter"))]
    config_path:String,
    /// Location of database containing playlist information in sqlite format, only needed for
    /// playlist mode
    #[arg(short,long, default_value_t=String::from("/home/eli/.local/share/lollypop/playlists.db"))]
    playlist_database_path:String,
    /// For playlist mode, have relative paths in the resulting m3u files for the output location
    #[arg(long, default_value_t=true)]
    use_relative_paths : bool,
    /// Output location for generated playlists
    #[arg(short,long,default_value_t=String::from("."))]
    output_location:String,
    /// Also copy generated playlist to the uncompressed library location after playlists are
    /// created
    #[arg(long,default_value_t=false)]
    sync_generated_playlists:bool,
}


//async fn music_converter(uncompressed_path:&String, compressed_path:&String,mode:&String, verbose:bool){
async fn music_converter(args:Args){
    match args.mode.as_str(){
        "convert" => convert_library(&args.uncompressed_path,&args.compressed_path,args.verbose),
        "leftover" => remove_leftover_files(&args.uncompressed_path, &args.compressed_path, args.verbose), 
        "count" => count_missing(&args.uncompressed_path, &args.compressed_path),
        "both" => {
            convert_library(&args.uncompressed_path,&args.compressed_path,args.verbose);
            remove_leftover_files(&args.uncompressed_path, &args.compressed_path, args.verbose)
        },
        "convert_loop" => run_coverter_loop(args.uncompressed_path.to_string(), args.compressed_path.to_string(), args.verbose),
        "infinite_convert" =>  run_converter_indefinately(&args.uncompressed_path, &args.compressed_path, args.verbose, None),
        "playlist" => {
            convert_playlists(&args.playlist_database_path, &args.output_location,args.use_relative_paths).await;
            if args.sync_generated_playlists{
                convert_library(&args.uncompressed_path, &args.compressed_path, args.verbose);
            }
            
        },
        "sync_playlist_libaries" => sync_playlist_libaries(&args.uncompressed_path, &args.compressed_path),
        _ => {
            println!("Invalid mode: {}", args.mode);
            println!("Vaid modes are convert_loop,both,count,leftover,convert,infinite_convert,sync_playlist_libaries");
            return;
            }
        }
}
#[tokio::main]
async fn main() {
    let args = Args::parse();
    music_converter(args).await;
}

