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
        <Stack.Screen name="index" options={{ title: "Drive Prime Motors" }} />
        <Stack.Screen
          name="recently-sold"
          options={{ title: "Recently Sold" }}
        />
        <Stack.Screen
          name="vehicle/[slug]"
          options={{ title: "Vehicle Details" }}
        />
      </Stack>
    </>
  );
}
