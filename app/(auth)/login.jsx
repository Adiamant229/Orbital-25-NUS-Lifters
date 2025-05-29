//react and expo imports
import { useState } from "react";
import {
  StyleSheet,
  Text,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
  Platform
} from "react-native";
import { Link, useRouter } from "expo-router";

//themed components
import { Colors } from "../../constants/colors";
import ThemedView from "../../components/themedView";
import ThemedText from "../../components/themedText";
import ThemedButton from "../../components/themedButton";
import Spacer from "../../components/spacer";
import ThemedTextInput from "../../components/themedTextInput";

//logo
import Logo from "../../assets/img/NUS_Lifters.png";

//firebase imports
import { auth } from "../../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";

const Login = () => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

  // Platform-specific spacer height
  const spacerHeight = Platform.OS === "ios" ? 10 : 3;
  const logoWidthAndHeight = Platform.OS === "ios" ? 350 : 330;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ThemedView style={styles.container}>
        <Image source={Logo} style={[styles.img, { width: logoWidthAndHeight, height: logoWidthAndHeight}]} />

        <Spacer height={spacerHeight} />

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
          <Text style={{ color: "#f2f2f2", fontWeight: "bold" }}>Login</Text>
        </ThemedButton>

        <Spacer height={spacerHeight} />

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

export const styles = StyleSheet.create({
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

  img: {
    width: 350,
    height: 350,
    resizeMode: "contain",
    borderRadius: 20,
    marginVertical: 10,
  },
});
