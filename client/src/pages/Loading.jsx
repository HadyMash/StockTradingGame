import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader } from 'rsuite';

function Loading() {
  const navigate = useNavigate();

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
      navigate(`/home/${code}`);
      return;
    }
    navigate('/home');
  }, []);

  return <Loader size="lg" content="Loading..." vertical center />;
}

export default Loading;
