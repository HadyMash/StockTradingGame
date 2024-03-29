import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PlayerAvatar from '../shared/PlayerAvatar';
import { Close } from '@rsuite/icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { socket } from '../socket';
import { GameState } from '../../../game.mjs';

function Lobby() {
  const location = useLocation();
  console.log('location state', location.state);
  const navigate = useNavigate();
  const [game, setGame] = useState(location.state.game);
  const localPlayer = location.state.localPlayer;
  const [players, setPlayers] = useState(location.state.players);
  const [kickPlayer, setKickPlayer] = useState(null);
  const [loadingStartGame, setLoadingStartGame] = useState(false);
  const [infoMessage, setInfoMessage] = useState();

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
    socket.on('error-message', (message) => {
      showErrorToast(message);
    });

    // TODO: fix kick message not displaying on home page
    socket.on('kicked', () => {
      console.log('kicked');
      setInfoMessage('You were kicked from the game');
    });

    socket.on('player-joined', (data) => {
      console.log('player-joined', data);
      setPlayers((previousPlayers) => {
        return [...previousPlayers, data.player];
      });
    });

    socket.on('remove-player', (playerId) => {
      console.log('remove-player', playerId);
      setPlayers((previousPlayers) => {
        return previousPlayers.filter((player) => player.id !== playerId);
      });
    });

    socket.on('game-started', (data) => {
      console.log('start-game', data);
      navigate(`/game/${game.id}`, {
        state: {
          game,
          players: data.players,
          localPlayer,
          stockData: data.stockData,
          nextRoundTimestamp: data.nextRoundTimestamp,
          round: data.round,
        },
      });
    });

    socket.on('new-host', (hostId) => {
      console.log('new-host', hostId);
      setGame((previousGame) => {
        return {
          ...previousGame,
          hostId,
        };
      });
    });

    // TODO: don't route to home immediately after implementing connection recovery
    socket.on('disconnect', () => {
      console.log('disconnect');
      navigate('/home', {
        state: {
          infoMessage: infoMessage,
        },
      });
    });

    return () => {
      socket?.off();
    };
  }, []);

  function handleKick(player) {
    setKickPlayer(player);
  }

  async function kick(id) {
    socket.emit('kick', id);
    setKickPlayer(null);
  }

  async function handleLeave() {
    socket.disconnect();
  }

  async function handleStartGame() {
    setLoadingStartGame(true);
    socket.emit('start-game');
    // TODO: wait for response from server before turning loading off
    setLoadingStartGame(false);
  }

  useEffect(() => {
    console.log('players', players);
  }, []);

  return (
    <div
      style={{ position: 'relative', height: '100vh', boxSizing: 'border-box' }}
    >
      <div className="game-code-container">
        <h2 style={{ marginRight: '10px' }}>{game.id.toUpperCase()}</h2>

        <div
          onClick={() => navigator.clipboard.writeText(game.id)}
          style={{ cursor: 'pointer', paddingRight: '20px' }}
          title="Click to copy code"
        >
          <svg
            className="copy-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 467 512.22"
            width="12px"
          >
            <path d="M131.07 372.11c.37 1 .57 2.08.57 3.2 0 1.13-.2 2.21-.57 3.21v75.91c0 10.74 4.41 20.53 11.5 27.62s16.87 11.49 27.62 11.49h239.02c10.75 0 20.53-4.4 27.62-11.49s11.49-16.88 11.49-27.62V152.42c0-10.55-4.21-20.15-11.02-27.18l-.47-.43c-7.09-7.09-16.87-11.5-27.62-11.5H170.19c-10.75 0-20.53 4.41-27.62 11.5s-11.5 16.87-11.5 27.61v219.69zm-18.67 12.54H57.23c-15.82 0-30.1-6.58-40.45-17.11C6.41 356.97 0 342.4 0 326.52V57.79c0-15.86 6.5-30.3 16.97-40.78l.04-.04C27.51 6.49 41.94 0 57.79 0h243.63c15.87 0 30.3 6.51 40.77 16.98l.03.03c10.48 10.48 16.99 24.93 16.99 40.78v36.85h50c15.9 0 30.36 6.5 40.82 16.96l.54.58c10.15 10.44 16.43 24.66 16.43 40.24v302.01c0 15.9-6.5 30.36-16.96 40.82-10.47 10.47-24.93 16.97-40.83 16.97H170.19c-15.9 0-30.35-6.5-40.82-16.97-10.47-10.46-16.97-24.92-16.97-40.82v-69.78zM340.54 94.64V57.79c0-10.74-4.41-20.53-11.5-27.63-7.09-7.08-16.86-11.48-27.62-11.48H57.79c-10.78 0-20.56 4.38-27.62 11.45l-.04.04c-7.06 7.06-11.45 16.84-11.45 27.62v268.73c0 10.86 4.34 20.79 11.38 27.97 6.95 7.07 16.54 11.49 27.17 11.49h55.17V152.42c0-15.9 6.5-30.35 16.97-40.82 10.47-10.47 24.92-16.96 40.82-16.96h170.35z" />
          </svg>
        </div>
        <h2>
          {players.length} / {game.settings?.maxPlayers ?? '~'}
        </h2>
      </div>
      <div className="lobby">
        <div>
          <div className="lobby-name-container">
            <div className="lobby-name-header">
              <h1>Lobby</h1>
            </div>
          </div>
        </div>
        <div
          className="player-grid"
          style={
            game.hostId !== localPlayer.id
              ? {
                  paddingBottom: '40px',
                }
              : {}
          }
        >
          {players &&
            players.map((player) => {
              console.log('players foreach', player);
              return (
                <Player
                  name={player.name}
                  handleKick={() => handleKick(player)}
                  key={player.id}
                  isHost={game.hostId === player.id}
                  showKick={
                    game.hostId === localPlayer.id &&
                    player.id !== localPlayer.id
                  }
                />
              );
            })}
        </div>
        {game.hostId === localPlayer.id && (
          <button
            className="start-game"
            onClick={handleStartGame}
            disabled={players.length < 2 || loadingStartGame}
          >
            {loadingStartGame ? 'Loading...' : 'Start Game'}
          </button>
        )}
      </div>
      <button className="lobby-leave" onClick={handleLeave}>
        Leave
      </button>
      {kickPlayer && <div className="popup-fade" />}
      {kickPlayer && (
        <div className="popup center-absolute">
          <h2>Kick {kickPlayer.name}?</h2>
          <div className="popup-buttons">
            <button onClick={() => setKickPlayer(null)}>Cancel</button>
            <button onClick={() => kick(kickPlayer.id)}>Kick</button>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
}

function Player({ name, handleKick, isHost = true, showKick = true }) {
  Player.propTypes = {
    name: PropTypes.string.isRequired,
    handleKick: PropTypes.func.isRequired,
    showKick: PropTypes.bool,
    isHost: PropTypes.bool,
  };

  return (
    <div className="player">
      <PlayerAvatar playerName={name} sizeInPixels={100} />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          marginTop: '12px',
        }}
      >
        {isHost && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="#ffcc00"
            height="20px"
            width="20px"
            version="1.1"
            id="Capa_1"
            viewBox="0 0 220 220"
            space="preserve"
            style={{ marginRight: '5px' }}
          >
            <path d="M220,98.865c0-12.728-10.355-23.083-23.083-23.083s-23.083,10.355-23.083,23.083c0,5.79,2.148,11.084,5.681,15.14  l-23.862,21.89L125.22,73.002l17.787-20.892l-32.882-38.623L77.244,52.111l16.995,19.962l-30.216,63.464l-23.527-21.544  c3.528-4.055,5.671-9.344,5.671-15.128c0-12.728-10.355-23.083-23.083-23.083C10.355,75.782,0,86.137,0,98.865  c0,11.794,8.895,21.545,20.328,22.913l7.073,84.735H192.6l7.073-84.735C211.105,120.41,220,110.659,220,98.865z" />
          </svg>
        )}
        <p
          style={
            showKick
              ? null
              : {
                  marginRight: '0',
                }
          }
        >
          {name}
        </p>
        {showKick && (
          <Close
            onClick={handleKick}
            style={{
              color: 'var(--primary-color)',
              fontSize: '1.4em',
              minWidth: '1.4em',
              cursor: 'pointer',
            }}
          />
        )}
      </div>
    </div>
  );
}

export default Lobby;
