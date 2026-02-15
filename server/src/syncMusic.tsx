import {$} from "bun";

export class syncMusic{
    static running:boolean = false;
    static async run(){
        let pwd = await $`pwd`.text()
        let executeablePath=pwd.substring(0,pwd.length-1) + "/library_converter"
        let noFiles:string = await Bun.spawn({cmd:[executeablePath, "count"]}).stdout.text();
        noFiles=noFiles.trim()
        if(syncMusic.running){
            return "Sync Music already currently running, currently:" + noFiles.toString() +  "files left to convert"
        }
        syncMusic.running=true
        if(noFiles == "0"){
            syncMusic.running=false
            return "No files to convert"
        }
        console.log("Syncing Music")
        Bun.spawn({cmd:[executeablePath], stdout:"pipe", onExit(){
            syncMusic.running=false
            console.log("Sync Music Finished")
        }});
        return "Started sync music: "+ noFiles.toString() + " files to convert"
    }
}
