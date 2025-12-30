import { File, Directory, Paths } from 'expo-file-system';



export interface ConfigData {
    ip:string;
    port:Number;
    savePath:string;
    dataType:string;
}



export function readConfigFromFile(path:string){
    let configInfo :ConfigData  = {ip:"",port:0,savePath:"",dataType:""}
    try{
        const file = new File(Paths.cache, path);
        if(!file.exists){
            file.create()
            return configInfo
        }
        let lines= file.textSync().split("\n");
        for (let index in lines){
            let split = lines[index].indexOf(":")
            let key = lines[index].substring(0,split)
            let value = lines[index].substring(split+1)
            switch (key){
                case "ip":
                    configInfo.ip=value
                    break;
                case "port":
                    configInfo.port=Number(value)
                    break;
                case "savePath":
                    configInfo.savePath=value
                    break;
                case "dataType":
                    configInfo.dataType=value
                    break;
                default:
                    console.log("Invalid identifier name in config:"+key)
            }
        }
    }
    catch (error){
        console.log(error);
    }
    return configInfo

}
export function isValidIpAddress(str:string, fullAddress:boolean = false){
    //checks if ip address up to point could become valid 
    //only ipv4
    let parts = str.split('.')
    if(parts.length > 4)return false
    if(fullAddress && parts.length != 4) return false
    for(let i in parts){
        let part = parts[i];
        if(part === "" && Number(i)!=parts.length -1)return false
        if(part.length > 1 && part[0] == '0')return false
        try {
            if(!Number.isFinite(Number(part))){
                return false //not a number
            }
            let num = Number(part)
            if(num <0 || num >255)return false
        }
        catch {
            return false //error not a number
        }
    }
    return true
}
export function isValidPort(port:string){
    try{
        let num = Number(port)
        if(num <0 || num > 65535)return false
        if(num % 1 != 0)return false

    }catch{
        return false //error not a number
    }
    return true 
}

export function isValidConfigData(configInfo:ConfigData){
    if(!(isValidPort(configInfo.port.toString()) && isValidIpAddress(configInfo.ip,true)))return false;
    if(configInfo.dataType != "mp3" && configInfo.dataType != "flac")return false;
    try{ 
        if( ! new Directory(configInfo.savePath).exists)return false; 
    }catch{
        return false
    }
    return true
}

export function saveData(path:string, configInfo:ConfigData){
    //first check that config data is valid 
    if(!isValidConfigData(configInfo)){
        alert("Invalid configInfo:" + configInfo)
        return
    }

    try{
        const file = new File(Paths.cache, path)
        let text = "ip:"+configInfo.ip + "\n"
        text+="port:"+configInfo.port.toString() + "\n"
        text +="savePath:"+configInfo.savePath + "\n"
        text+="dataType:"+configInfo.dataType
        if(!file.exists){
            file.create()
        }
        file.write(text)
        alert("Data saved:"+text)
    }catch(error){
        console.log(error);
    }
}


export async function sendRequest(url:string){
    console.log(url)
    try{
        let res = await fetch(url, {
            method: 'GET'
        })
        if(!res.ok){
            return {Error:"Response code:"+res.status}
        }
        let resJson=await res.json()
        return resJson
    }catch(error) {
        alert("Error in fetch request:" + url)
        alert(error)
        return {Error:error}
    }
}

function listDirectory(directory:Directory){
    let files:File[] = []
    const contents = directory.list();
    for( const item of contents){
        if ( item instanceof Directory){
            let tmp:File[] = listDirectory(item)
            files = [...files,...tmp]

        }
        else{
            files.push(item)
        }
    }
    return files
}

export function getListOfFiles(path:string){
    try{
        let files = listDirectory(new Directory(path)) 
        //alert(files.length)
        return files 
    }catch(error){
        alert(error)
        return []
    }
}

function listCleanDirectory(directory:Directory, prefix:string){
    let files:string[] = []
    let contents = directory.list()
    for( const item of contents){
        //let fileName:string = prefix + item.name
        let fileName:string = prefix.concat("/",item.name)
        if( item instanceof Directory){
            let tmp:string[] = listCleanDirectory(item, fileName)
            files = files.concat(tmp)
        }
        else{
            
            files.push(fileName)
        }
    }
    return files
}

export function getCleanListOfFiles(path:string){
    try {
        let files = listCleanDirectory(new Directory(path),"")
        return files
    }catch (error){
        alert(error)
        return []
    }
    
}

export function uriToUnixPath(path:string){
    //TODO remove weird .documents/tree/ stuff at end of path 
    //
    let cleanedPath:string=""
    for(let i=0; i<path.length;i++){
        if(path[i]==='%'){
            let code = parseInt(path.substring(i+1,i+3),16)
            cleanedPath+=String.fromCharCode(code)
            i+=2 //skip next 2 characters (hex codes)
        }
        else{
            cleanedPath+=path[i]
        }
    }
    return cleanedPath
}

export function getListOfFilesCleaned(path:string, prefix:string){
    //removes path from start of all paths and replaces it with prefix string
    //returns list of strings
    //allows format for unix file system
    let start = Date.now() /1000
    let files = getCleanListOfFiles(path)
    let listTime = (Date.now()/1000) - start
    if(prefix[prefix.length-1]!="/"){
        prefix+="/"
    }
    path=uriToUnixPath(path)
    let fileStrings = files.map((s) => {
        let startIndex = s[0] == '/' ? 1 : 0
        //make sure that double / is not created at concatination
        return prefix.concat(s.substring(startIndex))
    })
    let restTime = (Date.now()/1000)-start - listTime
    let debugString = "Took " + listTime.toString()  + " seconds to list files and " + restTime.toString() + " seconds to sanitise output\nlength of array:"+fileStrings.length.toString() + " value 1 of array:"+fileStrings[0]
    debugString+="\n Size of final element in array: " + fileStrings[fileStrings.length-1].length.toString()
    console.log(debugString)
    console.log(fileStrings[fileStrings.length-1])
    return fileStrings

}
