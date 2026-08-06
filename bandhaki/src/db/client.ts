import { openDatabaseSync } from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";

const expoDb = openDatabaseSync("bandhaki.db");

export const db = drizzle(expoDb);

export default db;
