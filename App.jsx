import 'react-native-gesture-handler';



/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useState, useEffect, createContext, useContext } from 'react';
import {
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  TextInput,
  Linking,
  Alert
} from 'react-native';

import Toast from 'react-native-toast-message';
import { NavigationContainer, useNavigation, StackActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TransitionPresets } from '@react-navigation/stack';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context'
import LinearGradient from 'react-native-linear-gradient';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import ImagePicker from 'react-native-image-crop-picker';
import DropShadow from "react-native-drop-shadow";

import { storeAccessToken, retrieveAccessToken, API_URL, fetchFadees, fetchUserData, fetchCreateFadee, errorToast } from "./manageAccessToken"

const LOGO_IMAGE = require("./images/logo.png")
const THREADS_LOGO_IMAGE = require("./images/threads-logo.png")
const WHITE_X_ICON = require("./images/x.png")
const Stack = createNativeStackNavigator();

let cachedAccessToken = null
const AppContext = createContext(1)

function AppStack({setCreatedFadeePopup, cachedFollowerCount, setCachedFollowerCount, cachedFadees, setCachedFadees, pickedImage, setPickedImage, fadeeOptions, setFadeeOptions, openHomeScreen}) {
  const navigation = useNavigation()

  function openHomeScreen(reloadFetch = true) {
    // fetch follower count & other user data
    navigation.dispatch(
      StackActions.replace("Home")
    );
    if(reloadFetch) {
      fetchUserData(cachedAccessToken).then(userData => {
        setCachedFollowerCount(userData.cached_follower_count)
      })
    }
    
  }

  useEffect(() => {
    retrieveAccessToken().then(accessToken => {
      if(accessToken) {
        cachedAccessToken = accessToken
        openHomeScreen()
      } else {
        navigation.navigate("Intro")
      }
    })
  }, [])

  return <Stack.Navigator screenOptions={{...TransitionPresets.SlideFromRightIOS, navigationBarColor: "black"}}>
    <Stack.Screen name="Intro" component={IntroScreen} options={{headerShown: false}}/>
    <Stack.Screen name="Connect" options={{headerShown: false, animation: "slide_from_right"}}>
      {(props) => <ConnectScreen {...props} openHomeScreen={openHomeScreen}></ConnectScreen>}
    </Stack.Screen>
    <Stack.Screen name="Home" options={{headerShown: false, animation: "slide_from_right"}}>
      {(props) => <HomeScreen {...props} cachedFollowerCount={cachedFollowerCount} cachedFadees={cachedFadees} setCachedFadees={setCachedFadees}></HomeScreen>}
    </Stack.Screen>
    <Stack.Screen name="New Fadee (Step 1)" options={{headerShown: false, animation: "slide_from_bottom"}}>
      {(props) => <NewFadee1Screen {...props} pickedImage={pickedImage} setPickedImage={setPickedImage}></NewFadee1Screen>}
    </Stack.Screen>
    <Stack.Screen name="New Fadee (Step 2)" options={{headerShown: false, animation: "slide_from_right"}}>
      {(props) => <NewFadee2Screen {...props} setCreatedFadeePopup={setCreatedFadeePopup} cachedFadees={cachedFadees} setCachedFadees={setCachedFadees} pickedImage={pickedImage} cachedFollowerCount={cachedFollowerCount} fadeeOptions={fadeeOptions} setFadeeOptions={setFadeeOptions}></NewFadee2Screen>}
    </Stack.Screen>
  </Stack.Navigator>
}

function FollowersProgressBar({fadee, cachedFollowerCount}) {
  
  let followerGoalDistanceTotal = fadee.follower_goal - fadee.created_at_follower_count
  let followerGoalDistanceNow = fadee.follower_goal - cachedFollowerCount
  let followerGoalLeftFraction = followerGoalDistanceNow / followerGoalDistanceTotal
  let followerGoalCompletedFraction = 1 - followerGoalLeftFraction
  let followerGoalCompleted = followerGoalDistanceTotal - followerGoalDistanceNow
  let followerGoalLeft = followerGoalDistanceTotal - followerGoalCompleted



  return <View style={{...styles.followersProgressBar.container, marginTop: 10}}>
    
    <View style={{...styles.followersProgressBar.thumb, left: followerGoalCompletedFraction * 100 + "%", top: 15, zIndex: 10, elevation: 10, transform: [{translateX: -15}, {translateY: -15}]}}>

    </View>
    <LinearGradient useAngle={true} angle={-90} angleCenter={{x:0.5,y:0.5}} style={{...styles.followersProgressBar.completedPart, position: "relative", zIndex: 1, width: followerGoalCompletedFraction * 100 + "%"}} colors={["#F9CE34", "#EE2A7B", "#6228D7"]}/>
    <View style={{...styles.followersProgressBar.leftPart, width: followerGoalLeftFraction * 100 + "%"}}/>
    
  </View>
}

function NewFadee2Screen({openHomeScreen, navigation, cachedFadees, setCachedFadees, fadeeOptions, setFadeeOptions, cachedFollowerCount, pickedImage, setCreatedFadeePopup}) {
  let columnWidth = Dimensions.get("window").width - 40
  /* useEffect(() => {
    setFadeeOptions({
      ...fadeeOptions,
      followerGoal: Math.max(fadeeOptions.followerGoal || 1, cachedFollowerCount + 1)
    })
  }, [cachedFollowerCount]) */

  return <View style={styles.fadee2.container}>
    <SafeAreaView style={styles.fadee2.safeContainer}>
      <View style={{...styles.topContainer, ...styles.topContainerFadee.topContainer}}>
        <TouchableOpacity style={styles.topContainerFadee.topWhiteCloseXButton} onPress={() => {
          navigation.popToTop()
        }}>
          <Image source={WHITE_X_ICON} style={styles.topContainerFadee.topWhiteCloseX}/>
        </TouchableOpacity>
        <Text style={styles.topContainerFadee.topText}>New Fadee</Text>
        
      </View>

      <View style={styles.fadeeGuide.container}>
        <Text style={styles.fadeeGuide.title}>
          Step 2: Set a follower goal
        </Text>
        <View style={{...styles.fadee2.followerCountContainer, width: columnWidth}}>
          <Text style={styles.fadee2.followerCountLabel}>Current:</Text>
          <Text style={styles.fadee2.followerCount}>
            {cachedFollowerCount}
          </Text>
        </View>
        <TextInput style={{...styles.defaultInput, width: columnWidth, marginTop: 20}} keyboardType="numeric" placeholder="Goal" placeholderTextColor="rgba(0, 0, 0, 0.5)"  value={fadeeOptions.followerGoal ? fadeeOptions.followerGoal.toString() : ""} onChangeText={text => {
          setFadeeOptions({
            ...fadeeOptions,
            followerGoal: parseInt(text) || 0
          })
        }} onEndEditing={() => {
          console.log("END EDITING")
        }}/>
      </View>

      <TouchableOpacity disabled={(fadeeOptions.followerGoal == null || fadeeOptions.followerGoal == 0 || fadeeOptions.followerGoal <= cachedFollowerCount)} style={{...styles.gradientButton.container, width: Dimensions.get("window").width - 40}} onPress={() => {
        fetchCreateFadee(cachedAccessToken, pickedImage, fadeeOptions).then(response => {
          if(!response) return

          if(response.status == "ok") {
            let fadee = response.fadee
            setCachedFadees([...cachedFadees, fadee])
            setCreatedFadeePopup(fadee);
            navigation.dispatch(
              StackActions.replace("Home")
            );
          } else {
            errorToast()
          }
        })
      }}>
        <LinearGradient useAngle={true} angle={300} angleCenter={{x:0.5,y:0.5}} style={{...styles.gradientButton.gradient, opacity: (fadeeOptions.followerGoal == null || fadeeOptions.followerGoal == 0 || fadeeOptions.followerGoal <= cachedFollowerCount) ? 0.7 : 1}} colors={["#F9CE34", "#EE2A7B", "#6228D7"]}>
          <Text style={styles.gradientButton.text}>Done!</Text>
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  </View>
}

function NewFadee1Screen({navigation, pickedImage, setPickedImage}) {
  function openImageMenu() {
    ImagePicker.openPicker({
      mediaType: "photo",
      //width: 600,
      //height: 315,
      cropping: false
    }).then(async selectedImage => {
      let image = await ImagePicker.openCropper({
        path: selectedImage.path,
        width: 600, 
        height: 315, 
      })      
      let asset = {type: image.mime, uri: image.path}
      // console.log(image)
      setPickedImage(asset)
      navigation.navigate("New Fadee (Step 2)")
    }).catch(error => {
      console.log(error)
    })
  }

  return <View style={styles.fadee1.container}>
    <SafeAreaView style={styles.fadee1.safeContainer}>
      <View style={{...styles.topContainer, ...styles.topContainerFadee.topContainer}}>
        <TouchableOpacity style={styles.topContainerFadee.topWhiteCloseXButton} onPress={() => {
          navigation.popToTop()
        }}>
          <Image source={WHITE_X_ICON} style={styles.topContainerFadee.topWhiteCloseX}/>
        </TouchableOpacity>
        <Text style={styles.topContainerFadee.topText}>New Fadee</Text>
        
      </View>

      <View style={styles.fadeeGuide.container}>
        <Text style={styles.fadeeGuide.title}>
          Step 1: Pick an image (1.91:1)
        </Text>
        <Text style={styles.fadeeGuide.subtitle}>
          At first, will be blurred but will get clearer as long as you're getting followers
        </Text>
      </View>

      <TouchableOpacity style={{...styles.gradientButton.container, width: Dimensions.get("window").width - 40}} onPress={() => {
        openImageMenu()
      }}>
        <LinearGradient useAngle={true} angle={300} angleCenter={{x:0.5,y:0.5}} style={styles.gradientButton.gradient} colors={["#F9CE34", "#EE2A7B", "#6228D7"]}>
          <Text style={styles.gradientButton.text}>
            Choose from camera roll
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  </View>
}

function HomeScreen({navigation, cachedFadees, setCachedFadees, cachedFollowerCount}) {
  const [fadeesMessageMiddle, setFadeesMessageMiddle] = useState("loading")

  const columnWidth = Dimensions.get("window").width - 40

  useEffect(() => {
    if(cachedFadees) {
      if(cachedFadees.length > 0) {
        setFadeesMessageMiddle(null)
      } else {
        setFadeesMessageMiddle("no-fadees")
      }
    } else {
      setFadeesMessageMiddle("loading")
    }
  }, [cachedFadees])

  useEffect(() => {
    console.log("FETCHING FADEES!")
    fetchFadees(cachedAccessToken).then(fadees => {
      setCachedFadees(fadees)
    })
  }, [])

  let realFadeesMessage = "Loading..."
  switch(fadeesMessageMiddle) {
    case "loading":
      realFadeesMessage = "Loading your Fadees..."
      break
    case "no-fadees":
      realFadeesMessage = `You don't have any Fadees yet!

Create one below & reach your follower goals quicker.`
      break
    case null:
      realFadeesMessage = ""
  }

  
  return <View style={styles.homeScreen.container}>
    <SafeAreaView style={styles.homeScreen.safeContainer}>
      <View style={styles.topContainer}>
        <Image source={LOGO_IMAGE} style={styles.homeScreen.logoTop}/>
      </View>
      {cachedFadees && cachedFadees.length
        ? <FlatList style={{...styles.homeScreen.fadeesContainer, width: columnWidth, height: "90%"}} data={cachedFadees} keyExtractor={item => item.id} renderItem={fadee => {
            fadee = fadee.item
            let followerGoalDistanceTotal = fadee.follower_goal - fadee.created_at_follower_count
          let followerGoalDistanceNow = fadee.follower_goal - cachedFollowerCount
/*           let followerGoalLeftFraction = followerGoalDistanceNow / followerGoalDistanceTotal
          let followerGoalCompletedFraction = 1 - followerGoalLeftFraction
 */          let followerGoalCompleted = followerGoalDistanceTotal - followerGoalDistanceNow
          let followerGoalLeft = followerGoalDistanceTotal - followerGoalCompleted
            return <View style={styles.homeScreen.fadee.container}>
              <Image source={{uri: getFadeeImageUrl(fadee.id)}} style={styles.homeScreen.fadee.image}></Image>
              <FollowersProgressBar fadee={fadee} cachedFollowerCount={cachedFollowerCount}/>
              <Text style={{textAlign: "center", color: "black", fontFamily: "Inter-Black"}}>{cachedFollowerCount}/{fadee.follower_goal} followers</Text>
              <TouchableOpacity style={styles.homeScreen.shareButton.container} onPress={() => {
                openThreadsCreatePost(`Image will fully unblur at ${fadee.follower_goal} followers! ${API_URL}/${fadee.beautiful_id}`)
              }}>
                <Text style={styles.homeScreen.shareButton.text}>Share</Text>
                <Image source={THREADS_LOGO_IMAGE} style={styles.homeScreen.shareButton.image}/>
              </TouchableOpacity>
            </View>
          }} ListFooterComponent={<Text key="ex" style={styles.homeScreen.createMoreBelowText}>Create more Fadees below!</Text>}>
        </FlatList>
        : null}
    </SafeAreaView>
    <View style={styles.homeScreen.fadeesMessageContainer}>
      {
        fadeesMessageMiddle
          ? <Text style={styles.homeScreen.fadeesMessage}>
              {realFadeesMessage}
            </Text>
          : null
      }
      
    </View>
    <LinearGradient colors={["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.5)"]} style={{position: "absolute", bottom: 0, left: 0, width: "100%", height: 300, pointerEvents: "none"}}></LinearGradient>
    <TouchableOpacity style={{...styles.gradientButton.container, width: Dimensions.get("window").width - 40}} onPress={() => {
      navigation.navigate("New Fadee (Step 1)")
    }}>
      <LinearGradient useAngle={true} angle={300} angleCenter={{x:0.5,y:0.5}} style={styles.gradientButton.gradient} colors={["#F9CE34", "#EE2A7B", "#6228D7"]}>
        <Text style={styles.gradientButton.text}>
          New
        </Text>
        <Image source={LOGO_IMAGE} style={styles.gradientButton.logo}/>
      </LinearGradient>
    </TouchableOpacity>
    
  </View>
}

function ConnectScreen({navigation, openHomeScreen}) {
  const [text, setText] = useState("@")

  return <View style={styles.connectScreen.container}>
    <KeyboardAvoidingView style={styles.connectScreen.innerContainer}>
      <Image source={LOGO_IMAGE} style={styles.connectScreen.logoTop}/>
      <View style={styles.connectScreen.middleContainer}>
        <Text style={styles.connectScreen.inputSubtitle}>What's your Threads/IG @?</Text>
        <TextInput style={{...styles.defaultInput, width: Dimensions.get("window").width - 60}} value={text} onChangeText={function(newValue) {
          newValue = "@" + newValue.replaceAll("@", "")
          setText(newValue)
        }}></TextInput>
      </View>
      <TouchableOpacity style={styles.connectScreen.continueButton} disabled={text == "@"} onPress={async function() {
        let rawResponse = await fetch(API_URL + "/api/create-access-token?username=" + text.replace("@", ""))
        let response = await rawResponse.json()
        

        if(response.status == "ok") {
          cachedAccessToken = response.userData.fadee_access_token
          await storeAccessToken(response.userData.fadee_access_token);
          openHomeScreen()
        } else {
          console.log(response)
          Toast.show({
            type: 'error',
            text1: "Can't find this username 🤔",
            text2: "Make sure this is a real @ on Threads"
          });
        }
      }}>
        <Text style={{...styles.connectScreen.continueButtonText, opacity: text == "@" ? 0.7 : 1}}>Start doing magic</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  </View>
}

function IntroScreen({navigation}) {
  return <View style={styles.introScreen.container}>
    <Image source={LOGO_IMAGE} style={styles.introScreen.logo}/>
    <Text style={styles.introScreen.subtitle}>
      Reach your follower goals faster on <Text style={styles.introScreen.bold}>Threads</Text>
    </Text>
    <TouchableOpacity style={{...styles.introScreen.button.container, width: Dimensions.get("window").width - 40}} onPress={function() {
      navigation.navigate("Connect")
      console.log("ASD")
    }}>
      <Text style={styles.introScreen.button.text}>Get started</Text>
      <Image source={THREADS_LOGO_IMAGE} style={styles.introScreen.button.image} />
    </TouchableOpacity>
  </View>
}


function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [cachedFadees, setCachedFadees] = useState(null)
  const [cachedFollowerCount, setCachedFollowerCount] = useState(null)
  const [pickedImage, setPickedImage] = useState(null)
  const [fadeeOptions, setFadeeOptions] = useState({
    followerGoal: null,
    pixelatePicture: false
  })
  const [createdFadeePopup, setCreatedFadeePopup] = useState(null)

  

  return (
    <>
      <NavigationContainer>
        <AppStack createdFadeePopup={createdFadeePopup} setCreatedFadeePopup={setCreatedFadeePopup} cachedFollowerCount={cachedFollowerCount} setCachedFollowerCount={setCachedFollowerCount} fadeeOptions={fadeeOptions} setFadeeOptions={setFadeeOptions} cachedFadees={cachedFadees} setCachedFadees={setCachedFadees} pickedImage={pickedImage} setPickedImage={setPickedImage}/>
      </NavigationContainer>
      <Toast/>
      <StatusBar backgroundColor="#000000"></StatusBar>
    </>
  );
}

async function openThreadsCreatePost(text="hahaha") {
  const url = `barcelona://create?text=${text}`
  await Linking.openURL(url)
}

const styles = StyleSheet.create({
  introScreen: {
    container: {
      backgroundColor: "black",
      width: "100%",
      height: "100%",
      paddingTop: 60,
      display: "flex",
      alignItems: "center",
    },
    logo: {
      width: "80%",
      resizeMode: 'contain',
    },
    subtitle: {
      color: "white",
      fontFamily: 'Inter-Regular',
      fontSize: 18,
      textAlign: "center",
      marginTop: -20,
      maxWidth: "80%"
    },
    bold: {
      fontFamily: "Inter-Bold"
    },
    button: {
      container: {
        position: "absolute",
        bottom: 50,
        left: 20,
        backgroundColor: "#222222",
        borderColor: "#9D9D9D",
        borderWidth: 2,
        height: 70,
        display: "flex",
        padding: 10,
        borderRadius: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        paddingLeft: 15,
        paddingRight: 15,
        alignItems: "center"
      },
      image: {
        height: 50,
        width: 50,
        borderRadius: 5 
      },
      text: {
        fontFamily: "Inter-Regular",
        fontSize: 18,
        color: "rgba(255, 255, 255, 0.9)"
      }
    }
  },
  connectScreen: {
    container: {
      backgroundColor: "black",
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center"
    },
    innerContainer: {
      paddingTop: 50,
      paddingBottom: 50,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      height: 400
    },
    logoTop: {
      height: 60,
      resizeMode: 'contain',
    },
    inputSubtitle: {
      color: "white",
      fontFamily: "Inter-Regular",
      fontSize: 20,
      marginBottom: 20,
      textAlign: "center"
    },
    continueButtonText: {
      fontFamily: "Inter-Bold",
      color: "white",
      fontSize: 20
    }
  },
  homeScreen: {
    createMoreBelowText: {
      color: "white",
      fontFamily: "Inter-Medium",
      fontSize: 18,
      width: "100%",
      textAlign: "center",
      marginBottom: 150
    },
    container: {
      backgroundColor: "black",
      width: "100%",
      height: "100%"
    },
    safeContainer: {
      display: "flex",
      height: "100%",
      alignItems: "center"
    },
    logoTop: {
      height: "60%",
      resizeMode: "contain"
    },
    fadeesMessageContainer: {
      position: "absolute",
      width: "100%",
      height: "100%",
      top: 0,
      left: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    fadeesMessage: {
      width: "80%",
      color: "white",
      fontFamily: "Inter-Medium",
      fontSize: 18,
      textAlign: "center"
    },
    fadeesContainer: {
      display: "flex",
      flex: 1,
      marginTop: 25
    },
    fadee: {
      container: {
        display: "flex",
        padding: 10,
        width: "100%",
        minHeight: 50,
        backgroundColor: "white",
        width: "100%",
        marginBottom: 20,
        borderRadius: 15
      },
      image: {
        width: "100%",
        aspectRatio: 1.91 / 1,
        borderRadius: 8
      }
    },
    shareButton: {
      container: {
        backgroundColor: "black",
        width: "100%",
        height: 50,
        borderRadius: 10,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingLeft: 15,
        paddingRight: 15,
        marginTop: 7.5
      },
      text: {
        color: "white",
        fontFamily: "Inter-Regular",
        fontSize: 18
      },
      image: {
        height: 30,
        width: 30,
        resizeMode: "contain",
        borderWidth: 1,
        borderColor: "white",
        borderRadius: 5,
      }
    }
  },
  gradientButton: {
    container: {
      position: "absolute",
      bottom: 50,
      left: 20,
      height: 70
    },
    gradient: {
      borderRadius: 1000,
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row"
    },
    logo: {
      resizeMode: "contain",
      width: 80,
      marginLeft: 10
    },
    text: {
      color: "white",
      fontFamily: "Inter-SemiBold",
      fontSize: 22,
      margin: 0,
    }
  },
  fadee1: {
    container: {
      backgroundColor: "black",
      width: "100%",
      height: "100%"
    },
    safeContainer: {
      display: "flex",
      height: "100%"
    }
  },
  topContainer: {
    width: "100%",
    height: 60,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    borderBottomWidth: 4,
    borderColor: "white"
  },
  topContainerFadee: {
    topWhiteCloseXButton: {
      height: "100%",
      aspectRatio: 1 / 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    topWhiteCloseX: {
      height: 20,
      width: 20,
      resizeMode: "contain"
    },
    topContainer: {
      justifyContent: "flex-start"
    },
    topText: {
      color: "white",
      fontSize: 18,
      fontFamily: "Inter-Medium"
    }
  },
  fadeeGuide: {
    container: {
      display: "flex",
      width: "100%",
      paddingTop: 60,
      alignItems: "center"
    },
    title: {
      color: "white",
      fontSize: 24,
      fontFamily: "Inter-SemiBold",
      marginBottom: 10,
    },
    subtitle: {
      color: "rgba(255, 255, 255, 0.8)",
      fontSize: 16,
      fontFamily: "Inter-Regular",
      marginTop: 2,
      width: "90%",
      textAlign: "center"
    }
  },
  fadee2: {
    container: {
      backgroundColor: "black",
      width: "100%",
      height: "100%"
    },
    safeContainer: {
      display: "flex",
      height: "100%"
    },
    followerCountContainer: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    followerCountLabel: {
      color: "white",
      fontFamily: "Inter-Regular",
      fontSize: 22
    },
    followerCount: {
      color: "white",
      fontFamily: "Inter-Regular",
      fontSize: 22
    }
  },
  defaultInput: {
    backgroundColor: "white",
    borderRadius: 100,
    textAlign: "center",
    color: "black",
    fontFamily: "Inter-SemiBold",
    fontSize: 18,
    height: 55
  },
  followersProgressBar: {
    container: {
      width: "100%",
      paddingTop: 5,
      paddingBottom: 5,
      height: 30,
      display: "flex",
      flexDirection: "row"
    },
    leftPart: {
      height: "100%",
      backgroundColor: "#D9D9D9",
      borderTopRightRadius: 100,
      borderBottomRightRadius: 100,
    },
    completedPart: {
      height: "100%",
      borderTopLeftRadius: 100,
      borderBottomLeftRadius: 100
    },
    thumb: {
      borderRadius: 100,
      width: 30,
      height: 30,
      backgroundColor: "white",
      borderWidth: 1,
      position: "absolute"
    },
    progressText: {
      fontFamily: "Inter-Black",
      //fontStyle: "italic"
      color: "white",
      fontSize: 18,
    }
  }
});

function getFadeeImageUrl(id) {
  return `https://storage.googleapis.com/fadees/${id}`
}

export default App;
