// Stats.tsx (Fully Corrected)

import { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Group,
    Paper,
    useMantineTheme,
    Text,
    rem,
} from '@mantine/core';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    AreaChart,
    Area,
} from 'recharts';
import { GraphControl } from './GraphControl.tsx'; // <-- Correct import path

// --- Dummy Data Definitions ---

const energyData = [
    { name: 'Jan', consumption: 4000, baseline: 2400 },
    { name: 'Feb', consumption: 3000, baseline: 2210 },
    { name: 'Mar', consumption: 2000, baseline: 2290 },
    { name: 'Apr', consumption: 2780, baseline: 2000 },
    { name: 'May', consumption: 1890, baseline: 2181 },
    { name: 'Jun', consumption: 2390, baseline: 2500 },
    { name: 'Jul', consumption: 3490, baseline: 2100 },
];

const elementData = [
    { name: 'Walls', 'Baseline Count': 400, 'Sim. Count': 420 },
    { name: 'Floors', 'Baseline Count': 300, 'Sim. Count': 300 },
    { name: 'Doors', 'Baseline Count': 200, 'Sim. Count': 210 },
    { name: 'Windows', 'Baseline Count': 278, 'Sim. Count': 290 },
    { name: 'Beams', 'Baseline Count': 189, 'Sim. Count': 189 },
    { name: 'Columns', 'Baseline Count': 239, 'Sim. Count': 239 },
];

const costData = [
    { name: 'Materials', value: 45000 },
    { name: 'Labor', value: 32000 },
    { name: 'MEP', value: 18000 },
    { name: 'Finishes', value: 12000 },
];

const carbonData = [
    { name: 'Jan', 'Baseline CO2': 1200, 'Sim. CO2': 1100 },
    { name: 'Feb', 'Baseline CO2': 1100, 'Sim. CO2': 1050 },
    { name: 'Mar', 'Baseline CO2': 1150, 'Sim. CO2': 1000 },
    { name: 'Apr', 'Baseline CO2': 900, 'Sim. CO2': 850 },
    { name: 'May', 'Baseline CO2': 850, 'Sim. CO2': 800 },
    { name: 'Jun', 'Baseline CO2': 950, 'Sim. CO2': 880 },
];

const kpiData = [
    { subject: 'Safety', A: 120, B: 110, fullMark: 150 },
    { subject: 'Cost', A: 98, B: 130, fullMark: 150 },
    { subject: 'Schedule', A: 86, B: 130, fullMark: 150 },
    { subject: 'Quality', A: 99, B: 100, fullMark: 150 },
    { subject: 'Sustainability', A: 85, B: 90, fullMark: 150 },
    { subject: 'Risk', A: 65, B: 85, fullMark: 150 },
];

const wasteData = [
    { name: 'Concrete', 'Baseline Waste (T)': 120, 'Sim. Waste (T)': 90 },
    { name: 'Steel', 'Baseline Waste (T)': 80, 'Sim. Waste (T)': 75 },
    { name: 'Drywall', 'Baseline Waste (T)': 60, 'Sim. Waste (T)': 40 },
    { name: 'Wood', 'Baseline Waste (T)': 40, 'Sim. Waste (T)': 35 },
];

// --- Stats Component ---

const Stats = () => {
    const theme = useMantineTheme();
    const [view, setView] = useState<'baseline' | 'simulation'>('baseline');

    // This is the full list of *all* possible chart options
    const allChartOptions = [
        { value: 'energy', label: 'Energy Consumption' },
        { value: 'elements', label: 'Element Count' },
        { value: 'cost', label: 'Cost Distribution' },
        { value: 'carbon', label: 'Carbon Footprint' },
        { value: 'kpi', label: 'KPI Radar (Renovation only)' },
        { value: 'waste', label: 'Material Waste (Renovation only)' },
    ];

    // This state now holds the "master" list of selected charts
    const [selectedCharts, setSelectedCharts] = useState<string[]>(
        allChartOptions.map(c => c.value) // Start with all charts selected
    );

    // --- DYNAMIC STATE LOGIC ---
    // This effect runs when the 'view' changes.
    // It cleans up the 'selectedCharts' state to remove
    // simulation-only charts if the user switches to 'baseline'.
    useEffect(() => {
        if (view === 'baseline') {
            setSelectedCharts((currentCharts) =>
                currentCharts.filter(
                    (chart) => chart !== 'kpi' && chart !== 'waste'
                )
            );
        }
    }, [view]);

    // --- (Chart colors, styles, and helpers remain the same) ---
    const CHART_COLORS = [
        theme.colors.cyan[6],
        theme.colors.grape[6],
        theme.colors.pink[6],
        theme.colors.blue[6],
        theme.colors.teal[6],
    ];
    const axisStroke = theme.colors.gray[5];
    const gridStroke = theme.colors.dark[4];
    const tooltipBg = theme.colors.dark[7];
    const tooltipBorder = theme.colors.dark[5];
    const legendColor = theme.colors.gray[3];
    const textColor = theme.colors.gray[1];
    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <Box
            p="xl"
            style={{
                backgroundColor: theme.colors.indigo[8],
                minHeight: '100vh',
                overflow: 'auto',
            }}
        >
            {/* --- GRAPH CONTROL (Fixed position - stays on screen while scrolling) --- */}
            <GraphControl
                view={view}
                selectedCharts={selectedCharts}
                onChange={setSelectedCharts}
                allOptions={allChartOptions}
            />

            {/* Header Section */}
            <Box mb="xl" style={{ textAlign: 'center' }}>
                <Group justify="center" mb="lg">
                    {/* --- Button 1 --- */}
                    <Button
                        size="lg"
                        variant={view === 'baseline' ? 'filled' : 'outline'}
                        color={view === 'baseline' ? 'indigo' : 'black'}
                        onClick={() => setView('baseline')}
                        styles={{
                            root: {
                                border: view === 'baseline' ? `5px solid ${theme.black}` : undefined,
                                opacity: view === 'baseline' ? 1 : 0.7,
                            }
                        }}
                    >
                        Baseline
                    </Button>

                    {/* --- Button 2 --- */}
                    <Button
                        size="lg"
                        variant={view === 'simulation' ? 'filled' : 'outline'}
                        color={view === 'simulation' ? 'indigo' : 'black'}
                        onClick={() => setView('simulation')}
                        styles={{
                            root: {
                                border: view === 'simulation' ? `5px solid ${theme.black}` : undefined,
                                opacity: view === 'simulation' ? 1 : 0.55,
                            }
                        }}
                    >
                        Renovation
                    </Button>
                </Group>
            </Box>

            {/* Charts Container - Single Column Layout */}
            <Box style={{
                maxWidth: '1200px',
                margin: '0 auto',
                marginTop: rem(100), // <-- ADDED PADDING HERE
                display: 'flex',
                flexDirection: 'column',
                gap: rem(24)
            }}>
                {/* Chart 1: Energy Consumption (Line Chart) */}
                {selectedCharts.includes('energy') && (
                    <Paper
                        withBorder
                        radius="md"
                        p="md"
                        style={{
                            backgroundColor: theme.colors.dark[8],
                            borderTop: `3px solid ${theme.colors.cyan[5]}`
                        }}
                    >
                        <Text c={textColor} fw={500} mb="md" size="lg">Energy Consumption (kWh)</Text>
                        <Box style={{ height: rem(400) }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={energyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                                    <XAxis dataKey="name" stroke={axisStroke} />
                                    <YAxis stroke={axisStroke} />
                                    <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }} labelStyle={{ color: textColor }} />
                                    <Legend wrapperStyle={{ color: legendColor }} />
                                    <Line type="monotone" dataKey="consumption" stroke={theme.colors.cyan[5]} activeDot={{ r: 8 }} />
                                    <Line type="monotone" dataKey="baseline" stroke={theme.colors.grape[5]} />
                                </LineChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                )}

                {/* Chart 2: Element Count (Bar Chart) */}
                {selectedCharts.includes('elements') && (
                    <Paper
                        withBorder
                        radius="md"
                        p="md"
                        style={{
                            backgroundColor: theme.colors.dark[8],
                            borderTop: `3px solid ${theme.colors.pink[6]}`
                        }}
                    >
                        <Text c={textColor} fw={500} mb="md" size="lg">Element Count by Type</Text>
                        <Box style={{ height: rem(400) }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={elementData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                                    <XAxis dataKey="name" stroke={axisStroke} />
                                    <YAxis stroke={axisStroke} />
                                    <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }} labelStyle={{ color: textColor }} />
                                    <Legend wrapperStyle={{ color: legendColor }} />
                                    <Bar dataKey="Baseline Count" fill={theme.colors.pink[6]} />
                                    {view === 'simulation' && <Bar dataKey="Sim. Count" fill={theme.colors.blue[6]} />}
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                )}

                {/* Chart 3: Cost Distribution (Pie Chart) */}
                {selectedCharts.includes('cost') && (
                    <Paper
                        withBorder
                        radius="md"
                        p="md"
                        style={{
                            backgroundColor: theme.colors.dark[8],
                            borderTop: `3px solid ${theme.colors.grape[6]}`
                        }}
                    >
                        <Text c={textColor} fw={500} mb="md" size="lg">Cost Distribution (Baseline)</Text>
                        <Box style={{ height: rem(400) }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={costData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={renderCustomizedLabel}
                                        outerRadius={150}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {costData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }} labelStyle={{ color: textColor }} />
                                    <Legend wrapperStyle={{ color: legendColor }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                )}

                {/* Chart 4: Carbon Footprint (Area Chart) */}
                {selectedCharts.includes('carbon') && (
                    <Paper
                        withBorder
                        radius="md"
                        p="md"
                        style={{
                            backgroundColor: theme.colors.dark[8],
                            borderTop: `3px solid ${theme.colors.red[6]}`
                        }}
                    >
                        <Text c={textColor} fw={500} mb="md" size="lg">Carbon Footprint (tCO2e)</Text>
                        <Box style={{ height: rem(400) }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={carbonData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                                    <XAxis dataKey="name" stroke={axisStroke} />
                                    <YAxis stroke={axisStroke} />
                                    <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }} labelStyle={{ color: textColor }} />
                                    <Legend wrapperStyle={{ color: legendColor }} />
                                    <Area type="monotone" dataKey="Baseline CO2" stackId="1" stroke={theme.colors.red[6]} fill={theme.colors.red[8]} />
                                    {view === 'simulation' && <Area type="monotone" dataKey="Sim. CO2" stackId="2" stroke={theme.colors.green[6]} fill={theme.colors.green[8]} />}
                                </AreaChart>
                            </ResponsiveContainer>
                        </Box>
                    </Paper>
                )}

                {/* Simulation-specific charts */}
                {view === 'simulation' && (
                    <>
                        {/* Chart 5: Simulation KPIs (Radar Chart) */}
                        {selectedCharts.includes('kpi') && (
                            <Paper
                                withBorder
                                radius="md"
                                p="md"
                                style={{
                                    backgroundColor: theme.colors.dark[8],
                                    borderTop: `3px solid ${theme.colors.cyan[5]}`
                                }}
                            >
                                <Text c={textColor} fw={500} mb="md" size="lg">Simulation KPIs (vs. Baseline)</Text>
                                <Box style={{ height: rem(400) }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius={130} data={kpiData}>
                                            <PolarGrid stroke={gridStroke} />
                                            <PolarAngleAxis dataKey="subject" stroke={axisStroke} />
                                            <PolarRadiusAxis angle={30} domain={[0, 150]} stroke={axisStroke} />
                                            <Radar name="Baseline" dataKey="A" stroke={theme.colors.grape[5]} fill={theme.colors.grape[5]} fillOpacity={0.5} />
                                            <Radar name="Simulation" dataKey="B" stroke={theme.colors.cyan[5]} fill={theme.colors.cyan[5]} fillOpacity={0.7} />
                                            <Legend wrapperStyle={{ color: legendColor }} />
                                            <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }} labelStyle={{ color: textColor }} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Paper>
                        )}

                        {/* Chart 6: Material Waste (Bar Chart) */}
                        {selectedCharts.includes('waste') && (
                            <Paper
                                withBorder
                                radius="md"
                                p="md"
                                style={{
                                    backgroundColor: theme.colors.dark[8],
                                    borderTop: `3px solid ${theme.colors.lime[7]}`
                                }}
                            >
                                <Text c={textColor} fw={500} mb="md" size="lg">Material Waste Reduction (Tons)</Text>
                                <Box style={{ height: rem(400) }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={wasteData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                                            <XAxis type="number" stroke={axisStroke} />
                                            <YAxis dataKey="name" type="category" stroke={axisStroke} />
                                            <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }} labelStyle={{ color: textColor }} />
                                            <Legend wrapperStyle={{ color: legendColor }} />
                                            <Bar dataKey="Baseline Waste (T)" fill={theme.colors.orange[7]} />
                                            <Bar dataKey="Sim. Waste (T)" fill={theme.colors.lime[7]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Paper>
                        )}
                    </>
                )}
            </Box>
        </Box>
    );
};

export default Stats;
