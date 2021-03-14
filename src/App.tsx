import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import "./App.css";
import { GithubFork } from "./GithubFork";
import { Status } from "./Status";
import { startup } from "./store/gameSlice";
import { Player } from "./Player";

function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(startup());
  }, []);
  return (
    <div className="App">
      <GithubFork />
      <header className="App-header">
        <Status />
        <Player />
      </header>
    </div>
  );
}

export default App;
