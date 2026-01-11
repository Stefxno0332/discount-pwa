import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiMenu, FiX, FiSun, FiMoon, FiHeart, FiUser, FiLogOut, FiSearch, FiColumns } from 'react-icons/fi';
import { useAuthStore, useAppStore, useWatchlistStore } from '../store';

const Header = () => {
    const location = useLocation();
    const { isAuthenticated, user, logout } = useAuthStore();
    const { darkMode, toggleDarkMode, sidebarOpen, toggleSidebar, closeSidebar } = useAppStore();
    const { watchlist, compareList } = useWatchlistStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [showUserMenu, setShowUserMenu] = useState(false);

    useEffect(() => {
        closeSidebar();
    }, [location.pathname]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            window.location.href = `/?search=${encodeURIComponent(searchQuery.trim())}`;
        }
    };

    const navLinks = [
        { path: '/', label: 'Offerte' },
        ...(isAuthenticated ? [
            { path: '/watchlist', label: 'Watchlist', badge: watchlist.length },
            { path: '/compare', label: 'Confronta', badge: compareList.length }
        ] : [])
    ];

    return (
        <header className="sticky top-0 z-50 glass border-b border-gray-200 dark:border-dark-border">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-amazon-orange to-yellow-500 rounded-xl flex items-center justify-center shadow-glow">
                            <span className="text-white font-bold text-lg">A</span>
                        </div>
                        <span className="hidden sm:block font-bold text-lg text-gray-900 dark:text-white">
                            Discount<span className="text-amazon-orange">Tracker</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`relative font-medium transition-colors ${location.pathname === link.path
                                    ? 'text-amazon-orange'
                                    : 'text-gray-600 dark:text-dark-muted hover:text-amazon-orange'
                                    }`}
                            >
                                {link.label}
                                {link.badge > 0 && (
                                    <span className="absolute -top-2 -right-4 w-5 h-5 bg-amazon-orange text-white text-xs rounded-full flex items-center justify-center">
                                        {link.badge}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </nav>

                    {/* Search Bar (Desktop) */}
                    <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md mx-8">
                        <div className="relative w-full">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cerca prodotti..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input pl-10 py-2"
                            />
                        </div>
                    </form>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className="btn-ghost p-2 rounded-lg"
                            aria-label="Toggle dark mode"
                        >
                            {darkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
                        </button>

                        {/* Auth */}
                        {isAuthenticated ? (
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center gap-2 btn-ghost p-2 rounded-lg"
                                >
                                    <div className="w-8 h-8 bg-amazon-orange rounded-full flex items-center justify-center text-white font-medium">
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="hidden sm:block text-sm font-medium">
                                        {user?.name?.split(' ')[0]}
                                    </span>
                                </button>

                                {showUserMenu && (
                                    <div className="absolute right-0 mt-2 w-48 card py-2 animate-slide-down">
                                        <Link
                                            to="/settings"
                                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-border"
                                            onClick={() => setShowUserMenu(false)}
                                        >
                                            <FiUser className="w-4 h-4" />
                                            Impostazioni
                                        </Link>
                                        <Link
                                            to="/watchlist"
                                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-border"
                                            onClick={() => setShowUserMenu(false)}
                                        >
                                            <FiHeart className="w-4 h-4" />
                                            Watchlist
                                        </Link>
                                        <Link
                                            to="/compare"
                                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-border"
                                            onClick={() => setShowUserMenu(false)}
                                        >
                                            <FiColumns className="w-4 h-4" />
                                            Confronta
                                        </Link>
                                        <hr className="my-2 border-gray-200 dark:border-dark-border" />
                                        <button
                                            onClick={() => { logout(); setShowUserMenu(false); }}
                                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-dark-border"
                                        >
                                            <FiLogOut className="w-4 h-4" />
                                            Esci
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="hidden sm:flex items-center gap-2">
                                <Link to="/login" className="btn-ghost text-sm">
                                    Accedi
                                </Link>
                                <Link to="/register" className="btn-primary text-sm">
                                    Registrati
                                </Link>
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={toggleSidebar}
                            className="md:hidden btn-ghost p-2 rounded-lg"
                        >
                            {sidebarOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Search */}
                <form onSubmit={handleSearch} className="lg:hidden pb-3">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cerca prodotti..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input pl-10 py-2"
                        />
                    </div>
                </form>
            </div>

            {/* Mobile Sidebar */}
            {sidebarOpen && (
                <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={closeSidebar}>
                    <div
                        className="absolute right-0 top-0 h-full w-[280px] max-w-[85vw] bg-[#ffffff] dark:bg-[#1e293b] shadow-xl transform transition-transform duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 h-full flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <span className="font-semibold text-lg">Menu</span>
                                <button onClick={closeSidebar} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg">
                                    <FiX className="w-6 h-6" />
                                </button>
                            </div>

                            <nav className="flex-1 space-y-2">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={`flex items-center justify-between px-4 py-3 rounded-lg ${location.pathname === link.path
                                            ? 'bg-amazon-orange/10 text-amazon-orange'
                                            : 'hover:bg-gray-100 dark:hover:bg-dark-border'
                                            }`}
                                    >
                                        {link.label}
                                        {link.badge > 0 && (
                                            <span className="w-6 h-6 bg-amazon-orange text-white text-xs rounded-full flex items-center justify-center">
                                                {link.badge}
                                            </span>
                                        )}
                                    </Link>
                                ))}
                            </nav>

                            {!isAuthenticated && (
                                <div className="pt-4 border-t border-gray-200 dark:border-dark-border space-y-3">
                                    <Link
                                        to="/login"
                                        className="block w-full py-3 px-4 text-center rounded-lg border border-amazon-orange text-amazon-orange font-medium hover:bg-amazon-orange/10 transition-colors"
                                    >
                                        Accedi
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="block w-full py-3 px-4 text-center rounded-lg bg-amazon-orange text-white font-medium hover:bg-amazon-orange/90 transition-colors"
                                    >
                                        Registrati
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
