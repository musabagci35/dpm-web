import { Link, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text } from "react-native";

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
        <Stack.Screen
          name="index"
          options={{
            title: "Drive Prime Motors",
            // Small, unobtrusive staff-only entry point — the real
            // protection is server-side (every admin API call requires a
            // verified session independent of this link existing).
            headerRight: () => (
              <Link href="/admin/login">
                <Text style={{ color: "#9ca3af", fontSize: 12, fontWeight: "600" }}>
                  Admin
                </Text>
              </Link>
            ),
          }}
        />
        <Stack.Screen
          name="recently-sold"
          options={{ title: "Recently Sold" }}
        />
        <Stack.Screen
          name="vehicle/[slug]"
          options={{ title: "Vehicle Details" }}
        />
        <Stack.Screen
          name="admin/login"
          options={{ title: "Admin Sign In" }}
        />
        <Stack.Screen
          name="admin/index"
          options={{ title: "Admin", headerBackVisible: false }}
        />
      </Stack>
    </>
  );
}
