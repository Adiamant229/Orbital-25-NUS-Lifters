// app/index.tsx
import { useEffect, useState } from "react";
import { TouchableOpacity, StyleSheet, Image, Text } from "react-native";
import { Link, useRouter } from "expo-router";

import { auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

import ThemedView from "../components/themedView";
import ThemedText from "../components/themedText";
import Spacer from "../components/spacer";

import Logo from "../assets/img/NUS_Lifters1.png";

export default function Index() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is logged in, redirect to gymCapacity
        router.replace("/gymCapacity");
      } else {
        // User not logged in, show home screen
        setCheckingAuth(false);
      }
    });

    return unsubscribe;
  }, []);

  if (checkingAuth) {
    // Show loading while checking auth
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  // Render your Home screen if not logged in
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title} title={true}>
        NUS Lifters
      </ThemedText>

      <Spacer height={10} />

      <ThemedText style={{ fontSize: 16 }}>
        Official NUS lifting club 2025
      </ThemedText>

      <Spacer />

      <Image source={Logo} style={styles.img} />

      <Spacer />

      <Link href="/login" asChild>
        <TouchableOpacity style={styles.card}>
          <Text>Login</Text>
        </TouchableOpacity>
      </Link>

      <Spacer />

      <Link href="/signup" asChild>
        <TouchableOpacity style={styles.card}>
          <Text>Sign up</Text>
        </TouchableOpacity>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontWeight: "bold",
    fontSize: 18,
  },

  card: {
    backgroundColor: "#eee",
    padding: 20,
    borderRadius: 5,
    // boxShadow doesn't work on React Native, if you want shadow on iOS/Android:
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },

  img: {
    width: 200,
    height: 200,
    resizeMode: "contain",
  },
});
