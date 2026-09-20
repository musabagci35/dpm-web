import { useCallback, useEffect, useState } from "react";
import { Tabs } from "expo-router/tabs";
import { useFocusEffect } from "expo-router";
import { ColorValue, Text } from "react-native";

import { subscribeAdminAuthChange, verifyAdminSession } from "@/lib/auth";

function TabIcon({ glyph, color }: { glyph: string; color: ColorValue }) {
  return <Text style={{ fontSize: 20, color }}>{glyph}</Text>;
}

export default function TabsLayout() {
  // Defaults to hidden — a customer must never see this tab even for the
  // instant it takes to verify a session. It only ever becomes visible
  // once /api/admin/me has actually confirmed an admin session; route-level
  // protection on the admin screens themselves stays in place regardless,
  // this only controls whether the tab bar icon renders at all.
  const [isAdmin, setIsAdmin] = useState(false);

  const check = useCallback(() => {
    verifyAdminSession()
      .then((session) => setIsAdmin(Boolean(session)))
      .catch(() => setIsAdmin(false));
  }, []);

  useEffect(() => {
    check();
    return subscribeAdminAuthChange((user) => setIsAdmin(Boolean(user)));
  }, [check]);

  // Re-checks whenever this tab group regains focus (e.g. coming back from
  // the admin login screen, or the app resuming from the background) so an
  // expired session hides the tab again without needing a restart.
  useFocusEffect(check);

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
          // The route itself stays fully navigable (router.push still works)
          // — this only removes the icon from the tab bar for anyone who
          // isn't a verified admin.
          href: isAdmin ? undefined : null,
        }}
      />
    </Tabs>
  );
}
