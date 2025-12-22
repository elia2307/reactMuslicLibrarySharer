import { StyleSheet, Button ,useColorScheme, type ButtonProps} from 'react-native';


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

export function ThemedButton({...props}:ButtonProps)
{
    //let colorScheme = useColorScheme();
    //let themeTextStyle =  colorScheme==='light' ? styles.lightThemeText : styles.darkThemeText;
    return <Button {...props}/>
}


