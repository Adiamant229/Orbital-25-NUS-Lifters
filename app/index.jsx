// react and expo imports
import { useEffect, useState } from "react";
import {
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from "react-native";
import { Link, useRouter } from "expo-router";

// firebase imports
import { auth } from "../firebaseConfig";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";

// themed components
import ThemedView from "../components/themedView";
import ThemedText from "../components/themedText";
import Spacer from "../components/spacer";
import ThemedTextInput from "../components/themedTextInput";
import ThemedButton from "../components/themedButton";

// logo
import Logo from "../assets/img/NUS_Lifters.png";

const Index = () => {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/gymCapacity");
      } else {
        setCheckingAuth(false);
      }
    });

    return unsubscribe;
  }, []);

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
      const user = userCredential.user;
      console.log("User signed in:", user.uid);
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

  if (checkingAuth) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  const spacerHeight = Platform.OS === "ios" ? 10 : 3;
  const logoWidthAndHeight = Platform.OS === "ios" ? 350 : 330;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
 
          <ThemedView style={styles.container}>
            <Image
              source={Logo}
              style={[
                styles.img,
                { width: logoWidthAndHeight, height: logoWidthAndHeight },
              ]}
            />
            <ThemedText style={{ fontSize: 16, fontStyle: "italic" }}>
              For the Lifters, By the Lifters in NUS
            </ThemedText>

            <Spacer height={spacerHeight} />

     

            <ThemedTextInput
              style={{ width: "80%", marginBottom: 20 }}
              placeholder="Email"
              keyboardType="email-address"
              placeholderTextColor={"grey"}
              onChangeText={setEmail}
              value={email}
            />

            <ThemedTextInput
              style={{ width: "80%", marginBottom: 20 }}
              placeholder="Password"
              placeholderTextColor={"grey"}
              onChangeText={setPassword}
              value={password}
              secureTextEntry
            />

            <ThemedButton onPress={handleSubmit}>
              <ThemedText style={{ color: "#f2f2f2", fontWeight: "bold" }}>
                Login
              </ThemedText>
            </ThemedButton>

            <Spacer height={spacerHeight} />

            <Link href="/signup">
              <ThemedText style={{ textAlign: "center" }}>
                Create new Account
              </ThemedText>
            </Link>
          </ThemedView>
    
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

export default Index;

export const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  title: {
    textAlign: "center",
    fontSize: 18,
    marginBottom: 30,
  },
  img: {
    resizeMode: "contain",
    borderRadius: 20,
    marginVertical: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
