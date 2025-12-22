import { readdir } from "node:fs/promises"; 
import { $ } from "bun";
async function tree(path:string){
    let out = [path]
    if(await Bun.file(path).exists()){
        return out
    }
    else{
        if(path[path.length -1] != '/'){
            path=path+"/"
        }
    }
    const files = await readdir(path, {recursive: false});
    for(let file of files){
        const filePath = path +  file
        out.push.apply(out,await tree(filePath))
    }
    return out.sort()
}


export async function listFiles(libraryType:string){
    let path = "" 
    libraryType=libraryType.toLowerCase()
    if( libraryType == "original" ||libraryType == "flac"){
        libraryType="original"
        path= "/mnt/Data/Music/"
    }
    else if (libraryType == "mp3" || libraryType == "compressed"){
        libraryType="compressed"
        path= "/mnt/Data/mp3Lib/"
    }
    else{
        return "invalid library type";
    }
    let files = await tree(path)
    files = files.map( (s) => libraryType +"/"+ s.substring(path.length))
    return files
}

export async function syncMusic(){
    let pwd = await $`pwd`.text()
    let scriptPath=pwd.substring(0,pwd.length-1) + "/syncMusic.sh"
    Bun.spawn(["/bin/bash",scriptPath])
    
}
