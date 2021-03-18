import React from "react";
import "./App.css";
import { GithubFork } from "./GithubFork";
import { Status } from "./Status";
import { Test } from "./Test";
import { Player } from "./Player";

function App() {
  return (
    <div className="App">
      <GithubFork />
      <header className="App-header">
        <Status />
        {false && <Test />}
        <Player />
      </header>
    </div>
  );
}

export default App;
