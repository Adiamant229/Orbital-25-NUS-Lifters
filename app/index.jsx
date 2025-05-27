//react and expo imports
import { useEffect, useState } from "react";
import { StyleSheet, Image, Text } from "react-native";
import { Link, useRouter } from "expo-router";

//firebase imports 
import { auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

//themed components 
import ThemedView from "../components/themedView";
import ThemedText from "../components/themedText";
import ThemedCard from "../components/themedCard"
import Spacer from "../components/spacer";

//logo 
import Logo from "../assets/img/NUS_Lifters.png";

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

  return (
    <ThemedView style={styles.container}>

      <Image source={Logo} style={styles.img} />

      <ThemedText style={{ fontSize: 16 }}>
        For the Lifters, By the Lifters in NUS
      </ThemedText>

      <Spacer />
      <Link href="/login" asChild>
        <ThemedCard>
          <Text style={{ color: "#f2f2f2" }}>Login</Text>
        </ThemedCard>
      </Link>

      <Spacer height={25} />

      <Link href="/signup" asChild>
        <ThemedCard>
          <Text style={{ color: "#f2f2f2" }}>Sign up</Text>
        </ThemedCard>
      </Link>
    </ThemedView>
  );
}

export const styles = StyleSheet.create({
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

  img: {
    width: 350,
    height: 350,
    resizeMode: "contain",
    borderRadius: 20,
    marginVertical: 10,
  }
});
