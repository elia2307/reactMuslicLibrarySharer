use std::path::Path;
use std::fs;
use std::fs::create_dir_all;
use std::fs::read_dir;
use std::process::Command;

fn file_tree(path:&String, sorted:bool, include_hidden:bool)-> Option<Vec<String>>{

    let mut vec = Vec::new();
    let mut directories = Vec::new();
    directories.push(Path::new(&path).to_path_buf());
    while directories.len() != 0 { 
        let files = read_dir(&directories.remove(0)).unwrap();
        for file in files{
            let f = file.unwrap();
            let file_path = f.path().to_str()?.to_string();
            if !include_hidden{
                if f.file_name().to_str()?.chars().nth(0).unwrap() == '.'{
                    continue;
                }
            }
            if f.file_type().unwrap().is_dir(){
                directories.push(f.path());
            }
            else{
                vec.push(file_path);
            }
        }
    }
    if sorted{
        vec.sort()
    }

    return Some(vec)
}


fn clean_flac_file(str:String) -> String{
    if str.len() < 5{
        return str;
    }
    let ending_indicies = str.char_indices().nth_back(4).unwrap().0;
    let ending = &str[ending_indicies..];

    //let ending:String = str.chars().skip(str.len()-5).collect();
    if ending == ".flac"{
        //let prefix  :String = str.chars().take(str.len()-5).collect();
        let prefix_rev :String = str.chars().rev().skip(5).collect();
        let  prefix :String = prefix_rev.chars().rev().collect();
        let out = prefix + ".mp3";
        return out;
    }
    return str;
}
//assumes file str ends in .mp3 doesn't check
fn mp3_to_flac(str:String) -> String{
    let prefix_rev :String = str.chars().rev().skip(4).collect();
    let  prefix :String = prefix_rev.chars().rev().collect();
    let out = prefix + ".flac";
    return out;
}
//removes prefix from all strings in v
//doesn't check if elements start with prefix or are long enough 
fn remove_prefix(v :Vec<String>, prefix:String) -> Vec<String>{
    let mut out = Vec::new();
    for elem in v {
        let converted = elem.chars().skip(prefix.len()).collect();
        out.push(converted);
    }
    return out;
}

//takes 2 sorted vectors finds elements from full_vec not in missing_vec
//however will convert files in full_vec flac to mp3 in missing vec, 1.flac is same as 1.mp3
fn find_missing(full_vec:Vec<String>,missing_vec:Vec<String>)-> Vec<String>{
    let mut out = Vec::new();
    let mut missing_index =0;

    for elem in full_vec {
        while  missing_index < missing_vec.len() && elem >  missing_vec[missing_index] {
            missing_index+=1;
        }
        if  missing_index >=  missing_vec.len() {
            out.push(elem);
            continue;
        }
        else if elem == missing_vec[missing_index] {
            missing_index +=1;
        }
        else{
            out.push(elem);
        }
    }

    return out
}

fn get_uncompressed_file_list(path:&String) -> Vec<String>{
    let list = remove_prefix(file_tree(path, false,false).unwrap(),path.to_string());
    let mut files: Vec<String> = list.iter().map(|str| clean_flac_file(str.to_string())).collect();
    files.sort();
    return files;
}

fn  move_and_convert_files(input_path:String, output_path:String, files:Vec<String>){
    //for file in files
    //check if parent directory exists in output path 
    //e.g. files[2] is a/b/c/s and outputPath doesn't have a folder a/b/c/s inside of it 
    //make sure it exists
    //then if file  exists in input path then copy it to output path
    //if doesn't exist then replace suffic with .flac and run ffmpeg to convert to mp3 
    //inside correct folder
    for file in files {
        let full_path_str :String = output_path.clone() + file.as_str();
        let path = Path::new(full_path_str.as_str()); 
        let _ = create_dir_all(path.parent().unwrap());

        let mut original_path_str = input_path.clone() + file.as_str();
        if fs::exists(&original_path_str).unwrap(){
            let p = Path::new(original_path_str.as_str());
            let _ = std::fs::copy(p, path);
        }
        else{
            original_path_str= mp3_to_flac(original_path_str);
            let _original_path = Path::new(original_path_str.as_str());
            let args = ["-i",&original_path_str,"-acodec","libmp3lame",&full_path_str];
            //let args = format_args!("-i '{}' -acodec libmp3lame '{}'",original_path,path);
            let mut output = Command::new("ffmpeg")
                .args(args).spawn().unwrap() ;
            let out = output.wait().unwrap();
            println!("{out}");

        }
        
        

    }
    return;
}

fn main() {
    let uncompressed_path:String = String::from("/mnt/Data/Music/Library/");
    let compressed_library_path = String::from("/mnt/Data/mp3Lib/");
    let compressed_files = remove_prefix(file_tree(&compressed_library_path,true,false).unwrap(), compressed_library_path.clone());
    let uncompressed_files = get_uncompressed_file_list(&uncompressed_path);
    

    let missing_files = find_missing(uncompressed_files,compressed_files);
    println!("Number of missing files {}",missing_files.len());
    move_and_convert_files(uncompressed_path, compressed_library_path, missing_files)
    //some files in missing_files e.g. 01.mp3 could be 01.flac or 01.mp3 in the uncompressed files
    //due to converting them to mp3 to allow for easier checking 
    //so will need to check both 
}
