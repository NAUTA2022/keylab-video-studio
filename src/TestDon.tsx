import React from 'react';
import { AbsoluteFill } from 'remotion';
import { DonExcusas } from './svg/DonExcusas';
import { Inversor } from './svg/Inversor';
export const TestDon: React.FC = () => (
  <AbsoluteFill style={{ background: '#E86A5C' }}>
    <DonExcusas height={760} pose="stand" talk={0.6} smug={0.7} style={{ left: 10, top: 60 }} />
    <DonExcusas height={760} pose="run" phase={1.2} style={{ left: 520, top: 60 }} />
    <Inversor height={760} mood="shock" shout={0.4} style={{ left: 10, top: 1000 }} />
    <Inversor height={760} mood="angry" rage={1} shout={0.8} frame={4} style={{ left: 520, top: 1000 }} />
  </AbsoluteFill>
);
