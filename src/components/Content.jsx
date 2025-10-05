import React from "react";
import "../styles/Content";

export default function Content() {
  const [loading, setLoading] = React.useState(false); // tracking the loading state

  return (
    <>
      <h2>What is your favourite movie and why?</h2>
      <textarea
        className="favourite-movie"
        // value=
        // onChange=
        aria-label="Enter your favourite movie and why"
      ></textarea>
      <h2>Are you in the mood for something new or a classic?</h2>
      <textarea
        className="mood-movie"
        // value=
        // onChange=
        aria-label="Enter if you are in the mood for something new or a classic"
      ></textarea>
      <h2>Do you want to have fun or do you want something serious</h2>
      <textarea
        className="movie"
        // value=
        // onChange=
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
