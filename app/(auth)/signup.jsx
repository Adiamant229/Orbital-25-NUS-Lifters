//react and expo imports
import {
  StyleSheet,
  Alert,
  Text,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useState } from "react";
import { Link, useRouter } from "expo-router";

// Themed components
import ThemedView from "../../components/themedView";
import ThemedText from "../../components/themedText";
import ThemedButton from "../../components/themedButton";
import Spacer from "../../components/spacer";
import ThemedTextInput from "../../components/themedTextInput";

// Firebase imports
import { auth, db } from "../../firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

//logo
import Logo from "../../assets/img/NUS_Lifters.png";

const Signup = () => {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const spacerHeight = Platform.OS === "ios" ? 10 : 3;
  const logoWidthAndHeight = Platform.OS === "ios" ? 280 : 240;

  const validateEmail = (email) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your username.");
      return;
    }
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password should be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: name,
      });

      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        createdAt: new Date(),
      });

      Alert.alert("Success", "Account created!");
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      router.replace("/gymCapacity");
    } catch (error) {
      const errorCode = error?.code ?? "unknown_error";
      console.error("Sign-up error:", errorCode);

      let userFacingMessage = "An error occurred during sign up.";
      if (errorCode === "auth/email-already-in-use") {
        userFacingMessage = "This email address is already in use.";
      } else if (errorCode === "auth/invalid-email") {
        userFacingMessage = "Please enter a valid email address.";
      } else if (errorCode === "auth/weak-password") {
        userFacingMessage = "Password should be at least 6 characters.";
      }
      Alert.alert("Sign Up Failed", userFacingMessage);
    } finally {
      setLoading(false);
    }
  };

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

          <ThemedText title={true} style={styles.title}>
            Create New Account
          </ThemedText>

          <ThemedTextInput
            placeholder="Username"
            placeholderTextColor={"grey"}
            onChangeText={setName}
            value={name}
          />

          <ThemedTextInput
            placeholder="Email"
            placeholderTextColor={"grey"}
            keyboardType="email-address"
            onChangeText={setEmail}
            value={email}
          />

          <ThemedTextInput
            placeholder="Password"
            placeholderTextColor={"grey"}
            secureTextEntry
            onChangeText={setPassword}
            value={password}
            textContentType="password"
            autoComplete="password"
          />

          <ThemedTextInput
            placeholder="Confirm Password"
            placeholderTextColor={"grey"}
            secureTextEntry
            onChangeText={setConfirmPassword}
            value={confirmPassword}
            textContentType="oneTimeCode"
            autoComplete="off"
          />

          <ThemedButton onPress={handleRegister} disabled={loading}>
            <Text style={{ color: "#f2f2f2", fontWeight: "bold" }}>
              {loading ? "Creating..." : "Create"}
            </Text>
          </ThemedButton>

          <Spacer height={spacerHeight} />

          <Link href="/">
            <ThemedText style={{ textAlign: "center" }}>
              Login instead
            </ThemedText>
          </Link>
        </ThemedView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

export default Signup;

const styles = StyleSheet.create({
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
    marginBottom: 20,
  },
  img: {
    resizeMode: "contain",
    borderRadius: 20,
    marginVertical: 10,
  },
});
