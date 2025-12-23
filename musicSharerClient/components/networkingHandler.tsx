import {  TextInputChangeEvent} from 'react-native';
import * as React from 'react';
import { File, Directory, Paths } from 'expo-file-system';

import { ThemedTextInput} from '@/components/themed-textInput'
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { ThemedButton } from './themed-button';

interface NetworkingHandlerProps {
    ip? : string;
    port?: number;
    path?: string;
}

export function NetworkingHandler(props:NetworkingHandlerProps){ 
    let [ip,setIp]=React.useState("")
    let [port,setPort]=React.useState(0)
    let [responseText, setResponseText]=React.useState("")

    let path = "networkingInfo.cache"
    if ( props.path != undefined){
        let info = readNetworkingInfoFromFile(props.path)
        setIp(info.ip)
        setPort(info.port)
        path=props.path
    }
    else {
        if( props.ip != undefined){
            setIp(props.ip)
        }
        if (props.port != undefined){
            setPort(props.port)
        }
    }
    async function sendRequest(api:string){
        if(api[0] != '/'){
            api = "/" + api
        }
        let url ="http://" +  ip + ":" + port.toString() +api            

        console.log(url)
        try{
            let res = await fetch(url, {
                method: 'GET'
            })
            let resJson=await res.json()

            alert("Success")
            let songs = resJson.message
            let text = JSON.stringify(songs)
            setResponseText(text)
            //alert(await res.text())
        }catch(error) {
            alert("Error in fetch request:" + url)
            alert(error)
        }
    }



    return (
        <ThemedView>
            <ThemedText type="subtitle"> Ip Address of Remote Computer: </ThemedText>
            <ThemedTextInput onChange={(event:TextInputChangeEvent) => {
                let text = event.nativeEvent.text
                if(!isValidIpAddress(text)){
                    text = text.substring(0,text.length-1)
                }
                setIp(text)
            }} placeholder="Ip address of computer" value={ip}/>
            <ThemedText type="subtitle"> Port of server on Remote Computer: </ThemedText>
            <ThemedTextInput value = {port.toString()} onChange={(event:TextInputChangeEvent) => {
                if(isValidPort(event.nativeEvent.text)){
                    setPort(Number(event.nativeEvent.text))
                }

            }} placeholder="Port of computer"/>
            <ThemedButton onPress={() => sendRequest("/api/syncMusic")} color="#841584" title="Sync Music" />
            <ThemedButton onPress={() => sendRequest("/api/listFiles/original")} color="#841584" title="Get Flac Library List" />
            <ThemedButton onPress={() => sendRequest("/api/listFiles/compressed")} color="#841584" title="Get Mp3 Library List" />
            <ThemedButton onPress={() =>saveNetworkingInfoData(path,ip, port)} color='#841584' title='Save Port and IP address'/>
            <ThemedText >{responseText}</ThemedText>
        </ThemedView>

    )
}
function readNetworkingInfoFromFile(path:string){
    let ip:string;
    let port:number;
    try{
        const file = new File(Paths.cache, path);
        if(!file.exists){
            file.create()
            ip = "0.0.0.0";
            port =0
            return {ip:ip, port:port};
        }
        let values = file.textSync().split(":");
        if(values.length <2){
            ip = "0.0.0.0"
            port=0
        }
        else{
            ip = isValidIpAddress(values[0]) ? values[0] : "1.2.3.4"

            port = isValidPort(values[1]) ? Number(values[1]) : 0
        }
    }
    catch (error){
        console.log(error);
        ip="0.0.0.0"
        port=0
    }
    return {ip:ip, port:port}

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
function saveNetworkingInfoData(path:string, ip:string, port:Number){
    try{
        const file = new File(Paths.cache, path)
        if(!file.exists){
            file.create()
        }
        file.write(ip+":"+port.toString())
    }catch(error){
        console.log(error);
    }
}
