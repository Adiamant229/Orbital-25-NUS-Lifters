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

export function capWords(x) {
  for (let i = 0; i < x.length; i++) {
    x[i] = x[i].charAt(0).toUpperCase() + x[i].substring(1);
  }
  return x;
}

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

    return () => unsubscribe();
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
        password,
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
  const logoSize = Platform.OS === "ios" ? 350 : 330;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flexContainer}
      >
        <ThemedView style={styles.container}>
          <Image
            source={Logo}
            style={[styles.logo, { width: logoSize, height: logoSize }]}
          />

          <ThemedText style={styles.tagline}>
            For the Lifters, By the Lifters in NUS
          </ThemedText>

          <Spacer height={spacerHeight} />

          <ThemedTextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            placeholderTextColor={"grey"}
            onChangeText={setEmail}
            value={email}
          />

          <ThemedTextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={"grey"}
            onChangeText={setPassword}
            value={password}
            secureTextEntry
          />

          <ThemedButton onPress={handleSubmit}>
            <ThemedText style={styles.buttonText}>Login</ThemedText>
          </ThemedButton>

          <Spacer height={spacerHeight} />

          <Link href="/signup" style={styles.link}>
            <ThemedText>Create new Account</ThemedText>
          </Link>
        </ThemedView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

export default Index;

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  logo: {
    resizeMode: "contain",
    borderRadius: 20,
    marginVertical: 10,
  },
  tagline: {
    fontSize: 16,
    fontStyle: "italic",
    textAlign: "center",
  },
  input: {
    width: "80%",
    marginBottom: 20,
  },
  buttonText: {
    color: "#f2f2f2",
    fontWeight: "bold",
  },
  link: {
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
