use std::path::Path;
use std::env;
use std::fs::remove_file;
use std::fs;
use std::fs::create_dir_all;
use std::fs::read_dir;
use std::process::Command;

fn file_tree(path:&String, sorted:bool, include_hidden:bool)-> Vec<String>{
    let mut vec = Vec::new();
    let mut directories = Vec::new();
    directories.push(Path::new(&path).to_path_buf());
    while directories.len() != 0 { 
        let files = read_dir(&directories.remove(0)).unwrap();
        for file in files{
            let f = file.unwrap();
            let file_path = f.path().to_str().unwrap().to_string();
            if !include_hidden{
                if f.file_name().to_str().unwrap().chars().nth(0).unwrap() == '.'{
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

    return vec
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
fn remove_prefix(v :Vec<String>, prefix:&String) -> Vec<String>{
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
    let list = remove_prefix(file_tree(path, false,false),path);
    let mut files: Vec<String> = list.iter().map(|str| clean_flac_file(str.to_string())).collect();
    files.sort();
    return files;
}
fn get_compressed_file_list(path:&String) -> Vec<String>{
    let list = remove_prefix(file_tree(path,true,false),path);
    return list;
}


fn move_and_convert(input_path:&String, output_path:&String,file:&String, verbose:bool){
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
        let out = Command::new("ffmpeg")
            .args(args).output().unwrap() ;
        //let out = output.wait().unwrap();
        if verbose{
            println!("{}",out.status);
            println!("{}",String::from_utf8_lossy(&out.stdout));
            println!("{}",String::from_utf8_lossy(&out.stderr));
        }

    }   
}

fn  move_and_convert_files(input_path:&String, output_path:&String, files:Vec<String>, verbose:bool){
    for i in 0..files.len(){
        move_and_convert(input_path,output_path,&files[i],verbose);
        if verbose {
        }
        println!("Completed {} out of {}",i+1,files.len());
        println!("{}%",((i+1)*100)/files.len());
    }
    return;
}

fn convert_library(input_path:&String,output_path:&String,verbose:bool){
    let input_files = get_uncompressed_file_list(&input_path);
    let ouput_files = get_compressed_file_list(&output_path);
    let missing_files = find_missing(input_files,ouput_files);
    if verbose{
        println!("Number of missing files {}",missing_files.len());
    }
    move_and_convert_files(input_path, output_path, missing_files,verbose);
}

fn remove_files(files:Vec<String>, start_path:&String){
    for file in files{
        let full_path = start_path.clone() + "/" + &file;
        let _ = remove_file(full_path);
        
    }
}

fn remove_leftover_files(original_path:&String, compressed_path : &String, verbose:bool){
    let original_files = get_uncompressed_file_list(original_path);
    let compressed_files = get_compressed_file_list(compressed_path);
    let leftover = find_missing(compressed_files, original_files);
    if verbose {
        for file in &leftover{
            println!("{file}");
        }
        println!("Number of leftover files {}",leftover.len());
    }
    remove_files(leftover, compressed_path);
}

fn music_converter(uncompressed_path:&String, compressed_path:&String,mode:&String, verbose:bool){
    if mode == "convert"{
        convert_library(&uncompressed_path,&compressed_path,verbose);
    }
    else if mode == "leftover"{
        remove_leftover_files(&uncompressed_path, &compressed_path, verbose)
    }
    else if mode=="both"{
        convert_library(&uncompressed_path,&compressed_path,verbose);
        remove_leftover_files(&uncompressed_path, &compressed_path, verbose)
    }
    else{
        println!("Invalid mode: {mode}");
        panic!();
    }
    println!("Success");
}

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() == 5 {
        let uncompressed_path = &args[1];
        let compressed_path = &args[2];
        let mode = &args[3];
        let verbose = &args[4] == "true";
        music_converter(uncompressed_path, compressed_path, mode, verbose)
    }
    else{
        let uncompressed_path:String = String::from("/mnt/Data/Music/Library/");
        let compressed_path = String::from("/mnt/Data/mp3Lib/");
        let verbose = false;
        let mode = String::from("both");
        music_converter(&uncompressed_path, &compressed_path,&mode, verbose)
    }
}

