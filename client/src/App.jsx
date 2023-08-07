import Loading from './pages/Loading';
import Home from './pages/Home';
import Game from './pages/Game';
import Lobby from './pages/Lobby';
import Scoreboard from './pages/Scoreboard';
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
      <Route path="/scoreboard" element={<Scoreboard />} />
    </Routes>
  );
}

export default App;
