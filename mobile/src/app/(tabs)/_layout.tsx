import { Tabs } from "expo-router/tabs";
import { ColorValue, Text } from "react-native";

function TabIcon({ glyph, color }: { glyph: string; color: ColorValue }) {
  return <Text style={{ fontSize: 20, color }}>{glyph}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#111827" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "800" },
        tabBarActiveTintColor: "#dc2626",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: { backgroundColor: "#fff" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarLabel: "Home",
          tabBarIcon: ({ color }) => <TabIcon glyph="⌂" color={color} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: "Inventory",
          tabBarLabel: "Inventory",
          tabBarIcon: ({ color }) => <TabIcon glyph="🚗" color={color} />,
        }}
      />
      <Tabs.Screen
        name="recently-sold"
        options={{
          title: "Recently Sold",
          tabBarLabel: "Sold",
          tabBarIcon: ({ color }) => <TabIcon glyph="✓" color={color} />,
        }}
      />
      <Tabs.Screen
        name="contact"
        options={{
          title: "Contact",
          tabBarLabel: "Contact",
          tabBarIcon: ({ color }) => <TabIcon glyph="☎" color={color} />,
        }}
      />
      <Tabs.Screen
        name="sell"
        options={{
          title: "Sell My Car",
          tabBarLabel: "Sell",
          headerShown: false,
          tabBarIcon: ({ color }) => <TabIcon glyph="$" color={color} />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          tabBarLabel: "Admin",
          headerShown: false,
          tabBarIcon: ({ color }) => <TabIcon glyph="⚙" color={color} />,
        }}
      />
    </Tabs>
  );
}
