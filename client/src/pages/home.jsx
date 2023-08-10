import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Slider } from 'rsuite';
import 'rsuite/dist/rsuite-no-reset.min.css';
import { ArrowLeftLine } from '@rsuite/icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { setSocketQuery, socket } from '../socket';
import DividerWithText from '../shared/DividerWithText';
import { GameState } from '../../../game.mjs';
import { socketQueryType } from '../../../socketQueryType.mjs';

function Home() {
  const location = useLocation();
  const params = useParams();
  const [showCreateGame, setShowCreateGame] = useState(false);
  const [name, setName] = useState('');
  const [gameId, setGameId] = useState(
    params.code?.toUpperCase() ??
      new URL(window.location).searchParams.get('code') ??
      '',
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

  function showErrorToast(message) {
    toast.error(message, {
      position: 'top-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: 'light',
    });
  }

  useEffect(() => {
    if (location.state?.infoMessage) {
      toast.info('You have been kicked from the lobby', {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light',
      });
    }
    return () => {
      console.log('socket cleanup function unsubscribing from all events');
      socket?.off();
    };
  }, []);

  function socketOnJoinGame(res) {
    const game = res.game;
    const localPlayer = res.player;
    const players = res.game.players;

    console.log('gameJoined', game, localPlayer, players);
    const url = new URL(window.location);
    switch (game.state) {
      case GameState.waiting:
        url.searchParams.set('code', game.id);
        window.history.replaceState({}, '', url);
        navigate(`/lobby/${game.id}`, {
          state: {
            game: game,
            localPlayer: localPlayer,
            players: players,
          },
        });
        break;
      case GameState.started:
        url.searchParams.set('code', game.id);
        window.history.replaceState({}, '', url);
        navigate(`/game/${game.id}`, {
          state: {
            game: game,
            localPlayer: localPlayer,
            players: players,
          },
        });
        break;
      default:
        navigate('/home');
        break;
    }
  }

  async function handleJoinGame() {
    setLoadingJoinGame(true);
    try {
      let valid = true;
      // check name
      if (!name) {
        valid = false;
        showErrorToast('Please enter a name');
      }

      if (!gameId) {
        valid = false;
        showErrorToast('Please enter a game code');
      }

      if (!valid) {
        return;
      }
      if (socket?.connected) {
        socket.disconnect();
      }

      // connect to game
      setSocketQuery({
        type: socketQueryType.JOIN_GAME,
        username: name,
        gameId: gameId.toLowerCase(),
      });

      socket?.on('error-message', (message) => {
        showErrorToast(message);
        setLoadingJoinGame(false);
      });

      socket?.on('join-game', socketOnJoinGame);

      socket?.on('connect_error', () => {
        showErrorToast('Could not connect to game');
        setLoadingJoinGame(false);
      });

      socket?.on('disconnect', () => {
        showErrorToast('Could not connect to game');
        setLoadingJoinGame(false);
      });

      socket.connect();
    } catch (err) {
      console.error(err);
      showErrorToast('Could not connect to game');
      setLoadingJoinGame(false);
    }
  }

  async function handleCreateGame() {
    if (showCreateGame) {
      setLoadingCreateGame(true);
      try {
        let valid = true;
        if (!name) {
          valid = false;
          showErrorToast('Please enter a name');
        }
        if (!maxRounds) {
          valid = false;
          showErrorToast('Please enter a max number of rounds');
        }
        if (!roundDuration) {
          valid = false;
          showErrorToast('Please enter a round duration');
        }
        if (!startingMoney) {
          valid = false;
          showErrorToast('Please enter a starting money amount');
        }
        if (!targetMoney) {
          valid = false;
          showErrorToast('Please enter a target money multiplier');
        }
        if (!maxPlayers) {
          valid = false;
          showErrorToast('Please enter a max number of players');
        }

        if (!valid) return;

        if (socket?.connected) {
          socket.disconnect();
        }

        setSocketQuery({
          type: socketQueryType.CREATE_GAME,
          username: name,
          maxGameTurns: parseInt(maxRounds),
          roundDurationSeconds: parseInt(roundDuration),
          startingMoney: parseInt(startingMoney),
          targetMoney: parseInt(startingMoney) * parseFloat(targetMoney),
          maxPlayers: parseInt(maxPlayers),
        });

        socket?.on('join-game', socketOnJoinGame);
        socket?.on('connect_error', () => {
          showErrorToast('Could not connect to game');
          setLoadingJoinGame(false);
        });
        socket?.on('disconnect', () => {
          showErrorToast('Could not connect to game');
          setLoadingJoinGame(false);
        });

        socket.connect();
      } catch (err) {
        console.error(err);
        showErrorToast('Could not connect to game');
        setLoadingJoinGame(false);
      }

      setLoadingCreateGame(false);
    } else {
      setShowCreateGame(true);
    }
  }

  return (
    <>
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
            {loadingCreateGame ? 'Loading...' : 'Create Game'}
          </button>
        </div>
      </div>
      <ToastContainer />
    </>
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
        max={90}
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
    <button className="go-back" onClick={() => setShowCreateGame(false)}>
      <ArrowLeftLine style={{ fontSize: '22px' }} />
      <p style={{ fontSize: '16px' }}>Go Back</p>
    </button>
  );
}

export default Home;
