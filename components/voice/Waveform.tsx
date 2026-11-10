'use client';

import { useEffect, useRef } from 'react';

interface WaveformProps {
    analyser?: AnalyserNode | null;
    active: boolean;
}

export default function Waveform({ analyser, active }: WaveformProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const frameRef = useRef<number | null>(null);
    const smoothRef = useRef<number[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;
        const context = canvas.getContext('2d');
        if (!context) return undefined;

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const bars = 44;
        const data = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;
        const styles = window.getComputedStyle(document.documentElement);
        const riverHue = styles.getPropertyValue('--river').trim() || '221 83% 53%';
        const penHue = styles.getPropertyValue('--pen').trim() || '38 92% 50%';

        const draw = () => {
            const ratio = window.devicePixelRatio || 1;
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            if (canvas.width !== width * ratio || canvas.height !== height * ratio) {
                canvas.width = width * ratio;
                canvas.height = height * ratio;
            }
            context.setTransform(ratio, 0, 0, ratio, 0, 0);
            context.clearRect(0, 0, width, height);

            if (analyser && data) analyser.getByteTimeDomainData(data);

            const gap = width / bars;
            for (let index = 0; index < bars; index += 1) {
                let level = 0.06;
                if (analyser && data && active) {
                    const start = Math.floor((index / bars) * data.length);
                    const sliceLength = Math.ceil(data.length / bars);
                    let sum = 0;
                    for (let offset = start; offset < Math.min(start + sliceLength, data.length); offset += 1) {
                        const sample = (data[offset] - 128) / 128;
                        sum += sample * sample;
                    }
                    const sampleCount = Math.min(sliceLength, data.length - start);
                    const rms = Math.sqrt(sum / (sampleCount || 1));
                    level = Math.min(1, rms * 3.2);
                }

                const target = Math.max(0.06, level);
                smoothRef.current[index] = (smoothRef.current[index] || 0.06) * 0.72 + target * 0.28;
                const barHeight = Math.max(3, smoothRef.current[index] * height * 0.92);
                context.fillStyle = `hsl(${index % 7 === 0 && active ? penHue : riverHue} / ${active ? 0.85 : 0.28})`;
                const x = index * gap + gap / 2;
                const radius = Math.min(2, gap / 3);
                if (typeof context.roundRect === 'function') {
                    context.beginPath();
                    context.roundRect(x - 1.5, (height - barHeight) / 2, 3, barHeight, radius);
                    context.fill();
                } else {
                    context.fillRect(x - 1.5, (height - barHeight) / 2, 3, barHeight);
                }
            }

            frameRef.current = requestAnimationFrame(draw);
        };

        draw();
        if (reduceMotion && frameRef.current !== null) cancelAnimationFrame(frameRef.current);
        return () => {
            if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
        };
    }, [active, analyser]);

    return <canvas ref={canvasRef} className="h-16 w-full" aria-hidden="true" />;
}
