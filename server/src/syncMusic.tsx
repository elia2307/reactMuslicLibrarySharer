import {$} from "bun";

export class syncMusic{
    static running:boolean = false;
    static async run(){
        if(syncMusic.running){
            return "Sync Music already currently running"
        }
        syncMusic.running=true
        console.log("Syncing Music")
        let pwd = await $`pwd`.text()
        let executeablePath=pwd.substring(0,pwd.length-1) + "/library_converter"
        Bun.spawn({cmd:[executeablePath], stdout:"pipe", onExit(){
            syncMusic.running=false
            console.log("Sync Music Finished")
        }});
        return "Started sync music"
    }
}
