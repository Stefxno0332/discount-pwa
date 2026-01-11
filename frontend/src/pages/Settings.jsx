import { useState, useEffect } from 'react';
import { FiBell, FiSmartphone, FiMoon, FiSun, FiSave } from 'react-icons/fi';
import { useAuthStore, useAppStore } from '../store';
import { subscribeToPush, unsubscribeFromPush, isPushSubscribed, requestNotificationPermission } from '../services/notifications';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const Settings = () => {
    const { isAuthenticated, user, updateUser } = useAuthStore();
    const { darkMode, toggleDarkMode } = useAppStore();

    const [pushEnabled, setPushEnabled] = useState(false);
    const [whatsappPhone, setWhatsappPhone] = useState('');
    const [whatsappEnabled, setWhatsappEnabled] = useState(false);
    const [minDiscount, setMinDiscount] = useState(10);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setPushEnabled(user.notifications?.push?.enabled || false);
            setWhatsappEnabled(user.notifications?.whatsapp?.enabled || false);
            setWhatsappPhone(user.notifications?.whatsapp?.phone || '');
            setMinDiscount(user.preferences?.minDiscountPercent || 10);
        }

        checkPushStatus();
    }, [user]);

    const checkPushStatus = async () => {
        const subscribed = await isPushSubscribed();
        setPushEnabled(subscribed);
    };

    const handlePushToggle = async () => {
        try {
            if (!pushEnabled) {
                const permission = await requestNotificationPermission();
                if (permission !== 'granted') {
                    toast.error('Permesso notifiche negato');
                    return;
                }

                const result = await subscribeToPush();
                if (result.success) {
                    setPushEnabled(true);
                    toast.success('Notifiche push attivate');
                } else {
                    toast.error(result.error);
                }
            } else {
                const result = await unsubscribeFromPush();
                if (result.success) {
                    setPushEnabled(false);
                    toast.success('Notifiche push disattivate');
                }
            }
        } catch (error) {
            toast.error('Errore gestione notifiche');
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Save notification settings
            await api.put('/users/notifications', {
                whatsapp: {
                    enabled: whatsappEnabled,
                    phone: whatsappPhone
                }
            });

            // Save preferences
            await api.put('/users/profile', {
                preferences: {
                    minDiscountPercent: minDiscount
                }
            });

            updateUser({
                notifications: {
                    ...user.notifications,
                    whatsapp: { enabled: whatsappEnabled, phone: whatsappPhone }
                },
                preferences: { ...user.preferences, minDiscountPercent: minDiscount }
            });

            toast.success('Impostazioni salvate');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Errore salvataggio');
        }
        setIsSaving(false);
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Impostazioni</h2>
                    <p className="text-gray-500 dark:text-dark-muted mb-6">
                        Accedi per gestire le impostazioni
                    </p>
                    <Link to="/login" className="btn-primary">
                        Accedi
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
            <div className="container mx-auto px-4 py-8 max-w-2xl">
                <h1 className="text-2xl font-bold mb-8">Impostazioni</h1>

                {/* Appearance */}
                <div className="card p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Aspetto</h2>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {darkMode ? <FiMoon className="w-5 h-5 text-amazon-orange" /> : <FiSun className="w-5 h-5 text-amazon-orange" />}
                            <div>
                                <p className="font-medium">Modalità scura</p>
                                <p className="text-sm text-gray-500 dark:text-dark-muted">
                                    {darkMode ? 'Attiva' : 'Disattiva'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={toggleDarkMode}
                            className={`relative w-14 h-7 rounded-full transition-colors ${darkMode ? 'bg-amazon-orange' : 'bg-gray-300'
                                }`}
                        >
                            <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${darkMode ? 'translate-x-8' : 'translate-x-1'
                                }`} />
                        </button>
                    </div>
                </div>

                {/* Notifications */}
                <div className="card p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Notifiche</h2>

                    {/* Push Notifications */}
                    <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-dark-border">
                        <div className="flex items-center gap-3">
                            <FiBell className="w-5 h-5 text-amazon-orange" />
                            <div>
                                <p className="font-medium">Notifiche Push</p>
                                <p className="text-sm text-gray-500 dark:text-dark-muted">
                                    Ricevi notifiche nel browser
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handlePushToggle}
                            className={`relative w-14 h-7 rounded-full transition-colors ${pushEnabled ? 'bg-amazon-orange' : 'bg-gray-300'
                                }`}
                        >
                            <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${pushEnabled ? 'translate-x-8' : 'translate-x-1'
                                }`} />
                        </button>
                    </div>

                    {/* WhatsApp */}
                    <div className="py-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <FiSmartphone className="w-5 h-5 text-amazon-orange" />
                                <div>
                                    <p className="font-medium">Notifiche WhatsApp</p>
                                    <p className="text-sm text-gray-500 dark:text-dark-muted">
                                        Ricevi messaggi su WhatsApp
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setWhatsappEnabled(!whatsappEnabled)}
                                className={`relative w-14 h-7 rounded-full transition-colors ${whatsappEnabled ? 'bg-amazon-orange' : 'bg-gray-300'
                                    }`}
                            >
                                <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${whatsappEnabled ? 'translate-x-8' : 'translate-x-1'
                                    }`} />
                            </button>
                        </div>

                        {whatsappEnabled && (
                            <input
                                type="tel"
                                placeholder="+39 123 456 7890"
                                value={whatsappPhone}
                                onChange={(e) => setWhatsappPhone(e.target.value)}
                                className="input"
                            />
                        )}
                    </div>
                </div>

                {/* Preferences */}
                <div className="card p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Preferenze</h2>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Sconto minimo per notifiche
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="0"
                                max="70"
                                step="5"
                                value={minDiscount}
                                onChange={(e) => setMinDiscount(parseInt(e.target.value))}
                                className="flex-1 accent-amazon-orange"
                            />
                            <span className="w-16 text-center font-bold text-amazon-orange">
                                {minDiscount}%
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-dark-muted mt-2">
                            Ricevi notifiche solo per sconti superiori a questa percentuale
                        </p>
                    </div>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                >
                    <FiSave className="w-5 h-5" />
                    {isSaving ? 'Salvataggio...' : 'Salva Impostazioni'}
                </button>
            </div>
        </div>
    );
};

export default Settings;
