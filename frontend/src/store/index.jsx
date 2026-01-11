import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

// Auth Store
export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,

            login: async (email, password) => {
                set({ isLoading: true });
                try {
                    const response = await api.post('/users/login', { email, password });
                    const { user, token } = response.data.data;
                    set({ user, token, isAuthenticated: true, isLoading: false });
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    return { success: true };
                } catch (error) {
                    set({ isLoading: false });
                    return { success: false, error: error.response?.data?.message || 'Login failed' };
                }
            },

            register: async (name, email, password) => {
                set({ isLoading: true });
                try {
                    const response = await api.post('/users/register', { name, email, password });
                    const { user, token } = response.data.data;
                    set({ user, token, isAuthenticated: true, isLoading: false });
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    return { success: true };
                } catch (error) {
                    set({ isLoading: false });
                    return { success: false, error: error.response?.data?.message || 'Registration failed' };
                }
            },

            logout: () => {
                set({ user: null, token: null, isAuthenticated: false });
                delete api.defaults.headers.common['Authorization'];
            },

            updateUser: (userData) => {
                set({ user: { ...get().user, ...userData } });
            },

            initAuth: () => {
                const token = get().token;
                if (token) {
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                }
            }
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated })
        }
    )
);

// App Store (theme, preferences)
export const useAppStore = create(
    persist(
        (set) => ({
            darkMode: true,
            sidebarOpen: false,

            toggleDarkMode: () => {
                set((state) => {
                    const newMode = !state.darkMode;
                    if (newMode) {
                        document.documentElement.classList.add('dark');
                    } else {
                        document.documentElement.classList.remove('dark');
                    }
                    return { darkMode: newMode };
                });
            },

            setDarkMode: (value) => {
                if (value) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
                set({ darkMode: value });
            },

            toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
            closeSidebar: () => set({ sidebarOpen: false })
        }),
        {
            name: 'app-storage',
            partialize: (state) => ({ darkMode: state.darkMode })
        }
    )
);

// Products Store
export const useProductsStore = create((set, get) => ({
    products: [],
    currentProduct: null,
    categories: [],
    stats: null,
    filters: {
        category: '',
        minDiscount: 0,
        minPrice: '',
        maxPrice: '',
        sortBy: 'dealScore',
        sortOrder: 'desc',
        search: ''
    },
    pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
    },
    isLoading: false,
    error: null,

    setFilters: (newFilters) => {
        set({ filters: { ...get().filters, ...newFilters }, pagination: { ...get().pagination, page: 1 } });
    },

    resetFilters: () => {
        set({
            filters: {
                category: '',
                minDiscount: 0,
                minPrice: '',
                maxPrice: '',
                sortBy: 'dealScore',
                sortOrder: 'desc',
                search: ''
            },
            pagination: { ...get().pagination, page: 1 }
        });
    },

    setPage: (page) => {
        set({ pagination: { ...get().pagination, page } });
    },

    fetchProducts: async () => {
        set({ isLoading: true, error: null });
        try {
            const { filters, pagination } = get();
            const params = new URLSearchParams();

            params.append('page', pagination.page);
            params.append('limit', pagination.limit);
            if (filters.category) params.append('category', filters.category);
            if (filters.minDiscount) params.append('minDiscount', filters.minDiscount);
            if (filters.minPrice) params.append('minPrice', filters.minPrice);
            if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
            if (filters.sortBy) params.append('sortBy', filters.sortBy);
            if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
            if (filters.search) params.append('search', filters.search);

            const response = await api.get(`/products?${params}`);
            set({
                products: response.data.data,
                pagination: response.data.pagination,
                isLoading: false
            });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    fetchProduct: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get(`/products/${id}`);
            set({ currentProduct: response.data.data, isLoading: false });
            return response.data.data;
        } catch (error) {
            set({ error: error.message, isLoading: false });
            return null;
        }
    },

    fetchCategories: async () => {
        try {
            const response = await api.get('/products/meta/categories');
            set({ categories: response.data.data });
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    },

    fetchStats: async () => {
        try {
            const response = await api.get('/products/meta/stats');
            set({ stats: response.data.data });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }
}));

// Watchlist Store
export const useWatchlistStore = create((set, get) => ({
    watchlist: [],
    compareList: [],
    isLoading: false,

    fetchWatchlist: async () => {
        set({ isLoading: true });
        try {
            const response = await api.get('/users/watchlist');
            set({ watchlist: response.data.data, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
        }
    },

    addToWatchlist: async (productId) => {
        try {
            await api.post(`/users/watchlist/${productId}`);
            get().fetchWatchlist();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.message };
        }
    },

    removeFromWatchlist: async (productId) => {
        try {
            await api.delete(`/users/watchlist/${productId}`);
            set({ watchlist: get().watchlist.filter(p => p._id !== productId && p.asin !== productId) });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.message };
        }
    },

    isInWatchlist: (productId) => {
        return get().watchlist.some(p => p._id === productId || p.asin === productId);
    },

    fetchCompareList: async () => {
        try {
            const response = await api.get('/users/compare');
            set({ compareList: response.data.data });
        } catch (error) {
            console.error('Failed to fetch compare list:', error);
        }
    },

    addToCompare: async (productId) => {
        try {
            await api.post(`/users/compare/${productId}`);
            get().fetchCompareList();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.message };
        }
    },

    removeFromCompare: async (productId) => {
        try {
            await api.delete(`/users/compare/${productId}`);
            set({ compareList: get().compareList.filter(p => p._id !== productId) });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.message };
        }
    },

    clearCompare: async () => {
        try {
            await api.delete('/users/compare');
            set({ compareList: [] });
        } catch (error) {
            console.error('Failed to clear compare list:', error);
        }
    }
}));
