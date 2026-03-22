
compiled_location="./library_converter/target/release/library_converter"
(cd library_converter; cargo build -r)
#cp $compiled_location  server/library_converter

cp $compiled_location ~/.local/bin/syncMusic 
