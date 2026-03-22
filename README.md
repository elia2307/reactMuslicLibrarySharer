Make android applicaiton using react native 
which allows for transfering music library from computer to phone 
but only transfering new files 
and will run converter on server side 



TODO:
cleanup android app, make buttons more unified and simplier to use 
add m3u playlist downloading (make full paths in playlist file get changed to relative paths 
in the download and make client side fix m3u file path)


Run 
To run client 
npx expo start

Server:
bun dev



compile app 
./musicSharerClient/android/gradlew assembleRelease
load into phone
adb install ./musicSharerClient/android/app/build/outputs/apk/release/app-release.apk
