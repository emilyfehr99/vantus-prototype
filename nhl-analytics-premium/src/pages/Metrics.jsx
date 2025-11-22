import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { nhlApi } from '../api/nhl';
import { backendApi } from '../api/backend';
import { motion } from 'framer-motion';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Users, TrendingUp } from 'lucide-react';
import clsx from 'clsx';

const SortIcon = ({ column, sortConfig }) => {
    if (sortConfig.key !== column) {
        return <ArrowUpDown size={14} className="text-text-muted opacity-50 group-hover:opacity-100" />;
    }
    return sortConfig.direction === 'ascending' ?
        <ArrowUp size={14} className="text-accent-primary" /> :
        <ArrowDown size={14} className="text-accent-primary" />;
};

const Metrics = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingAdvanced, setLoadingAdvanced] = useState(false);
    const [advancedMetrics, setAdvancedMetrics] = useState({});
    const [sortConfig, setSortConfig] = useState({ key: 'points', direction: 'descending' });
    const [filter, setFilter] = useState('');
    const [backendAvailable, setBackendAvailable] = useState(true);
    const [metricsView, setMetricsView] = useState('team'); // 'team' or 'player'
    const [playerStats, setPlayerStats] = useState([]);
    const [loadingPlayers, setLoadingPlayers] = useState(false);
    const [playerStatsError, setPlayerStatsError] = useState(null);
    const [playerSortConfig, setPlayerSortConfig] = useState({ key: 'game_score', direction: 'descending' });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Use current date to avoid redirect issues
                const today = new Date().toISOString().split('T')[0];
                const standingsData = await nhlApi.getStandings(today);

                const processedData = standingsData.standings.map(team => ({
                    rank: team.leagueSequence,
                    name: team.teamName.default,
                    abbrev: team.teamAbbrev.default,
                    logo: team.teamLogo,
                    gp: team.gamesPlayed,
                    w: team.wins,
                    l: team.losses,
                    otl: team.otLosses,
                    pts: team.points,
                    pPct: team.pointPctg.toFixed(3),
                    gf: team.goalFor,
                    ga: team.goalAgainst,
                    diff: team.goalDifferential,
                    l10: `${team.l10Wins}-${team.l10Losses}-${team.l10OtLosses}`,
                    streak: `${team.streakCode}${team.streakCount}`,
                    rw: team.regulationWins,
                    row: team.regulationPlusOtWins,
                }));
                setData(processedData);
                setLoading(false);

                // Try to fetch advanced metrics from backend
                setLoadingAdvanced(true);
                try {
                    const metrics = await backendApi.getTeamMetrics();
                    setAdvancedMetrics(metrics);
                    setBackendAvailable(true);
                } catch (error) {
                    console.warn('Backend API not available, advanced metrics will not be shown:', error);
                    setBackendAvailable(false);
                }
                setLoadingAdvanced(false);
            } catch (error) {
                console.error('Failed to fetch metrics data:', error);
                setLoading(false);
                setLoadingAdvanced(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const fetchPlayerStats = async () => {
            if (metricsView !== 'player') {
                setPlayerStats([]);
                setPlayerStatsError(null);
                return;
            }
            
            setLoadingPlayers(true);
            setPlayerStatsError(null);
            try {
                const stats = await backendApi.getPlayerStats('2025', 'regular', '5on5');
                setPlayerStats(stats || []);
            } catch (error) {
                console.error('Failed to fetch player stats:', error);
                setPlayerStatsError(error.message || 'Failed to load player stats');
                setPlayerStats([]);
            } finally {
                setLoadingPlayers(false);
            }
        };

        fetchPlayerStats();
    }, [metricsView]);

    const handleSort = (key) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending',
        }));
    };

    const handlePlayerSort = (key) => {
        setPlayerSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending',
        }));
    };

    const sortedPlayerStats = useMemo(() => {
        if (!playerStats.length) return [];
        
        const sorted = [...playerStats].sort((a, b) => {
            let aValue = a[playerSortConfig.key];
            let bValue = b[playerSortConfig.key];

            // Handle null/undefined
            if (aValue === undefined || aValue === null) aValue = -Infinity;
            if (bValue === undefined || bValue === null) bValue = -Infinity;

            if (aValue < bValue) {
                return playerSortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (aValue > bValue) {
                return playerSortConfig.direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
        
        return sorted;
    }, [playerStats, playerSortConfig]);

    // Helper to display metric value, showing "—" for null/undefined, formatting numbers to 2 decimals
    const displayMetric = (value, isPercentage = false) => {
        if (value === undefined || value === null) {
            return '—';
        }
        // Don't treat 0 as missing - 0 is a valid value
        if (typeof value === 'number') {
            if (isPercentage) {
                return value.toFixed(1) + '%';
            }
            return value.toFixed(2);
        }
        return value;
    };

    const sortedData = useMemo(() => {
        if (!Array.isArray(data) || data.length === 0) return [];
        // Merge basic data with advanced metrics
        let sortableItems = data.map(item => {
            if (!item || !item.abbrev) return null;
            const advanced = advancedMetrics[item.abbrev] || {};
            return { ...item, ...advanced };
        }).filter(item => item !== null);

        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Handle numeric strings if necessary, though most should be numbers now
                // Handle null/undefined
                if (aValue === undefined || aValue === null || aValue === '-') aValue = -Infinity;
                if (bValue === undefined || bValue === null || bValue === '-') bValue = -Infinity;

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems.filter(item =>
            item.name.toLowerCase().includes(filter.toLowerCase()) ||
            item.abbrev.toLowerCase().includes(filter.toLowerCase())
        );
    }, [data, advancedMetrics, sortConfig, filter]);

    const getHeatmapColor = (value, min, max, inverse = false) => {
        // Simple normalization for color coding
        // This is a simplified version; for production, use a proper scale
        const normalized = (value - min) / (max - min);
        const intensity = inverse ? 1 - normalized : normalized;

        if (intensity > 0.8) return 'text-accent-primary font-bold';
        if (intensity < 0.2) return 'text-accent-secondary font-bold';
        return 'text-white';
    };

    // Calculate min/max for heatmaps
    const stats = useMemo(() => {
        if (!Array.isArray(data) || data.length === 0) return {};
        const validData = data.filter(d => d && typeof d.gf === 'number' && typeof d.ga === 'number');
        if (validData.length === 0) return {};
        return {
            gf: { min: Math.min(...validData.map(d => d.gf)), max: Math.max(...validData.map(d => d.gf)) },
            ga: { min: Math.min(...validData.map(d => d.ga)), max: Math.max(...validData.map(d => d.ga)) },
            diff: { min: Math.min(...validData.map(d => d.diff)), max: Math.max(...validData.map(d => d.diff)) },
        };
    }, [data]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="h-16 w-16 rounded-full border-t-2 border-b-2 border-accent-primary animate-spin"></div>
            </div>
        );
    }

    const columns = [
        { key: 'rank', label: 'RK', align: 'center' },
        { key: 'name', label: 'TEAM', align: 'left' },
        { key: 'gp', label: 'GP', align: 'center' },
        { key: 'w', label: 'W', align: 'center' },
        { key: 'l', label: 'L', align: 'center' },
        { key: 'otl', label: 'OTL', align: 'center' },
        { key: 'pts', label: 'PTS', align: 'center', highlight: true },
        { key: 'pPct', label: 'P%', align: 'center' },
        { key: 'gf', label: 'GF', align: 'center' },
        { key: 'ga', label: 'GA', align: 'center' },
        { key: 'diff', label: 'DIFF', align: 'center' },
        { key: 'l10', label: 'L10', align: 'center' },
        { key: 'streak', label: 'STRK', align: 'center' },

        // Advanced Metrics - Core
        { key: 'gs', label: 'GS', align: 'center', advanced: true, tooltip: 'Game Score' },
        { key: 'xg', label: 'xG', align: 'center', advanced: true, tooltip: 'Expected Goals' },
        { key: 'hdc', label: 'HDC', align: 'center', advanced: true, tooltip: 'High Danger Chances' },

        // Zone Metrics
        { key: 'ozs', label: 'OZS', align: 'center', advanced: true, tooltip: 'Offensive Zone Shots' },
        { key: 'nzs', label: 'NZS', align: 'center', advanced: true, tooltip: 'Neutral Zone Shots' },
        { key: 'dzs', label: 'DZS', align: 'center', advanced: true, tooltip: 'Defensive Zone Shots' },

        // Shot Generation
        { key: 'fc', label: 'FC', align: 'center', advanced: true, tooltip: 'Forecheck/Cycle Shots' },
        { key: 'rush', label: 'RUSH', align: 'center', advanced: true, tooltip: 'Rush Shots' },

        // Turnovers
        { key: 'nzts', label: 'NZT', align: 'center', advanced: true, tooltip: 'Neutral Zone Turnovers' },
        { key: 'nztsa', label: 'NZTSA', align: 'center', advanced: true, tooltip: 'NZ Turnovers to Shots Against' },

        // Movement
        { key: 'lat', label: 'LAT', align: 'center', advanced: true, tooltip: 'Lateral Movement' },
        { key: 'long_movement', label: 'LONG', align: 'center', advanced: true, tooltip: 'Longitudinal Movement' },

        // Shooting
        { key: 'shots', label: 'SOG', align: 'center', advanced: true, tooltip: 'Shots on Goal' },
        { key: 'goals_per_game', label: 'G/G', align: 'center', advanced: true, tooltip: 'Goals per Game' },

        // Possession
        { key: 'corsi_pct', label: 'CF%', align: 'center', advanced: true, tooltip: 'Corsi For %' },

        // Physical
        { key: 'hits_per_game', label: 'HITS', align: 'center', advanced: true, tooltip: 'Hits per Game' },
        { key: 'blocks_per_game', label: 'BLK', align: 'center', advanced: true, tooltip: 'Blocked Shots per Game' },
        { key: 'giveaways_per_game', label: 'GV', align: 'center', advanced: true, tooltip: 'Giveaways per Game' },
        { key: 'takeaways_per_game', label: 'TK', align: 'center', advanced: true, tooltip: 'Takeaways per Game' },
        { key: 'pim_per_game', label: 'PIM', align: 'center', advanced: true, tooltip: 'Penalty Minutes per Game' },

        // Special Teams
        { key: 'pp_pct', label: 'PP%', align: 'center', advanced: true, tooltip: 'Power Play %' },
        { key: 'pk_pct', label: 'PK%', align: 'center', advanced: true, tooltip: 'Penalty Kill %' },
        { key: 'faceoff_pct', label: 'FO%', align: 'center', advanced: true, tooltip: 'Faceoff %' },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-bg-secondary to-bg-primary border border-white/5 p-8 md:p-12 shadow-2xl mb-8">
                <div className="absolute top-0 right-0 w-96 h-96 bg-success/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-8">
                    <div>
                        <h1 className="text-5xl md:text-7xl font-display font-black text-white tracking-tighter mb-4">
                            LEAGUE <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-success">METRICS</span>
                        </h1>
                        <p className="text-text-muted font-mono text-lg max-w-2xl">
                            Comprehensive team statistics, advanced analytics, and performance trends.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-accent-primary" size={20} />
                        <input
                            type="text"
                            placeholder="Search teams..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white font-mono text-sm focus:outline-none focus:border-accent-primary/50 focus:bg-white/10 transition-all placeholder:text-text-muted"
                        />
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setMetricsView('team')}
                                className={clsx(
                                    "flex items-center gap-2 px-4 py-3 rounded-xl font-mono text-sm font-bold transition-all border",
                                    metricsView === 'team'
                                        ? "bg-accent-primary/20 border-accent-primary/50 text-accent-primary"
                                        : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                                )}
                            >
                                <TrendingUp size={18} />
                                <span>TEAM METRICS</span>
                            </button>
                            <button
                                onClick={() => setMetricsView('player')}
                                className={clsx(
                                    "flex items-center gap-2 px-4 py-3 rounded-xl font-mono text-sm font-bold transition-all border",
                                    metricsView === 'player'
                                        ? "bg-accent-primary/20 border-accent-primary/50 text-accent-primary"
                                        : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                                )}
                            >
                                <Users size={18} />
                                <span>PLAYER METRICS</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading Advanced Metrics Banner */}
            {loadingAdvanced && (
                <div className="glass-panel p-4 rounded-xl border border-accent-primary/30 bg-accent-primary/5 flex items-center gap-3 animate-pulse">
                    <div className="h-4 w-4 rounded-full border-t-2 border-b-2 border-accent-primary animate-spin"></div>
                    <span className="font-mono text-sm text-accent-primary">
                        Loading advanced metrics from backend...
                    </span>
                </div>
            )}

            {/* Backend Unavailable Warning */}
            {!backendAvailable && !loadingAdvanced && (
                <div className="glass-panel p-4 rounded-xl border border-danger/30 bg-danger/5 flex items-center gap-3">
                    <span className="font-mono text-sm text-danger">
                        ⚠️ Backend API unavailable. Advanced metrics will not be displayed.
                    </span>
                </div>
            )}

            {/* Data Table - Only show for team metrics */}
            {metricsView === 'team' && (
            <div className="glass-card rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10">
                                {columns.map((col) => (
                                    <th
                                        key={col.key}
                                        onClick={() => handleSort(col.key)}
                                        className={clsx(
                                            "p-4 text-text-muted font-display font-bold tracking-wider text-xs uppercase cursor-pointer hover:text-white transition-colors group select-none whitespace-nowrap",
                                            col.align === 'center' ? 'text-center' : 'text-left',
                                            sortConfig.key === col.key && "text-accent-primary bg-white/5"
                                        )}
                                    >
                                        <div className={clsx("flex items-center gap-1", col.align === 'center' && "justify-center")}>
                                            {col.label}
                                            <SortIcon column={col.key} sortConfig={sortConfig} />
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {sortedData.map((team, index) => (
                                <motion.tr
                                    key={team.abbrev}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="hover:bg-white/5 transition-colors group"
                                >
                                    <td className="p-4 text-center text-text-muted">{team.rank}</td>
                                    <td className="p-4">
                                        <Link to={`/team/${team.abbrev}`} className="flex items-center gap-3 group-hover:opacity-80 transition-opacity">
                                            <img src={team.logo} alt={team.abbrev} className="w-6 h-6 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                                            <span className="font-sans font-bold text-white group-hover:text-accent-primary transition-colors">{team.name}</span>
                                        </Link>
                                    </td>
                                    <td className="p-4 text-center text-text-muted">{team.gp}</td>
                                    <td className="p-4 text-center text-white">{team.w}</td>
                                    <td className="p-4 text-center text-text-muted">{team.l}</td>
                                    <td className="p-4 text-center text-text-muted">{team.otl}</td>
                                    <td className="p-4 text-center font-bold text-lg text-white bg-white/5">{team.pts}</td>
                                    <td className="p-4 text-center text-text-muted">{team.pPct}</td>
                                    <td className={clsx("p-4 text-center", getHeatmapColor(team.gf, stats.gf.min, stats.gf.max))}>{team.gf}</td>
                                    <td className={clsx("p-4 text-center", getHeatmapColor(team.ga, stats.ga.min, stats.ga.max, true))}>{team.ga}</td>
                                    <td className={clsx("p-4 text-center", team.diff > 0 ? "text-success" : team.diff < 0 ? "text-danger" : "text-text-muted")}>
                                        {team.diff > 0 ? '+' : ''}{team.diff}
                                    </td>
                                    <td className="p-4 text-center text-text-muted">{team.l10}</td>
                                    <td className="p-4 text-center text-white">{team.streak}</td>

                                    {/* Advanced Metrics - Core */}
                                    <td className="p-4 text-center text-accent-primary bg-white/5" title="Game Score">
                                        {loadingAdvanced ? '...' : displayMetric(team.gs)}
                                    </td>
                                    <td className="p-4 text-center text-text-muted" title="Expected Goals">
                                        {loadingAdvanced ? '...' : displayMetric(team.xg)}
                                    </td>
                                    <td className="p-4 text-center text-text-muted" title="High Danger Chances">
                                        {loadingAdvanced ? '...' : displayMetric(team.hdc)}
                                    </td>

                                    {/* Zone Metrics */}
                                    <td className="p-4 text-center text-text-muted" title="Offensive Zone Shots">
                                        {loadingAdvanced ? '...' : displayMetric(team.ozs)}
                                    </td>
                                    <td className="p-4 text-center text-text-muted" title="Neutral Zone Shots">
                                        {loadingAdvanced ? '...' : displayMetric(team.nzs)}
                                    </td>
                                    <td className="p-4 text-center text-text-muted" title="Defensive Zone Shots">
                                        {loadingAdvanced ? '...' : displayMetric(team.dzs)}
                                    </td>

                                    {/* Shot Generation */}
                                    <td className="p-4 text-center text-text-muted" title="Forecheck/Cycle Shots">
                                        {loadingAdvanced ? '...' : displayMetric(team.fc)}
                                    </td>
                                    <td className="p-4 text-center text-text-muted" title="Rush Shots">
                                        {loadingAdvanced ? '...' : displayMetric(team.rush)}
                                    </td>

                                    {/* Turnovers */}
                                    <td className="p-4 text-center text-text-muted" title="Neutral Zone Turnovers">
                                        {loadingAdvanced ? '...' : displayMetric(team.nzts)}
                                    </td>
                                    <td className="p-4 text-center text-text-muted" title="NZ Turnovers to Shots Against">
                                        {loadingAdvanced ? '...' : displayMetric(team.nztsa)}
                                    </td>

                                    {/* Movement */}
                                    <td className="p-4 text-center text-text-muted" title="Lateral Movement">
                                        {loadingAdvanced ? '...' : displayMetric(team.lat)}
                                    </td>
                                    <td className="p-4 text-center text-text-muted" title="Longitudinal Movement">
                                        {loadingAdvanced ? '...' : displayMetric(team.long_movement)}
                                    </td>

                                    {/* Shooting */}
                                    <td className="p-4 text-center text-text-muted" title="Shots on Goal">
                                        {loadingAdvanced ? '...' : displayMetric(team.shots)}
                                    </td>
                                    <td className="p-4 text-center text-text-muted" title="Goals per Game">
                                        {loadingAdvanced ? '...' : displayMetric(team.goals_per_game)}
                                    </td>

                                    {/* Possession */}
                                    <td className="p-4 text-center text-text-muted" title="Corsi For %">
                                        {loadingAdvanced ? '...' : displayMetric(team.corsi_pct, true)}
                                    </td>

                                    {/* Physical */}
                                    <td className="p-4 text-center text-text-muted" title="Hits per Game">
                                        {loadingAdvanced ? '...' : displayMetric(team.hits_per_game)}
                                    </td>
                                    <td className="p-4 text-center text-text-muted" title="Blocked Shots per Game">
                                        {loadingAdvanced ? '...' : displayMetric(team.blocks_per_game)}
                                    </td>
                                    <td className="p-4 text-center text-text-muted" title="Giveaways per Game">
                                        {loadingAdvanced ? '...' : displayMetric(team.giveaways_per_game)}
                                    </td>
                                    <td className="p-4 text-center text-text-muted" title="Takeaways per Game">
                                        {loadingAdvanced ? '...' : displayMetric(team.takeaways_per_game)}
                                    </td>
                                    <td className="p-4 text-center text-text-muted" title="Penalty Minutes per Game">
                                        {loadingAdvanced ? '...' : displayMetric(team.pim_per_game)}
                                    </td>

                                    {/* Special Teams */}
                                    <td className="p-4 text-center text-text-muted" title="Power Play %">
                                        {loadingAdvanced ? '...' : displayMetric(team.pp_pct, true)}
                                    </td>
                                    <td className="p-4 text-center text-text-muted" title="Penalty Kill %">
                                        {loadingAdvanced ? '...' : displayMetric(team.pk_pct, true)}
                                    </td>
                                    <td className="p-4 text-center text-text-muted" title="Faceoff %">
                                        {loadingAdvanced ? '...' : displayMetric(team.faceoff_pct, true)}
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            )}

            {/* Player Metrics Table - Only show for player metrics */}
            {metricsView === 'player' && (
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-3xl font-display font-bold flex items-center gap-3">
                            <Users className="w-8 h-8 text-accent-primary" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">PLAYER METRICS</span>
                            <span className="text-sm text-gray-500 font-mono">(5v5 via MoneyPuck)</span>
                        </h2>
                        <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent ml-8"></div>
                    </div>

                    {loadingPlayers ? (
                        <div className="glass-card p-12 rounded-2xl border border-white/10 text-center">
                            <div className="h-8 w-8 rounded-full border-t-2 border-b-2 border-accent-primary animate-spin mx-auto"></div>
                            <p className="text-gray-400 mt-4 font-mono">Loading player stats...</p>
                        </div>
                    ) : playerStatsError ? (
                        <div className="glass-card p-12 rounded-2xl border border-danger/30 bg-danger/5 text-center">
                            <p className="text-danger font-mono">{playerStatsError}</p>
                            <p className="text-gray-400 mt-2 text-sm">Please check that the backend API is running and accessible.</p>
                        </div>
                    ) : playerStats.length === 0 ? (
                        <div className="glass-card p-12 rounded-2xl border border-white/10 text-center">
                            <p className="text-gray-400 font-mono">No player stats available</p>
                        </div>
                    ) : (
                        <div className="glass-card rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-white/5 border-b border-white/10">
                                            {[
                                                { key: 'name', label: 'PLAYER', align: 'left' },
                                                { key: 'team', label: 'TEAM', align: 'left' },
                                                { key: 'position', label: 'POS', align: 'center', sortable: false },
                                                { key: 'games_played', label: 'GP', align: 'center' },
                                                { key: 'icetime', label: 'TOI', align: 'center' },
                                                { key: 'goals', label: 'G', align: 'center' },
                                                { key: 'assists', label: 'A', align: 'center' },
                                                { key: 'points', label: 'P', align: 'center' },
                                                { key: 'shots', label: 'SOG', align: 'center' },
                                                { key: 'xgoals', label: 'xG', align: 'center' },
                                                { key: 'game_score', label: 'GS', align: 'center' },
                                                { key: 'corsi_pct', label: 'CF%', align: 'center' },
                                                { key: 'xgoals_pct', label: 'xGF%', align: 'center' },
                                                { key: 'onice_goals_for', label: 'GF', align: 'center', altKeys: ['onIce_F_goals', 'I_F_goals'] },
                                                { key: 'onice_goals_against', label: 'GA', align: 'center', altKeys: ['onIce_A_goals'] },
                                                { key: 'onice_xgoals_for', label: 'xGF', align: 'center', altKeys: ['onIce_F_xGoals'] },
                                                { key: 'onice_xgoals_against', label: 'xGA', align: 'center', altKeys: ['onIce_A_xGoals'] },
                                                { key: 'hits', label: 'HITS', align: 'center', altKeys: ['I_F_hits'] },
                                                { key: 'blocks', label: 'BLK', align: 'center', altKeys: ['I_F_blocks'] },
                                                { key: 'takeaways', label: 'TK', align: 'center', altKeys: ['I_F_takeaways'] },
                                                { key: 'giveaways', label: 'GV', align: 'center', altKeys: ['I_F_giveaways'] },
                                                { key: 'goals_5v5', label: 'G 5v5', align: 'center' },
                                                { key: 'points_5v5', label: 'P 5v5', align: 'center' },
                                                { key: 'xgoals_5v5', label: 'xG 5v5', align: 'center' },
                                                { key: 'faceoff_pct', label: 'FO%', align: 'center' },
                                                { key: 'penalties_drawn', label: 'PD', align: 'center' },
                                                { key: 'penalties_taken', label: 'PT', align: 'center' },
                                                { key: 'onice_corsi_for', label: 'CF', align: 'center', altKeys: ['onIce_F_corsi'] },
                                                { key: 'onice_corsi_against', label: 'CA', align: 'center', altKeys: ['onIce_A_corsi'] },
                                                { key: 'goals_per_60', label: 'G/60', align: 'center' },
                                                { key: 'points_per_60', label: 'P/60', align: 'center' },
                                                { key: 'xgoals_per_60', label: 'xG/60', align: 'center' },
                                                { key: 'shooting_pct', label: 'SH%', align: 'center' },
                                            ].map((col) => (
                                                <th
                                                    key={col.key}
                                                    className={clsx(
                                                        "p-4 text-text-muted font-display font-bold tracking-wider text-xs uppercase",
                                                        col.align === 'center' ? 'text-center' : 'text-left',
                                                        col.sortable !== false && "cursor-pointer hover:text-white transition-colors"
                                                    )}
                                                    onClick={() => col.sortable !== false && handlePlayerSort(col.key)}
                                                >
                                                    <div className={clsx("flex items-center gap-1", col.align === 'center' && "justify-center")}>
                                                        {col.label}
                                                        {col.sortable !== false && (
                                                            <SortIcon column={col.key} sortConfig={playerSortConfig} />
                                                        )}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {sortedPlayerStats.map((player, index) => (
                                            <motion.tr
                                                key={`${player.name}-${player.team}-${index}`}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.01 }}
                                                className="hover:bg-white/5 transition-colors"
                                            >
                                                {(() => {
                                                    // Helper to get value with fallbacks
                                                    const getValue = (keys, format = (v) => v) => {
                                                        for (const key of keys) {
                                                            const val = player[key];
                                                            // Check if value exists and is not null/undefined/empty string
                                                            if (val !== undefined && val !== null && val !== '') {
                                                                // For numeric values, 0 is valid
                                                                if (typeof val === 'number') {
                                                                    return format(val);
                                                                }
                                                                // For string values that might be numeric
                                                                if (typeof val === 'string' && val.trim() !== '') {
                                                                    const numVal = parseFloat(val);
                                                                    if (!isNaN(numVal)) {
                                                                        return format(numVal);
                                                                    }
                                                                    return format(val);
                                                                }
                                                            }
                                                        }
                                                        // If no value found, check if any of the keys exist but are 0 or empty
                                                        for (const key of keys) {
                                                            if (player.hasOwnProperty(key) && player[key] === 0) {
                                                                return format(0);
                                                            }
                                                        }
                                                        return '—';
                                                    };
                                                    
                                                    return (
                                                        <>
                                                            <td className="p-4 font-sans font-bold text-white">{player.name}</td>
                                                            <td className="p-4 text-center">
                                                                <img 
                                                                    src={`https://assets.nhle.com/logos/nhl/svg/${player.team}_light.svg`}
                                                                    alt={player.team}
                                                                    className="w-8 h-8 mx-auto object-contain"
                                                                    onError={(e) => {
                                                                        e.target.onerror = null;
                                                                        e.target.src = `https://a.espncdn.com/i/teamlogos/nhl/500/${player.team?.toLowerCase() || 'nhl'}.png`;
                                                                    }}
                                                                />
                                                            </td>
                                                            <td className="p-4 text-center text-text-muted">{player.position}</td>
                                                            <td className="p-4 text-center text-text-muted">{player.games_played || '—'}</td>
                                                            <td className="p-4 text-center text-text-muted">{player.icetime ? (player.icetime / 60).toFixed(1) : '—'}</td>
                                                            <td className="p-4 text-center text-white font-bold">{getValue(['goals', 'I_F_goals'])}</td>
                                                            <td className="p-4 text-center text-white">{getValue(['assists'])}</td>
                                                            <td className="p-4 text-center text-white font-bold">{getValue(['points', 'I_F_points'])}</td>
                                                            <td className="p-4 text-center text-text-muted">{getValue(['shots', 'I_F_shotsOnGoal'])}</td>
                                                            <td className="p-4 text-center text-text-muted">{getValue(['xgoals', 'I_F_xGoals'], v => v.toFixed(2))}</td>
                                                            <td className="p-4 text-center text-accent-primary">{getValue(['game_score', 'gameScore'], v => v.toFixed(2))}</td>
                                                            <td className="p-4 text-center text-text-muted">{getValue(['corsi_pct', 'onIce_corsiPercentage'], v => v.toFixed(1))}</td>
                                                            <td className="p-4 text-center text-text-muted">{getValue(['xgoals_pct', 'onIce_xGoalsPercentage'], v => v.toFixed(1))}</td>
                                                            <td className="p-4 text-center text-text-muted">{getValue(['OnIce_F_goals', 'onIce_F_goals', 'onice_goals_for'], v => typeof v === 'number' ? v : (v || '—'))}</td>
                                                            <td className="p-4 text-center text-text-muted">{getValue(['OnIce_A_goals', 'onIce_A_goals', 'onice_goals_against'], v => typeof v === 'number' ? v : (v || '—'))}</td>
                                                            <td className="p-4 text-center text-text-muted">{getValue(['OnIce_F_xGoals', 'onIce_F_xGoals', 'onice_xgoals_for'], v => typeof v === 'number' ? v.toFixed(2) : '—')}</td>
                                                            <td className="p-4 text-center text-text-muted">{getValue(['OnIce_A_xGoals', 'onIce_A_xGoals', 'onice_xgoals_against'], v => typeof v === 'number' ? v.toFixed(2) : '—')}</td>
                                                            <td className="p-4 text-center text-text-muted">{getValue(['I_F_hits', 'hits'], v => typeof v === 'number' ? v : (v || '—'))}</td>
                                                            <td className="p-4 text-center text-text-muted">{getValue(['shotsBlockedByPlayer', 'I_F_blocks', 'blocks'], v => typeof v === 'number' ? v : (v || '—'))}</td>
                                                            <td className="p-4 text-center text-text-muted">{getValue(['I_F_takeaways', 'takeaways'], v => typeof v === 'number' ? v : (v || '—'))}</td>
                                                            <td className="p-4 text-center text-text-muted">{getValue(['I_F_giveaways', 'giveaways'], v => typeof v === 'number' ? v : (v || '—'))}</td>
                                                            <td className="p-4 text-center text-text-muted">{getValue(['I_F_goals', 'goals_5v5'], v => typeof v === 'number' ? v : (v || '—'))}</td>
                                                            <td className="p-4 text-center text-text-muted">{getValue(['I_F_points', 'points_5v5'], v => typeof v === 'number' ? v : (v || '—'))}</td>
                                                            <td className="p-4 text-center text-text-muted">{getValue(['I_F_xGoals', 'xgoals_5v5'], v => typeof v === 'number' ? v.toFixed(2) : '—')}</td>
                                                            <td className="p-4 text-center text-text-muted">{getValue(['faceoffsWon', 'I_F_faceOffsWon', 'I_F_faceOffWinPercentage', 'faceoff_pct'], v => {
                                                                if (typeof v === 'number') {
                                                                    const total = (player.faceoffsWon || 0) + (player.faceoffsLost || 0);
                                                                    if (total > 0) {
                                                                        return ((v / total) * 100).toFixed(1);
                                                                    }
                                                                    return v.toFixed(1);
                                                                }
                                                                return '—';
                                                            })}</td>
                                                            <td className="p-4 text-center text-text-muted">{getValue(['penaltiesDrawn', 'I_F_penaltiesDrawn', 'penalties_drawn'], v => typeof v === 'number' ? v : (v || '—'))}</td>
                                                            <td className="p-4 text-center text-text-muted">{getValue(['penalties', 'I_F_penalties', 'penalties_taken'], v => typeof v === 'number' ? v : (v || '—'))}</td>
                                                            <td className="p-4 text-center text-text-muted">{getValue(['OnIce_F_shotAttempts', 'onIce_F_corsi', 'onice_corsi_for'], v => typeof v === 'number' ? v : (v || '—'))}</td>
                                                            <td className="p-4 text-center text-text-muted">{getValue(['OnIce_A_shotAttempts', 'onIce_A_corsi', 'onice_corsi_against'], v => typeof v === 'number' ? v : (v || '—'))}</td>
                                                            <td className="p-4 text-center text-text-muted">{(() => {
                                                                // Try to get the value directly first
                                                                let per60Value = player.I_F_goalsPer60 || player.goals_per_60;
                                                                if (typeof per60Value === 'number' && per60Value > 0) {
                                                                    return per60Value.toFixed(2);
                                                                }
                                                                // Calculate from goals and icetime
                                                                const goals = player.I_F_goals || player.goals || 0;
                                                                const icetime = player.icetime || 0;
                                                                if (typeof goals === 'number' && typeof icetime === 'number' && icetime > 0) {
                                                                    return ((goals / icetime) * 3600).toFixed(2);
                                                                }
                                                                return '—';
                                                            })()}</td>
                                                            <td className="p-4 text-center text-text-muted">{(() => {
                                                                // Try to get the value directly first
                                                                let per60Value = player.I_F_pointsPer60 || player.points_per_60;
                                                                if (typeof per60Value === 'number' && per60Value > 0) {
                                                                    return per60Value.toFixed(2);
                                                                }
                                                                // Calculate from points and icetime
                                                                const points = player.I_F_points || player.points || 0;
                                                                const icetime = player.icetime || 0;
                                                                if (typeof points === 'number' && typeof icetime === 'number' && icetime > 0) {
                                                                    return ((points / icetime) * 3600).toFixed(2);
                                                                }
                                                                return '—';
                                                            })()}</td>
                                                            <td className="p-4 text-center text-text-muted">{(() => {
                                                                // Try to get the value directly first
                                                                let per60Value = player.I_F_xGoalsPer60 || player.xgoals_per_60;
                                                                if (typeof per60Value === 'number' && per60Value > 0) {
                                                                    return per60Value.toFixed(2);
                                                                }
                                                                // Calculate from xGoals and icetime
                                                                const xgoals = player.I_F_xGoals || player.xgoals || 0;
                                                                const icetime = player.icetime || 0;
                                                                if (typeof xgoals === 'number' && typeof icetime === 'number' && icetime > 0) {
                                                                    return ((xgoals / icetime) * 3600).toFixed(2);
                                                                }
                                                                return '—';
                                                            })()}</td>
                                                            <td className="p-4 text-center text-text-muted">{(() => {
                                                                // Try to get the value directly first
                                                                let shootingPct = player.I_F_shootingPercentage || player.shooting_pct;
                                                                if (typeof shootingPct === 'number' && shootingPct > 0) {
                                                                    return shootingPct.toFixed(1);
                                                                }
                                                                // Calculate from goals and shots
                                                                const goals = player.I_F_goals || player.goals || 0;
                                                                const shots = player.I_F_shotsOnGoal || player.shots || 0;
                                                                if (typeof goals === 'number' && typeof shots === 'number' && shots > 0) {
                                                                    return ((goals / shots) * 100).toFixed(1);
                                                                }
                                                                return '—';
                                                            })()}</td>
                                                        </>
                                                    );
                                                })()}
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4 text-center text-gray-500 text-sm font-mono border-t border-white/10">
                                Showing all {sortedPlayerStats.length} players
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Metrics;
