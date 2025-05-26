import { StyleSheet, Alert, Text, Keyboard, TouchableWithoutFeedback } from "react-native";
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

const Signup = () => {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your username.");
      return;
    }
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Update displayName in Firebase Auth profile
      await updateProfile(user, {
        displayName: name,
      });

      // Save additional user info to Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
        createdAt: new Date(),
      });

      Alert.alert("Success", "Account created!");
      setName("");
      setEmail("");
      setPassword("");

      router.replace("/gymCapacity");
    } catch (error) {
      const errorCode = error.code;
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
      <ThemedView style={styles.container}>
        <Spacer />

        <ThemedText title={true} style={styles.title}>
          Create New Account
        </ThemedText>

        <ThemedTextInput
          style={{ width: "80%", marginBottom: 20 }}
          placeholder="Username"
          autoCapitalize="none"
          onChangeText={setName}
          value={name}
        />

        <ThemedTextInput
          style={{ width: "80%", marginBottom: 20 }}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          onChangeText={setEmail}
          value={email}
        />

        <ThemedTextInput
          style={{ width: "80%", marginBottom: 20 }}
          placeholder="Password"
          secureTextEntry
          onChangeText={setPassword}
          value={password}
        />

        <ThemedButton onPress={handleRegister} disabled={loading}>
          <Text style={{ color: "#f2f2f2" }}>
            {loading ? "Creating..." : "Create"}
          </Text>
        </ThemedButton>

        <Spacer height={10} />

        <Link href="/login">
          <ThemedText style={{ textAlign: "center" }}>Login instead</ThemedText>
        </Link>
      </ThemedView>
    </TouchableWithoutFeedback>
  );
};

export default Signup;

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
});
