use std::num::ParseFloatError;
use std::path::{absolute, Path};
use std::process::Command;
use crate::utils::{self, is_flac_file};

pub struct Playlist{
    playlist_name:String,
    songs: Vec<Song>,
}
#[derive(Clone)]
pub struct Song{
    path:String,
    title:Option<String>,
    length:Option<i32>, //seconds
    artist:Option<String>,
    album:Option<String>,
    genre:Option<String>,
}



//converts a sql playlist file to a list of m3u files in the output path directory 
//where each playlist name is [playlist_name].m3u
pub async fn convert_playlists(database_path:&String, output_path:&String, relative_paths:bool){
    println!("{}",database_path);
    let database_path = make_path_absolute(database_path);
    let output_path = make_path_absolute(output_path);
    let mut output_folder = output_path.clone();


    output_folder.push('/');
    let db =  match open_database(&database_path).await{
        None => return,
        Some(v) => v,
    };
    let playlists = get_playlist_list(&db).await; 
    for mut playlist in playlists{
        if relative_paths{
            playlist.songs=convert_song_paths_to_relative(&playlist.songs, &output_path);
        }
        let playlist_m3u = convert_playlist_to_m3u(&playlist);
        let mut playlist_filename = format!("{}.m3u",playlist.playlist_name.clone());
        playlist_filename = playlist_filename.replace("/", " ");
        
        let full_path: String= output_folder.clone() + playlist_filename.as_str(); 
        let playlist_path = Path::new(full_path.as_str());
        //println!("{full_path}");
        utils::write_to_file(playlist_path, &playlist_m3u);
        //println!("{playlist_m3u}");
    }

}



async fn get_playlist_list(db:&sqlite::Connection)->Vec<Playlist>{
    let query = String::from("SELECT id,name from playlists;");
    let playlist_vec = select_from_db(db, &query);
    let mut playlists = Vec::new();
    for p in playlist_vec {
        let songs= get_playlist_songs(db, &p[0]).await;
        let playlist= Playlist {playlist_name: p[1].clone(), songs};
        playlists.push(playlist);
    }
    return playlists
    
}
//returns string containing m3u file 
fn convert_playlist_to_m3u(playlist:&Playlist)->String{
    let mut out=String::from("#EXTM3U");
    for song in playlist.songs.clone(){
        let header = format!("\n#EXTINF{}\n",get_m3u_song_metadata(&song));
        //println!("{header}");
        out+=&header;
        //out.push_str("\n#EXTINF\n");
        out+=&song.path;
    }
    return out;
}

async fn get_playlist_songs(db:&sqlite::Connection, id:&String)-> Vec<Song>{
    //sql injection risk since id is only numbers as a string, but in theory someone 
    //could add invalid ids to sql file and cause drop table etc
    //but that would require access to database and at that point could drop table 
    //anyways 
    let query = format!("SELECT uri from tracks where playlist_id={id};");
    let mut out = Vec::new();
    let songs = select_from_db(db, &query);
    for s in songs{
        //make sure path is relative and a file path not a uri path
        out.push(create_song_object_from_path(&utils::clean_file_path(&s[0])));
        //out.push(utils::clean_file_path(&s[0]));
    }
    return out;
}

async fn open_database(database_path:&String)->Option<sqlite::Connection> {
    let db = sqlite::open(database_path);
    match db {
        Err(e) => {
            println!("Error in opening database {database_path}: {e:?}");
            return None;
        },
        Ok(v) => return Some(v),
    }
}


fn select_from_db(db:&sqlite::Connection, query:&String) ->Vec<Vec<String>> {
    let mut out = Vec::new();
    db.iterate(query, |pairs| {
        let mut val = Vec::new();
        for &(_name, value) in pairs.iter() {
            //println!("{} = {}", name, value.unwrap());
            val.push(value.unwrap().to_string());

        }       
        out.push(val);
        return true;
    }).unwrap();
    return out  
    
}


pub fn convert_flac_playlist_to_mp3(playlist_path:&String, flac_folder_path:&String, mp3_folder_path:&String)->String{

    let text = utils::read_from_file(Path::new(playlist_path));
    let lines = text.lines();
    let mut output_text =String::from("");
    for line in lines{
        if line.starts_with('#'){
            output_text+=line;
        }
        else{
            output_text+=&convert_path_to_mp3_folder(&line.trim().to_string(),flac_folder_path,mp3_folder_path);
        }
        output_text+="\n";
    }
    return output_text;
    
    //let mut playlist =read_m3u_file(Path::new(playlist_path));
    
    //playlist.songs = convert_playlist_songs_to_mp3_folder(&playlist.songs, flac_folder_path, mp3_folder_path);
    //return convert_playlist_to_m3u(&playlist);
}
fn convert_path_to_mp3_folder(path:&String, flac_folder_path:&String,mp3_folder_path:&String) -> String{
    let mut mp3_path = path.clone();
    if is_flac_file(&mp3_path){
        mp3_path = utils::flac_to_mp3(mp3_path);
    }
    mp3_path = utils::replace_file_prefix(&mp3_path, flac_folder_path,mp3_folder_path);
    return mp3_path;

}

fn convert_song_paths_to_relative(songs:&Vec<Song>, relative_path:&String)->Vec<Song>{
    let mut out:Vec<Song> = Vec::new();
    for song in songs{
        let mut s = song.clone();
        s.path = convert_path_to_relative(&s.path, relative_path);
        //out.push(convert_path_to_relative(&path,&relative_path));
        out.push(song.clone());
    }
    return out;
}
//assumes path is absolute if it is relative returns path 
fn convert_path_to_relative(path:&String, relative_path_location:&String)->String{
    if !path.starts_with("/"){
        return path.clone();
    }
    let mut out = String::from(".");
    let path_parts :Vec<&str>= path.split("/").collect();
    let relative_path_parts :Vec<&str> = relative_path_location.split("/").collect();
    let mut index1=0;
    let mut index2=0;
    while path_parts.get(index1).unwrap() == relative_path_parts.get(index2).unwrap(){
        index1+=1;
        index2+=1;
        if index1 >= path_parts.len() || index2 >= relative_path_parts.len(){
            break;
        }
    }
    while index2 < relative_path_parts.len(){
        out += &String::from("/.."); 
        index2+=1;
    }
    while index1 < path_parts.len(){
        out +=&format!("/{}",  path_parts.get(index1).unwrap()); 
        index1+=1;
    }
    return out;
}

fn make_path_absolute(path:&String) -> String{
    let absolute_path = absolute(path).unwrap();
    let absolute_string = absolute_path.into_os_string().into_string().unwrap();
    return absolute_string;
}

fn get_m3u_song_metadata(song:&Song)->String{
    let mut out=String::from(":");
    if song.length != None{
        out+=&song.length.unwrap().to_string();

    }
    out+=", ";
    if song.artist != None{
        out+=&song.artist.clone().unwrap();
    }
    out+= " - ";
    if song.title != None{
        out+=&song.title.clone().unwrap();
    }
    if song.genre != None{
        out+=", Genre:";
        out+=&song.genre.clone().unwrap();
    }
    if song.album != None{
        out+=", Album:";
        out+=&song.album.clone().unwrap();
    }
    //println!("{out}");
    return out;
}

fn create_song_object_from_path(path:&String) -> Song{
    //println!("{path}");
    let command_output = Command::new("ffprobe")
        .arg(path.as_str())
        .arg("-of")
        .arg("json")
        .arg("-show_entries")
        .arg("format_tags=ALBUM,TITLE,GENRE,ARTIST:format=duration")
        .output()
        .expect("Failed to get song information");
    let output_string= String::from_utf8(command_output.stdout).unwrap();
    //println!("command output as string:{}",output_string);
    let json : serde_json::Value= serde_json::from_str(&output_string).expect("JSON from ffprobe was not formatted properly");
    let format: serde_json::Value;
    match json.get("format"){
        Some(v) => {
            format=v.clone();
        },
        None => {
            return Song{path:path.clone(), title:None, length:None, artist:None, album:None, genre:None};
        }
    }
    let length:Option<i32> = match format.get("duration"){
        Some(v) => convert_string_float_to_i32(&remove_quotes(&v.to_string()).to_string()),
        None => None,
    };
    let tags = match format.get("tags"){
        Some(v) =>v,
        None => {return Song{path:path.to_string(), title:None, length, artist:None,album:None,genre:None};}
    };
    let title=read_json_field(tags, "TITLE");
    let artist=read_json_field(tags, "ARTIST");
    let genre=read_json_field(tags, "GENRE");
    let album=read_json_field(tags, "ALBUM");
    return Song{path:path.to_string(), title, length, artist,album, genre };
}

fn read_json_field(json:&serde_json::Value, field:&str)-> Option<String>{
    match json.get(field){
        Some(v) =>return Some(remove_quotes(&v.to_string())),
        None => return None,
    }
}
fn convert_string_float_to_i32(str:&String) -> Option<i32>{
    let f:Result<f32, ParseFloatError> = str.parse();
    match f {
        Ok(f) => {
            return Some(f as i32);
        }
        Err(..) =>{
            return None;
        }
    }
}

fn remove_quotes(str:&String)->String{
    if !str.starts_with("\"") || !str.ends_with("\""){
        return str.clone();
    }
    else{
        let mut chars = str.chars();
        chars.next();
        chars.next_back();
        return chars.as_str().to_string();
    }


}

