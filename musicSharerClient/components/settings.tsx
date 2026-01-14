import { StyleSheet, TextInputChangeEvent} from 'react-native';
import * as React from 'react';
import {File, Paths, Directory} from 'expo-file-system';

import {isValidPort, isValidIpAddress, readConfigFromFile, ConfigData, saveData} from '@/components/utils'

import {Picker} from '@react-native-picker/picker'



import { ThemedTextInput} from '@/components/themed-textInput'
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { ThemedButton } from './themed-button';

interface SettingsProps {
    path?: string;
}

export function SettingsComponent(props:SettingsProps){ 

    let pickerStyle = StyleSheet.create({
        lightContainer: {
            backgroundColor: '#d0d0c0',

        },
        darkContainer: {
            backgroundColor: '#a02c40',
        },
        lightThemeText: {
            color: '#242c40',
        },
        darkThemeText: {
            color: '#e0e0e0',
        },
    })



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
            <ThemedText>Music data type from server:
            </ThemedText>
            <Picker 
                style={ [pickerStyle.darkContainer]}
                selectedValue={configData.dataType}
                onValueChange= {(type) => setConfigData((prev) => ({...prev,dataType:type}))}
                prompt="File type of music to copy from server"
            >
                <Picker.Item label="Select File Type" enabled={false} />
                <Picker.Item label="mp3" style = {{height:100, backgroundColor: "#242c40"}} color = "#e0e0e0" value="mp3" />
                <Picker.Item label = "flac" style = {{height: 100, backgroundColor: '#242c40', flex: 0.4}} color = "#e0e0e0" value="flac" />
            </Picker>


            <ThemedButton onPress={() =>saveData(path,configData)} color='#841584' title='Save Settings'/>
            <ThemedButton onPress={ () => {
                let file = new File(Paths.cache, "cleanedListOfFiles.cache")
                if(!file.exists)return
                file.delete()
                alert("File deleted")
            }} title = "Clear list of files Cache" color= "#a02c40"/>          
        </ThemedView>

    )
}

