convertLibrary() {
    local input="$1"
    local output="$2"
    for filename in "$input"/*; do 
        if [ -d "$filename" ] ; then 
            #recursively call function on sub folders but ignore folders which have # as the first character (whcih is my ignore character)
            if [[ $(basename "$filename") == "#"* ]]; then 
                continue 
            else 
                newOutput=""$output"/"$(basename "$filename")
                mkdir -p "$newOutput"
                convertLibrary "$filename" "$newOutput"
            fi

        elif [[ $filename == *.m4a ]]; then
            newFileName=""$(basename "$filename" ".m4a")".mp3"
            #if file doesnt exist then make it
            if [ ! -f "$output/$newFileName" ]; then 
                ffmpeg -i "$input/$(basename "$filename")" -acodec libmp3lame  "$output/$newFileName"
            fi
        elif [[ $filename == *.flac ]]; then 
            newFileName=""$(basename "$filename" ".flac")".mp3"
            if [ ! -f "$output/$newFileName" ]; then
                ffmpeg -i "$input/$(basename "$filename")" -acodec libmp3lame  "$output/$newFileName"
            fi
        else 
            # -n dont replace
            cp -n "$filename" "$output/"
        fi
    done

}
originalPath="/mnt/Data/Music/Library/"
mp3Path="/mnt/Data/mp3Lib/"
convertLibrary "$originalPath" "$mp3Path"



