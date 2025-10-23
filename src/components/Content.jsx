import React from "react";
import "../styles/Content.css";

export default function Content() {
  const [loading, setLoading] = React.useState(false); // tracking the loading state
  const [findMovie, setFindMovie] = React.useState(false); // tracking to see if the user has clicked to find movie
  const [favouriteInputText, setFavouriteInputText] = React.useState(""); //state for the favourite input
  const [moodInputText, setMoodInputText] = React.useState(""); //state for the favourite input
  const [movieInputText, setMovieInputText] = React.useState(""); //state for the favourite input
  const [movieResult, setMovieResult] = React.useState(null); // store the AI response

  // when the startover button is hit, all values will be reset.
  const findNewMovie = () => {
    setFindMovie(false);
    setFavouriteInputText("");
    setMoodInputText("");
    setMovieInputText("");
    setMovieResult(null);
  };

  const handleMovie = async () => {
    setLoading(true);
    try {
      // sending data off to the ai to begin with.
      const res = await fetch("/.netlify/functions/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          favourite: favouriteInputText,
          mood: moodInputText,
          movie: movieInputText,
        }), // this inserts the current user text from all 3 text fields in the AI prompt.
      });

      // awaiting the response. Setting the user translation to what the ai gives back.
      const data = await res.json();
      console.log("Response:", data);

      // store the movie recommendation text
      setMovieResult(data);
      setFindMovie(true); //setting true which will switch the users view so they can see the suggested movie.
    } catch (error) {
      console.error("Movie fetch failed", error);
      setMovieResult("An error occurred. Please try again.");
      setFindMovie(true);
    } finally {
      setLoading(false); //loading is now false as the movie will be displayed to the user.
    }
  };

  return (
    <div className="container">
      {!findMovie ? (
        <div className="content-container">
          <h3>What is your favourite movie and why?</h3>
          <textarea
            className="favourite-movie"
            value={favouriteInputText} // setting the value of state.
            onChange={(e) => setFavouriteInputText(e.target.value)} // updating state to whatever the user types
            aria-label="Enter your favourite movie and why"
          ></textarea>
          <h3>Are you in the mood for something new or a classic?</h3>
          <textarea
            className="mood-movie"
            value={moodInputText}
            onChange={(e) => setMoodInputText(e.target.value)}
            aria-label="Enter if you are in the mood for something new or a classic"
          ></textarea>
          <h3>Do you want to have fun or do you want something serious</h3>
          <textarea
            className="movie"
            value={movieInputText}
            onChange={(e) => setMovieInputText(e.target.value)}
            aria-label="Enter if you want to have fun or do you want something serious"
          ></textarea>
          <button
            onClick={handleMovie} // fetches the movie which allows for the view to be changed.
            className="find-movie-btn"
            disabled={loading}
          >
            {loading ? "Searching..." : "Find Movie"}
          </button>
        </div>
      ) : (
        // If the findMovie button has been hit, the below will be dispalyed.
        <div className="content-container">
          <h2 className="movie-title">
            {movieResult?.title} ({movieResult?.releaseYear})
          </h2>
          <p className="movie-content">{movieResult?.content}</p>
          <button onClick={findNewMovie} className="reset-btn">
            Find a new movie
          </button>
        </div>
      )}
    </div>
  );
}
