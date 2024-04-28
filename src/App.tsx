import { Route, Routes } from "react-router-dom"
import LandingPage from "./components/LandingPage"
import Game from "./components/Game"

const App = () => {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/game" element={<Game />} />
        </Routes>
    )
}

export default App