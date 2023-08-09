import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useParams } from 'react-router-dom';
import { Slider } from 'rsuite';
import 'rsuite/dist/rsuite-no-reset.min.css';
import { ArrowLeftLine } from '@rsuite/icons';

import DividerWithText from '../shared/DividerWithText';

// TODO: store user id in local storage or session storage or cookie
function Home() {
  const params = useParams();
  const [showCreateGame, setShowCreateGame] = useState(false);
  // TODO: replace name state with a ref
  const [name, setName] = useState('');
  const [gameId, setGameId] = useState(
    params.code?.toUpperCase() ??
      new URL(window.location).searchParams.get('code') ??
      ''
  );
  {
    const url = new URL(window.location);
    url.searchParams.delete('code');
    window.history.replaceState({}, '', url);
  }
  const [maxRounds, setMaxRounds] = useState(20);
  const [roundDuration, setRoundDuration] = useState(20);
  const [startingMoney, setStartingMoney] = useState(1000);
  const [targetMoney, setTargetMoney] = useState(1.5);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [loadingJoinGame, setLoadingJoinGame] = useState(false);
  const [loadingCreateGame, setLoadingCreateGame] = useState(false);

  const navigate = useNavigate();

  async function handleJoinGame() {
    setLoadingJoinGame(true);
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

    // send request
    const response = await fetch('http://localhost:3000/join-game', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        gameId: gameId.toLowerCase(),
      }),
      // TODO: show error to user
    }).catch((err) => console.error(err));

    // handle response
    try {
      if (response) {
        const data = await response.json();
        console.log(data);
        if (response.status === 200) {
          const url = new URL(window.location);
          url.searchParams.set('code', data.game.id);
          window.history.replaceState({}, '', url);
          navigate(`/lobby/${data.game.id}`, { state: data });
        } else {
          console.log('error:', response.status, data);
          // TODO: show error to user
        }
      }
    } finally {
      setLoadingCreateGame(false);
    }

    setLoadingJoinGame(false);
  }

  async function handleCreateGame() {
    if (showCreateGame) {
      setLoadingCreateGame(true);
      // TODO: validate and show errors
      let valid = true;
      if (!name) {
        valid = false;
      }
      if (!maxRounds) {
        valid = false;
      }
      if (!roundDuration) {
        valid = false;
      }
      if (!startingMoney) {
        valid = false;
      }
      if (!targetMoney) {
        valid = false;
      }
      if (!maxPlayers) {
        valid = false;
      }

      console.log('valid:', valid);
      if (!valid) return;

      const response = await fetch('http://localhost:3000/create-new-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hostName: name,
          maxGameTurns: maxRounds,
          roundDurationSeconds: roundDuration,
          startingMoney,
          targetMoney: startingMoney * targetMoney,
          maxPlayers,
        }),
        // TODO: show error to user
      }).catch((err) => console.error(err));

      try {
        if (response) {
          const data = await response.json();
          console.log(data);
          if (response.status === 201) {
            const url = new URL(window.location);
            url.searchParams.set('code', data.game.id);
            window.history.replaceState({}, '', url);
            navigate(`/lobby/${data.game.id}`, { state: data });
          } else {
            console.log('error:', response.status, data);
            // TODO: show error to user
          }
        }
      } finally {
        setLoadingCreateGame(false);
      }
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
            name={name}
            gameId={gameId}
            setGameId={setGameId}
            handleJoinGame={handleJoinGame}
            loadingJoinGame={loadingJoinGame}
          />
        )}
        <button
          onClick={handleCreateGame}
          disabled={(showCreateGame && !name) || loadingCreateGame}
        >
          {/* // TODO: consider replacing loading text with rsuite loading spinner */}
          {loadingCreateGame ? 'Loading...' : 'Create Game'}
        </button>
      </div>
    </div>
  );
}

function JoinGame({
  name,
  gameId,
  setGameId,
  handleJoinGame,
  loadingJoinGame,
}) {
  JoinGame.propTypes = {
    name: PropTypes.string.isRequired,
    gameId: PropTypes.string.isRequired,
    setGameId: PropTypes.func.isRequired,
    handleJoinGame: PropTypes.func.isRequired,
    loadingJoinGame: PropTypes.bool.isRequired,
  };

  return (
    <React.Fragment>
      {/* // TODO: allow only characters (no spaces and numbers) */}
      <input
        type="text"
        placeholder="Game ID"
        value={gameId}
        onChange={(e) => setGameId(e.target.value.toUpperCase())}
      />
      <button
        onClick={handleJoinGame}
        disabled={!name || !gameId || loadingJoinGame}
      >
        {/* // TODO: consider replacing loading text with rsuite spinner */}
        {loadingJoinGame ? 'Loading...' : 'Join Game'}
      </button>
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
        barClassName="slider-bar"
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
      <Slider
        progress
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(val) => setValue(val)}
      />
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          let value = Number(e.target.value);
          if (value > max) {
            value = max;
          }
          if (value < min) {
            value = min;
          }
          setValue(value);
        }}
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
      <ArrowLeftLine style={{ fontSize: '22px' }} />
      <p style={{ fontSize: '16px' }}>Go Back</p>
    </button>
  );
}

export default Home;
