import Loading from './pages/Loading';
import Home from './pages/Home';
import Game from './pages/Game';
import Lobby from './pages/Lobby';
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Loading />} />
      <Route path="/home" element={<Home />} />
      <Route path="/lobby" element={<Lobby />} />
      <Route path="/lobby/:code" element={<Lobby />} />
      <Route path="/game" element={<Game />} />
      <Route path="/game/:code" element={<Game />} />
    </Routes>
  );
}

export default App;
