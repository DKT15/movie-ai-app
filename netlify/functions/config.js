import { OpenAI } from "openai";
import { createClient } from "@supabase/supabase-js";
import movies from "./data.js";

/* OpenAI config */
if (!process.env.OPENAI_API_KEY)
  throw new Error("OpenAI API key is missing or invalid.");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

/* Supabase config */
const privateKey = process.env.SUPABASE_API_KEY;
if (!privateKey) throw new Error(`Expected env var SUPABASE_API_KEY`);
const url = process.env.SUPABASE_URL;
if (!url) throw new Error(`Expected env var SUPABASE_URL`);

const supabase = createClient(url, privateKey);

/* Netlify Handler */

// storing the map in a data variable so all the data is sent to Supabase in one batch once the promises are resolved.
export async function handler(event) {
  try {
    const { favourite, mood, movie } = JSON.parse(event.body); //reads the request body that has been sent from the frontend by extracting the favourite, mood and movie into variables.

    // Generate embeddings for each movie and only inserting movies once the database is empty.
    //.limit is used to see if the rows are empty. Only need to check to see if at least one row returns here.
    const { data: existing } = await supabase
      .from("documents")
      .select("id")
      .limit(1);
    if (!existing || existing.length === 0) {
      console.log("Inserting movie embeddings into Supabase...");
      const data = await Promise.all(
        movies.map(async (movie) => {
          const text = `${movie.title} (${movie.releaseYear}): ${movie.content}`;
          const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-ada-002",
            input: text,
          });
          return {
            content: text,
            embedding: embeddingResponse.data[0].embedding,
          };
        })
      );

      // Inserting into database
      const { document } = await supabase.from("documents").insert(data);
      if (document);
      console.log("Movie embeddings inserted successfully!");
    } else {
      console.log("Skipping insertion — movies already in DB.");
    }

    /* Handling the user search and recommendation. */

    // If there isn't any of the 3 below, then the error will be returned.
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

    // Creating the embedding for the combined query
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query,
    });

    // getting the response as a result of passing in the query. Storing it in a variable so it can be run below in the vector similarity search.
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Run vector similarity search in Supabase
    const { data: documents, error: searchError } = await supabase.rpc(
      "match_documents",
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: 5, // top 5 matches for OpenAI to analyse
      }
    );

    // search error will be thrown if there is an error.
    // If there isn't any documents found/added then the message below will be returned.
    if (searchError) throw searchError;
    if (!documents?.length) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "No similar movies found.",
        }),
      };
    }
    // Combine matched movie info
    const movieList = documents.map((doc) => doc.content).join("\n");

    // Ask OpenAI to pick the single best recommendation
    const chatResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful movie assistant. Respond ONLY in JSON: title, releaseYear, content.",
        },
        {
          role: "user",
          content: `
            The user’s favourite: ${favourite}.
            Their mood: ${mood}.
            Recently watched or mentioned: ${movie}.
            Here are some candidate movies from the database:
            ${movieList}
            Please pick the single best movie.
          `,
        },
      ],
      response_format: { type: "json_object" }, // forces a clean JSON response
    });

    let movieData;
    try {
      movieData = JSON.parse(chatResponse.choices[0].message.content); //converting the JSON into a JS object.
    } catch (e) {
      console.error(
        "Failed to parse AI JSON:",
        chatResponse.choices[0].message.content
      );
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "AI did not return valid JSON" }),
      };
    }

    // Return result to frontend
    return {
      statusCode: 200,
      body: JSON.stringify(movieData),
    };
  } catch (err) {
    console.error("Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
