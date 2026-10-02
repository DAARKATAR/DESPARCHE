import { Wall, Door, Barricade, WallBuy, PerkMachine, MysteryBoxLocation, PackAPunchMachine, AltarDef } from '../types/game';

export interface MapData {
  name: string;
  width: number;
  height: number;
  playerSpawn: { x: number; y: number };
  walls: Wall[];
  doors: Door[];
  barricades: Barricade[];
  wallBuys: WallBuy[];
  perkMachines: PerkMachine[];
  mysteryBoxes: MysteryBoxLocation[];
  altars: AltarDef[];
  packAPunch: PackAPunchMachine;
  powerSwitch: { x: number; y: number; isOn: boolean };
  electricTrap: { x: number; y: number; w: number; h: number; cost: number; activeTime: number; isActive: boolean };
  outdoorSpawns: { x: number; y: number }[];
}

export function createBunkerMap(): MapData {
  // Map dimensions: 2000 x 1800
  // Wall thickness: 24px

  // BARRICADES (Windows where zombies enter):
  // 1. Spawn Room West Window (x: 200, y: 1120, w: 24, h: 90)
  // 2. Spawn Room South Window (x: 350, y: 1560, w: 90, h: 24)
  // 3. Courtyard West Window (x: 100, y: 400, w: 24, h: 90)
  // 4. Courtyard North Window (x: 550, y: 100, w: 90, h: 24)
  // 5. Power Room East Window (x: 1876, y: 1200, w: 24, h: 90)
  // 6. Laboratory North Window (x: 1400, y: 100, w: 90, h: 24)

  const barricades: Barricade[] = [
    // Spawn Room West Window
    {
      id: 'barricade_spawn_west',
      roomId: 'spawn',
      x: 200,
      y: 1120,
      w: 24,
      h: 90,
      planks: 6,
      maxPlanks: 6,
      repairing: false,
      facing: 'left',
      spawnPoint: { x: 120, y: 1165 }
    },
    // Spawn Room South Window
    {
      id: 'barricade_spawn_south',
      roomId: 'spawn',
      x: 350,
      y: 1560,
      w: 90,
      h: 24,
      planks: 6,
      maxPlanks: 6,
      repairing: false,
      facing: 'bottom',
      spawnPoint: { x: 395, y: 1650 }
    },
    // Courtyard West Window
    {
      id: 'barricade_court_west',
      roomId: 'courtyard',
      x: 100,
      y: 400,
      w: 24,
      h: 90,
      planks: 6,
      maxPlanks: 6,
      repairing: false,
      facing: 'left',
      spawnPoint: { x: 30, y: 445 }
    },
    // Courtyard North Window
    {
      id: 'barricade_court_north',
      roomId: 'courtyard',
      x: 550,
      y: 100,
      w: 90,
      h: 24,
      planks: 6,
      maxPlanks: 6,
      repairing: false,
      facing: 'top',
      spawnPoint: { x: 595, y: 30 }
    },
    // Power Room East Window
    {
      id: 'barricade_power_east',
      roomId: 'power',
      x: 1876,
      y: 1200,
      w: 24,
      h: 90,
      planks: 6,
      maxPlanks: 6,
      repairing: false,
      facing: 'right',
      spawnPoint: { x: 1950, y: 1245 }
    },
    // Laboratory North Window (Pack-a-Punch Sanctuary)
    {
      id: 'barricade_lab_north',
      roomId: 'laboratory',
      x: 1400,
      y: 100,
      w: 90,
      h: 24,
      planks: 6,
      maxPlanks: 6,
      repairing: false,
      facing: 'top',
      spawnPoint: { x: 1445, y: 30 }
    }
  ];

  // DOORS
  const doors: Door[] = [
    // Door 1: Spawn -> Courtyard (x: 450..570, y: 950)
    {
      id: 'door_spawn_courtyard',
      name: 'Puerta al Patio Central',
      x: 450,
      y: 950,
      w: 120,
      h: 24,
      cost: 750,
      isOpen: false,
      roomA: 'spawn',
      roomB: 'courtyard'
    },
    // Door 2: Spawn -> Power Room (x: 820, y: 1200..1320)
    {
      id: 'door_spawn_power',
      name: 'Puerta a la Central Eléctrica',
      x: 820,
      y: 1200,
      w: 24,
      h: 120,
      cost: 1000,
      isOpen: false,
      roomA: 'spawn',
      roomB: 'power'
    },
    // Door 3: Courtyard -> Laboratory (x: 1050, y: 480..600)
    {
      id: 'door_courtyard_lab',
      name: 'Puerta del Laboratorio 115',
      x: 1050,
      y: 480,
      w: 24,
      h: 120,
      cost: 1250,
      isOpen: false,
      roomA: 'courtyard',
      roomB: 'laboratory'
    },
    // Door 4: Power Room <-> Laboratory (x: 1450..1570, y: 950)
    {
      id: 'door_power_lab',
      name: 'Compuerta Criogénica',
      x: 1450,
      y: 950,
      w: 120,
      h: 24,
      cost: 1250,
      isOpen: false,
      roomA: 'power',
      roomB: 'laboratory'
    }
  ];

  // WALLS: Cut walls so openings match Barricades & Doors exactly!
  const walls: Wall[] = [
    // --- Top Outer Wall (y: 100) ---
    // Has Courtyard Window at x: 550..640, Lab Window at x: 1400..1490
    { x: 100, y: 100, w: 450, h: 24, isSolid: true },
    { x: 640, y: 100, w: 760, h: 24, isSolid: true },
    { x: 1490, y: 100, w: 410, h: 24, isSolid: true },

    // --- Bottom Outer Wall (y: 1560-1584) ---
    // Spawn South Window is at x: 350..440
    { x: 200, y: 1560, w: 150, h: 24, isSolid: true },
    { x: 440, y: 1560, w: 1460, h: 24, isSolid: true },

    // --- Left Outer Wall (x: 100) ---
    // Courtyard West Window is at y: 400..490
    { x: 100, y: 100, w: 24, h: 300, isSolid: true },
    { x: 100, y: 490, w: 24, h: 484, isSolid: true },

    // Left wall from Courtyard into Spawn:
    { x: 100, y: 950, w: 124, h: 24, isSolid: true },

    // --- Spawn Room West Wall (x: 200) ---
    // Has Spawn West Window at y: 1120..1210
    { x: 200, y: 950, w: 24, h: 170, isSolid: true },
    { x: 200, y: 1210, w: 24, h: 374, isSolid: true },

    // --- Right Outer Wall (x: 1876-1900) ---
    // Has Power East Window at y: 1200..1290
    { x: 1876, y: 100, w: 24, h: 1100, isSolid: true },
    { x: 1876, y: 1290, w: 24, h: 294, isSolid: true },

    // --- Spawn Room North Wall (y: 950) ---
    // Has Door to Courtyard at x: 450..570
    { x: 200, y: 950, w: 250, h: 24, isSolid: true },
    { x: 570, y: 950, w: 250, h: 24, isSolid: true },

    // --- Spawn Room East Wall (x: 820) ---
    // Has Door to Power at y: 1200..1320
    { x: 820, y: 950, w: 24, h: 250, isSolid: true },
    { x: 820, y: 1320, w: 24, h: 264, isSolid: true },

    // --- Courtyard East Wall (x: 1050) ---
    // Separates Courtyard from Lab, has Door at y: 480..600
    { x: 1050, y: 100, w: 24, h: 380, isSolid: true },
    { x: 1050, y: 600, w: 24, h: 374, isSolid: true },

    // --- Lab South Wall / Power North Wall (y: 950, with door at x: 1450..1570) ---
    { x: 1050, y: 950, w: 400, h: 24, isSolid: true },
    { x: 1570, y: 950, w: 310, h: 24, isSolid: true },

    // --- Internal Obstacles / Pillars / Bunker Furniture ---
    // Spawn Room Pillar
    { x: 480, y: 1220, w: 45, h: 45, isSolid: true },
    // Courtyard sandbags
    { x: 450, y: 500, w: 120, h: 36, isSolid: true },
    { x: 780, y: 620, w: 36, h: 120, isSolid: true },
    // Power Generators in Power Room
    { x: 1350, y: 1150, w: 70, h: 120, isSolid: true },
    { x: 1550, y: 1150, w: 70, h: 120, isSolid: true },
    // Laboratory Relic Pillars (spacious, wide walkways)
    { x: 1240, y: 410, w: 32, h: 32, isSolid: true },
    { x: 1740, y: 410, w: 32, h: 32, isSolid: true },
  ];

  const wallBuys: WallBuy[] = [
    // Olympia in Spawn (North wall)
    { id: 'wb_olympia', weaponId: 'olympia', x: 320, y: 974, facing: 'top' },
    // Kar98k in Spawn (South wall)
    { id: 'wb_kar98k', weaponId: 'kar98k', x: 620, y: 1540, facing: 'bottom' },
    // MP40 in Courtyard (North wall)
    { id: 'wb_mp40', weaponId: 'mp40', x: 850, y: 124, facing: 'top' },
    // Trench Gun in Power Room (North wall)
    { id: 'wb_trenchgun', weaponId: 'trenchgun', x: 1200, y: 974, facing: 'top' },
  ];

  const perkMachines: PerkMachine[] = [
    // Quick Revive in Spawn Room
    { id: 'quick_revive', x: 260, y: 1460, w: 40, h: 40 },
    // Juggernog in Courtyard
    { id: 'juggernog', x: 280, y: 280, w: 40, h: 40 },
    // Speed Cola in Power Room
    { id: 'speed_cola', x: 1720, y: 1420, w: 40, h: 40 },
    // Double Tap in Laboratory
    { id: 'double_tap', x: 1180, y: 280, w: 40, h: 40 },
    // Stamin-Up in Courtyard
    { id: 'stamin_up', x: 880, y: 840, w: 40, h: 40 },
  ];

  const mysteryBoxes: MysteryBoxLocation[] = [
    // Main active box in Courtyard
    { id: 'box_courtyard', x: 550, y: 300, w: 80, h: 36, isActive: true },
    // Secondary box in Power Room
    { id: 'box_power', x: 1300, y: 1420, w: 80, h: 36, isActive: false },
    // Tertiary box in Lab
    { id: 'box_lab', x: 1700, y: 300, w: 80, h: 36, isActive: false },
  ];

  const altars: AltarDef[] = [
    // Sacred Altar (Left wing of ritual hall)
    {
      id: 'altar_sacred',
      type: 'sacred',
      name: 'Altar Sagrado',
      x: 1360,
      y: 420,
      w: 64,
      h: 64,
      isUpgrading: false,
      upgradeTimer: 0,
      depositedWeapon: null
    },
    // Cursed Altar (Right wing of ritual hall)
    {
      id: 'altar_cursed',
      type: 'cursed',
      name: 'Altar Maldito',
      x: 1620,
      y: 420,
      w: 64,
      h: 64,
      isUpgrading: false,
      upgradeTimer: 0,
      depositedWeapon: null
    }
  ];

  const packAPunch: PackAPunchMachine = {
    x: 1495,
    y: 420,
    w: 70,
    h: 50,
    isUpgrading: false,
    upgradeTimer: 0,
    depositedWeapon: null
  };

  const powerSwitch = {
    x: 1800,
    y: 1020,
    isOn: false
  };

  const electricTrap = {
    x: 450,
    y: 700,
    w: 120,
    h: 30,
    cost: 1000,
    activeTime: 0,
    isActive: false
  };

  const outdoorSpawns = [
    { x: 120, y: 1165 }, // Spawn West Window
    { x: 395, y: 1650 }, // Spawn South Window
    { x: 30, y: 445 },   // Courtyard West Window
    { x: 595, y: 30 },   // Courtyard North Window
    { x: 1950, y: 1245 },// Power East Window
    { x: 1445, y: 30 }   // Lab North Window
  ];

  return {
    name: 'Bunker 115: El Despertar',
    width: 2000,
    height: 1800,
    playerSpawn: { x: 500, y: 1300 },
    walls,
    doors,
    barricades,
    wallBuys,
    perkMachines,
    mysteryBoxes,
    altars,
    packAPunch,
    powerSwitch,
    electricTrap,
    outdoorSpawns
  };
}

export type BunkerRoom = 'spawn' | 'courtyard' | 'power' | 'laboratory';

export function getPlayerZone(x: number, y: number): BunkerRoom {
  // Spawn Room: (200..820, 950..1560)
  if (x >= 180 && x <= 830 && y >= 940 && y <= 1580) {
    return 'spawn';
  }
  // Laboratory (Pack-a-Punch Sanctuary): (1050..1876, 100..950)
  if (x >= 1040 && x <= 1900 && y >= 80 && y <= 960) {
    return 'laboratory';
  }
  // Power Room: (820..1876, 950..1560)
  if (x >= 820 && x <= 1900 && y >= 940 && y <= 1580) {
    return 'power';
  }
  // Courtyard / Central Hub: (100..1050, 100..950)
  return 'courtyard';
}

export function getNextWaypointToRoom(
  currentRoom: BunkerRoom, 
  targetRoom: BunkerRoom, 
  doors: Door[]
): { x: number; y: number } | null {
  if (currentRoom === targetRoom) return null;

  const doorSpawnCourtyard = doors.find(d => d.id === 'door_spawn_courtyard');
  const doorSpawnPower = doors.find(d => d.id === 'door_spawn_power');
  const doorCourtyardLab = doors.find(d => d.id === 'door_courtyard_lab');
  const doorPowerLab = doors.find(d => d.id === 'door_power_lab');

  // Spawn <-> Courtyard (Door at x: 450..570, y: 950)
  if (currentRoom === 'spawn' && targetRoom === 'courtyard') {
    if (doorSpawnCourtyard?.isOpen) {
      return { x: 510, y: 890 }; // 60px inside courtyard!
    }
  }
  if (currentRoom === 'courtyard' && targetRoom === 'spawn') {
    if (doorSpawnCourtyard?.isOpen) {
      return { x: 510, y: 1010 }; // 60px inside spawn!
    }
  }

  // Spawn <-> Power (Door at x: 820, y: 1200..1320)
  if (currentRoom === 'spawn' && targetRoom === 'power') {
    if (doorSpawnPower?.isOpen) {
      return { x: 880, y: 1260 }; // 60px inside power room!
    }
  }
  if (currentRoom === 'power' && targetRoom === 'spawn') {
    if (doorSpawnPower?.isOpen) {
      return { x: 760, y: 1260 }; // 60px inside spawn room!
    }
  }

  // Courtyard <-> Laboratory (Door at x: 1050, y: 480..600)
  if (currentRoom === 'courtyard' && targetRoom === 'laboratory') {
    if (doorCourtyardLab?.isOpen) {
      return { x: 1110, y: 540 }; // 60px inside lab!
    }
  }
  if (currentRoom === 'laboratory' && targetRoom === 'courtyard') {
    if (doorCourtyardLab?.isOpen) {
      return { x: 990, y: 540 }; // 60px inside courtyard!
    }
  }

  // Power <-> Laboratory direct link (Door at x: 1450..1570, y: 950)
  if (currentRoom === 'power' && targetRoom === 'laboratory') {
    if (doorPowerLab?.isOpen) {
      return { x: 1510, y: 890 }; // inside lab
    }
    if (doorSpawnPower?.isOpen) {
      return { x: 760, y: 1260 }; // via spawn
    }
  }
  if (currentRoom === 'laboratory' && targetRoom === 'power') {
    if (doorPowerLab?.isOpen) {
      return { x: 1510, y: 1010 }; // inside power
    }
    if (doorCourtyardLab?.isOpen) {
      return { x: 990, y: 540 }; // via courtyard
    }
  }

  // Multi-hop routes:
  // Spawn -> Laboratory (via Courtyard)
  if (currentRoom === 'spawn' && targetRoom === 'laboratory') {
    if (doorSpawnCourtyard?.isOpen) {
      return { x: 510, y: 890 };
    }
  }
  // Laboratory -> Spawn (via Courtyard)
  if (currentRoom === 'laboratory' && targetRoom === 'spawn') {
    if (doorCourtyardLab?.isOpen) {
      return { x: 990, y: 540 };
    }
  }

  // Courtyard -> Power (via Spawn)
  if (currentRoom === 'courtyard' && targetRoom === 'power') {
    if (doorSpawnCourtyard?.isOpen) {
      return { x: 510, y: 1010 };
    }
  }
  // Power -> Courtyard (via Spawn)
  if (currentRoom === 'power' && targetRoom === 'courtyard') {
    if (doorSpawnPower?.isOpen) {
      return { x: 760, y: 1260 };
    }
  }

  // Power -> Laboratory (via Spawn -> Courtyard)
  if (currentRoom === 'power' && targetRoom === 'laboratory') {
    if (doorSpawnPower?.isOpen) {
      return { x: 760, y: 1260 };
    }
  }
  // Laboratory -> Power (via Courtyard -> Spawn)
  if (currentRoom === 'laboratory' && targetRoom === 'power') {
    if (doorCourtyardLab?.isOpen) {
      return { x: 990, y: 540 };
    }
  }

  return null;
}

