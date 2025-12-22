import { StyleSheet, TextInput,useColorScheme, type TextInputProps} from 'react-native';
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


