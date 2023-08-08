import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Dropdown, Slider } from 'rsuite';
import 'rsuite/dist/rsuite-no-reset.min.css';
import {
  VictoryAxis,
  VictoryChart,
  VictoryLine,
  VictoryZoomContainer,
} from 'victory';
import TextInput from '../shared/TextInput';
import PlayerAvatar from '../shared/PlayerAvatar';
import { Minus, ArrowDownLine, ArrowUpLine } from '@rsuite/icons';
import { GameState } from '../../../game.mjs';

// TODO: see where i can replace state with refs

// TODO: get code from memory router params and url as fallback
// TODO: make game page responsive
function Game() {
  const location = useLocation();
  const navigate = useNavigate();
  const [game, setGame] = React.useState(location.state.game);
  const [players, setPlayers] = React.useState(location.state.players);
  const [localPlayer, _setLocalPlayer] = React.useState(
    location.state.localPlayer
  );
  function setLocalPlayer(newLocalPlayer) {
    setPreviousLocalPlayer(localPlayer);
    _setLocalPlayer(newLocalPlayer);
  }
  const [previousLocalPlayer, setPreviousLocalPlayer] = React.useState(
    location.state.localPlayer
  );
  const [stockData, setStockData] = React.useState(location.state.stockData);
  const symbols = Object.keys(location.state.stockData[0]);
  const [selectedSymbol, setSelectedSymbol] = React.useState(symbols[0]);
  const [timeRemainingForDay, setTimeRemainingForDay] = React.useState(
    game.settings.roundDurationSeconds
  );

  useEffect(() => {
    console.log(
      'game',
      game,
      'players',
      players,
      'localPlayer',
      localPlayer,
      'stockData',
      stockData,
      'symbols',
      symbols,
      'selectedSymbol',
      selectedSymbol,
      'timeRemainingForDay',
      timeRemainingForDay
    );
  }, []);

  useEffect(() => {
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
              // TODO: show error to user and navigate back to home
              console.log('game not yet started inside game.jsx');
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
        // TODO: show error to user
      }
    }, game.settings.roundDurationSeconds * 1000);

    return () => {
      clearInterval(updateIntervalId);
      abortController?.abort();
    };
  }, []);

  // ! temp
  useEffect(() => {
    console.log('timeRemainingForDay:', timeRemainingForDay);
  }, [timeRemainingForDay]);

  return (
    <div className="game-grid">
      <div className="panel chart">
        <Chart
          selectedSymbol={selectedSymbol}
          symbols={symbols}
          setSymbol={setSelectedSymbol}
          data={stockData}
        />
      </div>
      <div className="panel account">
        <Account
          money={localPlayer.money}
          holdings={localPlayer.stocks}
          setSymbol={setSelectedSymbol}
          latestStockData={stockData[stockData.length - 1]}
        />
      </div>
      <div className="panel">
        <Players localPlayer={localPlayer} players={players} />
      </div>
    </div>
  );
}

function Chart({ selectedSymbol, symbols, setSymbol, data }) {
  Chart.propTypes = {
    selectedSymbol: PropTypes.string.isRequired,
    symbols: PropTypes.arrayOf(PropTypes.string).isRequired,
    setSymbol: PropTypes.func.isRequired,
    data: PropTypes.arrayOf(PropTypes.object).isRequired,
  };

  const [domain, setDomain] = React.useState({ x: [0, 20] });
  const [graphDimensions, setGraphDimensions] = React.useState(null);
  const graphRef = useRef(null);

  const symbolData = data.map((obj) => {
    return {
      id: obj[selectedSymbol].id,
      price: obj[selectedSymbol].price,
      volume: obj[selectedSymbol].volume,
    };
  });

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

  const { maxPrice, minPrice } = symbolData.reduce(
    ({ maxPrice, minPrice }, obj) => ({
      maxPrice: obj.price > maxPrice ? obj.price : maxPrice,
      minPrice: obj.price < minPrice ? obj.price : minPrice,
    }),
    {
      maxPrice: symbolData[0]?.price || null,
      minPrice: symbolData[0]?.price || null,
    }
  );

  function panGraph(e) {
    setDomain((currentDomain) => {
      e.stopPropagation();
      let delta = (e.deltaY || e.deltaX) * 0.05;
      if (currentDomain.x[0] + delta < 0) {
        delta = -currentDomain.x[0];
      }
      if (currentDomain.x[1] + delta > symbolData.length) {
        delta = symbolData.length - currentDomain.x[1] + 2;
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
        onWheelCapture={panGraph}
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
            data={symbolData}
            x="id"
            y="price"
            // TODO: fix scuffed animation
            // animate={{
            //   onEnter: {
            //     duration: 500,
            //     before: () => ({
            //       _y: symbolData[symbolData.length - 2].price || 0,
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
        {/* // TODO: make caret bigger */}
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

function Account({ money, holdings, setSymbol, latestStockData }) {
  Account.propTypes = {
    money: PropTypes.number.isRequired,
    holdings: PropTypes.objectOf(PropTypes.object).isRequired,
    setSymbol: PropTypes.func.isRequired,
    latestStockData: PropTypes.object.isRequired,
  };

  return (
    <React.Fragment>
      <div className="title">
        <h1>Account</h1>
        <h1>${money}</h1>
      </div>
      <Holdings
        holdings={holdings}
        setSymbol={setSymbol}
        latestStockData={latestStockData}
      />
      <Trade
        symbol={'SMBL'}
        moneyAvailable={1000}
        quantityAvailable={10}
        price={30}
      />
    </React.Fragment>
  );
}

function Holdings({ holdings, setSymbol, latestStockData }) {
  Holdings.propTypes = {
    holdings: PropTypes.objectOf(PropTypes.object).isRequired,
    setSymbol: PropTypes.func.isRequired,
    latestStockData: PropTypes.object.isRequired,
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
            quantity={holdings[symbol].quantity}
            value={holdings[symbol].quantity * latestStockData[symbol].price}
            setSymbol={setSymbol}
          />
        ))}
      </div>
      <div className="end-fade"></div>
    </div>
  );
}

function Asset({ symbol, quantity, value, setSymbol }) {
  Asset.propTypes = {
    symbol: PropTypes.string.isRequired,
    quantity: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
    setSymbol: PropTypes.func.isRequired,
  };

  // TODO: make symbol clickable
  // TODO: add commas to value
  return (
    <React.Fragment>
      <p className="symbol" onClick={() => setSymbol(symbol)}>
        {symbol}
      </p>
      <p className="quantity">{quantity}</p>
      <p className="value">${value}</p>
    </React.Fragment>
  );
}

function Trade({ symbol, moneyAvailable, quantityAvailable, price }) {
  Trade.propTypes = {
    symbol: PropTypes.string.isRequired,
    moneyAvailable: PropTypes.number.isRequired,
    quantityAvailable: PropTypes.number.isRequired,
    price: PropTypes.number.isRequired,
  };

  // TODO: combine quantity and total into one state
  const [quantity, setQuantity] = React.useState(0);
  const [estimatedTotal, setEstimatedTotal] = React.useState(0);
  const [showBuy, setShowBuy] = React.useState(true);

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

  // TODO: clamp quantity and total when toggling between buy and sell
  const toggleShowBuy = () => setShowBuy((val) => !val);

  // TODO: add suffix to quantity and total

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
      {/* // TODO: style sliders to match the ones on the home page */}
      <TextInput
        type="number"
        prefix="Quantity:"
        min={0}
        max={maxQuantity}
        value={quantity}
        setValue={(val) => {
          setQuantity(val);
          setEstimatedTotal(Math.round(val * price * 100) / 100);
        }}
        suffix={() => (
          <p
            className="max-button"
            onClick={() => {
              setQuantity(maxQuantity);
              setEstimatedTotal(Math.round(maxQuantity * price * 100) / 100);
            }}
          >
            Max
          </p>
        )}
      />
      <TextInput
        type="number"
        // TODO: add approximate symbol
        prefix={`Total:${estimatedTotal > 0 ? ' $' : ''}`}
        min={0}
        max={maxTotal}
        value={estimatedTotal}
        setValue={(val) => {
          const initialQuantity = val / price;
          const roundedQuantity = Math.round(initialQuantity * 100) / 100;
          setEstimatedTotal(val);
          setQuantity(roundedQuantity);
        }}
        suffix={() => (
          <p
            className="max-button"
            onClick={() => {
              setQuantity(Math.round(maxTotal * 100) / 100);
              setEstimatedTotal(maxTotal);
            }}
          >
            Max
          </p>
        )}
      />
      {/* // TODO: style slider */}
      <Slider
        progress
        value={quantity}
        min={0}
        max={maxQuantity}
        step={0.01}
        onChange={(val) => {
          setQuantity(val);
          setEstimatedTotal(Math.round(val * price * 100) / 100);
        }}
      />
      <div className="space-around-flex">
        {showBuy ? (
          <button className="buy">Buy</button>
        ) : (
          <button className="sell">Sell</button>
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

  const [showStartFade, setShowStartFade] = React.useState(false);
  const [showEndFade, setShowEndFade] = React.useState(true);

  const aiIndex = players.findIndex((player) => player.id === 'ai');

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
          key={localPlayer.id}
          playerName={localPlayer.name}
          playerMoney={localPlayer.money}
          prevPlayerMoney={localPlayer.money}
        />
        <Player
          key={players[aiIndex].id}
          playerName={players[aiIndex].name}
          playerMoney={players[aiIndex].netWorth}
          prevPlayerMoney={players[aiIndex].netWorth}
        />
        {
          // TODO: cache to avoid redundant computation
          // TODO: implement previous money
          players
            .filter(
              (player) => player.id !== localPlayer.id && player.id !== 'ai'
            )
            .map((player) => (
              <Player
                key={player.id}
                playerName={player.name}
                playerMoney={player.netWorth}
                prevPlayerMoney={player.netWorth}
              />
            ))
        }
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

  return (
    <div className="player">
      <PlayerAvatar playerName={playerName} />
      <span className="player-name">{playerName}</span>
      <span className="player-money">
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
        ${playerMoney}
      </span>
    </div>
  );
}

export default Game;
