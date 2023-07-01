import { Route, Routes } from 'react-router'
import { Scenarios } from './pages/start/Scenarios'
import { Room } from './pages/room/Room'
import Login from './pages/login/login'

function App() {
  return (
    <Routes>
    <Route path="/" element={<Login />} />
    <Route path="/scenario" element={<Scenarios />} />
    <Route path="/room/:scenarioId" element={<Room />} />
  </Routes>
  )
}

export default App
