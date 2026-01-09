import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';

import {File,Paths} from 'expo-file-system';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ThemedButton } from '@/components/themed-button';



import * as React from 'react';

import { uriToUnixPath, readConfigFromFile, sendRequest, fetchFileCacheList } from '@/components/utils';

import { MissingFiles } from '@/components/downloadMissingFiles';



export default function HomeScreen() {


    let configPath ="musicSharer.config" 
    let fileInfoCachePath="cleanedListOfFiles.cache"
    let config = readConfigFromFile(configPath)
    let url = "http://"+config.ip + ":" + config.port.toString()
    let [value, reloadPage]=React.useState(false)

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
                <ThemedText type="title">Welcome!</ThemedText>
                <HelloWave />
            </ThemedView>
            <ThemedView style={styles.stepContainer}>

                <ThemedText type="subtitle">Url of server: {url}</ThemedText>
                <ThemedText type="subtitle"> Save location of music: {decodeURI(config.savePath)} </ThemedText>
                <ThemedButton onPress={() => reloadPage(!value)} title="Reload Page"/>
                <ThemedButton onPress={() => sendRequest(url+"/api/syncMusic")} color="#841584" title="Sync Music" />
                <ThemedButton onPress={async () => { await fetchFileCacheList(config.savePath, config.dataType,fileInfoCachePath)}} color="#841584" title="List Files in Save Path" />
                <MissingFiles dataType = {config.dataType} url = {url}  missingFilesPath={fileInfoCachePath} outputLocation={config.savePath}/>
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
