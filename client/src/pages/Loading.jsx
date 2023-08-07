import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader } from 'rsuite';

function Loading() {
  const navigate = useNavigate();

  useEffect(() => {
    const code = window.location.search.substring(1);
    if (code) {
      // TODO: get game and route to lobby or game accordingly
      // get code with use params and use url as fallback
      // ! temp
      // TODO: remove artificial delay when data is actually fetched from the server
      setTimeout(() => {
        navigate(`/lobby/${code}`);
      }, 2000);
    } else {
      navigate('/home');
    }
  }, []);

  // TODO: change spinner color
  return <Loader size="lg" content="Loading..." vertical center />;
}

export default Loading;
