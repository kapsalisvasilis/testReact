import { useState, useMemo, useEffect, useRef } from 'react';
import {
    Paper,
    MultiSelect,
    Text,
    rem,
    useMantineTheme,
    Box,
    Group,
    ActionIcon,
} from '@mantine/core';
// Import useMotionValue
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { IconArrowsMaximize, IconArrowsMinimize } from '@tabler/icons-react';

// --- Define Props ---

type ChartOption = {
    value: string;
    label: string;
};

interface GraphControlProps {
    view: 'baseline' | 'simulation';
    selectedCharts: string[];
    onChange: (value: string[]) => void;
    allOptions: ChartOption[];
}

export const GraphControl = ({
                                 view,
                                 selectedCharts,
                                 onChange,
                                 allOptions,
                             }: GraphControlProps) => {
    const theme = useMantineTheme();
    const [isOpen, setIsOpen] = useState(false);
    const dragRef = useRef<HTMLDivElement>(null);

    // --- Use MotionValues for position ---
    const x = useMotionValue(0);
    const y = useMotionValue(100);

    // --- State for Drag Constraints ---
    const [constraints, setConstraints] = useState({ top: 10, left: 10, right: 10, bottom: 10 });

    // --- Helper to update drag constraints ---
    const updateConstraints = () => {
        if (dragRef.current) {
            const componentWidth = dragRef.current.offsetWidth;
            const componentHeight = dragRef.current.offsetHeight;

            // Set constraints to 10px from each viewport edge
            const newConstraints = {
                top: 20,
                left: 20,
                right: window.innerWidth - componentWidth - 40,
                bottom: window.innerHeight - componentHeight - 40,
            };
            setConstraints(newConstraints);

            // --- CRITICAL FIX ---
            // After constraints update, check if the *current* position
            // is now outside the new bounds. If so, snap it back.
            const currentX = x.get();
            const currentY = y.get();

            if (currentX > newConstraints.right) {
                x.set(newConstraints.right);
            }
            if (currentY > newConstraints.bottom) {
                y.set(newConstraints.bottom);
            }
            // Also check left/top, just in case
            if (currentX < newConstraints.left) {
                x.set(newConstraints.left);
            }
            if (currentY < newConstraints.top) {
                y.set(newConstraints.top);
            }
        }
    };

    // --- Set initial position and constraints on mount ---
    useEffect(() => {
        // --- CHANGE 1: Calculate initial X to be centered ---
        const initialWidth = 250; // Component's initial width from 'closed' variant
        const initialX = (window.innerWidth - initialWidth) / 2;
        const initialY = 100; // 100px from top

        // Set motion values instead of state
        x.set(initialX);
        y.set(initialY);

        // Update constraints on mount and on any window resize
        updateConstraints();
        window.addEventListener('resize', updateConstraints);

        // Cleanup listener
        return () => window.removeEventListener('resize', updateConstraints);

        // We only want this to run once on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- Dynamic Options Logic ---
    const availableOptions = useMemo(() => {
        if (view === 'baseline') {
            return allOptions.filter(
                (option) => option.value !== 'kpi' && option.value !== 'waste'
            );
        }
        return allOptions;
    }, [view, allOptions]);

    // --- Animation Variants ---
    // --- Animation Variants ---
    const containerVariants = {
        closed: {
            width: rem(200),
            height: rem(48),
            borderRadius: rem(24),

        },
        open: {
            width: rem(250),
            height: 'auto',
            borderRadius: rem(12),
        },
    };


    const contentVariants = {
        hidden: {
            opacity: 0,
            height: 0,
        },
        visible: {
            opacity: 1,
            height: 'auto',
            transition: {
                delay: 0.1,
            },
        },
        exit: {
            opacity: 0,
            height: 0,
            transition: {
                duration: 0.2,
            },
        },
    };

    return (
        <motion.div
            ref={dragRef} // <-- Attach ref to get dimensions
            // --- Animation props ---
            animate={isOpen ? 'open' : 'closed'}
            variants={containerVariants}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            // --- Update constraints after animation finishes ---
            onAnimationComplete={updateConstraints}

            // --- DRAG & POSITION props ---
            drag
            dragMomentum={false}
            dragConstraints={constraints} // <-- Apply dynamic constraints

            // --- Style for positioning ---
            style={{
                position: 'fixed', // Fixed to stay on screen during scroll
                x,   // <-- Use motion value
                y,   // <-- Use motion value
                zIndex: 1000,
                overflow: 'hidden',
                cursor: 'move',
            }}
        >
            <Paper
                shadow="md"
                radius={isOpen ? "md" : "xl"}
                withBorder
                style={{
                    background: isOpen
                        ? theme.black
                        : `linear-gradient(135deg, ${theme.colors.dark[6]} 0%, ${theme.colors.dark[4]} 100%)`,
                    borderColor: theme.colors.dark[4],
                    transition: 'all 0.3s ease',
                }}
            >
                {/* Header: Drag handle */}
                <motion.div
                    style={{ cursor: 'move' }}
                >
                    <Group
                        // --- CHANGE 2: Justify dynamically ---
                        justify={isOpen ? 'space-between' : 'center'}
                        p="xs"
                        style={{
                            height: rem(42)
                        }}
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <Text
                            fw={500}
                            c="white"
                            // --- CHANGE 2: Removed pl="xs" ---
                        >
                            Display Graphs
                        </Text>
                        <ActionIcon
                            variant="transparent"
                            aria-label={isOpen ? 'Minimize' : 'Enlarge'}
                        >
                            {isOpen ? (
                                <IconArrowsMinimize color={theme.colors.gray[5]} />
                            ) : (
                                <IconArrowsMaximize color={theme.colors.gray[5]} />
                            )}
                        </ActionIcon>
                    </Group>
                </motion.div>

                {/* Collapsible Content */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            variants={contentVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            style={{ overflow: 'hidden', cursor: 'default' }}
                            // Update constraints as content animates in
                            onAnimationComplete={updateConstraints}
                        >
                            <Box
                                p="md"
                                pt="xs"
                                style={{
                                    borderTop: `1px solid ${theme.colors.dark[4]}`,
                                }}
                            >
                                <MultiSelect
                                    data={availableOptions}
                                    value={selectedCharts}
                                    onChange={onChange}
                                    placeholder="Choose one or more charts"
                                    searchable
                                    clearable
                                    styles={{
                                        label: { color: 'white', marginBottom: rem(8), fontWeight: 500 },
                                        input: {
                                            backgroundColor: theme.colors.dark[5],
                                            color: 'white',
                                            borderColor: theme.colors.dark[3],
                                        },
                                        dropdown: {
                                            backgroundColor: theme.colors.dark[7],
                                            borderColor: theme.colors.dark[5],
                                        },
                                        option: {
                                            color: theme.colors.gray[2],
                                            '&[data-hovered]': {
                                                backgroundColor: theme.colors.dark[5],
                                            },
                                            '&[data-selected]': {
                                                backgroundColor: theme.colors.indigo[7],
                                                color: 'white',
                                            },
                                        },
                                        pill: {
                                            backgroundColor: theme.colors.indigo[6],
                                            color: 'white'
                                        }
                                    }}
                                />
                            </Box>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Paper>
        </motion.div>
    );
};