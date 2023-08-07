import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader } from 'rsuite';

function Loading() {
  const navigate = useNavigate();

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
      // TODO: check if a game with this code exists and route to home / lobby/game accordingly
      navigate(`/home/${code}`);
      return;
    }
    navigate('/home');
  }, []);

  // TODO: change spinner color
  return <Loader size="lg" content="Loading..." vertical center />;
}

export default Loading;
