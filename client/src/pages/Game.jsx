import PropTypes from 'prop-types';
import React from 'react';
import TextInput from '../shared/TextInput';

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
      <Trade symbol={'SMBL'} />
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

  return (
    <React.Fragment>
      <p className="symbol">{symbol}</p>
      <p className="quantity">{quantity}</p>
      <p className="value">${value}</p>
    </React.Fragment>
  );
}

function Trade({ symbol }) {
  Trade.propTypes = {
    symbol: PropTypes.string.isRequired,
  };

  // TODO: make it when you type in quantity or total, the other is updated
  // TODO: make it so when you type in quantity or total, prefix is added
  // TODO: add suffix to quantity and total
  return (
    <div className="trade">
      <h2>{symbol}</h2>
      <TextInput type={'number'} prefix={'Quantity:'} />
      <TextInput type="number" prefix="Total:" />
      <div className="space-around-flex">
        <button className="sell">Sell</button>
        <button className="buy">Buy</button>
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
