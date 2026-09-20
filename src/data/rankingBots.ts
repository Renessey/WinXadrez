export interface InitialBotPlayer {
  name: string;
  points: number;
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  tier: string;
}

const FIRST_NAMES = [
  // Nomes populares reais masculinos e femininos (sem sobrenome)
  'Lucas', 'Gabriel', 'Arthur', 'Matheus', 'Bernardo', 'Heitor', 'Davi', 'Lorenzo', 'Theo', 'Pedro',
  'Felipe', 'Enzo', 'Gustavo', 'Guilherme', 'Nicolas', 'Samuel', 'Henrique', 'Rafael', 'Lucca', 'Murilo',
  'Vitor', 'Eduardo', 'Joaquim', 'Isaac', 'Thiago', 'Vinicius', 'Leonardo', 'Benicio', 'Caio', 'Bryan',
  'Danilo', 'Breno', 'Cauã', 'Igor', 'Otavio', 'Emanuel', 'Francisco', 'Kaique', 'Yuri', 'Bruno',
  'Rodrigo', 'Fernando', 'Alexandre', 'Diego', 'Marcelo', 'Carlos', 'Andre', 'Fabio', 'Renan', 'Daniel',
  'Marcos', 'Wesley', 'Douglas', 'Alan', 'Erick', 'Leandro', 'Everton', 'Robson', 'Julio', 'Cesar',
  'Willian', 'Marcio', 'Wagner', 'Anderson', 'Helena', 'Alice', 'Laura', 'Manuela', 'Sophia', 'Isabella',
  'Luiza', 'Heloisa', 'Cecilia', 'Maitê', 'Eloah', 'Lorena', 'Livia', 'Maria', 'Beatriz', 'Mariana',
  'Lara', 'Julia', 'Isadora', 'Melissa', 'Yasmin', 'Ana', 'Isabelly', 'Clara', 'Marina', 'Camila',
  'Fernanda', 'Amanda', 'Bruna', 'Larissa', 'Leticia', 'Carolina', 'Gabriela', 'Bianca', 'Vanessa', 'Jessica',
  'Natalia', 'Debora', 'Tatiane', 'Patricia', 'Renata', 'Priscila', 'Sabrina', 'Thais', 'Aline', 'Flavia',
  'Daniela', 'Raquel', 'Vivian', 'Joana', 'Cristiano', 'Lionel', 'Magnus', 'Garry', 'Hikaru', 'Anand',
  'Fabiano', 'Levon', 'Ding', 'Alireza', 'WesleySo', 'Maxime', 'Ian', 'Nodirbek', 'Gukesh', 'Pragg'
];

const NICKS = [
  // Nicks gamer e xadrez autênticos (sem sobrenome)
  'Vortex', 'Shadow', 'Phantom', 'Blitz', 'Raptor', 'Titan', 'Frost', 'Nova', 'Ghost', 'Nexus',
  'Zen', 'Blade', 'Echo', 'Pulse', 'Apex', 'Orion', 'Kronos', 'Maverick', 'Hunter', 'Venom',
  'Storm', 'Spark', 'Knight', 'Rogue', 'Bishop', 'Rook', 'Cyber', 'Matrix', 'Phoenix', 'Valkyrie',
  'Striker', 'Nomad', 'Havoc', 'Specter', 'Viper', 'Razor', 'Flash', 'Thunder', 'IronClad', 'Steel',
  'Glitch', 'Cosmo', 'Aero', 'Zephyr', 'Tempest', 'Eclipse', 'Sol', 'Lumen', 'Hydra', 'Kraken',
  'Goliath', 'Colossus', 'Dragon', 'Inferno', 'Blaze', 'Ignis', 'Pyro', 'Magma', 'Obsidian', 'Onyx',
  'Crystal', 'Diamond', 'Sapphire', 'Emerald', 'Ruby', 'Topaz', 'Cobalt', 'Titanium', 'Neon', 'Quantum',
  'Vector', 'Pixel', 'Binary', 'Alpha', 'Omega', 'Delta', 'Sigma', 'Prime', 'Zero', 'Cipher',
  'Rune', 'Mystic', 'Oracle', 'Prophet', 'Sentry', 'Warden', 'Paladin', 'Samurai', 'Ninja', 'Ronin',
  'Spartan', 'Viking', 'Gladiator', 'Centurion', 'Champion', 'Monarch', 'Checkmate', 'Gambito', 'Fianchetto', 'EnPassant'
];

const MODIFIERS = [
  '', '_Pro', 'X', '_7', '99', '_BR', '_Z', '77', '_01', '88',
  '_Master', '07', '_00', '10', '21', '007', '_Dark', '_King', 'Top', '_Fox'
];

/**
 * Gera determinística e estavelmente 1000 bots únicos com nomes reais ou nicks sem sobrenome
 * e pontuações decrescentes distribuídas de 2950 até 45 pontos.
 */
export function generate1000RankingBots(): InitialBotPlayer[] {
  const generatedNames = new Set<string>();
  const nameList: string[] = [];

  // 1. Gera lista com nomes puros
  for (const nick of NICKS) {
    if (!generatedNames.has(nick)) {
      generatedNames.add(nick);
      nameList.push(nick);
    }
  }

  for (const name of FIRST_NAMES) {
    if (!generatedNames.has(name)) {
      generatedNames.add(name);
      nameList.push(name);
    }
  }

  // 2. Combina com modificadores comuns de nick até completar 1000
  let modIndex = 1;
  while (nameList.length < 1000 && modIndex < MODIFIERS.length) {
    const mod = MODIFIERS[modIndex];
    for (const base of NICKS) {
      const candidate = `${base}${mod}`;
      if (!generatedNames.has(candidate)) {
        generatedNames.add(candidate);
        nameList.push(candidate);
        if (nameList.length >= 1000) break;
      }
    }
    if (nameList.length >= 1000) break;

    for (const base of FIRST_NAMES) {
      const candidate = `${base}${mod}`;
      if (!generatedNames.has(candidate)) {
        generatedNames.add(candidate);
        nameList.push(candidate);
        if (nameList.length >= 1000) break;
      }
    }
    modIndex++;
  }

  // Fallback caso ainda falte algum para 1000
  let seq = 1;
  while (nameList.length < 1000) {
    const candidate = `Jogador_${seq}`;
    if (!generatedNames.has(candidate)) {
      generatedNames.add(candidate);
      nameList.push(candidate);
    }
    seq++;
  }

  // 3. Todos os 1000 jogadores começam exatamente com 0 pontos conforme solicitado
  const bots: InitialBotPlayer[] = [];

  for (let i = 0; i < 1000; i++) {
    const name = nameList[i];
    bots.push({
      name,
      points: 0,
      matches: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      tier: 'Iniciante',
    });
  }

  return bots;
}
