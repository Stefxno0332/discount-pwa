import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Header } from './components';
import { Home, ProductDetail, Watchlist, Compare, Settings, Login, Register } from './pages';
import { useAuthStore, useAppStore } from './store';

function App() {
    const { initAuth } = useAuthStore();
    const { darkMode } = useAppStore();

    useEffect(() => {
        // Initialize auth from storage
        initAuth();

        // Initialize dark mode
        if (darkMode) {
            document.documentElement.classList.add('dark');
        }
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
            <Routes>
                {/* Auth routes without header */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Main routes with header */}
                <Route
                    path="/*"
                    element={
                        <>
                            <Header />
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/product/:id" element={<ProductDetail />} />
                                <Route path="/watchlist" element={<Watchlist />} />
                                <Route path="/compare" element={<Compare />} />
                                <Route path="/settings" element={<Settings />} />
                            </Routes>
                        </>
                    }
                />
            </Routes>
        </div>
    );
}

export default App;
