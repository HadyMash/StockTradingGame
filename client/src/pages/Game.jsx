import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Dropdown, Slider } from 'rsuite';
import 'rsuite/dist/rsuite-no-reset.min.css';
import {
  VictoryAxis,
  VictoryChart,
  VictoryLine,
  VictoryZoomContainer,
} from 'victory';
import ToastContainer from 'react-toastify';
import TextInput from '../shared/TextInput';
import PlayerAvatar from '../shared/PlayerAvatar';
import { Minus, ArrowDownLine, ArrowUpLine } from '@rsuite/icons';
import { GameState } from '../../../game.mjs';

function Game() {
  const location = useLocation();
  const navigate = useNavigate();
  const [game, setGame] = useState(location.state.game);
  const [players, setPlayers] = useState(
    location.state.players.map((p) => {
      return {
        ...p,
        previousNetWorth: p.netWorth,
      };
    })
  );
  const [localPlayer, setLocalPlayer] = useState(location.state.localPlayer);
  const [stockData, setStockData] = useState(location.state.stockData);
  const symbols = Object.keys(location.state.stockData[0]);
  const [selectedSymbol, setSelectedSymbol] = useState(symbols[0]);
  const [timeRemainingForDay, setTimeRemainingForDay] = useState(
    game.settings.roundDurationSeconds -
      (Date.now() - game.startTimestamp) / 1000
  );

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
    console.log(location.state);
  }, []);

  async function handleBuy(symbol, quantity) {
    const response = await fetch('http://localhost:3000/buy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gameId: game.id,
        playerId: localPlayer.id,
        symbol,
        quantity,
      }),
    }).catch((err) => {
      console.error(err);
      showErrorToast(err);
    });

    try {
      if (response) {
        const data = await response.json();
        console.log('handle buy data', data);
        if (response.status === 200) {
          const gameState = data.gameState;
          if (!gameState) {
            throw new Error('gameState not found');
          }

          if (gameState == GameState.waiting) {
            console.log('game not yet started inside game.jsx');
            showErrorToast("game hasn't started yet");
            navigate('/');
          } else if (gameState == GameState.active) {
            // update localPlayer
            setLocalPlayer(data.player);
          } else if (gameState == GameState.finished) {
            // route to scoreboard
            const url = new URL(window.location);
            url.searchParams.delete('code');
            window.history.replaceState({}, '', url);
            navigate('/scoreboard', {
              state: {
                gameState: data.gameState,
                winner: data.winner,
                loser: data.loser,
              },
            });
          }
        } else {
          console.log('error:', response.status, data);
        }
      }
    } catch (error) {
      console.error(error);
      showErrorToast(error);
    }
  }

  async function handleSell(symbol, quantity) {
    const response = await fetch('http://localhost:3000/sell', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gameId: game.id,
        playerId: localPlayer.id,
        symbol,
        quantity,
      }),
    }).catch((err) => {
      console.error(err);
      showErrorToast(err);
    });

    try {
      if (response) {
        const data = await response.json();
        console.log('handle buy data', data);
        if (response.status === 200) {
          const gameState = data.gameState;
          if (!gameState) {
            throw new Error('gameState not found');
          }

          if (gameState == GameState.waiting) {
            console.log('game not yet started inside game.jsx');
            showErrorToast("game hasn't started yet");
            navigate('/');
          } else if (gameState == GameState.active) {
            // update localPlayer
            setLocalPlayer(data.player);
          } else if (gameState == GameState.finished) {
            // route to scoreboard
            const url = new URL(window.location);
            url.searchParams.delete('code');
            window.history.replaceState({}, '', url);
            navigate('/scoreboard', {
              state: {
                gameState: data.gameState,
                winner: data.winner,
                loser: data.loser,
              },
            });
          }
        } else {
          console.log('error:', response.status, data);
        }
      }
    } catch (error) {
      console.error(error);
      showErrorToast(error);
    }
  }

  useEffect(() => {
    let abortController;

    async function update(abortController) {
      const response = await fetch(
        `http://localhost:3000/update/${game.id}/${localPlayer.id}`,
        {
          signal: abortController.signal,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      ).catch((err) => {
        console.error(err);
        showErrorToast(err);
      });

      // handle response
      try {
        if (response) {
          const data = await response.json();
          console.log('update data', data);
          if (response.status === 200) {
            const gameState = data.gameState;
            if (!gameState) {
              throw new Error('gameState not found');
            }

            if (gameState == GameState.waiting) {
              console.log('game not yet started inside game.jsx');
              showErrorToast("game hasn't started yet");
              navigate('/');
            } else if (gameState == GameState.active) {
              // update player net worths on the right
              setPlayers((oldPlayers) => {
                return data.players.map((player) => {
                  return {
                    ...player,
                    previousNetWorth: oldPlayers.find(
                      (oldPlayer) => oldPlayer.id === player.id
                    ).netWorth,
                  };
                });
              });

              // update local player
              setLocalPlayer(data.player);

              // update stock data
              setStockData(data.stockData);

              // update time remaining for day
              setTimeRemainingForDay(game.settings.roundDurationSeconds);
            } else if (gameState == GameState.finished) {
              // route to scoreboard
              const url = new URL(window.location);
              url.searchParams.delete('code');
              window.history.replaceState({}, '', url);
              navigate('/scoreboard', {
                state: {
                  gameState: data.gameState,
                  winner: data.winner,
                  loser: data.loser,
                },
              });
            }
          } else {
            console.log('error:', response.status, data);
          }
        }
      } catch (err) {
        console.error(err);
        showErrorToast(err);
      }
    }
    const updateIntervalId = setInterval(async () => {
      abortController?.abort();
      abortController = new AbortController();
      try {
        update(abortController);
      } catch (error) {
        console.error(error);
        showErrorToast(error);
      }
    }, game.settings.roundDurationSeconds * 1000);

    setTimeout(() => {}, Math.round(game.startTimestamp / 1000));

    const timeRemainingForDayIntervalId = setInterval(() => {
      setTimeRemainingForDay((oldTime) => Math.max(0, oldTime - 1));
    }, 1000);

    return () => {
      clearInterval(updateIntervalId);
      clearInterval(timeRemainingForDayIntervalId);
      abortController?.abort();
    };
  }, []);

  // ! temp
  useEffect(() => {
    console.log('timeRemainingForDay:', timeRemainingForDay);
  }, [timeRemainingForDay]);

  return (
    <React.Fragment>
      <div className="game-grid">
        <div className="panel chart">
          <Chart
            selectedSymbol={selectedSymbol}
            symbols={symbols}
            setSymbol={setSelectedSymbol}
            data={stockData.map((obj) => {
              return {
                id: obj[selectedSymbol].id,
                price: obj[selectedSymbol].price,
                volume: obj[selectedSymbol].volume,
              };
            })}
          />
        </div>
        <div className="panel account">
          <Account
            money={localPlayer.money}
            holdings={localPlayer.stocks}
            selectedSymbol={selectedSymbol}
            setSymbol={setSelectedSymbol}
            latestStockData={stockData[stockData.length - 1]}
            previousStockDayData={stockData[stockData.length - 2]}
            handleBuy={handleBuy}
            handleSell={handleSell}
          />
        </div>
        <div className="panel">
          <Players localPlayer={localPlayer} players={players} />
        </div>
      </div>
      <ToastContainer />
    </React.Fragment>
  );
}

function Chart({ selectedSymbol, symbols, setSymbol, data }) {
  Chart.propTypes = {
    selectedSymbol: PropTypes.string.isRequired,
    symbols: PropTypes.arrayOf(PropTypes.string).isRequired,
    setSymbol: PropTypes.func.isRequired,
    data: PropTypes.arrayOf(PropTypes.object).isRequired,
  };

  const [domain, setDomain] = useState({ x: [0, 20] });
  const [graphDimensions, setGraphDimensions] = useState(null);
  const graphRef = useRef(null);

  // https://stackoverflow.com/a/68609331/21266350
  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      setGraphDimensions({
        width: graphRef.current.clientWidth,
        height: graphRef.current.clientHeight,
      });
    }
    // Add event listener
    window.addEventListener('resize', handleResize);
    // Call handler right away so state gets updated with initial window size
    handleResize();
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty array ensures that effect is only run on mount

  const { maxPrice, minPrice } = data.reduce(
    ({ maxPrice, minPrice }, obj) => ({
      maxPrice: obj.price > maxPrice ? obj.price : maxPrice,
      minPrice: obj.price < minPrice ? obj.price : minPrice,
    }),
    {
      maxPrice: data[0]?.price || null,
      minPrice: data[0]?.price || null,
    }
  );

  function panGraph(e) {
    setDomain((currentDomain) => {
      e.stopPropagation();
      let delta = (e.deltaY || e.deltaX) * 0.05;
      if (currentDomain.x[0] + delta < 0) {
        delta = -currentDomain.x[0];
      }
      if (currentDomain.x[1] + delta > data.length) {
        delta = data.length - currentDomain.x[1] + 2;
      }

      return {
        x: [currentDomain.x[0] + delta, currentDomain.x[1] + delta],
        y: [minPrice, maxPrice],
      };
    });
  }

  // TODO: scroll domain back when new data is added if the user isn't too far off the right

  return (
    <React.Fragment>
      <div
        ref={graphRef}
        className="graph"
        // TODO: fix issue with trackpad not working great and stuttering
        // onWheelCapture={panGraph}
      >
        {/* // TODO: style graph */}
        <VictoryChart
          width={graphDimensions?.width}
          height={graphDimensions?.height}
          containerComponent={
            <VictoryZoomContainer
              zoomDimension="x"
              zoomDomain={domain}
              allowZoom={false}
            />
          }
        >
          <VictoryLine
            data={data}
            x="id"
            y="price"
            // animate={{
            //   onEnter: {
            //     duration: 500,
            //     before: () => ({
            //       _y: data[data.length - 2].price || 0,
            //     }),
            //   },
            // }}
          />

          {/* Show the X-axis */}
          <VictoryAxis />

          {/* Move the Y-axis to the right */}
          <VictoryAxis
            dependentAxis
            orientation="right"
            tickFormat={(x) => `$${x}`}
            style={{
              grid: {
                fill: 'none',
                stroke: 'grey',
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                strokeDasharray: '10, 5',
                strokeWidth: 0.5,
                pointerEvents: 'painted',
              },
            }}
          />
        </VictoryChart>
      </div>
      <div className="dropdown">
        <Dropdown title={selectedSymbol} activeKey={selectedSymbol} size="lg">
          {symbols.map((symbol) => (
            <Dropdown.Item
              key={symbol}
              eventKey={symbol}
              onClick={() => setSymbol(symbol)}
            >
              {symbol}
            </Dropdown.Item>
          ))}
        </Dropdown>
      </div>
    </React.Fragment>
  );
}

function Account({
  money,
  holdings,
  selectedSymbol,
  setSymbol,
  latestStockData,
  previousStockDayData,
  handleBuy,
  handleSell,
}) {
  Account.propTypes = {
    money: PropTypes.number.isRequired,
    holdings: PropTypes.object.isRequired,
    selectedSymbol: PropTypes.string.isRequired,
    setSymbol: PropTypes.func.isRequired,
    latestStockData: PropTypes.object.isRequired,
    previousStockDayData: PropTypes.object.isRequired,
    handleBuy: PropTypes.func.isRequired,
    handleSell: PropTypes.func.isRequired,
  };

  return (
    <React.Fragment>
      <div className="title">
        <h1>Account</h1>
        <h1>${money.toFixed(2)}</h1>
      </div>
      <Holdings
        holdings={holdings}
        setSymbol={setSymbol}
        latestStockData={latestStockData}
        previousStockDayData={previousStockDayData}
      />
      <Trade
        symbol={selectedSymbol}
        moneyAvailable={money}
        quantityAvailable={holdings[selectedSymbol] || 0}
        price={latestStockData[selectedSymbol]?.price || 0}
        handleBuy={handleBuy}
        handleSell={handleSell}
      />
    </React.Fragment>
  );
}

function Holdings({
  holdings,
  setSymbol,
  latestStockData,
  previousStockDayData,
}) {
  Holdings.propTypes = {
    holdings: PropTypes.object.isRequired,
    setSymbol: PropTypes.func.isRequired,
    latestStockData: PropTypes.object.isRequired,
    previousStockDayData: PropTypes.object.isRequired,
  };

  return (
    <div className="holdings-parent">
      <div className="holdings">
        <h2 style={{ justifySelf: 'start' }}>Symbol</h2>
        <h2 style={{ justifySelf: 'center' }}>Quantity</h2>
        <h2 style={{ justifySelf: 'end' }}>Value</h2>
        {Object.keys(holdings).map((symbol) => (
          <Asset
            key={symbol}
            symbol={symbol}
            quantity={holdings[symbol]}
            value={holdings[symbol] * latestStockData[symbol].price}
            previousValue={
              holdings[symbol] * previousStockDayData[symbol].price
            }
            setSymbol={setSymbol}
          />
        ))}
      </div>
      <div className="end-fade"></div>
    </div>
  );
}

function Asset({ symbol, quantity, value, previousValue, setSymbol }) {
  Asset.propTypes = {
    symbol: PropTypes.string.isRequired,
    quantity: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
    previousValue: PropTypes.number.isRequired,
    setSymbol: PropTypes.func.isRequired,
  };

  const [color, setColor] = useState();

  useEffect(() => {
    if (value > previousValue) {
      setColor('green');
    } else if (value < previousValue) {
      setColor('red');
    } else {
      setColor('grey');
    }

    setTimeout(() => {
      setColor(null);
    }, 1000);
  }, [value]);

  return (
    <React.Fragment>
      <p className="symbol" onClick={() => setSymbol(symbol)}>
        {symbol}
      </p>
      <p className="quantity">{quantity.toFixed(2)}</p>
      <p
        className="value"
        style={{
          color: color,
        }}
      >
        ${value.toLocaleString()}
      </p>
    </React.Fragment>
  );
}

function Trade({
  symbol,
  moneyAvailable,
  quantityAvailable,
  price,
  handleBuy,
  handleSell,
}) {
  Trade.propTypes = {
    symbol: PropTypes.string.isRequired,
    moneyAvailable: PropTypes.number.isRequired,
    quantityAvailable: PropTypes.number.isRequired,
    price: PropTypes.number.isRequired,
    handleBuy: PropTypes.func.isRequired,
    handleSell: PropTypes.func.isRequired,
  };

  const [quantity, setQuantity] = useState(0);
  const [estimatedTotal, setEstimatedTotal] = useState(0);
  const [showBuy, setShowBuy] = useState(true);
  const [loadingBuy, setLoadingBuy] = useState(false);
  const [loadingSell, setLoadingSell] = useState(false);

  const maxQuantity = showBuy
    ? Math.round((100 * moneyAvailable) / price) / 100
    : quantityAvailable;
  const maxTotal = showBuy
    ? moneyAvailable
    : Math.round(100 * quantityAvailable * price) / 100;

  useEffect(() => {
    if (quantity > maxQuantity) setQuantity(maxQuantity);
    if (estimatedTotal > maxTotal) setEstimatedTotal(maxTotal);
  }, [showBuy, maxQuantity, maxTotal, quantity, estimatedTotal]);

  const toggleShowBuy = () => setShowBuy((val) => !val);

  return (
    <div className="trade">
      <div className="header">
        <h2>{symbol}</h2>
        <div className="tabs">
          <button
            className="buy left"
            disabled={showBuy}
            onClick={toggleShowBuy}
          >
            Buy
          </button>
          <button
            className="sell right"
            disabled={!showBuy}
            onClick={toggleShowBuy}
          >
            Sell
          </button>
        </div>
      </div>
      <TextInput
        type="number"
        prefix="Quantity:"
        min={0}
        max={maxQuantity}
        value={quantity}
        setValue={(val) => {
          setQuantity(val);
          setEstimatedTotal(Math.ceil(val * price * 100) / 100);
        }}
        suffix={() => (
          <p
            className="max-button"
            onClick={() => {
              setQuantity(maxQuantity);
              setEstimatedTotal(Math.ceil(maxQuantity * price * 100) / 100);
            }}
          >
            Max
          </p>
        )}
      />
      <TextInput
        type="number"
        prefix={`Total:${estimatedTotal > 0 ? ' ≈$' : ''}`}
        min={0}
        max={maxTotal}
        value={estimatedTotal}
        setValue={(val) => {
          const initialQuantity = val / price;
          const roundedQuantity = Math.floor(initialQuantity * 100) / 100;
          setEstimatedTotal(val);
          setQuantity(roundedQuantity);
        }}
        suffix={() => (
          <p
            className="max-button"
            onClick={() => {
              setQuantity(Math.floor(maxTotal * 100) / 100);
              setEstimatedTotal(maxTotal);
            }}
          >
            Max
          </p>
        )}
      />
      <Slider
        progress
        value={quantity}
        min={0}
        max={maxQuantity}
        step={0.01}
        onChange={(val) => {
          setQuantity(val);
          setEstimatedTotal(Math.ceil(val * price * 100) / 100);
        }}
      />
      <div className="space-around-flex">
        {showBuy ? (
          <button
            className="buy"
            onClick={async () => {
              setLoadingBuy(true);
              await handleBuy(symbol, quantity);
              setLoadingBuy(false);
            }}
            disabled={quantity === 0 || loadingBuy}
          >
            Buy
          </button>
        ) : (
          <button
            className="sell"
            onClick={async () => {
              setLoadingSell(true);
              await handleSell(symbol, quantity);
              setLoadingSell(false);
            }}
            disabled={quantity === 0 || loadingSell}
          >
            Sell
          </button>
        )}
      </div>
    </div>
  );
}

function Players({ localPlayer, players }) {
  Players.propTypes = {
    localPlayer: PropTypes.object.isRequired,
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
  };

  const [showStartFade, setShowStartFade] = useState(false);
  const [showEndFade, setShowEndFade] = useState(true);

  const aiIndex = players.findIndex((player) => player.id === 'ai');
  const localPlayerIndex = players.findIndex(
    (player) => player.id === localPlayer.id
  );

  return (
    <div className="players-parent">
      <div
        className="players"
        onScroll={(e) => {
          if (e.target.scrollTop > 0) setShowStartFade(true);
          else setShowStartFade(false);

          if (
            e.target.scrollTop <
            e.target.scrollHeight - e.target.clientHeight
          )
            setShowEndFade(true);
          else setShowEndFade(false);
        }}
      >
        <Player
          key={players[localPlayerIndex].id}
          playerName={'You'}
          playerMoney={players[localPlayerIndex].netWorth}
          prevPlayerMoney={players[localPlayerIndex].previousNetWorth}
        />
        <Player
          key={players[aiIndex].id}
          playerName={players[aiIndex].name}
          playerMoney={players[aiIndex].netWorth}
          prevPlayerMoney={players[aiIndex].previousNetWorth}
        />
        {players
          .filter(
            (player) => player.id !== localPlayer.id && player.id !== 'ai'
          )
          .map((player) => (
            <Player
              key={player.id}
              playerName={player.name}
              playerMoney={player.netWorth}
              prevPlayerMoney={player.previousNetWorth}
            />
          ))}
      </div>
      <div className={showStartFade ? 'start-fade2' : undefined}></div>
      <div className={showEndFade ? 'end-fade2' : undefined}></div>
    </div>
  );
}

function Player({ playerName, playerMoney, prevPlayerMoney }) {
  Player.propTypes = {
    playerName: PropTypes.string.isRequired,
    playerMoney: PropTypes.number.isRequired,
    prevPlayerMoney: PropTypes.number.isRequired,
  };

  const [color, setColor] = useState(null);

  useEffect(() => {
    if (playerMoney > prevPlayerMoney) {
      setColor('green');
    } else if (playerMoney < prevPlayerMoney) {
      setColor('red');
    } else if (playerMoney == prevPlayerMoney) {
      setColor('grey');
    }
    setTimeout(() => {
      setColor(null);
    }, 1000);
  }, [playerMoney]);

  return (
    <div className="player">
      <PlayerAvatar playerName={playerName} />
      <span className="player-name">{playerName}</span>
      <span
        className="player-money"
        style={{
          color: color,
        }}
      >
        {playerMoney > prevPlayerMoney ? (
          <ArrowUpLine color="green" style={{ fontSize: '22px' }} />
        ) : playerMoney == prevPlayerMoney ? (
          <Minus
            color="orange"
            style={{ fontSize: '18px', marginRight: '5px' }}
          />
        ) : (
          <ArrowDownLine color="red" style={{ fontSize: '22px' }} />
        )}
        ${playerMoney?.toFixed(2)}
      </span>
    </div>
  );
}

export default Game;
