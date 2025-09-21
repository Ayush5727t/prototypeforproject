import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: "./cp.env" });

console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log("SUPABASE_ANON_KEY:", process.env.SUPABASE_ANON_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function fetchCrops() {
  const { data, error } = await supabase
    .from("croprecommendation")
    .select("*");

  if (error) console.error("Error:", error);
  else console.log("Crops:", data);
}

fetchCrops();
