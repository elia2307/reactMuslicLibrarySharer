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
    let fileInfoCachePath="cleanedListOfFiles.cache"
    let config = readConfigFromFile(configPath)
    let [responseText,setResponseText]=React.useState("")
    let [value, reloadPage]=React.useState(false)
    let [pageNumber, setPageNumber] = React.useState(0)
    const pageLength=1000 
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
                <ThemedButton onPress={async () => {
                    const file = new File(Paths.cache, fileInfoCachePath)
                    alert("Started Can Take A long time:")
                    if(!file.exists){
                        console.log("No cache, Fetching file list")
                        let files = getListOfFilesCleaned(config.savePath, "library/")
                        let str = ""
                        for (const file of files){
                            str+=file+"\n"
                        }
                        file.create({overwrite:true})
                        file.write(str)
                        setResponseText(str)
                    }else{
                        console.log("File exists in cache")
                        let str = await file.text()
                        setResponseText("File exists in cache:\n"+str)
                    }
                }} color="#841584" title="List Files in Save Path" />
                <ThemedText> Warning, Delete Cache:</ThemedText>
                <ThemedButton onPress={ () => {
                    let file = new File(Paths.cache,fileInfoCachePath )
                    if(!file.exists)return
                        file.delete()
                        alert("File deleted")
                    }} 
                    title = "Clear list of files Cache" color= "#a02c40"/>
                <ThemedText type="subtitle">Page {pageNumber} of response text out of {Math.floor(responseText.length / pageLength)} pages </ThemedText>
                <ThemedButton onPress = {() => setPageNumber(0)} color="#841584" title="Page 0"/>
                <ThemedButton onPress = {() => setPageNumber(Math.max(pageNumber-1,0))} color="#841584" title="Previous Page"/>
                <ThemedButton onPress = {() => setPageNumber(Math.min(pageNumber+1, Math.floor(responseText.length/pageLength)))} color="#841584" title="Next Page"/>
                <ThemedText >Response from server: {responseText.substring(pageNumber*pageLength,pageNumber*pageLength+pageLength)}</ThemedText>
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
