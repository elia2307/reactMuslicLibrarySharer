use crate::utils;
use crate::utils::write_to_file;
use crate::playlist_converter::convert_flac_playlist_to_mp3;
use std::io;
use std::time;
use std::path::Path;
use std::fs::remove_file;
use std::fs;
use std::fs::create_dir_all;
use std::fs::read_dir;
use std::process::Command;
use std::sync::mpsc;
use std::sync::mpsc::Receiver;
use std::thread;

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
    let list = utils::remove_prefix(file_tree(path, false,false),path);
    let mut files: Vec<String> = list.iter().map(|str| clean_flac_file(str.to_string())).collect();
    files.sort();
    return files;
}
fn get_compressed_file_list(path:&String) -> Vec<String>{
    let list = utils::remove_prefix(file_tree(path,true,false),path);
    return list;
}


fn move_and_convert(input_path:&String, output_path:&String,file:&String, verbose:bool){
    let full_path_str :String = output_path.clone() + file.as_str();
    let path = Path::new(full_path_str.as_str()); 
    let _ = create_dir_all(path.parent().unwrap());
    let mut original_path_str = input_path.clone() + file.as_str();
    if utils::is_m3u_file(file){
        let new_playlist_text = convert_flac_playlist_to_mp3(&original_path_str, input_path, output_path);
        write_to_file(Path::new(&full_path_str), &new_playlist_text)
        

    }
    else if fs::exists(&original_path_str).unwrap(){
        let p = Path::new(original_path_str.as_str());
        let _ = std::fs::copy(p, path);
    }
    else{
        original_path_str= utils::mp3_to_flac(original_path_str);
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
            println!("Converted {}",files[i]);
            println!("Completed {} out of {}",i+1,files.len());
            println!("{}%",((i+1)*100)/files.len());
        }
        
    }
    if files.len() != 0{
        println!("Converted {} files",files.len());
    }
    return;
}

pub fn convert_library(input_path:&String,output_path:&String,verbose:bool){
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

pub fn remove_leftover_files(original_path:&String, compressed_path : &String, verbose:bool){
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

pub fn count_missing(original_path:&String,compressed_path:&String){
    let original_files = get_uncompressed_file_list(original_path);
    let compressed_files = get_compressed_file_list(compressed_path);
    let leftover = find_missing(original_files,compressed_files);
    println!("{}",leftover.len());
}

pub fn run_converter_indefinately(uncompressed_path:&String,compressed_path:&String,verbose:bool, reciever:Option<Receiver<bool>>){
    let sleep_time = time::Duration::from_millis(5000);
    match reciever {
        Some(rec) => {
            loop{
                let res = rec.try_recv();
                match res {
                    Ok(_) => { 
                        println!("Killed run_converter_indefinately");
                        return;
                    }
                    Err(_) => {
                        convert_library(&uncompressed_path,&compressed_path, verbose)
                    }
                } 
                thread::sleep(sleep_time);
            }
        },
        None => {
            loop{
                convert_library(&uncompressed_path,&compressed_path, verbose);
                thread::sleep(sleep_time);
            }
        }
    }
}

pub fn run_coverter_loop(uncompressed_path:String, compressed_path:String,verbose:bool){
    let (tx,rx) = mpsc::channel();
    //run convert_library in a loop on separate thread while waiting for key press to cancel
    //execution
    let _ = thread::spawn(move || {
        run_converter_indefinately(&uncompressed_path, &compressed_path, verbose, Some(rx));
    });
    loop{
        let mut input = String::new();
        println!("Please type STOP or S to stop execution");
        io::stdin().read_line(&mut input).expect("error: unable to read user input");
        input = input.trim().to_string();
        if input == "STOP" || input == "S"{
            println!("STOPPING EXECUTION");
            let _ = tx.send(true);
            return 
        }
    }
     

}



