import {  TextInputChangeEvent} from 'react-native';
import * as React from 'react';
import {useState} from 'react';

import { ThemedTextInput} from '@/components/themed-textInput'
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { ThemedButton } from './themed-button';
interface NetworkingInfo {
    ipAddress:string;
    port:Number;
}

export class NetworkingHandler extends React.Component{
    constructor({...props}){
        super(props)
        this.state=useState<NetworkingInfo>({ipAddress:"",port:0})
    }
    static isValidIpAddress(str:string){
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
    static isValidPort(port:string){
        try{
            let num = Number(port)
            if(num <0 || num > 65535)return false
            if(num % 1 != 0)return false

        }catch{
            return false //error not a number
        }
       return true 
    }
    render() {
        let [ip,setIp]=useState('')
        let [port,setPort]=useState(0)
        let [responseText, setResponseText]=useState("")
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
                let text = JSON.stringify(resJson)
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
                    if(!NetworkingHandler.isValidIpAddress(text)){
                        text = text.substring(0,text.length-1)
                    }
                    setIp(text)
                }} placeholder="Ip address of computer" value={ip}/>
            <ThemedText type="subtitle"> Port of server on Remote Computer: </ThemedText>
            <ThemedTextInput value = {port.toString()} onChange={(event:TextInputChangeEvent) => {
                    if(NetworkingHandler.isValidPort(event.nativeEvent.text)){
                        setPort(Number(event.nativeEvent.text))
                    }
                       
            }} placeholder="Port of computer"/>
            <ThemedButton onPress={() => sendRequest("/api/syncMusic")} color="#841584" title="Sync Music" />
            <ThemedButton onPress={() => sendRequest("/api/listFiles/original")} color="#841584" title="Get Flac Library List" />
            <ThemedButton onPress={() => sendRequest("/api/listFiles/compressed")} color="#841584" title="Get Mp3 Library List" />
            <ThemedText >{responseText}</ThemedText>
        </ThemedView>

        )
    }
}
