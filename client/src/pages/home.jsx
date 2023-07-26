import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';

import DividerWithText from '../shared/DividerWithText';

function Home() {
  const [showCreateGame, setShowCreateGame] = useState(false);
  // TODO: check if i can remove the name state
  const [name, setName] = useState('');
  const [gameId, setGameId] = useState('');

  function handleJoinGame() {
    // ! temp
    console.log('joinGameRequest');
    // TODO: validate
    let valid = true;
    // check name
    if (!name) {
      // show name error
    }

    if (!gameId) {
      // show game id error
    }

    if (!valid) {
      return;
    }
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

  return (
    <div className="center-absolute">
      <div className="center-horizontally">
        <h1>STONKS</h1>
      </div>
      <div className="container">
        {showCreateGame && <GoBack setShowCreateGame={setShowCreateGame} />}
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {showCreateGame ? (
          <CreateGame />
        ) : (
          <JoinGame
            gameId={gameId}
            setGameId={setGameId}
            handleJoinGame={handleJoinGame}
          />
        )}
        <button onClick={handleCreateGame}>Create Game</button>
      </div>
    </div>
  );
}

function JoinGame({ gameId, setGameId, handleJoinGame }) {
  JoinGame.propTypes = {
    gameId: PropTypes.string.isRequired,
    setGameId: PropTypes.func.isRequired,
    handleJoinGame: PropTypes.func.isRequired,
  };

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

function GoBack({ setShowCreateGame }) {
  GoBack.propTypes = {
    setShowCreateGame: PropTypes.func.isRequired,
  };

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
  );
}

export default Home;
