import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const API_URL = "https://f.periphern.com"  // "https://grubworm-expert-sawfly.ngrok-free.app" // "http://192.168.0.141:443"


async function storeAccessToken(accessToken) {
  try {
    await AsyncStorage.setItem('access-token', accessToken);
    Toast.show({
      type: 'success',
      text1: 'Successfully signed in!',
    });
  } catch (e) {
    console.log(e)
    errorToast()  
  }
}

async function retrieveAccessToken() {
  try {
    let accessToken = await AsyncStorage.getItem("access-token")
    return accessToken
  } catch(e) {
    console.log(e)
    errorToast()
  }
}

async function fetchFadees(cachedAccessToken) {
  console.log("THIS 1")
  var request = new XMLHttpRequest();
  request.onreadystatechange = e => {
    console.log(request.responseText)
  }
  request.open("GET", API_URL)
  request.send()
  let rawFadees = await fetch(API_URL + "/api/my-fadees" , {
    headers: {
      "Authorization": cachedAccessToken
    }
  }).catch(error => {
    console.log("ERRO!")
  })
  console.log("THIS 2")
  
  let fadees = await rawFadees.json()
  if(fadees.status == "ok") {
    return fadees.fadees
  } else {
    errorToast()
  }
}

async function fetchUserData(cachedAccessToken) {
  let rawResponse = await fetch(API_URL + "/api/my-user-data", {
    headers: {
      "Authorization": cachedAccessToken
    }
  })

  let response = await rawResponse.json()
  if(response.status == "ok") {
    return response.userData
  } else {
    errorToast()
  }
}

async function fetchCreateFadee(cachedAccessToken, file, options) {
  let requestFormData = new FormData()
  requestFormData.append("file", {uri: file.uri, type: file.type, name: "fadee"})
  requestFormData.append("follower_goal", options.followerGoal)


  let rawResponse = await fetch(API_URL + "/api/create-fadee", {
    method: "POST",
    headers: {
      "Authorization": cachedAccessToken,
      "Content-Type": "multipart/form-data",
      "Accept": "application/json"
    },
    body: requestFormData
  })
  let response = await rawResponse.json()
  return response
}

function errorToast() {
  Toast.show({
    type: 'error',
    text1: 'An error occurred',
    text2: "Try reloading/updating the app"
  });
}

export {
  storeAccessToken,
  errorToast,
  retrieveAccessToken,
  fetchFadees,
  fetchUserData,
  fetchCreateFadee,
  API_URL
}