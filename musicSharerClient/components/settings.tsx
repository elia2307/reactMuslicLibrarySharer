import {  TextInputChangeEvent} from 'react-native';
import * as React from 'react';
import { File, Directory, Paths } from 'expo-file-system';



import { ThemedTextInput} from '@/components/themed-textInput'
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { ThemedButton } from './themed-button';

interface SettingsProps {
    path?: string;
}

interface ConfigData {
    ip:string;
    port:Number;
    savePath:string;
    dataType:string;
}


export function SettingsComponent(props:SettingsProps){ 


    let path = "musicSharer.config"
    if ( props.path != undefined){
        path=props.path
    }
    let info = readConfigFromFile(path)
    let [configData, setConfigData] = React.useState<ConfigData>(info)
    return (
        <ThemedView>
            <ThemedText type="subtitle"> Ip Address of Remote Computer: </ThemedText>
            <ThemedTextInput onChange={(event:TextInputChangeEvent) => {
                let text = event.nativeEvent.text
                if(!isValidIpAddress(text)){
                    text = text.substring(0,text.length-1)
                }
                setConfigData((prev) => ({...prev,ip:text}))
            }} placeholder="Ip address of computer" value={configData.ip}/>
            <ThemedText type="subtitle"> Port of server on Remote Computer: </ThemedText>
            <ThemedTextInput value = {configData.port.toString()} onChange={(event:TextInputChangeEvent) => {
                if(isValidPort(event.nativeEvent.text)){
                    let p = Number(event.nativeEvent.text)
                    setConfigData((prev) => ({...prev,port:p}))
                }

            }} placeholder="Port of computer"/>
            <ThemedText>"Save Path:" {configData.savePath}</ThemedText>
            <ThemedButton onPress={async () =>  {
                let res = await Directory.pickDirectoryAsync()
                if(!res.exists){
                    alert("Doesn't exist:" + res)
                    return;
                }
                let path =res.uri
                if(path == undefined) return;
                setConfigData((prev) => ({...prev,savePath:path}))
            }}  color='#841584' title='Pick output directory'/>
            
            <Select>
                <Option value="mp3">mp3</Option>
                <Option value="flac">flac</Option>
            </Select>

            <ThemedButton onPress={() =>saveData(path,configData)} color='#841584' title='Save Settings'/>
        </ThemedView>

    )
}
function readConfigFromFile(path:string){
    let configInfo :ConfigData  = {ip:"",port:0,savePath:"",dataType:""}

    try{
        const file = new File(Paths.cache, path);
        if(!file.exists){
            file.create()
            return configInfo
        }
        let lines= file.textSync().split("\n");
        for (let index in lines){
            let values = lines[index].split(":")
            switch (values[0]){
                case "ip":
                    configInfo.ip=values[1]
                    break;
                case "port":
                    configInfo.port=Number(values[1])
                    break;
                case "savePath":
                    configInfo.savePath=values[1]
                    break;
                case "dataType":
                    configInfo.dataType=values[1]
                    break;
                default:
                    console.log("Invalid identifier name in config:"+values[0])
            }
        }
    }
    catch (error){
        console.log(error);
    }
    return configInfo

}
function isValidIpAddress(str:string){
    //checks if ip address up to point could become valid 
    //only ipv4
    let parts = str.split('.')
    if(parts.length > 4)return false
    for(let i in parts){
        let part = parts[i];
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
function isValidPort(port:string){
    try{
        let num = Number(port)
        if(num <0 || num > 65535)return false
        if(num % 1 != 0)return false

    }catch{
        return false //error not a number
    }
    return true 
}
function saveData(path:string, configInfo:ConfigData){
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
