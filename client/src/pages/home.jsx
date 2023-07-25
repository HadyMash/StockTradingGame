import React from 'react';
import DividerWithText from '../shared/DividerWithText';

function Home() {
  function JoinGame() {
    return (
      <React.Fragment>
        <input type="text" placeholder="Game ID" />
        <button>Join Game</button>
        <DividerWithText>or</DividerWithText>
        <button>Create Game</button>
      </React.Fragment>
    );
  }
  return (
    <div className="center-absolute">
      <div className="center-horizontally">
        <h1>STONKS</h1>
      </div>
      <div className="container">
        <input type="text" placeholder="Name" />
        <JoinGame />
      </div>
    </div>
  );
}

export default Home;
