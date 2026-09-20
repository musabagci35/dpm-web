import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#111827" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "800" },
          contentStyle: { backgroundColor: "#f9fafb" },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="vehicle/[slug]"
          options={{ title: "Vehicle Details" }}
        />
        <Stack.Screen
          name="marketplace/[id]"
          options={{ title: "Vehicle Listing" }}
        />
        <Stack.Screen
          name="marketplace/checkout-result"
          options={{ title: "Checkout", headerShown: false }}
        />
        <Stack.Screen name="auctions/index" options={{ title: "Auctions" }} />
        <Stack.Screen name="auctions/[id]" options={{ title: "Auction" }} />
      </Stack>
    </>
  );
}
