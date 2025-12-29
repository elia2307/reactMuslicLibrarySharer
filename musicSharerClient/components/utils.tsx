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
        let resJson=await res.json()

        alert("Success")
        return resJson
    }catch(error) {
        alert("Error in fetch request:" + url)
        alert(error)
    }
}
