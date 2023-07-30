import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import TextInput from '../shared/TextInput';

// TODO: see where i can replace state with refs

// TODO: make game responsive
function Game() {
  return (
    <div className="game-grid">
      <div className="panel">
        <Chart />
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
        />
      </div>
      <div className="panel">
        <Players />
      </div>
    </div>
  );
}

// TODO: add chart
function Chart() {
  return <div>Chart</div>;
}

function Account({ money, holdings }) {
  Account.propTypes = {
    money: PropTypes.number.isRequired,
    holdings: PropTypes.objectOf(PropTypes.object).isRequired,
  };

  return (
    <React.Fragment>
      <div className="title">
        <h1>Account</h1>
        <h1>${money}</h1>
      </div>
      <Holdings holdings={holdings} />
      <Trade
        symbol={'SMBL'}
        moneyAvailable={1000}
        quantityAvailable={10}
        price={30}
      />
    </React.Fragment>
  );
}

function Holdings({ holdings }) {
  Holdings.propTypes = {
    holdings: PropTypes.objectOf(PropTypes.object).isRequired,
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
          />
        ))}
      </div>
      <div className="end-fade"></div>
    </div>
  );
}

function Asset({ symbol, quantity, value }) {
  Asset.propTypes = {
    symbol: PropTypes.string.isRequired,
    quantity: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
  };

  // TODO: make symbol clickable
  // TODO: add commas to value
  return (
    <React.Fragment>
      <p className="symbol">{symbol}</p>
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

  // TODO: fix bug with typing in total and it adding a decimal
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
          const newTotal = roundedQuantity * price;
          const roundedTotal = Math.round(newTotal * 100) / 100;

          setEstimatedTotal(roundedTotal);
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
