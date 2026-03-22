use std::fs::read_to_string;
use url::Url;
use std::fs::File;
use std::path::Path;
use std::io::prelude::*;

//assumes file str ends in .mp3 doesn't check
pub fn mp3_to_flac(str:String) -> String{
    let prefix_rev :String = str.chars().rev().skip(4).collect();
    let  prefix :String = prefix_rev.chars().rev().collect();
    let out = prefix + ".flac";
    return out;
}

pub fn flac_to_mp3(str:String) -> String{
    let prefix_rev :String = str.chars().rev().skip(5).collect();
    let  prefix :String = prefix_rev.chars().rev().collect();
    let out = prefix + ".mp3";
    return out;
}

pub fn replace_file_prefix(path:&String,input_path_prefix:&String, output_path_prefix:&String)->String{
    //if path is a full file path starting from / will check if starts with input_path_prefix 
    //if it does it replaces the start with output_path_prefix
    if path.starts_with(input_path_prefix){
        let new_path = output_path_prefix.clone() + path.get(input_path_prefix.len()..).expect("Substring in replace_file prefix throw exception");
        return new_path;
    }
    return path.to_string();
}


//removes prefix from all strings in v
//doesn't check if elements start with prefix or are long enough 
pub fn remove_prefix(v :Vec<String>, prefix:&String) -> Vec<String>{
    let mut out = Vec::new();
    for elem in v {
        let converted = elem.chars().skip(prefix.len()).collect();
        out.push(converted);
    }
    return out;
}


//returns true if file ends in .m3u
//false if not 
pub fn is_m3u_file(file:&String)-> bool{
    if file.len() < 4{
        return false
    }
    let ending_indicies = file.char_indices().nth_back(3).unwrap().0;
    let ending = &file[ending_indicies..];
    return ending==".m3u"; 
}
pub fn is_flac_file(file:&String) -> bool{
    if file.len()<5{
        return false
    }
    let ending_indicies = file.char_indices().nth_back(4).unwrap().0;
    let ending = &file[ending_indicies..];
    println!("{ending}");
    return ending == ".flac";
}



pub fn read_from_file(path:&Path)->String{
    let contents = read_to_string(path).expect("Error in reading file");
    return contents;
}

pub fn write_to_file(path:&Path, text:&String){
    let mut file = File::create(path).unwrap();
    let _ = file.write_all(text.as_bytes());
}



pub fn clean_file_path(path:&String)->String{
    if path.starts_with("file://"){
        let url = Url::parse(path).unwrap();
        let p = url.to_file_path().unwrap();
        return String::from(p.to_string_lossy());
    }
    return path.to_string();
}


