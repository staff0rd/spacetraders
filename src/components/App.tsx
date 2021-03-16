import React from "react";
import "./App.css";
import { GithubFork } from "./GithubFork";
import { Status } from "./Status";

function App() {
  return (
    <div className="App">
      <GithubFork />
      <header className="App-header">
        <Status />
      </header>
    </div>
  );
}

export default App;
