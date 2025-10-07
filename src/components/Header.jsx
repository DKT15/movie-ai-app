import React from "react";
import "../styles/Header.css";
import popcorn from "../assets/popcorn-img.png";

export default function Header() {
  return (
    <>
      <header>
        <div className="content">
          <img
            src={popcorn}
            alt="image of popcorn with eyes"
            className="popcorn"
          />
          <div className="text-wrapper">
            <h1>PopChoice</h1>
            <p className="subtitle">Find your perfect movie to watch now!</p>
          </div>
        </div>
      </header>
    </>
  );
}
