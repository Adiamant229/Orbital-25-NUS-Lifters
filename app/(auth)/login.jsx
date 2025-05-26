import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { Colors } from "../../constants/colors";

// Themed components
import ThemedView from "../../components/themedView";
import ThemedText from "../../components/themedText";
import ThemedButton from "../../components/themedButton";
import Spacer from "../../components/spacer";
import ThemedTextInput from "../../components/themedTextInput";

// Firebase Auth
import { auth } from "../../firebaseConfig";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signInWithCredential,
  GoogleAuthProvider,
} from "firebase/auth";

// Google sign-in
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";

WebBrowser.maybeCompleteAuthSession();

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Google Auth request setup
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: "YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com",
    iosClientId: "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com",
    androidClientId: "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com",
    webClientId: "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com", // enable "Web" in Firebase
  });

  // Redirect signed-in users automatically
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/gymCapacity");
      }
    });
    return unsubscribe;
  }, []);

  // Handle Google login response
  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.authentication;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then((userCredential) => {
          console.log("Google login successful:", userCredential.user.uid);
          router.replace("/gymCapacity");
        })
        .catch((error) => {
          console.error("Google Sign-In error:", error);
          Alert.alert("Login Error", "Failed to sign in with Google.");
        });
    }
  }, [response]);

  // Handle Email/Password login
  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("User signed in:", userCredential.user.uid);
      setEmail("");
      setPassword("");
      router.replace("/gymCapacity");
    } catch (error) {
      console.error("Login error:", error.code, error.message);
      let message = "Failed to login.";
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        message = "Invalid email or password.";
      } else if (error.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      }
      Alert.alert("Login Error", message);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ThemedView style={styles.container}>
        <Spacer />

        <ThemedText title={true} style={styles.title}>
          Login to Your Account
        </ThemedText>

        <ThemedTextInput
          style={{ width: "80%", marginBottom: 20 }}
          placeholder="Email"
          keyboardType="email-address"
          onChangeText={setEmail}
          value={email}
        />

        <ThemedTextInput
          style={{ width: "80%", marginBottom: 20 }}
          placeholder="Password"
          onChangeText={setPassword}
          value={password}
          secureTextEntry
        />

        <ThemedButton onPress={handleSubmit}>
          <Text style={{ color: "#f2f2f2" }}>Login</Text>
        </ThemedButton>

        <Spacer height={10} />

        <ThemedButton onPress={() => promptAsync()} disabled={!request}>
          <Text style={{ color: "#f2f2f2" }}>Login with Google</Text>
        </ThemedButton>

        <Spacer height={10} />

        <Link href="/signup">
          <ThemedText style={{ textAlign: "center" }}>
            Create new Account
          </ThemedText>
        </Link>
      </ThemedView>
    </TouchableWithoutFeedback>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    textAlign: "center",
    fontSize: 18,
    marginBottom: 30,
  },

  btn: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 5,
  },

  pressed: {
    opacity: 0.8,
  },
});
