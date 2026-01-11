import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const PriceChart = ({ priceHistory, title = 'Storico Prezzi' }) => {
    if (!priceHistory || priceHistory.length === 0) {
        return (
            <div className="card p-6 text-center">
                <p className="text-gray-500 dark:text-dark-muted">
                    Nessun dato storico disponibile
                </p>
            </div>
        );
    }

    // Format data for chart
    const chartData = priceHistory.map((item) => ({
        date: new Date(item.date).toLocaleDateString('it-IT', {
            day: '2-digit',
            month: 'short'
        }),
        fullDate: new Date(item.date).toLocaleDateString('it-IT'),
        price: item.price
    }));

    const minPrice = Math.min(...priceHistory.map(p => p.price));
    const maxPrice = Math.max(...priceHistory.map(p => p.price));
    const avgPrice = priceHistory.reduce((acc, p) => acc + p.price, 0) / priceHistory.length;

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-dark-card border border-dark-border rounded-lg p-3 shadow-xl">
                    <p className="text-xs text-dark-muted mb-1">{payload[0].payload.fullDate}</p>
                    <p className="text-lg font-bold text-amazon-orange">
                        €{payload[0].value.toFixed(2)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">{title}</h3>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-dark-muted mb-1">Minimo</p>
                    <p className="text-lg font-bold text-green-500">€{minPrice.toFixed(2)}</p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-dark-muted mb-1">Media</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">€{avgPrice.toFixed(2)}</p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-dark-muted mb-1">Massimo</p>
                    <p className="text-lg font-bold text-red-500">€{maxPrice.toFixed(2)}</p>
                </div>
            </div>

            {/* Chart */}
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#FF9900" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#FF9900" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: '#94A3B8', fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            tick={{ fill: '#94A3B8', fontSize: 12 }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `€${value}`}
                            domain={['dataMin - 5', 'dataMax + 5']}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="price"
                            stroke="#FF9900"
                            strokeWidth={2}
                            fill="url(#priceGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Period info */}
            <p className="text-center text-xs text-gray-500 dark:text-dark-muted mt-4">
                Dati degli ultimi {priceHistory.length} giorni disponibili
            </p>
        </div>
    );
};

export default PriceChart;
