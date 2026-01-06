import React from 'react';
import Head from 'next/head';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

export default function DesignSystem() {
    return (
        <div className="min-h-screen bg-obsidian p-20 flex flex-col gap-20">
            <Head>
                <title>Design System | Onyx Enterprise</title>
            </Head>

            {/* Header */}
            <section className="space-y-4">
                <h1 className="text-6xl font-bold uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
                    Onyx Enterprise
                </h1>
                <p className="text-xl text-mist/60 max-w-2xl">
                    Design System Verification. Analyzing typography, color palette, and interaction primitives.
                </p>
            </section>

            {/* Typography */}
            <section className="space-y-8">
                <div className="flex items-baseline gap-4 border-b border-white/10 pb-4">
                    <h2 className="text-2xl font-display text-neon-lime uppercase tracking-widest">Typography</h2>
                </div>
                <div className="grid gap-8">
                    <div className="space-y-2">
                        <span className="text-xs text-white/30 font-mono">Display H1 (Syne)</span>
                        <h1 className="text-7xl font-bold">The quick brown fox.</h1>
                    </div>
                    <div className="space-y-2">
                        <span className="text-xs text-white/30 font-mono">Display H2 (Syne)</span>
                        <h2 className="text-5xl font-bold">Jumps over the lazy dog.</h2>
                    </div>
                    <div className="space-y-2">
                        <span className="text-xs text-white/30 font-mono">Display H3 (Syne)</span>
                        <h3 className="text-4xl font-bold">Commerce Operating System.</h3>
                    </div>
                    <div className="space-y-2">
                        <span className="text-xs text-white/30 font-mono">Body (Manrope)</span>
                        <p className="text-lg text-mist max-w-3xl leading-relaxed">
                            BizTrackr PRO is engineered for high-velocity commerce.
                            Every interaction is calculated, every pixel is intentional.
                            We do not compromise on performance or aesthetics. The interface fades away, leaving only pure data and control.
                        </p>
                    </div>
                </div>
            </section>

            {/* Components */}
            <section className="space-y-8">
                <div className="flex items-baseline gap-4 border-b border-white/10 pb-4">
                    <h2 className="text-2xl font-display text-neon-lime uppercase tracking-widest">Interaction Primitives</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Buttons */}
                    <div className="space-y-6">
                        <h3 className="text-xl text-white">Buttons</h3>
                        <div className="flex flex-wrap gap-4 items-center">
                            <Button>Primary Action</Button>
                            <Button variant="secondary">Secondary</Button>
                            <Button variant="outline">Outline</Button>
                            <Button variant="destructive">Destructive</Button>
                            <Button variant="ghost">Ghost</Button>
                        </div>
                        <div className="flex flex-wrap gap-4 items-center">
                            <Button size="sm">Small</Button>
                            <Button size="lg">Large Action</Button>
                        </div>
                    </div>

                    {/* Cards */}
                    <div className="space-y-6">
                        <h3 className="text-xl text-white">Spatial (Cards)</h3>
                        <Card hoverEffect className="w-full max-w-md">
                            <CardHeader>
                                <CardTitle>Revenue Analytics</CardTitle>
                                <CardDescription>Real-time financial telemetry.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-32 rounded bg-black/40 border border-white/5 flex items-center justify-center">
                                    <span className="text-neon-lime font-mono text-2xl">+24.5%</span>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full">View Report</Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </section>
        </div>
    );
}
