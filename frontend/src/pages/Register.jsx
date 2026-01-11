import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';

const Register = () => {
    const navigate = useNavigate();
    const { register, isLoading } = useAuthStore();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name || !email || !password || !confirmPassword) {
            toast.error('Compila tutti i campi');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Le password non corrispondono');
            return;
        }

        if (password.length < 6) {
            toast.error('La password deve avere almeno 6 caratteri');
            return;
        }

        const result = await register(name, email, password);

        if (result.success) {
            toast.success('Registrazione completata!');
            navigate('/');
        } else {
            toast.error(result.error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-amazon-orange to-yellow-500 rounded-xl flex items-center justify-center shadow-glow">
                            <span className="text-white font-bold text-xl">A</span>
                        </div>
                    </Link>
                    <h1 className="text-2xl font-bold mt-4">Crea un account</h1>
                    <p className="text-gray-500 dark:text-dark-muted mt-2">
                        Inizia a monitorare le offerte
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="card p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Nome</label>
                        <div className="relative">
                            <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Il tuo nome"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="input pl-10"
                                autoComplete="name"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <div className="relative">
                            <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="email"
                                placeholder="tua@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input pl-10"
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Password</label>
                        <div className="relative">
                            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Minimo 6 caratteri"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input pl-10 pr-10"
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Conferma Password</label>
                        <div className="relative">
                            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Ripeti la password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="input pl-10"
                                autoComplete="new-password"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full py-3"
                    >
                        {isLoading ? 'Registrazione...' : 'Registrati'}
                    </button>
                </form>

                <p className="text-center mt-6 text-gray-500 dark:text-dark-muted">
                    Hai già un account?{' '}
                    <Link to="/login" className="text-amazon-orange hover:underline font-medium">
                        Accedi
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
