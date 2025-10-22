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
  try {
    const { favourite, mood, movie } = JSON.parse(event.body); //reads the request body that has been sent from the frontend by extracting the favourite, mood and movie into variables.
    if (!favourite && !mood && !movie) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Missing user inputs (favourite, mood, movie)",
        }),
      };
    }

    //Combine the inputs into one search query
    const query = `
      The user’s favorite movie or genre is: ${favourite || "unknown"}.
      They are currently in the mood for: ${mood || "any mood"}.
      They recently watched or mentioned: ${movie || "none"}.
      Recommend one movie that fits all of this.
    `;

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // const data = await Promise.all(
    //   movies.map(async (movie) => {
    //     const text = `${movie.title} ${movie.releaseYear} ${movie.content}`;
    //     const embedding = await openai.embeddings.create({
    //       model: "text-embedding-ada-002",
    //       input: text,
    //     });
    //     return {
    //       content: text,
    //       embedding: embedding.data[0].embedding,
    //     };
    //   })
    // );
    // Insert content and embedding into Supabase
    // await supabase.from("documents").insert(data);
    // console.log("Embedding and storing complete!");

    // Run vector similarity search in Supabase
    const { documents } = await supabase.rpc("match_documents", {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: 5, // get top 5 similar movies
    });

    // Combine matched movie info
    const movieList = documents.map((doc) => doc.content).join("\n");

    // Ask OpenAI to pick the single best recommendation
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful movie assistant that recommends ONE movie based on user preferences.",
        },
        {
          role: "user",
          content: `
            The user’s favourite: ${favourite}.
            Their mood: ${mood}.
            Recently watched or mentioned: ${movie}.
            Here are some candidate movies from the database:
            ${movieList}
            Please pick the single best movie and explain why it’s the best match.
          `,
        },
      ],
    });

    const response = chatResponse.choices[0].message.content;

    // Return result to frontend
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: response,
        documents,
      }),
    };
  } catch (err) {
    console.error("Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
