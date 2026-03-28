import { readdir } from "node:fs/promises"; 
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

async function getFileList(fileType?:string){
    if (fileType == undefined) {
        return
    }
    let files = await listFiles(fileType)
    return files

}

function removeDuplicate(arr1 : string[], arr2: string[]){
    //returns list of values in arr1 which are not in arr2 
    //values only in arr2 are not in list returned
    let unique:string[] = []
    let arr2Index =0
    for(let arr1Str of arr1){
        let arr2Str = arr2[arr2Index]
        //while clientFile is alphabettically before file increment client index to get to right point 
        if(arr2Str != undefined){
            while(arr1Str > arr2Str ){
                arr2Index++;
                arr2Str=arr2[arr2Index]
                if(arr2Str == undefined)break;
            }
        }
        if (arr2Str == undefined){
            //if clientFile is undefined then at end of clientFiles array so rest of files push to missing files
            unique.push(arr1Str)
            continue
        }
        if(arr1Str === arr2Str){
            // if files equal then incrment client index 
            arr2Index++;
        }
        else{
            // if files not equal then file is not in fileList 
            console.log(arr1Str + " not in server list of files, curr server:" + arr2Str)
            unique.push(arr1Str)
        }
    }
    return unique
    
}

export async function findMissingFiles(fileList: string){
    let clientFiles:string[] = fileList.trim().split("\n").sort()
    let fileType=clientFiles[0]?.substring(0,clientFiles[0].indexOf("/"))
    let serverFiles = await getFileList(fileType)
    if(serverFiles == undefined) return "Bad input, invalid body of request"
    if( serverFiles.length ==0 )return "Bad input, invalid body of request"
    let missingFiles = removeDuplicate(serverFiles,clientFiles)
    console.log("Number of Missing Files:" + missingFiles.length)
    return missingFiles
}
function isHiddenFile(file:string){
    let parts = file.split("/")
    for(let part of parts){
        if(part[0] == '.'){
            return true
        }
    }
    return false
}
function removeHidden(files:string[]){
    let out = []
    for (let file of files){
        if(!isHiddenFile(file)){
            out.push(file)
        }
    }
    return out
}

export async function getLeftoverFiles(fileList: string){
    let clientFiles:string[] = fileList.trim().split("\n").sort()
    let fileType=clientFiles[0]?.substring(0,clientFiles[0].indexOf("/"))
    let serverFiles = await getFileList(fileType)
    if(serverFiles == undefined) return "Bad input, invalid body of request"
    if( serverFiles.length ==0 )return "Bad input, invalid body of request"
    clientFiles.map( (f) => {f.trim()})
    let leftoverFiles = removeDuplicate(clientFiles,serverFiles)
    leftoverFiles = removeHidden(leftoverFiles)
    //console.log(leftoverFiles)
    console.log(leftoverFiles.length)
    return leftoverFiles

}
export async function downloadFile(filePath:string)
{    
    try{
        filePath = decodeURIComponent(filePath)
        console.log(filePath)
    }catch(error){
        console.error(error)
        return 
    }

    let path = "" 
    let libraryType=filePath.substring(0,filePath.indexOf("/")).toLowerCase()
    let localPath = filePath.substring(filePath.indexOf("/")+1)
    if( libraryType == "original" ||libraryType == "flac"){
        path= "/mnt/Data/Music/"
    }
    else if (libraryType == "mp3" || libraryType == "compressed"){
        path= "/mnt/Data/mp3Lib/"
    }
    else{
        console.log("Invalid path")
        return
    }
    
    let pathParts = localPath.split("/")
    for(let part of pathParts){
        if(part === "." || part ===".."){
            console.log("Invalid path, . or .. in path")
            return
        }
    }
    path+=localPath
    const file = Bun.file(path)
    if(!await file.exists()){
        console.log("Invalid, file doesn't exist")
        return
    }
    return file
}
