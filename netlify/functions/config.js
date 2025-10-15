import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import movies from "./data.js";

/** OpenAI config */
if (!process.env.OPENAI_API_KEY)
  throw new Error("OpenAI API key is missing or invalid.");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

/** Supabase config */
const privateKey = process.env.SUPABASE_API_KEY;
if (!privateKey) throw new Error(`Expected env var SUPABASE_API_KEY`);
const url = process.env.SUPABASE_URL;
if (!url) throw new Error(`Expected env var SUPABASE_URL`);

const supabase = createClient(url, privateKey);

export async function handler() {
  console.log(movies);

  const embedding = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: "Hello",
  });
}
// console.log(embedding.data[0].embedding);
