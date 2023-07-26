import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';

import DividerWithText from '../shared/DividerWithText';

// TODO: fix bug where text field loses focus after typing one character
function Home() {
  const [showCreateGame, setShowCreateGame] = useState(false);
  const [name, setName] = useState('');
  const [gameId, setGameId] = useState('');

  function handleJoinGame() {
    // ! temp
    console.log('joinGameRequest');
    // TODO: validate
    // TODO: send request
    // TODO: handle response
  }

  function handleCreateGame() {
    if (showCreateGame) {
      // ! temp
      console.log('createGameRequest');
    } else {
      setShowCreateGame(true);
    }
  }

  function JoinGame() {
    return (
      <React.Fragment>
        <input
          type="text"
          placeholder="Game ID"
          value={gameId}
          onChange={(e) => setGameId(e.target.value.toUpperCase())}
        />
        <button onClick={handleJoinGame}>Join Game</button>
        <DividerWithText>or</DividerWithText>
      </React.Fragment>
    );
  }

  function CreateGame() {
    return <div>Create Game</div>;
  }
  console.log(showCreateGame);

  function GoBack() {
    return (
      // TODO: format button properly
      <button
        className="inline-children"
        onClick={() => setShowCreateGame(false)}
      >
        <FontAwesomeIcon style={{}} icon={faChevronLeft} />
        <div style={{ width: '10px' }}></div>
        <p style={{ fontSize: '16px' }}>Go Back</p>
      </button>
      // <button onClick={() => setShowCreateGame(false)}>
      //   <i className="fas fa-arrow-left"></i>
      // </button>
    );
  }

  return (
    <div className="center-absolute">
      <div className="center-horizontally">
        <h1>STONKS</h1>
      </div>
      <div className="container">
        {showCreateGame && <GoBack />}
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {showCreateGame ? <CreateGame /> : <JoinGame />}
        <button onClick={handleCreateGame}>Create Game</button>
      </div>
    </div>
  );
}

export default Home;
