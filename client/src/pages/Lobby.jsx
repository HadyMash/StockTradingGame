import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PlayerAvatar from '../shared/PlayerAvatar';
import { Close } from '@rsuite/icons';
import { GameState } from '../../../game.mjs';

function Lobby() {
  const location = useLocation();
  const navigate = useNavigate();
  const [game, setGame] = useState(location.state.game);
  const localPlayer = location.state.player;
  const [players, setPlayers] = useState(location.state.game.players);
  const [kickPlayer, setKickPlayer] = useState(null);

  useEffect(() => {
    // set interval to poll for players
    let abortController;
    const updateIntervalId = setInterval(async () => {
      abortController = new AbortController();
      const response = await fetch(
        `http://localhost:3000/update/${game.id}/${localPlayer.id}`,
        {
          signal: abortController.signal,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          // TODO: show error to user
        }
      ).catch((err) => console.error(err));

      // handle response
      try {
        if (response) {
          const data = await response.json();
          console.log(data);
          if (response.status === 200) {
            const gameState = data.gameState;
            if (!gameState) {
              throw new Error('gameState not found');
            }
            if (gameState == GameState.waiting) {
              // lobby
              setPlayers(data.players);
              setGame((previousGame) => {
                return {
                  ...previousGame,
                  hostId: data.hostId,
                };
              });
            } else if (gameState == GameState.inProgress) {
              // TODO: route to game
            } else {
              // TODO: route to scoreboard
            }
          } else {
            console.log('error:', response.status, data);
          }
        }
      } catch (err) {
        console.error(err);
        // TODO: show error to user
      }
    }, 2000);

    return () => {
      abortController?.abort();
      clearInterval(updateIntervalId);
    };
  }, []);

  function handleKick(player) {
    setKickPlayer(player);
  }

  function kick(id) {
    // TODO: kick api call
    setKickPlayer(null);
  }

  async function handleLeave() {
    const response = await fetch('http://localhost:3000/remove-player', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerId: localPlayer.id,
        requestId: localPlayer.id,
        gameId: game.id,
      }),
      // TODO: show error to user
    }).catch((err) => console.error(err));

    // handle response
    try {
      if (response) {
        if (response.status === 204 || response.status === 200) {
          routeToHomePage();
        }
        else {
          const data = await response.json();
          console.log(data);
          console.log('error:', response.status, data);
          // TODO: show error to user
        }
      }
    } catch (err) {
      console.log('error:', err);
    }
  }

  function routeToHomePage() {
    const url = new URL(window.location);
    url.searchParams.delete('code');
    window.history.replaceState({}, '', url);
    navigate(`/home`);
  }

  function handleStartGame() {
    // TODO: start game api call
  }

  return (
    <div
      style={{ position: 'relative', height: '100vh', boxSizing: 'border-box' }}
    >
      <div className="lobby">
        <div>
          {/* // TODO: add game code copy */}
          <h1>Lobby - {game.id.toUpperCase()}</h1>
        </div>
        {/* // TODO: add end fade here too */}
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
            players.map((player) => (
              <Player
                name={player.name}
                handleKick={() => handleKick(player)}
                key={player.id}
                showKick={
                  game.hostId === localPlayer.id && player.id !== localPlayer.id
                }
              />
            ))}
        </div>
        {game.hostId === localPlayer.id && (
          <button
            className="start-game"
            onClick={handleStartGame}
            disabled={players.length < 2}
          >
            Start Game
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
    </div>
  );
}

// TODO: add host icon (crown)
function Player({ name, handleKick, showKick = true }) {
  Player.propTypes = {
    name: PropTypes.string.isRequired,
    handleKick: PropTypes.func.isRequired,
    showKick: PropTypes.bool,
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

// TODO: implement
function handleStart() { }

// TODO: implement
function handleCopy() { }

export default Lobby;
