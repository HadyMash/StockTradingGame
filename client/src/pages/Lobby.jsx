import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import PlayerAvatar from '../shared/PlayerAvatar';
const PLAYER_NAME_WIDTH_PIXELS = 100;

// TODO: get code from memory router params and url as fallback
function Lobby() {
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => {
      navigate('/game');
    }, 100000);
  }, []);

  // const names= useEffect({
  //   dispatch("")
  // },[arrayName]);
  const names = ['Amira', 'Sara', 'Adam', 'Nawar', 'Hady', 'Yahia'];
  const windowSize = useWindowSize();

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="lobby">
        <h1>Lobby</h1>
        {/* <NameComponent /> */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignContent: 'center',
            overflowY: 'auto',
            overflowX: 'hidden',
            height: '100%',
            width: '100%',
            alignItems: 'center',
            margin: '66px 44px',
          }}
        >
          <div
            className="names"
            style={{
              gridAutoColumns: `repeat(5, 100px)`,
            }}
          >
            {/* {names.map((hostname, index) => (
              <hostcomponent key={index} i={index} name={hostname} />
            ))} */}
            {names.map((name, index) => (
              <div key={index}>
                {index === 0 ? (
                  <HostComponent name={name} />
                ) : (
                  <NameComponent key={index} i={index} name={name} />
                )}
              </div>
            ))}
          </div>
        </div>
        <button className="start-game">Start Game</button>
      </div>
      <button className="leave">Leave</button>
    </div>
  );

  // return <div>Lobby</div>;
}
// const HostComponent = ({ props }) => {
function HostComponent(props) {
  const { i, name, handleCheckboxChange } = props;

  const ProfilePicture = () => {
    return (
      <div className="profile-picture">
        <FontAwesomeIcon icon={faUser} size="4x" />
      </div>
    );
  };

  return (
    <div className="side-by-side">
      <PlayerAvatar playerName={name} />
      <span className="playersnames">{name}</span>
    </div>
  );
}
function NameComponent(props) {
  const { i, name, handleCheckboxChange } = props;
  const [isModalVisible, setIsModalVisible] = useState(false);
  //   Esxit button
  const handleXClick = () => {
    // Perform exit action here
    setIsModalVisible(false);
  };

  const ProfilePicture = () => {
    return (
      <div className="profile-picture">
        <FontAwesomeIcon icon={faUser} size="4x" />
      </div>
    );
  };

  return (
    <div className="side-by-side">
      <PlayerAvatar playerName={name} />
      <span className="playersnames">{name}</span>

      <button className="leave-button" onClick={handleXClick}>
        X
      </button>

      {/* <button onClick={() => setIsModalVisible(true)}></button> */}
    </div>
  );
}

// Hook
function useWindowSize() {
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });
  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    // Add event listener
    window.addEventListener('resize', handleResize);
    // Call handler right away so state gets updated with initial window size
    handleResize();
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty array ensures that effect is only run on mount
  return windowSize;
}

export default Lobby;
