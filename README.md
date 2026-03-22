A full stack application which allows for syncronising music libraries between devices, and between different formats such as flac and mp3 files.
3 main sections library converter which is a command line application written in rust which allows for syncronising music libraries and playlists.
Music sharer client which is a react native android application which syncronises a music library between the phone and the server ip address
Server which is a bun web server which allows for downloading and fetching files from the computer.


## Library Converter 
Library converter requires ffmpeg to be installed, and cargo to compile the program. The script build.sh will build the program an install as the command syncMusic which is the format the web server assumes. 
Functionality 
Playlist converter, will convert playlists from a sqlite file to m3u files with metadata fetched from the music files, the database format requies a table called playlists which has an id column and a name column, and a second table called tracks, which has atleast 2 fields, playlist_id which is the id for the playlist and uri which is the path for the item in the playlist, any extra columns or tables will not affect the running of the program.
Convert libaries, will convert from a library in flac or mp3 files into a separate library only containg mp3 files, the function will also convert the m3u files in the library to link to the new mp3 library, will break playlists if the m3u files link to external music files outside the libary.
remove leftover files, will remove leftover files from the compressed library that no longer exist in the uncompressed original library
convert loop, which runs the convert libraries function repeatedly to allow for new files to automatically get converted.

## Music Sharer Client 
A react native appliction using expo go which allows for an android phone to download files to the local storage of the phone in desired folders, relies on functionality in the bun webserver and the library converter to allow for syncronising of files.

## Bun Web Server
Allows for getting lists of files available, has support for 2 libaries compressed and uncompressed, can pass a list of files from the local phone and will respond with which files are missing, abstracts actual path of files and validates downloading of files so that only files in the library folder can be downloaded. Symlinks in the libaries will be followed so a symlink from the library will result in entire home directory being accessabile, also allows for calling of the libary converter by an end point to make sure libaries are syncronised.

Make android applicaiton using react native 
which allows for transfering music library from computer to phone 
but only transfering new files 
and will run converter on server side 


compile app 
./musicSharerClient/android/gradlew assembleRelease
load into phone
adb install ./musicSharerClient/android/app/build/outputs/apk/release/app-release.apk




TODO <br>
Add config file support for library converter, to allow saving default paths<br>
Add button in musicSharerClient to allow for force redownloading playlist folder<br>
Add functionality in library converter to overwrite playlists folder in compressed library for convert<br>
Make sure symlinks are handled properly <br>
Add password verification for web server downloading of files <br>
Add env variables for web server for library locations or config files
