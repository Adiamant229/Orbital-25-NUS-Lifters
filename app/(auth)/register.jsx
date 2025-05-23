import { StyleSheet, Alert, Text } from "react-native";
import { useState } from "react";
import { Link } from "expo-router";

//themed components
import ThemedView from "../../components/themedView";
import ThemedText from "../../components/themedText";
import ThemedButton from "../../components/themedButton";
import Spacer from "../../components/spacer";
import ThemedTextInput from "../../components/themedTextInput";

//backend
import { auth } from "../../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
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
      console.log("User signed up successfully:", user.uid);
      Alert.alert("Success", "Account created!");
      setEmail("");
      setPassword("");
      // TODO: Navigate to main app or login page after successful registration
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
    <ThemedView style={styles.container}>
      <Spacer />

      <ThemedText title={true} style={styles.title}>
        Register For an Account
      </ThemedText>

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
          {loading ? "Registering..." : "Register"}
        </Text>
      </ThemedButton>

      <Spacer height={100} />

      <Link href="/login">
        <ThemedText style={{ textAlign: "center" }}>Login</ThemedText>
      </Link>
    </ThemedView>
  );
};

export default Register;

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
