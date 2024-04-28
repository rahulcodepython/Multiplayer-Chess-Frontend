import { Link } from "react-router-dom"

const LandingPage = () => {
    return (
        <div className="h-screen flex items-center justify-center">
            <Link to="/game">
                <button className="px-12 py-8 text-xl bg-green-700 hover:bg-green-800 rounded-md text-white">
                    Start Game
                </button>
            </Link>
        </div>
    )
}

export default LandingPage