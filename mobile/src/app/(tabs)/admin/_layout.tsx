import { Stack } from "expo-router";

export default function AdminStackLayout() {
  return (
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
        options={{ title: "Admin", headerBackVisible: false }}
      />
      <Stack.Screen name="login" options={{ title: "Admin Sign In" }} />
      <Stack.Screen name="add-vehicle" options={{ title: "Add Vehicle" }} />
      <Stack.Screen
        name="edit-vehicle/[id]"
        options={{ title: "Edit Vehicle" }}
      />
      <Stack.Screen name="leads" options={{ title: "Leads" }} />
      <Stack.Screen
        name="marketplace-listings"
        options={{ title: "Marketplace Listings" }}
      />
      <Stack.Screen
        name="marketplace-listing/[id]"
        options={{ title: "Review Listing" }}
      />
      <Stack.Screen
        name="auction-listings"
        options={{ title: "Auction Moderation" }}
      />
      <Stack.Screen
        name="auction-listing/[id]"
        options={{ title: "Review Auction" }}
      />
    </Stack>
  );
}
