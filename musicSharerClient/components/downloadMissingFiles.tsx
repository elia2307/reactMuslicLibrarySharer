import * as React from 'react';
import { getMissingFiles } from "./utils"
import { ThemedView } from './themed-view';
import { ThemedButton } from './themed-button';
import { ThemedText } from './themed-text';

import { File, Directory, Paths} from 'expo-file-system';
interface MissingFilesProps{
    missingFilesPath:string;
    url:string;
    outputLocation:string;
}

function getCreatedDirectory(pathParts:string[]){
    let dir = new Directory(pathParts[0])
    for(let i=1;i<pathParts.length;i++){
        try{
            let subDirs = dir.list()
            let exists:Boolean = false
            //for some reason dir.exists doesn't actually return false when directory doesn't exist 
            //so fix is iterate over all files in parent directory which know exists and check if any directorys have the correct name 
            for(let val of subDirs){
                if(val instanceof Directory){
                    if(val.name === pathParts[i]){
                        exists=true
                        dir=val
                        break
                    }
                }
            }
            if(!exists){
                dir=dir.createDirectory(pathParts[i])
                //console.log(decodeURI(dir.uri) + " created")
            }
        }
        catch(error){
            console.error(decodeURI(dir.uri) + " doesn't exist.\n" + error)
        }
    }
    return dir
}

function createFileSafe(dir:Directory, fileName:string){
    //similar problem as getCreatedDirectory however this time the problem is, if file exists then it creaetes a second file with (1) at the end 
    //which is undesirable
    for (let val of dir.list()){
        if(val instanceof File){
            if(val.name == fileName){
                return val
            }
        }
    }
    try{
        let createdFile = dir.createFile(fileName, "application/mp3")
        return createdFile
    }catch(error){
        console.error(error)
        return

    }
}

export function MissingFiles(props:MissingFilesProps){
    let [missingFiles, setMissingFiles] = React.useState<string[]>([])
    let [downloaderEnabled, setDownloaderEnabled] = React.useState<boolean>(false)
    let [fileIndex,setFileIndex] = React.useState(0)
    let downloadingView = (<ThemedView></ThemedView>)
    if(downloaderEnabled){
        let progressText = "Downloading "  +fileIndex.toString() + " out of " + missingFiles.length
        progressText +="\n Current file: " + missingFiles[fileIndex]
        let fullUrl = props.url + "/api/downloadFile/"+ missingFiles[fileIndex]
        progressText+="\n"+fullUrl
        if(missingFiles[fileIndex] != undefined){
            
        
        File.downloadFileAsync(encodeURI(fullUrl), Paths.cache, {idempotent:true}).then( async (file) => {
            //console.log("File downloaded path:"+file.uri)
            let content = file.bytesSync() 
            //first part is mp3 or flac 
            let parts = missingFiles[fileIndex].split("/")
            //last part is file name so don't need for finding correct folder
            parts[0]=props.outputLocation
            let dir = getCreatedDirectory(parts.slice(0,-1))
            //console.log(decodeURI(dir.uri))
            let createdFile = createFileSafe(dir,parts[parts.length-1])
            if(createdFile == undefined){
                alert("Error in creating file")
                return
            }
            createdFile.write(content)
            console.log("File written to:" + decodeURI(createdFile.uri))
            

            setFileIndex(fileIndex+1)

        }).catch(error =>   alert(error))   
        }
        else{
            progressText+="\nDownloads complete"
        }
        downloadingView = (
            <ThemedView>
                <ThemedButton onPress = { () => setFileIndex((fileIndex+1) % missingFiles.length)} title="Next file" color="#841584" />
                <ThemedButton onPress = { () => setDownloaderEnabled(false) } title="Stop Download" color="#841584"/>
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
                setFileIndex(0)
                setMissingFiles(files)                           
            }} color='#841584' title="Download list of missing files from server" />
            {downloadingView}
        </ThemedView>
    )

    }

