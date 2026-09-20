import { Stack } from "expo-router";

export default function SellStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#111827" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "800" },
        contentStyle: { backgroundColor: "#f9fafb" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Sell My Car" }} />
      <Stack.Screen name="login" options={{ title: "Seller Sign In" }} />
      <Stack.Screen name="register" options={{ title: "Create Seller Account" }} />
      <Stack.Screen name="forgot-password" options={{ title: "Forgot Password" }} />
      <Stack.Screen name="phone-login" options={{ title: "Sign In with Phone" }} />
      <Stack.Screen
        name="biometric-setup"
        options={{ title: "Face ID / Touch ID", headerBackVisible: false }}
      />
      <Stack.Screen name="my-listings" options={{ title: "My Listings" }} />
      <Stack.Screen name="new" options={{ title: "List Your Vehicle" }} />
      <Stack.Screen name="listing/[id]" options={{ title: "Your Listing" }} />
      <Stack.Screen name="auction/new" options={{ title: "Create Auction" }} />
      <Stack.Screen name="auction/[id]" options={{ title: "Your Auction" }} />
    </Stack>
  );
}
