import { useState, useRef, useEffect, useCallback } from 'react';

const mainLinks = [
    { link: '#', label: 'PROJECT SELECTION', view: 'project' },
    { link: '#', label: '3D VIEW', view: 'viewer' },
    { link: '#', label: 'STATISTICS', view: 'stats' },
];

interface HeaderProps {
    activeView: string;
    onViewChange: (view: string) => void;
}

const Header = ({ activeView, onViewChange }: HeaderProps) => {
    const initialIndex = mainLinks.findIndex(link => link.view === activeView);
    const [activeIndex, setActiveIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
    const [isAnimating, setIsAnimating] = useState(false);

    const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
    const markerRef = useRef<HTMLDivElement>(null);
    const animationTimers = useRef<NodeJS.Timeout[]>([]);

    const clearAnimationTimers = useCallback(() => {
        animationTimers.current.forEach(timer => clearTimeout(timer));
        animationTimers.current = [];
    }, []);

    // FIX: Sync activeIndex with activeView prop changes
    useEffect(() => {
        const newIndex = mainLinks.findIndex(link => link.view === activeView);
        if (newIndex >= 0 && newIndex !== activeIndex) {
            setActiveIndex(newIndex);
        }
    }, [activeView]);

    // Update marker position when activeIndex changes
    useEffect(() => {
        const setMarkerPosition = () => {
            const currentLink = linkRefs.current[activeIndex];
            if (currentLink && markerRef.current) {
                const { offsetLeft, offsetWidth } = currentLink;
                markerRef.current.style.left = `${offsetLeft}px`;
                markerRef.current.style.width = `${offsetWidth}px`;
            }
        };

        const timer = setTimeout(setMarkerPosition, 50);
        return () => clearTimeout(timer);
    }, [activeIndex]);

    const handleLinkClick = (event: React.MouseEvent<HTMLAnchorElement>, index: number, view: string) => {
        event.preventDefault();
        if (index === activeIndex || isAnimating) return;

        setIsAnimating(true);
        const previousIndex = activeIndex;
        setActiveIndex(index);

        const currentLink = linkRefs.current[index];
        const previousLink = linkRefs.current[previousIndex];

        if (!currentLink || !previousLink || !markerRef.current) {
            setIsAnimating(false);
            onViewChange(view);
            return;
        }

        const marker = markerRef.current;

        // Phase 1: Create wave effect from current position
        marker.style.setProperty('--wave-intensity', '10px');
        marker.classList.add('wave-effect');

        // Phase 2: Move to new position with elastic motion
        setTimeout(() => {
            marker.classList.add('elastic-move');
        }, 200);

        // Phase 3: Finalize and clean up
        setTimeout(() => {
            marker.classList.remove('wave-effect', 'elastic-move');
            marker.style.setProperty('--wave-intensity', '0px');
            setIsAnimating(false);
            onViewChange(view);
        }, 600);

        // Store timer for cleanup
        animationTimers.current.push(setTimeout(() => {}, 600));
    };

    const mainItems = mainLinks.map((item, index) => (
        <a
            href={item.link}
            key={item.label}
            ref={(el) => (linkRefs.current[index] = el)}
            style={{
                display: 'block',
                padding: '12px 32px',
                textTransform: 'uppercase',
                fontSize: '14px',
                color: activeIndex === index ? 'black' : 'gray',
                fontWeight: activeIndex === index ? 800 : 700,
                textDecoration: 'none',
                transition: 'all 300ms ease',
                position: 'relative',
                zIndex: 1,
                userSelect: 'none',
                cursor: 'pointer',
            }}
            onClick={(event) => handleLinkClick(event, index, item.view)}
        >
            <span style={{
                display: 'inline-block',
                transition: 'all 300ms ease',
                transform: activeIndex === index ? 'translateY(-2px)' : 'translateY(0)',
                fontSize: activeIndex === index ? '15px' : '14px',
                letterSpacing: activeIndex === index ? '1px' : '0.5px',
            }}>
                {item.label}
            </span>
        </a>
    ));

    return (
        <>
            <style>
                {`
                .header-marker {
                    position: absolute;
                    bottom: 0;
                    height: 3px;
                    background: linear-gradient(90deg, #228be6, #3b82f6, #6366f1);
                    border-radius: 2px;
                    transition: all 400ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
                    z-index: 0;
                    box-shadow: 0 2px 8px rgba(34, 139, 230, 0.3);
                }

                .wave-effect {
                    animation: wavePulse 200ms ease-in-out;
                }

                .elastic-move {
                    transition: all 400ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
                }

                @keyframes wavePulse {
                    0% {
                        transform: scaleY(1);
                        opacity: 1;
                    }
                    25% {
                        transform: scaleY(0.3);
                        opacity: 0.7;
                    }
                    50% {
                        transform: scaleY(1.2);
                        opacity: 1;
                    }
                    75% {
                        transform: scaleY(0.8);
                        opacity: 0.9;
                    }
                    100% {
                        transform: scaleY(1);
                        opacity: 1;
                    }
                }

                /* Ripple effect on click */
                @keyframes ripple {
                    0% {
                        transform: scale(0);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(4);
                        opacity: 0;
                    }
                }

                .ripple-effect::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 20px;
                    height: 20px;
                    background: radial-gradient(circle, rgba(34, 139, 230, 0.3) 0%, transparent 70%);
                    border-radius: 50%;
                    transform: translate(-50%, -50%);
                    animation: ripple 600ms ease-out;
                    z-index: -1;
                }
                `}
            </style>

            <header style={{
                height: '70px',
                backgroundColor: 'white',
                borderBottom: '1px solid #e9ecef',
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '0 24px',
                position: 'relative',
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    width: '100%'
                }}>
                    <div style={{
                        position: 'relative',
                        display: 'flex',
                        gap: '300px',
                        justifyContent: 'center'
                    }}>
                        {mainItems}
                        <div
                            ref={markerRef}
                            className="header-marker"
                        />
                    </div>
                </div>
            </header>
        </>
    );
};

export default Header;