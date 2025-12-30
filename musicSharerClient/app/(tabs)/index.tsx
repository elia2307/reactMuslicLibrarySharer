import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';

import {File,Paths} from 'expo-file-system';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ThemedButton } from '@/components/themed-button';



import * as React from 'react';

import { uriToUnixPath, readConfigFromFile, sendRequest, getListOfFilesCleaned } from '@/components/utils';

export default function HomeScreen() {


    let configPath ="musicSharer.config" 

    let config = readConfigFromFile(configPath)
    let [responseText,setResponseText]=React.useState("")
    let [value, reloadPage]=React.useState(false)
    async function serverRequest(api:string){
        let json = await sendRequest("http://"+config.ip + ":"+config.port.toString()+api)
        setResponseText(JSON.stringify(json))
        
    }

    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
            headerImage={
                <Image
                    source={require('@/assets/images/partial-react-logo.png')}
                    style={styles.reactLogo}
                />
            }>
            <ThemedView style={styles.titleContainer}>
                <ThemedText type="title">Welcome User!</ThemedText>
                <HelloWave />
            </ThemedView>
            <ThemedView style={styles.stepContainer}>

                <ThemedText type="subtitle">Url of server: {config.ip}:{config.port.toString()}</ThemedText>
                <ThemedText type="subtitle"> Save location of music: {uriToUnixPath(config.savePath)} </ThemedText>
                <ThemedText type="subtitle">Run SyncMusic on Computer</ThemedText>
                <ThemedButton onPress={() => reloadPage(!value)} title="Reload Page"/>
                <ThemedButton onPress={() => serverRequest("/api/syncMusic")} color="#841584" title="Sync Music" />
                <ThemedButton onPress={() => serverRequest("/api/listFiles/original")} color="#841584" title="Get Flac Library List" />
                <ThemedButton onPress={() => serverRequest("/api/listFiles/compressed")} color="#841584" title="Get Mp3 Library List" />
                <ThemedButton onPress={() => {
                    alert("Started, can take a while")
                    const file = new File(Paths.cache, "cleanedListOfFiles.txt")
                    if(!file.exists){
                        let f = getListOfFilesCleaned(config.savePath, "library/")
                        file.create()
                        let str = f.reduce((s:string,val) => s+val + "\n")
                        file.write(str)
                    
                        setResponseText(str)
                    }else{
                        setResponseText(file.textSync())
                    }
                }} color="#841584" title="List Files in Save Path" />
                <ThemedText >Response from server: {responseText}</ThemedText>
                <ThemedButton onPress={ () => {
                    let file = new File(Paths.cache, "cleanedListOfFiles.txt")
                    if(!file.exists)return
                    file.delete()
                    }} 
                    title = "Clear list of files Cache" color= "#a02c40"/>
            </ThemedView>
        </ParallaxScrollView>
    );
}

const styles = StyleSheet.create({
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    stepContainer: {
        gap: 8,
        marginBottom: 8,
    },
    reactLogo: {
        height: 178,
        width: 290,
        bottom: 0,
        left: 0,
        position: 'absolute',
    },
});
