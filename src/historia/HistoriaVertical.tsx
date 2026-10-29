import React from 'react';
import { AbsoluteFill, Audio, staticFile } from 'remotion';
import {
  BG, INK, MUTED, SOFT, Backdrop, BigLogo, Chip, Floor, Growth, Horizon, Label, Network, Outro, Person, Pillar, Stroke, Voxel, Words, type Kind,
} from './Historia';
import { PlataformaReal } from './Marketplace';

// Historia de Key Lab · versión vertical 1080x1920 (mismos tiempos, voz y música que la horizontal).
// Texto en columna de 920 px; personas abajo; nada pegado a los bordes.

const TX = 80, TW = 920; // columna de texto

export const HistoriaVertical: React.FC = () => (
  <AbsoluteFill style={{ background: BG, overflow: 'hidden' }}>
    <Backdrop />
    <Audio src={staticFile('media/historia-keylab/historia-keylab-voz-musica.mp3')} />

    {/* 01 · ORIGEN */}
    <Voxel at={0.4} until={5.1} cx={540} cy={640} s={120} />
    <Words text="Todo empezó en una empresa de videojuegos" at={0.3} until={5.1} size={60} y={860} width={TW} />
    <Words text="que construía en The Sandbox." at={2.7} until={5.1} size={44} y={1060} width={TW} color={SOFT} />
    <Floor at={5.4} until={18.9} y={1280} w={940} />
    <Person kind="ulises" at={5.6} until={18.9} x={290} y={1280} h={340} dim={[[14.6, 18.9]]} />
    <Person kind="sebas" at={5.9} until={18.9} x={790} y={1280} h={340} dim={[[11.3, 14.6]]} />
    <Stroke d="M540 880 L540 1280" at={9.3} until={18.9} len={400} color="rgba(255,255,255,0.35)" width={1.5} />
    <Words text="Dos personas." at={5.5} until={9.2} size={64} y={520} width={TW} />
    <Words text="Cada uno en su área." at={9.3} until={11.2} size={64} y={520} width={TW} />
    <Label text="Ulises" at={11.4} until={18.9} x={290} y={1310} color={INK} size={34} />
    <Label text="Diseño · Creatividad" at={11.9} until={18.9} x={290} y={1366} color={SOFT} size={20} />
    <Label text="Sebastián" at={14.7} until={18.9} x={790} y={1310} color={INK} size={34} />
    <Label text="Tecnología · Desarrollo" at={15.7} until={18.9} x={790} y={1366} color={SOFT} size={20} />

    {/* 02 · CRECER */}
    <Words text="Pronto, los dos empezaron a crecer." at={19.2} until={25.7} size={70} y={360} width={TW} align="left" x={TX} />
    <Words text="Proyectos más grandes." at={22.1} until={25.7} size={44} y={640} width={TW} align="left" x={TX} color={MUTED} weight={600} />
    <Words text="Más responsabilidad." at={23.8} until={25.7} size={44} y={710} width={TW} align="left" x={TX} color={MUTED} weight={600} />
    <Growth at={19.2} until={25.7} left={357} bottom={460} />
    <Floor at={25.9} until={36.3} y={1340} w={980} />
    <Person kind="ulises" at={25.9} until={36.3} x={220} y={1340} h={270} />
    <Stroke d="M540 990 C430 970 300 1000 230 1060" at={33.8} until={36.3} len={500} />
    <Stroke d="M540 990 C650 970 780 1000 850 1060" at={33.8} until={36.3} len={500} />
    <Person kind="race" at={26.9} until={36.3} x={540} y={1340} h={420} glow />
    <Person kind="sebas" at={26.1} until={36.3} x={860} y={1340} h={270} />
    <Label text="Race" at={27.0} until={36.3} x={540} y={1372} color={INK} size={34} />
    <Words text="La primera oportunidad real de surgir." at={28.6} until={32.0} size={58} y={420} width={TW} />
    <Words text="El mentor de ambos." at={33.7} until={36.3} size={66} y={460} width={TW} weight={800} />

    {/* 03 · PRIMER CONTACTO */}
    <Words text="Llegaron colaboraciones con otras empresas." at={36.6} until={41.34} size={62} y={820} width={TW} />
    <Words text="Crypto Depto" at={41.55} until={52.44} font="display" size={130} y={380} width={TW} />
    <Floor at={43.24} until={52.44} y={1240} w={600} />
    <Person kind="matias" at={43.44} until={52.44} x={540} y={1240} h={400} />
    <Label text="Matías" at={43.84} until={52.44} x={540} y={1272} color={INK} size={30} />
    <Words text="Tokenización de activos reales" at={45.94} until={52.44} size={48} y={1350} width={TW} color={SOFT} />
    <Words text="El primer contacto." at={49.54} until={52.44} size={38} y={1520} width={TW} color={MUTED} weight={600} />

    {/* 04 · APRENDER */}
    <Floor at={52.64} until={77.14} y={1500} w={800} />
    <Person kind="ulises" at={52.74} until={77.14} x={540} y={1500} h={480} />
    <Words text="Ulises se metió de lleno en la teoría." at={52.84} until={70.84} size={58} y={200} width={TW} align="left" x={TX} />
    <Chip text="RWA" at={55.74} until={70.84} x={TX} y={440} />
    <Chip text="DEX / CEX" at={58.64} until={70.84} x={270} y={440} />
    <Chip text="Tokenomics" at={63.94} until={70.84} x={TX} y={540} />
    <Chip text="Vesting" at={66.14} until={70.84} x={440} y={540} />
    <Chip text="ICO" at={68.14} until={70.84} x={710} y={540} accent />
    <Words text="Y en la práctica:" at={71.04} until={77.14} size={48} y={220} width={TW} align="left" x={TX} color={MUTED} weight={600} />
    <Words text="codo a codo con desarrolladores blockchain." at={72.54} until={77.14} size={62} y={310} width={TW} align="left" x={TX} weight={800} />
    <Floor at={77.24} until={89.94} y={1500} w={800} />
    <Person kind="sebas" at={77.34} until={89.94} x={540} y={1500} h={480} />
    <Words text="Sebastián dominó las integraciones y el desarrollo blockchain." at={77.44} until={89.94} size={56} y={170} width={TW} align="left" x={TX} />
    <Chip text="Integraciones" at={79.24} until={89.94} x={TX} y={470} />
    <Chip text="ERC-3643" at={84.84} until={89.94} x={TX} y={570} accent />
    <Chip text="Polygon" at={87.94} until={89.94} x={400} y={570} />
    <Chip text="BNB Chain" at={89.04} until={89.94} x={TX} y={670} />

    {/* 05 · VULCANO */}
    <Words text="Vulcano" at={92.04} until={107.04} font="display" size={160} y={330} width={TW} />
    <Floor at={92.24} until={107.04} y={1300} w={860} />
    <Person kind="a" at={92.34} until={107.14} x={440} y={1300} h={400} dx={[102.04, 104.84, -230]} />
    <Person kind="b" at={92.64} until={107.14} x={640} y={1300} h={400} dx={[102.04, 104.84, 230]} />
    <Label text="Dos amigos" at={94.14} until={101.84} x={540} y={1336} color={INK} size={26} />
    <Label text="Tokenización y plataformas a medida" at={94.6} until={101.84} x={540} y={1386} color={SOFT} size={18} />
    <Words text="Proyectos juntos." at={100.24} until={101.94} size={50} y={1460} width={TW} color={MUTED} weight={600} />
    <Words text="Caminos distintos." at={102.24} until={107.04} size={58} y={1460} width={TW} />

    {/* 06 · ALGO PROPIO */}
    <Horizon at={107.51} until={124.91} />
    <Floor at={107.61} until={124.81} y={1400} w={940} />
    <Person kind="ulises" at={107.81} until={124.81} x={300} y={1400} h={430} />
    <Person kind="sebas" at={108.01} until={124.81} x={780} y={1400} h={430} />
    <Words text="Y empezaron algo propio." at={110.81} until={117.51} size={78} y={300} width={TW} weight={800} />
    <Words text="Construir el futuro junto a sus clientes." at={113.61} until={117.51} size={46} y={540} width={TW} color={SOFT} />
    <Words text="Valores accesibles. La puerta del mercado abierta a más gente." at={117.91} until={124.81} size={54} y={280} width={TW} />
    <Words text="Y evolucionar todos los días." at={122.61} until={124.81} size={46} y={560} width={TW} color={SOFT} />

    {/* 07 · LA DECISIÓN */}
    <Words text="Blockenfy" at={127.93} until={140.0} font="display" size={150} y={330} width={TW} />
    <Person kind="c" at={128.25} until={137.03} x={540} y={1400} h={430} />
    <Label text="Blockenfy" at={128.73} until={137.03} x={540} y={1432} color={SOFT} size={22} />
    <Words text="Mejoras en diseño y funciones." at={134.1} until={140.0} size={48} y={600} width={TW} color={MUTED} weight={600} />
    <Stroke d="M180 1120 C330 1120 420 1120 540 1120 C640 1120 700 1020 900 960" at={137.1} until={140.0} len={800} color={INK} />
    <Stroke d="M540 1120 C640 1120 700 1220 900 1280" at={137.1} until={140.0} len={500} color={SOFT} />
    <Label text="Visiones distintas" at={137.3} until={140.0} x={540} y={1360} color={INK} size={26} />
    <Words text="Key Lab representaba algo más." at={140.21} until={154.67} size={74} y={320} width={TW} weight={800} />
    {[['Calidad visual', 143.56], ['Calidad funcional', 144.86], ['Tokenización abierta', 146.36]].map(([txt, at], i) => (
      <Pillar key={i} text={txt as string} at={at as number} until={154.67} x={TX + 40} row={{ y: 700 + i * 130 }} accent={i === 2} />
    ))}
    <Words text="Para que el mercado crezca." at={148.26} until={150.66} size={46} y={1250} width={TW} color={SOFT} />
    <Words text="En esa empresa no iban a conseguirlo." at={150.76} until={154.67} size={54} y={1250} width={TW} weight={800} />

    {/* 08 · KEY LAB */}
    <Words text="Por eso hicieron evolucionar su empresa." at={154.87} until={158.97} size={64} y={820} width={TW} />
    <BigLogo at={159.07} until={167.57} x={210} y={230} />
    {(['a', 'b', 'c', 'matias'] as Kind[]).map((k, i) => (
      <Person key={i} kind={k} at={160.17 + i * 0.25} until={180.37} x={180 + i * 240} y={1640} h={210} />
    ))}
    {[['Diseño', 161.47], ['UX / UI', 162.67], ['Producto', 165.47], ['Blockchain', 167.17]].map(([txt, at], i) => (
      <Label key={i} text={txt as string} at={at as number} until={180.37} x={180 + i * 240} y={1664} color={i === 3 ? SOFT : INK} size={18} />
    ))}
    <Words text="Una plataforma tokenizadora white label." at={167.77} until={180.37} size={56} y={170} weight={800} align="left" x={TX} width={TW} />
    <Chip text="Calidad AAA" at={173.87} until={180.37} x={TX} y={370} accent />
    <Chip text="Valor alcanzable" at={175.67} until={180.37} x={420} y={370} />
    <PlataformaReal at={162.56} until={180.37} x={540} y={880} width={940} shots={[
      { img: 'p014-013', label: 'Marketplace con tu marca', at: 162.56, zoom: [1.0, 1.045], pan: [[0.5, 0.35], [0.5, 0.5]] },
      { img: 'p013-012', label: 'Detalle del proyecto', at: 166.3, zoom: [1.0, 1.045], pan: [[0.5, 0.35], [0.5, 0.5]] },
      { img: 'p011-010', label: 'Registro e ingreso', at: 169.6, zoom: [1.0, 1.045], pan: [[0.5, 0.35], [0.5, 0.5]] },
      { img: 'p012-011', label: 'Dashboard del inversionista', at: 172.4, zoom: [1.0, 1.045], pan: [[0.5, 0.35], [0.5, 0.5]] },
      { img: 'p015-014', label: 'Mis pertenencias', at: 175.2, zoom: [1.0, 1.045], pan: [[0.5, 0.35], [0.5, 0.5]] },
      { img: 'p016-015', label: 'Perfil del inversionista', at: 177.8, zoom: [1.0, 1.045], pan: [[0.5, 0.35], [0.5, 0.5]] },
    ]} />

    {/* 09 · HOY */}
    <Words text="Hoy" at={180.67} until={191.07} font="display" size={200} y={300} width={TW} />
    <Network at={181.17} until={191.07} cx={540} cy={960} k={0.85} />
    <Words text="Alianzas con firmas legales y del sector." at={181.47} until={185.77} size={54} y={1300} width={TW} />
    <Words text="Negocios que crecen." at={185.87} until={189.47} size={54} y={1300} width={TW} />
    <Words text="Plataformas que de verdad valen la pena." at={189.57} until={191.07} size={54} y={1300} width={TW} weight={800} />

    {/* 10 · CIERRE */}
    <Words text="Key Lab no es el primero." at={192.47} until={199.77} size={84} y={640} width={TW} weight={800} />
    <Words text="Es el que se sentó a entender lo que el mercado necesita." at={195.17} until={199.77} size={50} y={920} width={TW} color={SOFT} />
    <Floor at={200.17} until={203.67} y={1340} w={1000} />
    {(['ulises', 'a', 'race', 'b', 'c', 'matias', 'sebas'] as Kind[]).map((k, i) => (
      <Person key={i} kind={k} at={200.17 + i * 0.12} until={203.67} x={120 + i * 140} y={1340} h={200} />
    ))}
    <Words text="Codo a codo con sus clientes." at={201.07} until={203.67} size={68} y={700} width={TW} weight={800} />
    <Words text="Key Lab es el futuro." at={203.87} until={205.88} font="display" size={150} y={760} width={TW} />
    <Outro at={205.88} />
  </AbsoluteFill>
);
