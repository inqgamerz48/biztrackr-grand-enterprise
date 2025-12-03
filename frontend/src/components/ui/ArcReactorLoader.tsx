import React, { useEffect, useRef } from 'react';
import anime from 'animejs';

const ArcReactorLoader = () => {
    const reactorRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!reactorRef.current) return;

        // Core Pulse - Neon Blue & Green
        anime({
            targets: '.reactor-core',
            opacity: [0.6, 1],
            boxShadow: [
                '0 0 10px #00f3ff',
                '0 0 20px #00f3ff',
                '0 0 40px #0aff0a',
                '0 0 20px #00f3ff'
            ],
            fill: ['#00f3ff', '#0aff0a'], // Cycle colors
            easing: 'easeInOutSine',
            duration: 2000,
            direction: 'alternate',
            loop: true
        });

        // Inner Ring Rotation - Neon Yellow
        anime({
            targets: '.reactor-inner-ring',
            rotate: 360,
            stroke: ['#fdfc00', '#ffffff'], // Pulse yellow to white
            duration: 3000,
            easing: 'linear',
            loop: true
        });

        // Outer Ring Rotation (Counter-clockwise) - Neon Red
        anime({
            targets: '.reactor-outer-ring',
            rotate: -360,
            stroke: ['#ff003c', '#ffffff'], // Pulse red to white
            duration: 8000,
            easing: 'linear',
            loop: true
        });

        // Mechanical Bits Slide - Multi-color
        anime({
            targets: '.mech-bit',
            translateX: [0, 5, 0],
            fill: function (el: any, i: number) {
                const colors = ['#fdfc00', '#ff003c', '#0aff0a', '#00f3ff']; // Yellow, Red, Green, Blue
                return colors[i % colors.length];
            },
            duration: 2000,
            delay: anime.stagger(200),
            easing: 'easeInOutQuad',
            loop: true
        });

    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
            <svg
                ref={reactorRef}
                width="200"
                height="200"
                viewBox="0 0 200 200"
                className="overflow-visible text-muted-foreground"
            >
                {/* Glow Filter */}
                <defs>
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Outer Housing */}
                <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="4" />
                <circle cx="100" cy="100" r="85" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" className="opacity-50" />

                {/* Outer Ring */}
                <g className="reactor-outer-ring" style={{ transformOrigin: '100px 100px' }}>
                    <circle cx="100" cy="100" r="75" fill="none" stroke="#ff003c" strokeWidth="2" strokeOpacity="0.8" />
                    {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                        <rect
                            key={i}
                            x="95"
                            y="20"
                            width="10"
                            height="15"
                            fill="#fff"
                            transform={`rotate(${angle} 100 100)`}
                            className="mech-bit"
                        />
                    ))}
                </g>

                {/* Inner Ring */}
                <g className="reactor-inner-ring" style={{ transformOrigin: '100px 100px' }}>
                    <circle cx="100" cy="100" r="50" fill="none" stroke="#fdfc00" strokeWidth="4" strokeDasharray="20,10" filter="url(#glow)" />
                    <circle cx="100" cy="100" r="45" fill="none" stroke="#fff" strokeWidth="1" />
                </g>

                {/* Core */}
                <circle
                    cx="100"
                    cy="100"
                    r="30"
                    fill="#00f3ff"
                    className="reactor-core"
                    filter="url(#glow)"
                />
                <path
                    d="M100 75 L115 110 L85 110 Z"
                    fill="#fff"
                    opacity="0.8"
                    className="reactor-core-triangle"
                    transform="rotate(180 100 100)"
                />
            </svg>
            <div className="absolute mt-64 text-foreground font-mono text-sm tracking-widest animate-pulse">
                INITIALIZING SYSTEMS...
            </div>
        </div>
    );
};

export default ArcReactorLoader;
