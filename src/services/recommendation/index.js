import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load env variables
dotenv.config({ path: "./cp.env" });

// Test if env variables are loaded
console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log("SUPABASE_ANON_KEY:", process.env.SUPABASE_ANON_KEY);

// Connect to Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Fetch data from croprecommendation table
async function fetchCrops() {
  const { data, error } = await supabase
    .from("croprecommendation")
    .select("*");

  if (error) console.error("Error:", error);
  else console.log("Crops:", data);
}

fetchCrops();
