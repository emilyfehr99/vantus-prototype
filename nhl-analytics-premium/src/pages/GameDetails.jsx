import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { nhlApi } from '../api/nhl';
import { backendApi } from '../api/backend';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Zap, Activity, Shield, Crosshair, ArrowLeft, Clock, Users } from 'lucide-react';
import clsx from 'clsx';

// Team primary colors (hex)
const TEAM_COLORS = {
    'TBL': '#002868', 'NSH': '#FFB81C', 'EDM': '#041E42', 'FLA': '#C8102E',
    'COL': '#6F263D', 'DAL': '#006847', 'BOS': '#FFB81C', 'TOR': '#00205B',
    'MTL': '#AF1E2D', 'OTT': '#C8102E', 'BUF': '#002654', 'DET': '#CE1126',
    'CAR': '#CC0000', 'WSH': '#C8102E', 'PIT': '#FFB81C', 'NYR': '#0038A8',
    'NYI': '#00539B', 'NJD': '#CE1126', 'PHI': '#F74902', 'CBJ': '#002654',
    'STL': '#002F87', 'MIN': '#154734', 'WPG': '#041E42', 'VGK': '#B4975A',
    'SJS': '#006D75', 'LAK': '#111111', 'ANA': '#F47A38', 'CGY': '#C8102E',
    'VAN': '#00205B', 'SEA': '#001628', 'UTA': '#000000', 'CHI': '#CF0A2C'
};

import ErrorBoundary from '../components/ErrorBoundary';
import ShotChart from '../components/ShotChart';
import PeriodStatsTable from '../components/PeriodStatsTable';

// Helper function to calculate Game Score
const calculateGameScore = (stats) => {
    const goals = stats.goals || 0;
    const assists = stats.assists || 0;
    const primaryAssists = stats.primaryAssists || 0;
    const secondaryAssists = stats.secondaryAssists || 0;
    const shots = stats.shots || 0;
    const blockedShots = stats.blockedShots || 0;
    const penaltiesDrawn = stats.penaltiesDrawn || 0;
    const penalties = stats.pim || 0;
    const faceoffWins = stats.faceoffWins || 0;
    const faceoffTotal = (stats.faceoffWins || 0) + (stats.faceoffLosses || 0);
    const plusMinus = stats.plusMinus || 0;
    
    // Simplified Game Score formula
    // Game Score = 0.75×G + 0.7×A1 + 0.55×A2 + 0.075×SOG + 0.05×BLK + 0.15×PD - 0.15×PT + 0.01×FOW - 0.01×FOL + 0.15×GF - 0.15×GA
    // Using plusMinus as proxy for GF-GA
    const gameScore = (
        0.75 * goals +
        0.7 * primaryAssists +
        0.55 * secondaryAssists +
        0.075 * shots +
        0.05 * blockedShots +
        0.15 * penaltiesDrawn -
        0.15 * (penalties / 2) + // Approximate penalties taken
        0.01 * faceoffWins -
        0.01 * (faceoffTotal - faceoffWins) +
        0.15 * (plusMinus > 0 ? plusMinus : 0) -
        0.15 * (plusMinus < 0 ? Math.abs(plusMinus) : 0)
    );
    
    return Math.round(gameScore * 10) / 10;
};

// Extract top performers from boxscore (for completed/live games only)
const extractTopPerformers = (boxscore) => {
    const allPlayers = [];
    
    if (!boxscore) {
        console.log('No boxscore provided');
        return [];
    }
    
    const awayTeam = boxscore.awayTeam;
    const homeTeam = boxscore.homeTeam;
    const playerByGameStats = boxscore.playerByGameStats || {};
    
    console.log('Extracting top performers from boxscore:', {
        hasAwayTeam: !!awayTeam,
        hasHomeTeam: !!homeTeam,
        hasPlayerByGameStats: !!playerByGameStats,
        playerByGameStatsKeys: Object.keys(playerByGameStats)
    });
    
    // Process players from playerByGameStats (primary source)
    const processPlayerGroup = (players, teamAbbrev) => {
        if (!Array.isArray(players)) {
            console.log(`Players not an array for ${teamAbbrev}:`, typeof players);
            return;
        }
        
        console.log(`Processing ${players.length} players for ${teamAbbrev}`);
        
        players.forEach((player, idx) => {
            try {
                // Stats are directly on the player object, not in a nested 'stats' field
                const stats = player.stats || player;
                const gameScore = calculateGameScore(stats);
                const gamesPlayed = 1;
                
                // Get name - could be object or string
                let name = '';
                const nameField = player.name;
                if (typeof nameField === 'object' && nameField !== null) {
                    name = nameField.default || '';
                } else if (typeof nameField === 'string') {
                    name = nameField;
                }
                
                if (!name) {
                    const firstName = player.firstName?.default || player.firstName || '';
                    const lastName = player.lastName?.default || player.lastName || '';
                    name = `${firstName} ${lastName}`.trim();
                }
                
                // Get player ID and generate headshot URL
                const playerId = player.playerId || player.id || player.playerID;
                const headshot = playerId ? `https://assets.nhle.com/mugs/nhl/20242025/${playerId}.jpg` : null;
                
                // Include players with any stats (goals, assists, shots, or positive game score)
                if (name && (stats.goals > 0 || stats.assists > 0 || stats.shots > 0 || stats.sog > 0 || stats.shotsOnGoal > 0 || gameScore > 0 || stats.hits > 0 || stats.blockedShots > 0)) {
                    allPlayers.push({
                        name: name,
                        team: teamAbbrev,
                        position: player.positionCode || player.position || '',
                        sweaterNumber: player.sweaterNumber || player.jerseyNumber || '',
                        playerId: playerId,
                        headshot: headshot,
                        gameScore: gameScore,
                        gsPerGame: gameScore / gamesPlayed,
                        goals: stats.goals || 0,
                        assists: stats.assists || 0,
                        points: (stats.goals || 0) + (stats.assists || 0),
                        shots: stats.shots || stats.sog || stats.shotsOnGoal || 0
                    });
                }
            } catch (e) {
                console.error(`Error processing player ${idx} for ${teamAbbrev}:`, e, player);
            }
        });
    };
    
    // Process away team players from playerByGameStats
    const awayPlayerStats = playerByGameStats.awayTeam || {};
    if (awayTeam?.abbrev) {
        const awayForwards = awayPlayerStats.forwards || [];
        const awayDefense = awayPlayerStats.defense || [];
        const awayGoalies = awayPlayerStats.goalies || [];
        
        console.log(`Away team ${awayTeam.abbrev}:`, {
            forwards: awayForwards.length,
            defense: awayDefense.length,
            goalies: awayGoalies.length
        });
        
        processPlayerGroup(awayForwards, awayTeam.abbrev);
        processPlayerGroup(awayDefense, awayTeam.abbrev);
        processPlayerGroup(awayGoalies, awayTeam.abbrev);
    }
    
    // Process home team players from playerByGameStats
    const homePlayerStats = playerByGameStats.homeTeam || {};
    if (homeTeam?.abbrev) {
        const homeForwards = homePlayerStats.forwards || [];
        const homeDefense = homePlayerStats.defense || [];
        const homeGoalies = homePlayerStats.goalies || [];
        
        console.log(`Home team ${homeTeam.abbrev}:`, {
            forwards: homeForwards.length,
            defense: homeDefense.length,
            goalies: homeGoalies.length
        });
        
        processPlayerGroup(homeForwards, homeTeam.abbrev);
        processPlayerGroup(homeDefense, homeTeam.abbrev);
        processPlayerGroup(homeGoalies, homeTeam.abbrev);
    }
    
    console.log(`Total players extracted: ${allPlayers.length}`);
    
    // Sort by GS/GP and return top 5
    const sorted = allPlayers
        .filter(p => p && (p.gsPerGame > 0 || p.points > 0 || p.goals > 0 || p.assists > 0))
        .sort((a, b) => (b.gsPerGame || 0) - (a.gsPerGame || 0))
        .slice(0, 5);
    
    console.log('Top 5 players:', sorted);
    return sorted;
};

const GameDetailsContent = () => {
    const { id } = useParams();
    const [gameData, setGameData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [liveData, setLiveData] = useState(null);
    const [teamMetrics, setTeamMetrics] = useState({});
    const [prediction, setPrediction] = useState(null);
    const [awayHeatmap, setAwayHeatmap] = useState(null);
    const [homeHeatmap, setHomeHeatmap] = useState(null);
    const [shotsFromPbp, setShotsFromPbp] = useState([]);
    const [topPerformers, setTopPerformers] = useState([]);

    useEffect(() => {
        const fetchGameData = async () => {
            try {
                const [data, liveGameData] = await Promise.all([
                    nhlApi.getGameCenter(id),
                    backendApi.getLiveGame(id).catch(() => null)
                ]);

                setGameData(data);
                setLiveData(liveGameData);

                // Extract shots from play-by-play data for completed/live games
                if (data?.playByPlay && data?.boxscore) {
                    try {
                        const plays = data.playByPlay.plays || data.playByPlay || [];
                        const awayTeam = data.boxscore.awayTeam;
                        const homeTeam = data.boxscore.homeTeam;
                        const shots = [];
                        
                        if (Array.isArray(plays)) {
                            plays.forEach(play => {
                                const eventType = play.typeDescKey || play.typeDesc;
                                if (eventType && ['goal', 'shot-on-goal', 'missed-shot', 'blocked-shot'].includes(eventType)) {
                                    const details = play.details || {};
                                    const x = details.xCoord;
                                    const y = details.yCoord;
                                    
                                    if (x !== null && x !== undefined && y !== null && y !== undefined) {
                                        const teamId = details.eventOwnerTeamId;
                                        const teamAbbrev = (teamId === awayTeam?.id) ? awayTeam.abbrev : 
                                                         (teamId === homeTeam?.id) ? homeTeam.abbrev : 
                                                         (details.eventOwnerTeamId ? 'UNK' : null);
                                        
                                        if (teamAbbrev) {
                                            shots.push({
                                                x: x,
                                                y: y,
                                                type: eventType === 'goal' ? 'GOAL' : 'SHOT',
                                                team: teamAbbrev,
                                                period: play.periodDescriptor?.number || play.period || 1,
                                                time: play.timeInPeriod || play.time || '00:00',
                                                shooter: details.shootingPlayerId || details.scoringPlayerId || 'Unknown',
                                                shotType: details.shotType || 'wrist',
                                                xg: 0.1 // Default xG, could be calculated if needed
                                            });
                                        }
                                    }
                                }
                            });
                        }
                        
                        console.log(`Extracted ${shots.length} shots from play-by-play data`);
                        setShotsFromPbp(shots);
                    } catch (error) {
                        console.error('Error extracting shots from play-by-play:', error);
                        setShotsFromPbp([]);
                    }
                }

                // Fetch team metrics, prediction, and heatmap data for pre-game/post-game
                if (data?.boxscore) {
                    const awayAbbr = data.boxscore.awayTeam?.abbrev;
                    const homeAbbr = data.boxscore.homeTeam?.abbrev;
                    const gameState = data.boxscore.gameState;
                    
                    if (awayAbbr && homeAbbr) {
                        try {
                            const [metrics, gamePrediction, awayHeat, homeHeat] = await Promise.all([
                                backendApi.getTeamMetrics(),
                                backendApi.getGamePrediction(id).catch(() => null),
                                // Fetch heatmap data for pre-game (last 5 games)
                                (gameState === 'FUT' || gameState === 'PREVIEW') 
                                    ? backendApi.getTeamHeatmap(awayAbbr).catch(() => null)
                                    : Promise.resolve(null),
                                (gameState === 'FUT' || gameState === 'PREVIEW')
                                    ? backendApi.getTeamHeatmap(homeAbbr).catch(() => null)
                                    : Promise.resolve(null)
                            ]);
                            
                            setTeamMetrics(metrics || {});
                            setPrediction(gamePrediction);
                            setAwayHeatmap(awayHeat);
                            setHomeHeatmap(homeHeat);
                        } catch (err) {
                            console.error('Failed to fetch team data:', err);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to fetch game data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchGameData();
        // Poll for live data every 30s if game is live, also refresh team metrics and game data for top performers
        const interval = setInterval(() => {
            if (gameData?.boxscore?.gameState === 'LIVE' || gameData?.boxscore?.gameState === 'CRIT') {
                Promise.all([
                    backendApi.getLiveGame(id).catch(() => null),
                    backendApi.getTeamMetrics().catch(() => ({})),
                    nhlApi.getGameCenter(id).catch(() => null) // Refresh game data to get updated boxscore for top performers
                ]).then(([live, metrics, updatedGameData]) => {
                    setLiveData(live);
                    setTeamMetrics(metrics);
                    if (updatedGameData) {
                        setGameData(updatedGameData); // Update gameData to refresh top performers
                    }
                }).catch(err => console.error('Polling error:', err));
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [id, gameData?.boxscore?.gameState]);
    
    // Extract top performers when gameData changes or when live data updates
    useEffect(() => {
        if (gameData?.boxscore) {
            const gameState = gameData.boxscore.gameState;
            const awayAbbr = gameData.boxscore.awayTeam?.abbrev;
            const homeAbbr = gameData.boxscore.homeTeam?.abbrev;
            
            // For completed or live games, extract from current game
            if (gameState === 'FINAL' || gameState === 'OFF' || gameState === 'LIVE' || gameState === 'CRIT') {
                try {
                    const performers = extractTopPerformers(gameData.boxscore);
                    setTopPerformers(performers);
                    console.log('Top performers extracted from current game:', performers);
                } catch (error) {
                    console.error('Error extracting top performers:', error);
                    setTopPerformers([]);
                }
            } else {
                // Pre-game - get top performers from recent games
                const fetchRecentPerformers = async () => {
                    try {
                        if (awayAbbr && homeAbbr) {
                            console.log('Fetching top performers for pre-game:', { awayAbbr, homeAbbr });
                            
                            const [awayPerformers, homePerformers] = await Promise.all([
                                backendApi.getTeamTopPerformers(awayAbbr).catch((err) => {
                                    console.error(`Error fetching away performers for ${awayAbbr}:`, err);
                                    return [];
                                }),
                                backendApi.getTeamTopPerformers(homeAbbr).catch((err) => {
                                    console.error(`Error fetching home performers for ${homeAbbr}:`, err);
                                    return [];
                                })
                            ]);
                            
                            console.log('Away performers:', awayPerformers);
                            console.log('Home performers:', homePerformers);
                            
                            // Combine and sort by GS/GP
                            const allPerformers = [...(awayPerformers || []), ...(homePerformers || [])]
                                .filter(p => p && (p.gsPerGame > 0 || p.points > 0))
                                .sort((a, b) => (b.gsPerGame || 0) - (a.gsPerGame || 0))
                                .slice(0, 5);
                            
                            console.log('Combined top performers:', allPerformers);
                            setTopPerformers(allPerformers);
                        } else {
                            console.log('Missing team abbreviations:', { awayAbbr, homeAbbr });
                        }
                    } catch (error) {
                        console.error('Error fetching recent top performers:', error);
                        setTopPerformers([]);
                    }
                };
                
                fetchRecentPerformers();
            }
        }
    }, [gameData, liveData]); // Also update when liveData changes for live games

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="relative">
                    <div className="h-16 w-16 rounded-full border-t-2 border-b-2 border-accent-primary animate-spin"></div>
                    <div className="absolute inset-0 h-16 w-16 rounded-full border-r-2 border-l-2 border-accent-secondary animate-spin-reverse opacity-50"></div>
                </div>
            </div>
        );
    }

    if (!gameData) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <h2 className="text-2xl font-display font-bold mb-4">Game Data Not Available</h2>
                <Link to="/" className="px-6 py-2 rounded-lg bg-accent-primary text-bg-primary font-bold hover:bg-accent-secondary transition-colors">
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    const { awayTeam, homeTeam, gameState, period, clock, startTimeUTC } = gameData.boxscore || {};
    const isLive = gameState === 'LIVE' || gameState === 'CRIT';
    const isFinal = gameState === 'FINAL' || gameState === 'OFF';
    
    // Format game time from startTimeUTC if available
    let gameTime = null;
    if (startTimeUTC) {
        try {
            const date = new Date(startTimeUTC);
            gameTime = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        } catch (e) {
            gameTime = null;
        }
    }

    // Helper for metric cards
    const MetricCard = ({ title, icon: Icon, children, className }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={clsx("glass-card p-6", className)}
        >
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-white/5">
                    <Icon className="w-5 h-5 text-accent-primary" />
                </div>
                <h3 className="font-display font-bold text-lg tracking-wide">{title}</h3>
            </div>
            {children}
        </motion.div>
    );

    // Helper for comparison rows with team colors - always show both team colors
    const ComparisonRow = ({ label, awayVal, homeVal, format = (v) => v, inverse = false }) => {
        const awayNum = parseFloat(awayVal) || 0;
        const homeNum = parseFloat(homeVal) || 0;
        const total = awayNum + homeNum;
        const awayPct = total > 0 ? (awayNum / total) * 100 : 50;
        
        // Determine which team has the better value
        // For inverse metrics (like HDCA), lower is better
        const awayBetter = inverse ? (awayNum < homeNum) : (awayNum > homeNum);
        const homeBetter = inverse ? (homeNum < awayNum) : (homeNum > awayNum);
        
        const awayColor = TEAM_COLORS[awayTeam?.abbrev] || '#00D4FF';
        const homeColor = TEAM_COLORS[homeTeam?.abbrev] || '#FF00FF';

        return (
            <div className="mb-4">
                <div className="flex justify-between text-sm font-mono mb-2">
                    <span className={clsx(awayBetter ? "font-bold text-white" : "text-white")}>
                        {format(awayVal)}
                    </span>
                    <span className="text-text-secondary uppercase text-xs tracking-wider">{label}</span>
                    <span className={clsx(homeBetter ? "font-bold text-white" : "text-white")}>
                        {format(homeVal)}
                    </span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden flex relative">
                    <div
                        className={clsx(
                            "h-full transition-all duration-500",
                            awayBetter && "shadow-[0_0_8px_2px_rgba(255,255,255,0.6)]"
                        )}
                        style={{ 
                            width: `${awayPct}%`,
                            backgroundColor: awayColor
                        }}
                    />
                    <div
                        className={clsx(
                            "h-full transition-all duration-500",
                            homeBetter && "shadow-[0_0_8px_2px_rgba(255,255,255,0.6)]"
                        )}
                        style={{ 
                            width: `${100 - awayPct}%`,
                            backgroundColor: homeColor
                        }}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header Section */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-bg-secondary to-bg-primary border border-white/5 shadow-2xl">
                {/* Background Effects */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-primary/10 rounded-full blur-3xl -translate-y-1/2"></div>
                    <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent-secondary/10 rounded-full blur-3xl -translate-y-1/2"></div>
                </div>

                <div className="relative z-10 p-8 md:p-12">
                    <Link to="/" className="inline-flex items-center gap-2 text-text-muted hover:text-white mb-8 transition-colors group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-mono text-sm">BACK TO DASHBOARD</span>
                    </Link>

                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        {/* Away Team */}
                        <div className="flex flex-col items-center gap-4 flex-1">
                            <img src={awayTeam.logo} alt={awayTeam.abbrev} className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-2xl" />
                            <div className="text-center">
                                <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tighter">{awayTeam.abbrev}</h2>
                                <p className="text-text-muted font-mono mt-1">AWAY</p>
                            </div>
                        </div>

                        {/* Score / Status */}
                        <div className="flex flex-col items-center justify-center px-8 py-4 bg-white/5 rounded-2xl backdrop-blur-md border border-white/5 min-w-[200px]">
                            {isLive || isFinal ? (
                                <div className="flex items-center gap-8">
                                    <span className="text-6xl md:text-7xl font-display font-bold text-white team-gradient-text" style={{ '--team-primary': 'var(--color-accent-primary)' }}>{awayTeam.score}</span>
                                    <div className="h-12 w-px bg-white/10"></div>
                                    <span className="text-6xl md:text-7xl font-display font-bold text-white team-gradient-text" style={{ '--team-primary': 'var(--color-accent-secondary)' }}>{homeTeam.score}</span>
                                </div>
                            ) : (
                                <div className="text-4xl font-display font-bold text-text-muted">VS</div>
                            )}

                            {/* Arena Name */}
                            {gameData?.boxscore?.venue?.default && (
                                <div className="mt-2 text-sm font-mono text-text-muted">
                                    {gameData.boxscore.venue.default}
                                </div>
                            )}

                            <div className="mt-4 flex items-center gap-2">
                                {isLive ? (
                                    <>
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-color-success opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-color-success"></span>
                                        </span>
                                        <span className="font-mono text-color-success font-bold">{period} - {clock}</span>
                                    </>
                                ) : isFinal ? (
                                    <span className="font-mono text-text-muted">FINAL</span>
                                ) : (
                                    <span className="font-mono text-text-muted">{gameTime || 'TBD'}</span>
                                )}
                            </div>
                        </div>

                        {/* Home Team */}
                        <div className="flex flex-col items-center gap-4 flex-1">
                            <img src={homeTeam.logo} alt={homeTeam.abbrev} className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-2xl" />
                            <div className="text-center">
                                <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tighter">{homeTeam.abbrev}</h2>
                                <p className="text-text-muted font-mono mt-1">HOME</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Content Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Main Stats */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Period Stats Table - Only show for LIVE games */}
                    {isLive && (
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Clock className="w-6 h-6 text-accent-primary" />
                            <h3 className="text-xl font-display font-bold">PERIOD PERFORMANCE</h3>
                        </div>
                        {liveData?.period_stats ? (
                            <PeriodStatsTable
                                periodStats={liveData.period_stats}
                                awayTeam={awayTeam}
                                homeTeam={homeTeam}
                            />
                        ) : (
                            <div className="glass-card p-6 text-center text-text-muted">
                                No period stats available yet.
                            </div>
                        )}
                    </section>
                    )}

                    {/* Live Team Metrics - Show for LIVE games, updating live */}
                    {isLive && (teamMetrics[awayTeam?.abbrev] || teamMetrics[homeTeam?.abbrev]) && (
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <Activity className="w-6 h-6 text-accent-primary" />
                                <h3 className="text-xl font-display font-bold">LIVE TEAM METRICS</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <MetricCard title="LIVE CORE METRICS" icon={Target}>
                                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                                        <div className="flex items-center gap-2">
                                            <img src={awayTeam?.logo} alt={awayTeam?.abbrev} className="w-6 h-6" />
                                            <span className="text-accent-primary font-mono text-sm">{awayTeam?.abbrev}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <img src={homeTeam?.logo} alt={homeTeam?.abbrev} className="w-6 h-6" />
                                            <span className="text-accent-secondary font-mono text-sm">{homeTeam?.abbrev}</span>
                                        </div>
                                    </div>
                                    <ComparisonRow
                                        label="EXPECTED GOALS (xG)"
                                        awayVal={liveData?.advanced_metrics?.xg?.away_total || teamMetrics[awayTeam?.abbrev]?.xg}
                                        homeVal={liveData?.advanced_metrics?.xg?.home_total || teamMetrics[homeTeam?.abbrev]?.xg}
                                        format={(v) => parseFloat(v || 0).toFixed(2)}
                                    />
                                    <ComparisonRow
                                        label="CORSI FOR %"
                                        awayVal={liveData?.advanced_metrics?.corsi?.away || teamMetrics[awayTeam?.abbrev]?.corsi_pct}
                                        homeVal={liveData?.advanced_metrics?.corsi?.home || teamMetrics[homeTeam?.abbrev]?.corsi_pct}
                                        format={(v) => parseFloat(v || 0).toFixed(1) + '%'}
                                    />
                                    <ComparisonRow
                                        label="HIGH DANGER CHANCES"
                                        awayVal={liveData?.advanced_metrics?.shot_quality?.high_danger_shots?.away || teamMetrics[awayTeam?.abbrev]?.hdc}
                                        homeVal={liveData?.advanced_metrics?.shot_quality?.high_danger_shots?.home || teamMetrics[homeTeam?.abbrev]?.hdc}
                                        format={(v) => parseFloat(v || 0).toFixed(1)}
                                    />
                                </MetricCard>
                                <MetricCard title="LIVE PRESSURE" icon={Zap}>
                                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                                        <div className="flex items-center gap-2">
                                            <img src={awayTeam?.logo} alt={awayTeam?.abbrev} className="w-6 h-6" />
                                            <span className="text-accent-primary font-mono text-sm">{awayTeam?.abbrev}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <img src={homeTeam?.logo} alt={homeTeam?.abbrev} className="w-6 h-6" />
                                            <span className="text-accent-secondary font-mono text-sm">{homeTeam?.abbrev}</span>
                                        </div>
                                    </div>
                                    <ComparisonRow
                                        label="OFFENSIVE ZONE SHOTS"
                                        awayVal={liveData?.advanced_metrics?.pressure?.oz_shots?.away || teamMetrics[awayTeam?.abbrev]?.ozs}
                                        homeVal={liveData?.advanced_metrics?.pressure?.oz_shots?.home || teamMetrics[homeTeam?.abbrev]?.ozs}
                                    />
                                    <ComparisonRow
                                        label="RUSH CHANCES"
                                        awayVal={liveData?.advanced_metrics?.pressure?.rush_shots?.away || teamMetrics[awayTeam?.abbrev]?.rush}
                                        homeVal={liveData?.advanced_metrics?.pressure?.rush_shots?.home || teamMetrics[homeTeam?.abbrev]?.rush}
                                    />
                                    <ComparisonRow
                                        label="SHOTS ON GOAL"
                                        awayVal={liveData?.advanced_metrics?.shots?.away || teamMetrics[awayTeam?.abbrev]?.shots}
                                        homeVal={liveData?.advanced_metrics?.shots?.home || teamMetrics[homeTeam?.abbrev]?.shots}
                                        format={(v) => parseFloat(v || 0).toFixed(1)}
                                    />
                                </MetricCard>
                            </div>
                        </section>
                    )}

                    {/* Advanced Metrics Grid - Only show for LIVE games */}
                    {isLive && (
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <MetricCard title="SHOT QUALITY" icon={Crosshair}>
                            <ComparisonRow
                                label="EXPECTED GOALS (xG)"
                                awayVal={liveData?.advanced_metrics?.xg?.away_total}
                                homeVal={liveData?.advanced_metrics?.xg?.home_total}
                                format={(v) => parseFloat(v || 0).toFixed(2)}
                            />
                            <ComparisonRow
                                label="HIGH DANGER CHANCES"
                                awayVal={liveData?.advanced_metrics?.shot_quality?.high_danger_shots?.away}
                                homeVal={liveData?.advanced_metrics?.shot_quality?.high_danger_shots?.home}
                            />
                            <ComparisonRow
                                label="SHOOTING %"
                                awayVal={liveData?.advanced_metrics?.shot_quality?.shooting_percentage?.away}
                                homeVal={liveData?.advanced_metrics?.shot_quality?.shooting_percentage?.home}
                                format={(v) => v + '%'}
                            />
                        </MetricCard>

                        <MetricCard title="PRESSURE" icon={Zap}>
                            <ComparisonRow
                                label="OFFENSIVE ZONE SHOTS"
                                awayVal={liveData?.advanced_metrics?.pressure?.oz_shots?.away}
                                homeVal={liveData?.advanced_metrics?.pressure?.oz_shots?.home}
                            />
                            <ComparisonRow
                                label="SUSTAINED PRESSURE"
                                awayVal={liveData?.advanced_metrics?.pressure?.sustained_pressure?.away}
                                homeVal={liveData?.advanced_metrics?.pressure?.sustained_pressure?.home}
                            />
                            <ComparisonRow
                                label="RUSH CHANCES"
                                awayVal={liveData?.advanced_metrics?.pressure?.rush_shots?.away}
                                homeVal={liveData?.advanced_metrics?.pressure?.rush_shots?.home}
                            />
                        </MetricCard>

                        <MetricCard title="DEFENSE" icon={Shield}>
                            <ComparisonRow
                                label="BLOCKED SHOTS"
                                awayVal={liveData?.advanced_metrics?.defense?.blocked_shots?.away}
                                homeVal={liveData?.advanced_metrics?.defense?.blocked_shots?.home}
                            />
                            <ComparisonRow
                                label="TAKEAWAYS"
                                awayVal={liveData?.advanced_metrics?.defense?.takeaways?.away}
                                homeVal={liveData?.advanced_metrics?.defense?.takeaways?.home}
                            />
                            <ComparisonRow
                                label="GIVEAWAYS"
                                awayVal={liveData?.advanced_metrics?.defense?.giveaways?.away}
                                homeVal={liveData?.advanced_metrics?.defense?.giveaways?.home}
                            />
                        </MetricCard>

                        <MetricCard title="MOVEMENT" icon={Activity}>
                            <ComparisonRow
                                label="LATERAL MOVEMENT"
                                awayVal={liveData?.advanced_metrics?.movement?.lateral_movement?.away}
                                homeVal={liveData?.advanced_metrics?.movement?.lateral_movement?.home}
                                format={(v) => parseFloat(v || 0).toFixed(1)}
                            />
                            <ComparisonRow
                                label="N-S MOVEMENT"
                                awayVal={liveData?.advanced_metrics?.movement?.longitudinal_movement?.away}
                                homeVal={liveData?.advanced_metrics?.movement?.longitudinal_movement?.home}
                                format={(v) => parseFloat(v || 0).toFixed(1)}
                            />
                        </MetricCard>
                    </section>
                    )}

                    {/* Team Metrics Comparison (Pre-Game/Post-Game) - Show for FUT and FINAL games */}
                    {!isLive && (teamMetrics[awayTeam?.abbrev] || teamMetrics[homeTeam?.abbrev]) && (
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <TrendingUp className="w-6 h-6 text-accent-primary" />
                                <h3 className="text-xl font-display font-bold">TEAM METRICS COMPARISON</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Core Metrics */}
                                <MetricCard title="CORE METRICS" icon={Target}>
                                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                                        <div className="flex items-center gap-2">
                                            <img src={awayTeam?.logo} alt={awayTeam?.abbrev} className="w-6 h-6" />
                                            <span className="text-accent-primary font-mono text-sm">{awayTeam?.abbrev}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <img src={homeTeam?.logo} alt={homeTeam?.abbrev} className="w-6 h-6" />
                                            <span className="text-accent-secondary font-mono text-sm">{homeTeam?.abbrev}</span>
                                        </div>
                                    </div>
                                    <ComparisonRow
                                        label="GAME SCORE (GS)"
                                        awayVal={teamMetrics[awayTeam?.abbrev]?.gs}
                                        homeVal={teamMetrics[homeTeam?.abbrev]?.gs}
                                        format={(v) => parseFloat(v || 0).toFixed(1)}
                                    />
                                    <ComparisonRow
                                        label="EXPECTED GOALS (xG)"
                                        awayVal={teamMetrics[awayTeam?.abbrev]?.xg}
                                        homeVal={teamMetrics[homeTeam?.abbrev]?.xg}
                                        format={(v) => parseFloat(v || 0).toFixed(2)}
                                    />
                                    <ComparisonRow
                                        label="HIGH DANGER CHANCES (HDC)"
                                        awayVal={teamMetrics[awayTeam?.abbrev]?.hdc}
                                        homeVal={teamMetrics[homeTeam?.abbrev]?.hdc}
                                        format={(v) => parseFloat(v || 0).toFixed(1)}
                                    />
                                    <ComparisonRow
                                        label="HIGH DANGER CHANCES AGAINST (HDCA)"
                                        awayVal={teamMetrics[awayTeam?.abbrev]?.hdca}
                                        homeVal={teamMetrics[homeTeam?.abbrev]?.hdca}
                                        format={(v) => parseFloat(v || 0).toFixed(1)}
                                        inverse={true}
                                    />
                                </MetricCard>

                                {/* Zone Metrics */}
                                <MetricCard title="ZONE METRICS" icon={Zap}>
                                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                                        <div className="flex items-center gap-2">
                                            <img src={awayTeam?.logo} alt={awayTeam?.abbrev} className="w-6 h-6" />
                                            <span className="text-accent-primary font-mono text-sm">{awayTeam?.abbrev}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <img src={homeTeam?.logo} alt={homeTeam?.abbrev} className="w-6 h-6" />
                                            <span className="text-accent-secondary font-mono text-sm">{homeTeam?.abbrev}</span>
                                        </div>
                                    </div>
                                    <ComparisonRow
                                        label="OFFENSIVE ZONE SHOTS (OZS)"
                                        awayVal={teamMetrics[awayTeam?.abbrev]?.ozs}
                                        homeVal={teamMetrics[homeTeam?.abbrev]?.ozs}
                                    />
                                    <ComparisonRow
                                        label="NEUTRAL ZONE SHOTS (NZS)"
                                        awayVal={teamMetrics[awayTeam?.abbrev]?.nzs}
                                        homeVal={teamMetrics[homeTeam?.abbrev]?.nzs}
                                    />
                                    <ComparisonRow
                                        label="DEFENSIVE ZONE SHOTS (DZS)"
                                        awayVal={teamMetrics[awayTeam?.abbrev]?.dzs}
                                        homeVal={teamMetrics[homeTeam?.abbrev]?.dzs}
                                    />
                                </MetricCard>

                                {/* Shot Generation */}
                                <MetricCard title="SHOT GENERATION" icon={Crosshair}>
                                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                                        <div className="flex items-center gap-2">
                                            <img src={awayTeam?.logo} alt={awayTeam?.abbrev} className="w-6 h-6" />
                                            <span className="text-accent-primary font-mono text-sm">{awayTeam?.abbrev}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <img src={homeTeam?.logo} alt={homeTeam?.abbrev} className="w-6 h-6" />
                                            <span className="text-accent-secondary font-mono text-sm">{homeTeam?.abbrev}</span>
                                        </div>
                                    </div>
                                    <ComparisonRow
                                        label="FORECHECK/CYCLE (FC)"
                                        awayVal={teamMetrics[awayTeam?.abbrev]?.fc}
                                        homeVal={teamMetrics[homeTeam?.abbrev]?.fc}
                                    />
                                    <ComparisonRow
                                        label="RUSH SHOTS"
                                        awayVal={teamMetrics[awayTeam?.abbrev]?.rush}
                                        homeVal={teamMetrics[homeTeam?.abbrev]?.rush}
                                    />
                                    <ComparisonRow
                                        label="SHOTS ON GOAL"
                                        awayVal={teamMetrics[awayTeam?.abbrev]?.shots}
                                        homeVal={teamMetrics[homeTeam?.abbrev]?.shots}
                                        format={(v) => parseFloat(v || 0).toFixed(1)}
                                    />
                                </MetricCard>

                                {/* Turnovers */}
                                <MetricCard title="TURNOVERS" icon={Activity}>
                                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                                        <div className="flex items-center gap-2">
                                            <img src={awayTeam?.logo} alt={awayTeam?.abbrev} className="w-6 h-6" />
                                            <span className="text-accent-primary font-mono text-sm">{awayTeam?.abbrev}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <img src={homeTeam?.logo} alt={homeTeam?.abbrev} className="w-6 h-6" />
                                            <span className="text-accent-secondary font-mono text-sm">{homeTeam?.abbrev}</span>
                                        </div>
                                    </div>
                                    <ComparisonRow
                                        label="NEUTRAL ZONE TURNOVERS (NZT)"
                                        awayVal={teamMetrics[awayTeam?.abbrev]?.nzts}
                                        homeVal={teamMetrics[homeTeam?.abbrev]?.nzts}
                                    />
                                    <ComparisonRow
                                        label="NZ TURNOVERS TO SHOTS AGAINST (NZTSA)"
                                        awayVal={teamMetrics[awayTeam?.abbrev]?.nztsa}
                                        homeVal={teamMetrics[homeTeam?.abbrev]?.nztsa}
                                        format={(v) => parseFloat(v || 0).toFixed(1)}
                                        inverse={true}
                                    />
                                </MetricCard>

                                {/* Movement */}
                                <MetricCard title="MOVEMENT" icon={Activity}>
                                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                                        <div className="flex items-center gap-2">
                                            <img src={awayTeam?.logo} alt={awayTeam?.abbrev} className="w-6 h-6" />
                                            <span className="text-accent-primary font-mono text-sm">{awayTeam?.abbrev}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <img src={homeTeam?.logo} alt={homeTeam?.abbrev} className="w-6 h-6" />
                                            <span className="text-accent-secondary font-mono text-sm">{homeTeam?.abbrev}</span>
                                        </div>
                                    </div>
                                    <ComparisonRow
                                        label="LATERAL MOVEMENT (LAT)"
                                        awayVal={teamMetrics[awayTeam?.abbrev]?.lat}
                                        homeVal={teamMetrics[homeTeam?.abbrev]?.lat}
                                        format={(v) => parseFloat(v || 0).toFixed(1)}
                                    />
                                    <ComparisonRow
                                        label="LONGITUDINAL MOVEMENT (LONG)"
                                        awayVal={teamMetrics[awayTeam?.abbrev]?.long_movement}
                                        homeVal={teamMetrics[homeTeam?.abbrev]?.long_movement}
                                        format={(v) => parseFloat(v || 0).toFixed(1)}
                                    />
                                </MetricCard>

                                {/* Possession & Shooting */}
                                <MetricCard title="POSSESSION & SHOOTING" icon={Target}>
                                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                                        <div className="flex items-center gap-2">
                                            <img src={awayTeam?.logo} alt={awayTeam?.abbrev} className="w-6 h-6" />
                                            <span className="text-accent-primary font-mono text-sm">{awayTeam?.abbrev}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <img src={homeTeam?.logo} alt={homeTeam?.abbrev} className="w-6 h-6" />
                                            <span className="text-accent-secondary font-mono text-sm">{homeTeam?.abbrev}</span>
                                        </div>
                                    </div>
                                    <ComparisonRow
                                        label="CORSI FOR % (CF%)"
                                        awayVal={teamMetrics[awayTeam?.abbrev]?.corsi_pct}
                                        homeVal={teamMetrics[homeTeam?.abbrev]?.corsi_pct}
                                        format={(v) => parseFloat(v || 0).toFixed(1) + '%'}
                                    />
                                    <ComparisonRow
                                        label="GOALS PER GAME"
                                        awayVal={teamMetrics[awayTeam?.abbrev]?.goals}
                                        homeVal={teamMetrics[homeTeam?.abbrev]?.goals}
                                        format={(v) => parseFloat(v || 0).toFixed(2)}
                                    />
                                    <ComparisonRow
                                        label="GOALS AGAINST PER GAME"
                                        awayVal={teamMetrics[awayTeam?.abbrev]?.ga_gp}
                                        homeVal={teamMetrics[homeTeam?.abbrev]?.ga_gp}
                                        format={(v) => parseFloat(v || 0).toFixed(2)}
                                        inverse={true}
                                    />
                                </MetricCard>

                                {/* Physical Play */}
                                <MetricCard title="PHYSICAL PLAY" icon={Shield}>
                                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                                        <div className="flex items-center gap-2">
                                            <img src={awayTeam?.logo} alt={awayTeam?.abbrev} className="w-6 h-6" />
                                            <span className="text-accent-primary font-mono text-sm">{awayTeam?.abbrev}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <img src={homeTeam?.logo} alt={homeTeam?.abbrev} className="w-6 h-6" />
                                            <span className="text-accent-secondary font-mono text-sm">{homeTeam?.abbrev}</span>
                                        </div>
                                    </div>
                                    <ComparisonRow
                                        label="HITS PER GAME"
                                        awayVal={teamMetrics[awayTeam?.abbrev]?.hits}
                                        homeVal={teamMetrics[homeTeam?.abbrev]?.hits}
                                        format={(v) => parseFloat(v || 0).toFixed(1)}
                                    />
                                    <ComparisonRow
                                        label="BLOCKED SHOTS"
                                        awayVal={teamMetrics[awayTeam?.abbrev]?.blocks}
                                        homeVal={teamMetrics[homeTeam?.abbrev]?.blocks}
                                        format={(v) => parseFloat(v || 0).toFixed(1)}
                                    />
                                    <ComparisonRow
                                        label="GIVEAWAYS"
                                        awayVal={teamMetrics[awayTeam?.abbrev]?.giveaways}
                                        homeVal={teamMetrics[homeTeam?.abbrev]?.giveaways}
                                        format={(v) => parseFloat(v || 0).toFixed(1)}
                                        inverse={true}
                                    />
                                    <ComparisonRow
                                        label="TAKEAWAYS"
                                        awayVal={teamMetrics[awayTeam?.abbrev]?.takeaways}
                                        homeVal={teamMetrics[homeTeam?.abbrev]?.takeaways}
                                        format={(v) => parseFloat(v || 0).toFixed(1)}
                                    />
                                    <ComparisonRow
                                        label="PENALTY MINUTES (PIM)"
                                        awayVal={teamMetrics[awayTeam?.abbrev]?.pim}
                                        homeVal={teamMetrics[homeTeam?.abbrev]?.pim}
                                        format={(v) => parseFloat(v || 0).toFixed(1)}
                                    />
                                </MetricCard>

                                {/* Special Teams */}
                                <MetricCard title="SPECIAL TEAMS" icon={Zap}>
                                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                                        <div className="flex items-center gap-2">
                                            <img src={awayTeam?.logo} alt={awayTeam?.abbrev} className="w-6 h-6" />
                                            <span className="text-accent-primary font-mono text-sm">{awayTeam?.abbrev}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <img src={homeTeam?.logo} alt={homeTeam?.abbrev} className="w-6 h-6" />
                                            <span className="text-accent-secondary font-mono text-sm">{homeTeam?.abbrev}</span>
                                        </div>
                                    </div>
                                    <ComparisonRow
                                        label="POWER PLAY % (PP%)"
                                        awayVal={teamMetrics[awayTeam?.abbrev]?.pp_pct}
                                        homeVal={teamMetrics[homeTeam?.abbrev]?.pp_pct}
                                        format={(v) => parseFloat(v || 0).toFixed(1) + '%'}
                                    />
                                    <ComparisonRow
                                        label="PENALTY KILL % (PK%)"
                                        awayVal={teamMetrics[awayTeam?.abbrev]?.pk_pct}
                                        homeVal={teamMetrics[homeTeam?.abbrev]?.pk_pct}
                                        format={(v) => parseFloat(v || 0).toFixed(1) + '%'}
                                    />
                                    <ComparisonRow
                                        label="FACEOFF % (FO%)"
                                        awayVal={teamMetrics[awayTeam?.abbrev]?.fo_pct}
                                        homeVal={teamMetrics[homeTeam?.abbrev]?.fo_pct}
                                        format={(v) => parseFloat(v || 0).toFixed(1) + '%'}
                                    />
                                </MetricCard>
                            </div>
                        </section>
                    )}
                </div>

                {/* Right Column - Visuals & Players */}
                <div className="space-y-8">
                    {/* Shot Chart */}
                    <section className="glass-card p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Target className="w-6 h-6 text-accent-secondary" />
                            <h3 className="text-xl font-display font-bold">SHOT MAP</h3>
                        </div>
                        <div className="aspect-[2/1] rounded-xl overflow-hidden relative">
                            <ShotChart
                                shotsData={liveData?.shots_data || shotsFromPbp || []}
                                homeTeam={homeTeam.abbrev}
                                awayTeam={awayTeam.abbrev}
                                awayHeatmap={awayHeatmap}
                                homeHeatmap={homeHeatmap}
                                gameState={gameState}
                            />
                        </div>
                    </section>

                    {/* Top Players */}
                    <section className="glass-card p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Users className="w-6 h-6 text-color-success" />
                            <h3 className="text-xl font-display font-bold">TOP PERFORMERS</h3>
                        </div>
                        <div className="space-y-4">
                            {topPerformers.length > 0 ? (
                                topPerformers.map((player, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                    <div className="font-display font-bold text-2xl text-white/20 w-8 text-center">
                                        {idx + 1}
                                    </div>
                                    <div className="w-12 h-12 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center overflow-hidden">
                                        <img 
                                            src={`https://assets.nhle.com/logos/nhl/svg/${player.team}_light.svg`}
                                            alt={player.team}
                                            className="w-10 h-10 object-contain"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-white">
                                            {player.name}
                                        </div>
                                        <div className="text-xs font-mono text-text-muted flex gap-2">
                                            <span>{player.team}</span>
                                            <span>•</span>
                                            <span>{player.position}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono font-bold text-color-success">
                                            {player.gsPerGame ? player.gsPerGame.toFixed(2) : '0.00'} GS/GP
                                        </div>
                                        <div className="text-xs font-mono text-text-muted">
                                            {player.points || 0} P ({(player.goals || 0)}G, {(player.assists || 0)}A)
                                        </div>
                                    </div>
                                </div>
                                ))
                            ) : (
                                <div className="text-center text-text-muted py-4">No player data available</div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

const GameDetails = () => (
    <ErrorBoundary>
        <GameDetailsContent />
    </ErrorBoundary>
);

export default GameDetails;
