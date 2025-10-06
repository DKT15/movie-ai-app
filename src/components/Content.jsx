import React from "react";
import "../styles/Content";

export default function Content() {
  const [loading, setLoading] = React.useState(false); // tracking the loading state
  const [favouriteInputText, setFavouriteInputText] = React.useState(""); //state for the favourite input
  const [moodInputText, setMoodInputText] = React.useState(""); //state for the favourite input
  const [movieInputText, setMovieInputText] = React.useState(""); //state for the favourite input

  return (
    <>
      <h2>What is your favourite movie and why?</h2>
      <textarea
        className="favourite-movie"
        value={favouriteInputText} // setting the value of state.
        onChange={(e) => setFavouriteInputText(e.target.value)} // updating state to whatever the user types
        aria-label="Enter your favourite movie and why"
      ></textarea>
      <h2>Are you in the mood for something new or a classic?</h2>
      <textarea
        className="mood-movie"
        value={moodInputText}
        onChange={(e) => setMoodInputText(e.target.value)}
        aria-label="Enter if you are in the mood for something new or a classic"
      ></textarea>
      <h2>Do you want to have fun or do you want something serious</h2>
      <textarea
        className="movie"
        value={movieInputText}
        onChange={(e) => setMovieInputText(e.target.value)}
        aria-label="Enter if you want to have fun or do you want something serious"
      ></textarea>
      <button
        onClick={handleMovie} // fetches the movie which allows for the view to be changed.
        className="translate-btn"
        disabled={loading}
      >
        {loading ? "Searching..." : "Find Movie"}
      </button>
    </>
  );
}
