import React, { useState } from 'react';
import { getTeamLogo } from '../utils/teamLogos';

/**
 * ShotChart Component
 * Displays a hockey rink with shots and goals plotted
 * 
 * @param {Array} shotsData - Array of shot objects with {x, y, type, team, period, time}
 * @param {String} awayTeam - Away team abbreviation
 * @param {String} homeTeam - Home team abbreviation
 * @param {Object} awayHeatmap - Pre-game heatmap data for away team
 * @param {Object} homeHeatmap - Pre-game heatmap data for home team
 * @param {String} gameState - Current game state (FUT, LIVE, FINAL)
 */
const ShotChart = ({ shotsData = [], awayTeam, homeTeam, awayHeatmap = null, homeHeatmap = null, gameState = 'FUT' }) => {
    const [tooltip, setTooltip] = useState(null);

    // Rink dimensions (NHL standard in feet)
    const RINK_WIDTH = 200; // -100 to 100
    const RINK_HEIGHT = 85; // -42.5 to 42.5

    // SVG viewBox dimensions
    const SVG_WIDTH = 800;
    const SVG_HEIGHT = 340;

    // Convert rink coordinates to SVG coordinates
    const toSVGX = (x) => ((x + 100) / RINK_WIDTH) * SVG_WIDTH;
    const toSVGY = (y) => ((42.5 - y) / RINK_HEIGHT) * SVG_HEIGHT; // Flip Y axis

    // Team colors (simplified - you can expand this)
    const getTeamColor = (team) => {
        const colors = {
            'BOS': '#FFB81C', 'TOR': '#00205B', 'MTL': '#AF1E2D', 'OTT': '#C52032',
            'TBL': '#002868', 'FLA': '#041E42', 'DET': '#CE1126', 'BUF': '#002654',
            'NYR': '#0038A8', 'NYI': '#00539B', 'NJD': '#CE1126', 'PHI': '#F74902',
            'PIT': '#000000', 'WSH': '#041E42', 'CAR': '#CE1126', 'CBJ': '#002654',
            'CHI': '#CF0A2C', 'STL': '#002F87', 'MIN': '#154734', 'WPG': '#041E42',
            'NSH': '#FFB81C', 'COL': '#6F263D', 'DAL': '#006847', 'ARI': '#8C2633',
            'VGK': '#B4975A', 'SEA': '#001628', 'CGY': '#C8102E', 'EDM': '#041E42',
            'VAN': '#00205B', 'ANA': '#F47A38', 'LAK': '#111111', 'SJS': '#006D75'
        };
        return colors[team] || '#888888';
    };

    // Handle mouse enter on shot/goal
    const handleMouseEnter = (event, shot) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setTooltip({
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
            shooter: shot.shooter || 'Unknown',
            shotType: shot.shotType || 'Wrist',
            xg: shot.xg,
            isGoal: shot.type === 'GOAL'
        });
    };

    const handleMouseLeave = () => {
        setTooltip(null);
    };

    // Determine if we're showing pre-game (last 5 games) or in-game/post-game data
    const isPreGame = gameState === 'FUT' || gameState === 'PREVIEW';
    const hasLiveData = shotsData.length > 0;

    // For pre-game, use heatmap data (last 5 games)
    // For in-game/post-game, use live shots data
    let awayShots = [];
    let awayGoals = [];
    let homeShots = [];
    let homeGoals = [];

    if (isPreGame && (awayHeatmap || homeHeatmap)) {
        // Pre-game: Use heatmap data from last 5 games
        // Backend already normalizes so teams shoot from right (positive x)
        // Away team shoots right, Home team shoots left
        if (awayHeatmap) {
            awayShots = (awayHeatmap.shots_for || []).map(shot => ({
                ...shot,
                x: Math.abs(shot.x || 0), // Ensure positive (right side)
                y: shot.y || 0,
                team: awayTeam,
                shooter: shot.shooter,
                shotType: shot.shotType,
                xg: shot.xg
            }));
            awayGoals = (awayHeatmap.goals_for || []).map(goal => ({
                ...goal,
                x: Math.abs(goal.x || 0), // Ensure positive (right side)
                y: goal.y || 0,
                team: awayTeam,
                type: 'GOAL',
                shooter: goal.shooter,
                shotType: goal.shotType,
                xg: goal.xg
            }));
        }
        if (homeHeatmap) {
            homeShots = (homeHeatmap.shots_for || []).map(shot => ({
                ...shot,
                x: -Math.abs(shot.x || 0), // Ensure negative (left side)
                y: shot.y || 0,
                team: homeTeam,
                shooter: shot.shooter,
                shotType: shot.shotType,
                xg: shot.xg
            }));
            homeGoals = (homeHeatmap.goals_for || []).map(goal => ({
                ...goal,
                x: -Math.abs(goal.x || 0), // Ensure negative (left side)
                y: goal.y || 0,
                team: homeTeam,
                type: 'GOAL',
                shooter: goal.shooter,
                shotType: goal.shotType,
                xg: goal.xg
            }));
        }
    } else if (hasLiveData) {
        // In-game/Post-game: Use live shots data
        // Normalize coordinates so each team has their own side regardless of period
        shotsData.forEach(shot => {
            const isAway = shot.team === awayTeam;
            // Normalize: Away team always shoots from right (positive x), Home from left (negative x)
            const normalizedShot = {
                ...shot,
                x: isAway ? Math.abs(shot.x || 0) : -Math.abs(shot.x || 0),
                y: shot.y || 0
            };
            
            if (shot.type === 'GOAL' || shot.type === 'goal') {
                if (isAway) awayGoals.push(normalizedShot);
                else homeGoals.push(normalizedShot);
            } else {
                if (isAway) awayShots.push(normalizedShot);
                else homeShots.push(normalizedShot);
            }
        });
    }

    const awayColor = getTeamColor(awayTeam);
    const homeColor = getTeamColor(homeTeam);

    return (
        <div className="relative w-full rounded-xl overflow-hidden">
            {/* Rink Image Background */}
            <div className="relative w-full" style={{ paddingBottom: '42.5%' }}>
                <img
                    src="/rink.jpeg"
                    alt="Hockey Rink"
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                />

                {/* SVG Overlay for Shots */}
                <svg
                    viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                    className="absolute inset-0 w-full h-full"
                    preserveAspectRatio="xMidYMid meet"
                >
                    {/* Team Logos - Always show */}
                    <>
                        {/* Away Team Logo (Right side - they shoot right) */}
                        <g transform={`translate(${SVG_WIDTH * 0.85}, ${SVG_HEIGHT * 0.5})`}>
                            <image
                                href={getTeamLogo(awayTeam)}
                                x="-40"
                                y="-40"
                                width="80"
                                height="80"
                                opacity="0.7"
                            />
                            <text
                                x="0"
                                y="60"
                                textAnchor="middle"
                                fill="white"
                                fontSize="16"
                                fontWeight="bold"
                                className="drop-shadow-lg"
                            >
                                {awayTeam}
                            </text>
                        </g>
                        {/* Home Team Logo (Left side - they shoot left) */}
                        <g transform={`translate(${SVG_WIDTH * 0.15}, ${SVG_HEIGHT * 0.5})`}>
                            <image
                                href={getTeamLogo(homeTeam)}
                                x="-40"
                                y="-40"
                                width="80"
                                height="80"
                                opacity="0.7"
                            />
                            <text
                                x="0"
                                y="60"
                                textAnchor="middle"
                                fill="white"
                                fontSize="16"
                                fontWeight="bold"
                                className="drop-shadow-lg"
                            >
                                {homeTeam}
                            </text>
                        </g>
                    </>

                    {/* Away Team Shots (Right side) */}
                    {awayShots.map((shot, idx) => (
                        <circle
                            key={`away-shot-${idx}`}
                            cx={toSVGX(shot.x)}
                            cy={toSVGY(shot.y)}
                            r="4"
                            fill={awayColor}
                            stroke="black"
                            strokeWidth="0.8"
                            opacity="0.85"
                            style={{ cursor: 'pointer' }}
                            className="hover:opacity-100 hover:stroke-white transition-all"
                            onMouseEnter={(e) => handleMouseEnter(e, shot)}
                            onMouseLeave={handleMouseLeave}
                        />
                    ))}

                    {/* Away Team Goals (Right side) */}
                    {awayGoals.map((goal, idx) => (
                        <g
                            key={`away-goal-${idx}`}
                            style={{ cursor: 'pointer' }}
                            className="hover:opacity-100 transition-all"
                            onMouseEnter={(e) => handleMouseEnter(e, goal)}
                            onMouseLeave={handleMouseLeave}
                        >
                            <circle
                                cx={toSVGX(goal.x)}
                                cy={toSVGY(goal.y)}
                                r="7"
                                fill={awayColor}
                                stroke="black"
                                strokeWidth="1.5"
                                opacity="1"
                                className="hover:stroke-white"
                            />
                            {/* Star marker for goals */}
                            <text
                                x={toSVGX(goal.x)}
                                y={toSVGY(goal.y)}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill="white"
                                fontSize="10"
                                fontWeight="bold"
                                pointerEvents="none"
                            >
                                ★
                            </text>
                        </g>
                    ))}

                    {/* Home Team Shots (Left side) */}
                    {homeShots.map((shot, idx) => (
                        <circle
                            key={`home-shot-${idx}`}
                            cx={toSVGX(shot.x)}
                            cy={toSVGY(shot.y)}
                            r="4"
                            fill={homeColor}
                            stroke="black"
                            strokeWidth="0.8"
                            opacity="0.85"
                            style={{ cursor: 'pointer' }}
                            className="hover:opacity-100 hover:stroke-white transition-all"
                            onMouseEnter={(e) => handleMouseEnter(e, shot)}
                            onMouseLeave={handleMouseLeave}
                        />
                    ))}

                    {/* Home Team Goals (Left side) */}
                    {homeGoals.map((goal, idx) => (
                        <g
                            key={`home-goal-${idx}`}
                            style={{ cursor: 'pointer' }}
                            className="hover:opacity-100 transition-all"
                            onMouseEnter={(e) => handleMouseEnter(e, goal)}
                            onMouseLeave={handleMouseLeave}
                        >
                            <circle
                                cx={toSVGX(goal.x)}
                                cy={toSVGY(goal.y)}
                                r="7"
                                fill={homeColor}
                                stroke="black"
                                strokeWidth="1.5"
                                opacity="1"
                                className="hover:stroke-white"
                            />
                            {/* Star marker for goals */}
                            <text
                                x={toSVGX(goal.x)}
                                y={toSVGY(goal.y)}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill="white"
                                fontSize="10"
                                fontWeight="bold"
                                pointerEvents="none"
                            >
                                ★
                            </text>
                        </g>
                    ))}
                </svg>
            </div>

            {/* Custom Tooltip */}
            {tooltip && (
                <div
                    className="fixed z-50 pointer-events-none"
                    style={{
                        left: `${tooltip.x}px`,
                        top: `${tooltip.y}px`,
                        transform: 'translate(-50%, -100%)'
                    }}
                >
                    <div className="bg-black/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-xl border border-white/20">
                        <div className="text-xs font-mono space-y-1">
                            {tooltip.isGoal && <div className="text-yellow-400 font-bold">🎯 GOAL</div>}
                            <div className="font-semibold">{tooltip.shooter}</div>
                            <div className="text-gray-300">{tooltip.shotType} Shot</div>
                            {tooltip.xg !== undefined && (
                                <div className="text-blue-400">
                                    xG: {(tooltip.xg * 100).toFixed(1)}%
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ShotChart;
