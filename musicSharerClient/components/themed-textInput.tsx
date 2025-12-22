import { StyleSheet, TextInput,TextInputChangeEvent,useColorScheme, type TextInputProps} from 'react-native';
import {useState} from 'react';


import * as React from 'react';
const styles = StyleSheet.create({

    container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 20,
    lineHeight: 30,
  },
  lightContainer: {
    backgroundColor: '#d0d0c0',
  },
  darkContainer: {
    backgroundColor: '#242c40',
  },
  lightThemeText: {
    color: '#242c40',
  },
  darkThemeText: {
    color: '#d0d0c0',
  },
});

export function ThemedTextInput({...props}:TextInputProps)
{
    let colorScheme = useColorScheme();
    let themeTextStyle =  colorScheme==='light' ? styles.lightThemeText : styles.darkThemeText;
    if(props.placeholderTextColor === undefined){
        props.placeholderTextColor=themeTextStyle.color
    }
    return <TextInput style={[themeTextStyle,styles.text]} placeholderTextColor={themeTextStyle.color}{...props}/>
}




function isValidIpAddress(str:string){
    //checks if ip address up to point could become valid 
    //only ipv4
    let parts = str.split('.')
    if(parts.length > 4)return false
    for(let i in parts){
        let part = parts[i];
        if(part.length > 1 && part[0] == '0')return false
        try {
            if(!Number.isFinite(Number(part))){
                return false //not a number
            }
            let num = Number(part)
            if(num <0 || num >255)return false
        }
        catch {
            return false //error not a number
        }
    }
    return true
}



export function IpAddressInput({...props}:TextInputProps){
    let [ip, setIp] = useState({ipAddress:""});
    const validIpAddress = (text:string) => {
        if(!isValidIpAddress(text)){
            console.log("Invalid")
            text = text.substring(0,text.length-1)
        }
        setIp({ipAddress:text})
    }
    return <ThemedTextInput onChange={(text) => validIpAddress(text.nativeEvent.text)} value={ip.ipAddress} {...props}/>

}
