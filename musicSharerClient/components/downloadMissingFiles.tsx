import * as React from 'react';
import { getMissingFiles } from "./utils"
import { ThemedView } from './themed-view';
import { ThemedButton } from './themed-button';
import { ThemedText } from './themed-text';


interface MissingFilesProps{
    missingFilesPath:string;
    url:string;
    outputLocation:string;
}

export function MissingFiles(props:MissingFilesProps){
    let [missingFiles, setMissingFiles] = React.useState<string[]>([])
    let [downloaderEnabled, setDownloaderEnabled] = React.useState<boolean>(false)
    let [fileIndex,setFileIndex] = React.useState(0)
    let view = (<ThemedView></ThemedView>)
    if(downloaderEnabled){
        let progressText = "downloading "  +fileIndex.toString() + " out of " + missingFiles.length
        progressText +="\n current file: " + missingFiles[fileIndex]
        view = (
            <ThemedView>
                <ThemedButton onPress = { () => setFileIndex(fileIndex+1)} title="Next file" color="#841584" />
                <ThemedText> {progressText} </ThemedText>
            </ThemedView>
        )
    }
    return  (
        <ThemedView>
            <ThemedButton onPress = {async () => {
                let files = await getMissingFiles(props.missingFilesPath, props.url)
                if(files.length == 0 )return
                setDownloaderEnabled(true)
                setMissingFiles(files)                           
            }} color='#841584' title="Download list of missing files from server" />
            {view}
        </ThemedView>
    )

}

