import { OpenAI } from "openai";
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

// storing the map in a data variable so all the data is sent to Supabase in one batch once the promises are resolved.
export async function handler(event) {
  const { favourite, mood, movie } = JSON.parse(event.body); //reads the request body that has been sent from the frontend by extracting the text and targetLang into variables.

  try {
    const data = await Promise.all(
      movies.map(async (movie) => {
        const text = `${movie.title} ${movie.releaseYear} ${movie.content}`;
        const embedding = await openai.embeddings.create({
          model: "text-embedding-ada-002",
          input: text,
        });
        return {
          content: text,
          embedding: embedding.data[0].embedding,
        };
      })
    );
    // Insert content and embedding into Supabase
    await supabase.from("documents").insert(data);
    console.log("Embedding and storing complete!");

    const { documents } = await supabase.rpc("match_documents", {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 1,
    });
    console.log(documents[0].content);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "All embeddings complete" }),
    };
  } catch (err) {
    console.error("Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
