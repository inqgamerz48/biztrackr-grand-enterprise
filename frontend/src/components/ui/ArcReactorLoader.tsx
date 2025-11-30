import React, { useEffect, useRef } from 'react';
import anime from 'animejs/lib/anime.es.js';

const ArcReactorLoader = () => {
    const reactorRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!reactorRef.current) return;

        // Core Pulse
        anime({
            targets: '.reactor-core',
            opacity: [0.4, 0.8],
            boxShadow: ['0 0 10px #0ff', '0 0 40px #0ff'],
            easing: 'easeInOutSine',
            duration: 1000,
            direction: 'alternate',
            loop: true
        });

        // Inner Ring Rotation
        anime({
            targets: '.reactor-inner-ring',
            rotate: 360,
            duration: 3000,
            easing: 'linear',
            loop: true
        });

        // Outer Ring Rotation (Counter-clockwise)
        anime({
            targets: '.reactor-outer-ring',
            rotate: -360,
            duration: 8000,
            easing: 'linear',
            loop: true
        });

        // Mechanical Bits Slide
        anime({
            targets: '.mech-bit',
            translateX: [0, 5, 0],
            duration: 2000,
            delay: anime.stagger(200),
            easing: 'easeInOutQuad',
            loop: true
        });

    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-95 backdrop-blur-sm">
            <svg
                ref={reactorRef}
                width="200"
                height="200"
                viewBox="0 0 200 200"
                className="overflow-visible"
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
                <circle cx="100" cy="100" r="90" fill="none" stroke="#334155" strokeWidth="4" />
                <circle cx="100" cy="100" r="85" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="5,5" />

                {/* Outer Ring */}
                <g className="reactor-outer-ring" style={{ transformOrigin: '100px 100px' }}>
                    <circle cx="100" cy="100" r="75" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeOpacity="0.5" />
                    {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                        <rect
                            key={i}
                            x="95"
                            y="20"
                            width="10"
                            height="15"
                            fill="#0ea5e9"
                            transform={`rotate(${angle} 100 100)`}
                            className="mech-bit"
                        />
                    ))}
                </g>

                {/* Inner Ring */}
                <g className="reactor-inner-ring" style={{ transformOrigin: '100px 100px' }}>
                    <circle cx="100" cy="100" r="50" fill="none" stroke="#06b6d4" strokeWidth="4" strokeDasharray="20,10" filter="url(#glow)" />
                    <circle cx="100" cy="100" r="45" fill="none" stroke="#06b6d4" strokeWidth="1" />
                </g>

                {/* Core */}
                <circle
                    cx="100"
                    cy="100"
                    r="30"
                    fill="#ecfeff"
                    className="reactor-core"
                    filter="url(#glow)"
                />
                <path
                    d="M100 75 L115 110 L85 110 Z"
                    fill="#06b6d4"
                    opacity="0.5"
                    className="reactor-core-triangle"
                    transform="rotate(180 100 100)"
                />
            </svg>
            <div className="absolute mt-64 text-cyan-400 font-mono text-sm tracking-widest animate-pulse">
                INITIALIZING SYSTEMS...
            </div>
        </div>
    );
};

export default ArcReactorLoader;
