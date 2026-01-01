import { readdir } from "node:fs/promises"; 
import { $ } from "bun";
async function tree(path:string){
    let out:string[] = []
    if(await Bun.file(path).exists()){
        return [path]
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
        path= "/mnt/Data/Music/"
    }
    else if (libraryType == "mp3" || libraryType == "compressed"){
        path= "/mnt/Data/mp3Lib/"
    }
    else{
        return [];
    }
    let files = await tree(path)
    files = files.map( (s) => libraryType +"/"+ s.substring(path.length))
    return files
}

export async function syncMusic(){
    console.log("Syncing Music")
    let pwd = await $`pwd`.text()
    let scriptPath=pwd.substring(0,pwd.length-1) + "/syncMusic.sh"
    Bun.spawn(["/bin/bash",scriptPath])
    
}

export async function findMissingFiles(fileList: string){
    let clientFiles:string[] = fileList.trim().split("\n").sort()
    let fileType=clientFiles[0]?.substring(0,clientFiles[0].indexOf("/"))
    if(fileType == undefined) return "Bad input, invalid body of request"
    let serverFiles = await listFiles(fileType)
    if( serverFiles.length ==0 )return "Bad input, invalid body of request"
    let missingFiles:string[] = []
    let clientIndex =0
    for(let file of serverFiles){
        let clientFile = clientFiles[clientIndex]
        //while clientFile is alphabettically before file increment client index to get to right point 
        if(clientFile != undefined){
            while(file > clientFile ){
                clientIndex++;
                clientFile=clientFiles[clientIndex]
                if(clientFile == undefined)break;
            }
        }
        if (clientFile == undefined){
            //if clientFile is undefined then at end of clientFiles array so rest of files push to missing files
            missingFiles.push(file)
            continue
        }
        if(file === clientFile){
            // if files equal then incrment client index 
            clientIndex++;
        }
        else{
            // if files not equal then file is not in fileList 
            missingFiles.push(file)
        }

    }
    console.log(missingFiles.length)
    return missingFiles
}
