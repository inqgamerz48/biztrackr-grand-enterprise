import React, { useEffect, useRef } from 'react';
import anime from 'animejs';

const ArcReactorLoader = () => {
    const reactorRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!reactorRef.current) return;

        // Core Pulse - Neon Lime
        anime({
            targets: '.reactor-core',
            opacity: [0.6, 1],
            boxShadow: [
                '0 0 10px #ccff00',
                '0 0 20px #ccff00',
                '0 0 40px #ccff00',
                '0 0 20px #ccff00'
            ],
            fill: ['#ccff00', '#ffffff'],
            easing: 'easeInOutSine',
            duration: 2000,
            direction: 'alternate',
            loop: true
        });

        // Inner Ring Rotation - White
        anime({
            targets: '.reactor-inner-ring',
            rotate: 360,
            stroke: ['#ffffff', '#ccff00'],
            duration: 3000,
            easing: 'linear',
            loop: true
        });

        // Outer Ring Rotation (Counter-clockwise) - White
        anime({
            targets: '.reactor-outer-ring',
            rotate: -360,
            stroke: ['#ffffff', '#ffffff'],
            duration: 8000,
            easing: 'linear',
            loop: true
        });

        // Mechanical Bits Slide
        anime({
            targets: '.mech-bit',
            translateX: [0, 5, 0],
            fill: '#ccff00',
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
                    <circle cx="100" cy="100" r="75" fill="none" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.8" />
                    {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                        <rect
                            key={i}
                            x="95"
                            y="20"
                            width="10"
                            height="15"
                            fill="#ccff00"
                            transform={`rotate(${angle} 100 100)`}
                            className="mech-bit"
                        />
                    ))}
                </g>

                {/* Inner Ring */}
                <g className="reactor-inner-ring" style={{ transformOrigin: '100px 100px' }}>
                    <circle cx="100" cy="100" r="50" fill="none" stroke="#ccff00" strokeWidth="4" strokeDasharray="20,10" filter="url(#glow)" />
                    <circle cx="100" cy="100" r="45" fill="none" stroke="#fff" strokeWidth="1" />
                </g>

                {/* Core */}
                <circle
                    cx="100"
                    cy="100"
                    r="30"
                    fill="#ccff00"
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
            <div className="absolute mt-64 text-neon-lime font-display text-sm tracking-widest animate-pulse font-bold">
                SYSTEM INITIALIZATION...
            </div>
        </div>
    );
};

export default ArcReactorLoader;
