import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';

import DividerWithText from '../shared/DividerWithText';

function Home() {
  const [showCreateGame, setShowCreateGame] = useState(false);
  // TODO: replace name state with a ref
  const [name, setName] = useState('');
  const [gameId, setGameId] = useState('');
  const [maxRounds, setMaxRounds] = useState(20);
  const [roundDuration, setRoundDuration] = useState(15);
  const [startingMoney, setStartingMoney] = useState(500);
  const [targetMoney, setTargetMoney] = useState(1.5);
  const [maxPlayers, setMaxPlayers] = useState(5);

  function handleJoinGame() {
    // ! temp
    console.log('joinGameRequest');
    // TODO: validate
    let valid = true;
    // check name
    if (!name) {
      valid = false;
      // TODO: show name error
    }

    if (!gameId) {
      valid = false;
      // TODO: show game id error
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
          <CreateGame
            maxRounds={maxRounds}
            setMaxRounds={setMaxRounds}
            roundDuration={roundDuration}
            setRoundDuration={setRoundDuration}
            startingMoney={startingMoney}
            setStartingMoney={setStartingMoney}
            targetMoney={targetMoney}
            setTargetMoney={setTargetMoney}
            maxPlayers={maxPlayers}
            setMaxPlayers={setMaxPlayers}
          />
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

function CreateGame({
  maxRounds,
  setMaxRounds,
  roundDuration,
  setRoundDuration,
  startingMoney,
  setStartingMoney,
  targetMoney,
  setTargetMoney,
  maxPlayers,
  setMaxPlayers,
}) {
  CreateGame.propTypes = {
    maxRounds: PropTypes.number.isRequired,
    setMaxRounds: PropTypes.func.isRequired,
    roundDuration: PropTypes.number.isRequired,
    setRoundDuration: PropTypes.func.isRequired,
    startingMoney: PropTypes.number.isRequired,
    setStartingMoney: PropTypes.func.isRequired,
    targetMoney: PropTypes.number.isRequired,
    setTargetMoney: PropTypes.func.isRequired,
    maxPlayers: PropTypes.number.isRequired,
    setMaxPlayers: PropTypes.func.isRequired,
  };

  return (
    <React.Fragment>
      <GameSettingSlider
        title={'Rounds'}
        min={5}
        max={50}
        value={maxRounds}
        setValue={setMaxRounds}
      />
      <GameSettingSlider
        title={'Duration'}
        min={10}
        max={20}
        value={roundDuration}
        setValue={setRoundDuration}
      />
      <GameSettingSlider
        title={'starting cash'}
        min={100}
        max={5000}
        step={100}
        value={startingMoney}
        setValue={setStartingMoney}
      />
      <GameSettingSlider
        title={'target money'}
        min={1}
        max={2}
        step={0.1}
        value={targetMoney}
        setValue={setTargetMoney}
      />
      <GameSettingSlider
        title={'players'}
        min={2}
        max={10}
        value={maxPlayers}
        setValue={setMaxPlayers}
      />
    </React.Fragment>
  );
}

function GameSettingSlider({ title, min, max, value, setValue, step }) {
  GameSettingSlider.propTypes = {
    title: PropTypes.string.isRequired,
    min: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
    setValue: PropTypes.func.isRequired,
    step: PropTypes.number,
  };

  return (
    <div className="slider-flex">
      <p>{title}:</p>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      ></input>
      <input
        type="number"
        min={min}
        style={{ width: '5ch' }}
        max={max}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      ></input>
    </div>
  );
}

function GoBack({ setShowCreateGame }) {
  GoBack.propTypes = {
    setShowCreateGame: PropTypes.func.isRequired,
  };

  return (
    // TODO: format button properly
    <button className="go-back" onClick={() => setShowCreateGame(false)}>
      <FontAwesomeIcon icon={faChevronLeft} />
      <div style={{ width: '10px' }}></div>
      <p style={{ fontSize: '16px' }}>Go Back</p>
    </button>
  );
}

export default Home;
