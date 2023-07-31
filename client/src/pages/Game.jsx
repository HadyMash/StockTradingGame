import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { Dropdown } from 'rsuite';
import 'rsuite/dist/rsuite-no-reset.min.css';
import {
  VictoryChart,
  VictoryLine,
  VictoryAxis,
  VictoryZoomContainer,
  VictoryBrushContainer,
} from 'victory';
import TextInput from '../shared/TextInput';
// TODO: see where i can replace state with refs

// TODO: make game responsive
function Game() {
  return (
    <div className="game-grid">
      <div className="panel chart">
        <Chart
          selectedSymbol="SMBL"
          symbols={['SMBL', 'MSFT']}
          setSymbol={(symbol) => console.log(symbol)}
        />
      </div>
      <div className="panel account">
        <Account
          money={300}
          holdings={{
            SMBL: {
              quantity: 1,
              value: 100.12,
            },
            MSFT: {
              quantity: 2,
              value: 285.24,
            },
          }}
          // TODO: add setSymbol function
          setSymbol={(symbol) => console.log(symbol)}
        />
      </div>
      <div className="panel">
        <Players />
      </div>
    </div>
  );
}

function Chart({ selectedSymbol, symbols, setSymbol }) {
  Chart.propTypes = {
    selectedSymbol: PropTypes.string.isRequired,
    symbols: PropTypes.arrayOf(PropTypes.string).isRequired,
    setSymbol: PropTypes.func.isRequired,
  };

  const [domain, setDomain] = React.useState({ x: [0, 20] });

  // ! temp
  const data = [
    { id: 1, stock: 'SMBL', price: 100 },
    { id: 2, stock: 'SMBL', price: 101 },
    { id: 3, stock: 'SMBL', price: 80 },
    { id: 4, stock: 'SMBL', price: 102 },
    { id: 5, stock: 'SMBL', price: 98 },
    { id: 6, stock: 'SMBL', price: 103 },
    { id: 7, stock: 'SMBL', price: 97 },
    { id: 8, stock: 'SMBL', price: 104 },
    { id: 9, stock: 'SMBL', price: 96 },
    { id: 10, stock: 'SMBL', price: 105 },
    { id: 11, stock: 'SMBL', price: 95 },
    { id: 12, stock: 'SMBL', price: 106 },
    { id: 13, stock: 'SMBL', price: 94 },
    { id: 14, stock: 'SMBL', price: 107 },
    { id: 15, stock: 'SMBL', price: 93 },
    { id: 16, stock: 'SMBL', price: 108 },
    { id: 17, stock: 'SMBL', price: 92 },
    { id: 18, stock: 'SMBL', price: 109 },
    { id: 19, stock: 'SMBL', price: 91 },
    { id: 20, stock: 'SMBL', price: 110 },
    { id: 21, stock: 'SMBL', price: 105 },
    { id: 22, stock: 'SMBL', price: 102 },
    { id: 23, stock: 'SMBL', price: 95 },
    { id: 24, stock: 'SMBL', price: 98 },
    { id: 25, stock: 'SMBL', price: 100 },
    { id: 26, stock: 'SMBL', price: 103 },
    { id: 27, stock: 'SMBL', price: 110 },
    { id: 28, stock: 'SMBL', price: 101 },
    { id: 29, stock: 'SMBL', price: 96 },
    { id: 30, stock: 'SMBL', price: 108 },
    { id: 31, stock: 'SMBL', price: 94 },
    { id: 32, stock: 'SMBL', price: 97 },
    { id: 33, stock: 'SMBL', price: 109 },
    { id: 34, stock: 'SMBL', price: 92 },
    { id: 35, stock: 'SMBL', price: 103 },
    { id: 36, stock: 'SMBL', price: 101 },
    { id: 37, stock: 'SMBL', price: 99 },
    { id: 38, stock: 'SMBL', price: 96 },
    { id: 39, stock: 'SMBL', price: 104 },
    { id: 40, stock: 'SMBL', price: 95 },
    // Add more entries here...
  ];

  const { maxPrice, minPrice } = data.reduce(
    ({ maxPrice, minPrice }, obj) => ({
      maxPrice: obj.price > maxPrice ? obj.price : maxPrice,
      minPrice: obj.price < minPrice ? obj.price : minPrice,
    }),
    { maxPrice: data[0]?.price || null, minPrice: data[0]?.price || null }
  );

  return (
    <React.Fragment>
      <div
        className="graph"
        // TODO: fix issue with trackpad not working great and stuttering
        onWheelCapture={(e) => {
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
              y: [minPrice - 5, maxPrice + 5],
            };
          });
        }}
      >
        <VictoryChart
          containerComponent={
            <VictoryZoomContainer
              zoomDimension="x"
              zoomDomain={domain}
              onZoomDomainChange={(domain) => console.log(domain)}
              allowZoom={false}
            />
          }
        >
          <VictoryLine data={data} x="id" y="price" />
        </VictoryChart>
      </div>
      <div className="dropdown">
        <Dropdown title={selectedSymbol} activeKey={selectedSymbol}>
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

function Account({ money, holdings, setSymbol }) {
  Account.propTypes = {
    money: PropTypes.number.isRequired,
    holdings: PropTypes.objectOf(PropTypes.object).isRequired,
    setSymbol: PropTypes.func.isRequired,
  };

  return (
    <React.Fragment>
      <div className="title">
        <h1>Account</h1>
        <h1>${money}</h1>
      </div>
      <Holdings holdings={holdings} setSymbol={setSymbol} />
      <Trade
        symbol={'SMBL'}
        moneyAvailable={1000}
        quantityAvailable={10}
        price={30}
      />
    </React.Fragment>
  );
}

function Holdings({ holdings, setSymbol }) {
  Holdings.propTypes = {
    holdings: PropTypes.objectOf(PropTypes.object).isRequired,
    setSymbol: PropTypes.func.isRequired,
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
            value={holdings[symbol].value}
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
      />
      <input
        type="range"
        value={quantity}
        min={0}
        max={maxQuantity}
        step={0.01}
        onChange={(e) => {
          setQuantity(e.target.value);
          setEstimatedTotal(Math.round(e.target.value * price * 100) / 100);
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

function Players() {
  return (
    <div>
      <Player />
    </div>
  );
}

function Player() {
  return <div>Player</div>;
}

export default Game;
