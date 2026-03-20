use std::path::Path;
use std::io::prelude::*;
use std::fs::File;
pub struct Playlist{
    playlist_name:String,
    songs: Vec<String>,
}


//converts a sql playlist file to a list of m3u files in the output path directory 
//where each playlist name is [playlist_name].m3u
pub async fn convert_playlists(database_path:&String, output_path:&String){
    let mut output_folder = output_path.clone();


    output_folder.push('/');
    let db =  match open_database(database_path).await{
        None => return,
        Some(v) => v,
    };
    let playlists = get_playlist_list(&db).await; 
    for playlist in playlists{
        let playlist_m3u = convert_playlist_to_m3u(&playlist);
        let mut playlist_filename = format!("{}.m3u",playlist.playlist_name.clone());
        playlist_filename = playlist_filename.replace("/", " ");
        
        let full_path: String= output_folder.clone() + playlist_filename.as_str(); 
        let playlist_path = Path::new(full_path.as_str());
        println!("{full_path}");
        write_to_file(playlist_path, &playlist_m3u);
        println!("{playlist_m3u}");
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
        out.push_str("\n#EXTINF\n");
        out+=&song;
    }
    return out;
}

async fn get_playlist_songs(db:&sqlite::Connection, id:&String)-> Vec<String>{
    //sql injection risk since id is only numbers as a string, but in theory someone 
    //could add invalid ids to sql file and cause drop table etc
    //but that would require access to database and at that point could drop table 
    //anyways 
    let query = format!("SELECT uri from tracks where playlist_id={id};");
    let mut out = Vec::new();
    let songs = select_from_db(db, &query);
    for s in songs{
        out.push(s[0].clone());
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
        for &(name, value) in pairs.iter() {
            println!("{} = {}", name, value.unwrap());
            val.push(value.unwrap().to_string());

        }       
        out.push(val);
        return true;
    }).unwrap();
    return out  
    
}

fn write_to_file(path:&Path, text:&String){
    let mut file = File::create(path).unwrap();
    let _ = file.write_all(text.as_bytes());
}


