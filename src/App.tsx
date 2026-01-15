import './App.css'
import { GameProvider } from './context/GameContext'
import { GameView } from './components/GameView'

function App() {
  return (
    <GameProvider>
      <GameView />
    </GameProvider>
  )
}

export default App
