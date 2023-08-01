import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// TODO: get code from memory router params and url as fallback
function Lobby() {
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => {
      navigate('/game');
    }, 3000);
  }, []);

  return <div>Lobby</div>;
}

export default Lobby;
