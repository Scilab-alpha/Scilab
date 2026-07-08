import * as SecureStore from "expo-secure-store";

export async function getSecureItem(key: string) {
  if (process.env.EXPO_OS === "web") {
    return null;
  }

  return SecureStore.getItemAsync(key);
}

export async function setSecureItem(key: string, value: string) {
  if (process.env.EXPO_OS === "web") {
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

export async function deleteSecureItem(key: string) {
  if (process.env.EXPO_OS === "web") {
    return;
  }

  await SecureStore.deleteItemAsync(key);
}
