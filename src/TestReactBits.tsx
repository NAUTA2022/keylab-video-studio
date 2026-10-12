import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { ClockDriver } from './clock/ClockDriver';
import CrystalizedBall from './reactbits/CrystalizedBall';
import PatternWaves from './reactbits/PatternWaves';
import MicroSlats from './reactbits/MicroSlats';
import ElectricLogo from './reactbits/ElectricLogo';
import TechText from './reactbits/TechText';
import { LiquidChrome } from './reactbits/LiquidChrome';

const Full: React.FC<{ children: React.ReactNode; bg?: string }> = ({ children, bg = '#0D0E11' }) => (
  <AbsoluteFill style={{ background: bg }}>
    <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
  </AbsoluteFill>
);

export const TestReactBits: React.FC = () => (
  <AbsoluteFill style={{ background: '#0D0E11' }}>
    <ClockDriver />
    <Sequence durationInFrames={60}><Full><CrystalizedBall color="#2D52FF" /></Full></Sequence>
    <Sequence from={60} durationInFrames={60}><Full><PatternWaves color="#2D52FF" backgroundColor="#0D0E11" /></Full></Sequence>
    <Sequence from={120} durationInFrames={60}><Full><MicroSlats color="#2D52FF" glintColor="#8CA0FF" backgroundColor="#0D0E11" /></Full></Sequence>
    <Sequence from={180} durationInFrames={60}><Full><ElectricLogo color="#8CA0FF" glowColor="#2D52FF" /></Full></Sequence>
    <Sequence from={240} durationInFrames={60}><Full><div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TechText text="Key Lab" fontFamily="Anton" fontSize={220} color="#FFFFFF" accentColor="#2D52FF" /></div></Full></Sequence>
    <Sequence from={300} durationInFrames={60}><Full><LiquidChrome baseColor={[0.05, 0.1, 0.5]} /></Full></Sequence>
  </AbsoluteFill>
);
