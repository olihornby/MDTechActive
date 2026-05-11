const express = require('express');
const router = express.Router();
const GameRoom = require('../models/GameRoom');
const Player = require('../models/Player');

const USE_MEMORY_STORE = !process.env.MONGO_URI;
const memoryRooms = new Map();
const memoryPlayers = new Map();
const oneOnOneRooms = new Map();
const ROOM_SHUTDOWN_GRACE_MS = 45000;

const ONE_ON_ONE_DAMAGE = 20;
const ONE_ON_ONE_WIN_SCORE = 150;
const ONE_ON_ONE_QUESTIONS = [
  {
    id: 'duel-1',
    prompt: 'Which language runs in the browser?',
    options: ['JavaScript', 'TypeScript', 'PHP', 'Python'],
    answer: 'JavaScript',
  },
  {
    id: 'duel-2',
    prompt: 'What does CPU stand for?',
    options: ['Central Processing Unit', 'Central Program Utility', 'Computer Processing Unit', 'Core Processing Utility'],
    answer: 'Central Processing Unit',
  },
  {
    id: 'duel-3',
    prompt: 'Which role usually tests software for bugs?',
    options: ['QA Engineer', 'Release Manager', 'Product Owner', 'UX Researcher'],
    answer: 'QA Engineer',
  },
  {
    id: 'duel-4',
    prompt: 'Which tool tracks code versions?',
    options: ['Git', 'GitHub Pages', 'Jira', 'Postman'],
    answer: 'Git',
  },
  {
    id: 'duel-5',
    prompt: 'Which storage keeps data after power is off?',
    options: ['SSD', 'RAM', 'CPU Cache', 'Register'],
    answer: 'SSD',
  },
  {
    id: 'duel-6',
    prompt: 'Which HTTP method is commonly used to partially update a resource?',
    options: ['PATCH', 'PUT', 'POST', 'GET'],
    answer: 'PATCH',
  },
  {
    id: 'duel-7',
    prompt: 'Which status code usually means "Unauthorized"?',
    options: ['401', '403', '404', '400'],
    answer: '401',
  },
  {
    id: 'duel-8',
    prompt: 'Which command fetches and merges remote changes in Git? (single word)',
    options: ['pull', 'fetch', 'push', 'clone'],
    answer: 'pull',
  },
  {
    id: 'duel-9',
    prompt: 'Which acronym refers to protecting data in transit?',
    options: ['TLS', 'CSS', 'SQL', 'RAM'],
    answer: 'TLS',
  },
  {
    id: 'duel-10',
    prompt: 'Which role is most responsible for defining sprint priorities?',
    options: ['Product Manager', 'QA Engineer', 'SRE', 'Security Analyst'],
    answer: 'Product Manager',
  },
  {
    id: 'duel-11',
    prompt: 'Which layer is closest to end users in a typical web app?',
    options: ['Frontend', 'Database', 'Infrastructure', 'Message Queue'],
    answer: 'Frontend',
  },
  {
    id: 'duel-12',
    prompt: 'Which file commonly defines Node.js project dependencies?',
    options: ['package.json', 'vite.config.js', '.env', 'README.md'],
    answer: 'package.json',
  },
  {
    id: 'duel-13',
    prompt: 'Which metric measures request delay over time?',
    options: ['Latency', 'Throughput', 'Uptime', 'Error budget'],
    answer: 'Latency',
  },
  {
    id: 'duel-14',
    prompt: 'Which testing type validates full user flows in a browser?',
    options: ['End-to-end testing', 'Unit testing', 'Linting', 'Type checking'],
    answer: 'End-to-end testing',
  },
  {
    id: 'duel-15',
    prompt: 'Which database index benefit is most accurate?',
    options: ['Faster reads on indexed queries', 'Automatic schema design', 'Guaranteed zero write cost', 'Always smaller storage use'],
    answer: 'Faster reads on indexed queries',
  },
  {
    id: 'duel-16',
    prompt: 'Which practice reduces deployment risk by gradual exposure?',
    options: ['Feature flags', 'Force pushing to main', 'Skipping code review', 'Disabling monitoring'],
    answer: 'Feature flags',
  },
  {
    id: 'duel-17',
    prompt: 'Which term means a server can handle more users by adding machines?',
    options: ['Horizontal scaling', 'Vertical scaling', 'Rate limiting', 'Data normalization'],
    answer: 'Horizontal scaling',
  },
  {
    id: 'duel-18',
    prompt: 'Which response code category indicates server errors?',
    options: ['5xx', '4xx', '3xx', '2xx'],
    answer: '5xx',
  },
  {
    id: 'duel-19',
    prompt: 'Which role is primarily focused on incident response reliability?',
    options: ['SRE', 'Technical Writer', 'UX Designer', 'Scrum Master'],
    answer: 'SRE',
  },
  {
    id: 'duel-20',
    prompt: 'Which security principle gives users only the access they need?',
    options: ['Least privilege', 'Open by default', 'Shared root account', 'Security through obscurity'],
    answer: 'Least privilege',
  },
  {
    id: 'duel-21',
    prompt: 'Which header is required for most JSON API POST bodies?',
    options: ['Content-Type: application/json', 'Accept-Encoding: gzip', 'Cache-Control: no-store', 'Connection: keep-alive'],
    answer: 'Content-Type: application/json',
  },
  {
    id: 'duel-22',
    prompt: 'Which tool is best known for containerizing app environments?',
    options: ['Docker', 'Nginx', 'Redis', 'Wireshark'],
    answer: 'Docker',
  },
  {
    id: 'duel-23',
    prompt: 'Which Git workflow artifact is commonly reviewed before merging?',
    options: ['Pull request', 'Rebase todo list', 'Tag annotation', 'Detached HEAD'],
    answer: 'Pull request',
  },
  {
    id: 'duel-24',
    prompt: 'Which API design concept keeps endpoints predictable and consistent?',
    options: ['Stable resource naming', 'Randomized URL paths', 'Hidden status codes', 'Changing payload shapes each release'],
    answer: 'Stable resource naming',
  },
  {
    id: 'duel-25',
    prompt: 'Which one is a real benefit of CI pipelines?',
    options: ['Automatic test runs on commits', 'Instantly fixing all bugs', 'Replacing monitoring tools', 'Eliminating code reviews'],
    answer: 'Automatic test runs on commits',
  },
  {
    id: 'duel-26',
    prompt: 'Which answer best describes idempotent HTTP methods?',
    options: ['Repeating them has the same intended effect', 'They always return identical payloads', 'They only work over HTTPS', 'They cannot modify server state'],
    answer: 'Repeating them has the same intended effect',
  },
  {
    id: 'duel-27',
    prompt: 'Which strategy helps diagnose production issues quickly?',
    options: ['Centralized logging with correlation IDs', 'Removing error logs to reduce noise', 'Restarting services without investigation', 'Skipping alerts during peak traffic'],
    answer: 'Centralized logging with correlation IDs',
  },
  {
    id: 'duel-28',
    prompt: 'Which role most commonly owns visual hierarchy and interaction polish?',
    options: ['UI Designer', 'Database Administrator', 'Platform Engineer', 'Compliance Officer'],
    answer: 'UI Designer',
  },
  {
    id: 'duel-29',
    prompt: 'Which cache property is most accurate?',
    options: ['It can reduce load on downstream services', 'It guarantees perfectly fresh data', 'It removes all network latency', 'It replaces database backups'],
    answer: 'It can reduce load on downstream services',
  },
  {
    id: 'duel-30',
    prompt: 'Which deployment approach shifts a small % of traffic first?',
    options: ['Canary release', 'Big-bang deploy', 'Manual hot patching', 'Branch deletion'],
    answer: 'Canary release',
  },
];

const shuffleOptions = (options) => {
  const shuffled = [...options];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const buildDuelQuestion = (question) => ({
  ...question,
  options: shuffleOptions(question.options),
});

const normalizeRoomCode = (code = '') => code.trim().toUpperCase();
const createId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const getRemainingSeconds = (endsAt) => {
  const end = new Date(endsAt).getTime();
  const deltaMs = Math.max(0, end - Date.now());
  return Math.floor(deltaMs / 1000);
};

const getShutdownRemainingSeconds = (shutdownAt) => {
  if (!shutdownAt) {
    return 0;
  }

  const shutdown = new Date(shutdownAt).getTime();
  const deltaMs = Math.max(0, shutdown - Date.now());
  return Math.floor(deltaMs / 1000);
};

const sortByScoreDesc = (players) => [...players].sort((a, b) => b.score - a.score);
const randomFrom = (items) => items[Math.floor(Math.random() * items.length)];
const randomPairFromQueue = (queue) => {
  const firstIndex = Math.floor(Math.random() * queue.length);
  const first = queue.splice(firstIndex, 1)[0];
  const secondIndex = Math.floor(Math.random() * queue.length);
  const second = queue.splice(secondIndex, 1)[0];
  return [first, second];
};

const mapPlayer = (player) => ({
  _id: player._id,
  username: player.username,
  score: player.score,
});

const mapRoom = (room, players) => ({
  roomCode: room.roomCode,
  host: room.host,
  timeLimit: room.timeLimit,
  minigameType: room.minigameType,
  questionTypes: room.questionTypes || [],
  startedAt: room.startedAt,
  endsAt: room.endsAt,
  shutdownAt: room.shutdownAt || null,
  isActive: room.isActive,
  timerRemainingSeconds: getRemainingSeconds(room.endsAt),
  shutdownRemainingSeconds: getShutdownRemainingSeconds(room.shutdownAt),
  players: players.map(mapPlayer),
});

const getRoomByCode = async (roomCode) => {
  if (USE_MEMORY_STORE) {
    return memoryRooms.get(roomCode) || null;
  }

  return GameRoom.findOne({ roomCode });
};

const getRoomWithPlayersByCode = async (roomCode) => {
  if (USE_MEMORY_STORE) {
    const room = memoryRooms.get(roomCode) || null;
    if (!room) {
      return { room: null, players: [] };
    }

    const players = room.players
      .map((playerId) => memoryPlayers.get(String(playerId)))
      .filter(Boolean);

    return { room, players: sortByScoreDesc(players) };
  }

  const room = await GameRoom.findOne({ roomCode }).populate('players');
  return { room, players: room ? sortByScoreDesc(room.players) : [] };
};

const saveRoom = async (room) => {
  if (USE_MEMORY_STORE) {
    room.updatedAt = new Date();
    memoryRooms.set(room.roomCode, room);
    return room;
  }

  await room.save();
  return room;
};

const deleteRoomAndPlayersByCode = async (roomCode) => {
  if (USE_MEMORY_STORE) {
    const room = memoryRooms.get(roomCode);
    if (!room) {
      return;
    }

    room.players.forEach((playerId) => memoryPlayers.delete(String(playerId)));
    memoryRooms.delete(roomCode);
    return;
  }

  const room = await GameRoom.findOne({ roomCode });
  if (!room) {
    return;
  }

  await Player.deleteMany({ roomCode });
  await GameRoom.deleteOne({ _id: room._id });
};

const shutdownRoomByCode = async (roomCode) => {
  await deleteRoomAndPlayersByCode(roomCode);
  oneOnOneRooms.delete(roomCode);
};

const listPlayersByRoom = async (roomCode) => {
  if (USE_MEMORY_STORE) {
    const players = [];
    memoryPlayers.forEach((player) => {
      if (player.roomCode === roomCode) {
        players.push(player);
      }
    });
    return sortByScoreDesc(players);
  }

  return Player.find({ roomCode }).sort({ score: -1 });
};

const getPlayerByRoomAndUsername = async (roomCode, username) => {
  if (USE_MEMORY_STORE) {
    for (const player of memoryPlayers.values()) {
      if (player.roomCode === roomCode && player.username === username) {
        return player;
      }
    }
    return null;
  }

  return Player.findOne({ roomCode, username });
};

const getPlayerById = async (playerId) => {
  if (USE_MEMORY_STORE) {
    return memoryPlayers.get(String(playerId)) || null;
  }

  return Player.findById(playerId);
};

const incrementPlayerScore = async ({ roomCode, playerId, scoreDelta }) => {
  const delta = Number(scoreDelta) || 0;
  if (delta === 0) {
    return null;
  }

  if (USE_MEMORY_STORE) {
    const player = memoryPlayers.get(String(playerId));
    if (!player || player.roomCode !== roomCode) {
      return null;
    }

    player.score = (Number(player.score) || 0) + delta;
    player.updatedAt = new Date();
    memoryPlayers.set(String(player._id), player);
    return player;
  }

  const player = await Player.findById(playerId);
  if (!player || player.roomCode !== roomCode) {
    return null;
  }

  player.score = (Number(player.score) || 0) + delta;
  await player.save();
  return player;
};

const getOneOnOneStateForRoom = (roomCode) => {
  if (!oneOnOneRooms.has(roomCode)) {
    oneOnOneRooms.set(roomCode, {
      queue: [],
      healthByPlayerId: {},
      currentDuel: null,
      lastResult: null,
      questionCycle: [],
    });
  }

  return oneOnOneRooms.get(roomCode);
};

const sanitizeOneOnOneState = (state, roomPlayers) => {
  const validPlayerIds = new Set(roomPlayers.map((player) => String(player._id)));
  state.queue = state.queue.filter((playerId) => validPlayerIds.has(String(playerId)));

  Object.keys(state.healthByPlayerId).forEach((playerId) => {
    if (!validPlayerIds.has(String(playerId))) {
      delete state.healthByPlayerId[playerId];
    }
  });

  if (state.currentDuel) {
    const duelPlayers = state.currentDuel.playerIds || [];
    if (!duelPlayers.every((playerId) => validPlayerIds.has(String(playerId)))) {
      state.currentDuel = null;
    }
  }

  if (!Array.isArray(state.questionCycle)) {
    state.questionCycle = [];
  }
  state.questionCycle = state.questionCycle.filter((questionId) =>
    ONE_ON_ONE_QUESTIONS.some((question) => question.id === questionId)
  );
};

const getNextOneOnOneQuestion = (state) => {
  if (!state.questionCycle.length) {
    state.questionCycle = shuffleOptions(ONE_ON_ONE_QUESTIONS.map((question) => question.id));
  }

  const nextQuestionId = state.questionCycle.shift();
  const foundQuestion = ONE_ON_ONE_QUESTIONS.find((question) => question.id === nextQuestionId);
  return foundQuestion || randomFrom(ONE_ON_ONE_QUESTIONS);
};

const startOneOnOneDuelIfPossible = (state, roomPlayers) => {
  if (state.currentDuel) {
    return;
  }

  sanitizeOneOnOneState(state, roomPlayers);

  const aliveQueue = state.queue.filter((playerId) => (state.healthByPlayerId[String(playerId)] ?? 100) > 0);
  state.queue = aliveQueue;

  if (aliveQueue.length < 2) {
    return;
  }

  const queueCopy = [...aliveQueue];
  const [firstPlayerId, secondPlayerId] = randomPairFromQueue(queueCopy);
  state.queue = queueCopy;

  const question = buildDuelQuestion(getNextOneOnOneQuestion(state));

  state.currentDuel = {
    id: createId(),
    playerIds: [String(firstPlayerId), String(secondPlayerId)],
    question,
    startedAt: new Date().toISOString(),
    answers: {},
    resolved: false,
  };
  state.lastResult = null;
};

const getOneOnOneViewForPlayer = async ({ roomCode, playerId }) => {
  const players = await listPlayersByRoom(roomCode);
  const state = getOneOnOneStateForRoom(roomCode);
  sanitizeOneOnOneState(state, players);

  const normalizedPlayerId = String(playerId);
  if (state.healthByPlayerId[normalizedPlayerId] == null) {
    state.healthByPlayerId[normalizedPlayerId] = 100;
  }

  startOneOnOneDuelIfPossible(state, players);

  const currentDuel = state.currentDuel;
  const isInDuel = currentDuel ? currentDuel.playerIds.includes(normalizedPlayerId) : false;
  const opponentId = isInDuel
    ? currentDuel.playerIds.find((id) => id !== normalizedPlayerId)
    : null;
  const opponent = opponentId ? players.find((player) => String(player._id) === String(opponentId)) : null;
  const answered = Boolean(currentDuel?.answers?.[normalizedPlayerId]);

  return {
    status: isInDuel ? 'duel' : 'waiting',
    queuePosition: state.queue.findIndex((id) => String(id) === normalizedPlayerId) + 1 || 0,
    playerHealth: state.healthByPlayerId[normalizedPlayerId] ?? 100,
    opponentHealth: opponentId ? (state.healthByPlayerId[String(opponentId)] ?? 100) : null,
    duel: isInDuel
      ? {
          id: currentDuel.id,
          startedAt: currentDuel.startedAt,
          opponent: opponent ? mapPlayer(opponent) : null,
          question: {
            id: currentDuel.question.id,
            prompt: currentDuel.question.prompt,
            options: currentDuel.question.options,
          },
          answered,
        }
      : null,
    lastResult: state.lastResult,
  };
};

const createPlayer = async ({ roomCode, username }) => {
  if (USE_MEMORY_STORE) {
    const now = new Date();
    const player = {
      _id: createId(),
      roomCode,
      username,
      score: 0,
      createdAt: now,
      updatedAt: now,
    };
    memoryPlayers.set(player._id, player);
    return player;
  }

  const player = new Player({ roomCode, username });
  await player.save();
  return player;
};

const attachPlayerToRoom = async (room, playerId) => {
  if (!room.players.some((id) => String(id) === String(playerId))) {
    room.players.push(playerId);
    await saveRoom(room);
  }
};

const removePlayerFromRoom = async ({ room, roomCode, playerId }) => {
  room.players = room.players.filter((id) => String(id) !== String(playerId));
  await saveRoom(room);

  if (USE_MEMORY_STORE) {
    memoryPlayers.delete(String(playerId));
    return;
  }

  await Player.deleteOne({ _id: playerId, roomCode });
};

const countActiveRooms = async () => {
  if (USE_MEMORY_STORE) {
    let count = 0;
    for (const room of memoryRooms.values()) {
      if (room.isActive) {
        count += 1;
      }
    }
    return count;
  }

  return GameRoom.countDocuments({ isActive: true });
};

const countTotalPlayers = async () => {
  if (USE_MEMORY_STORE) {
    return memoryPlayers.size;
  }

  return Player.countDocuments({});
};

const countPlayersInRoom = async (roomCode) => {
  if (USE_MEMORY_STORE) {
    let count = 0;
    for (const player of memoryPlayers.values()) {
      if (player.roomCode === roomCode) {
        count += 1;
      }
    }
    return count;
  }

  return Player.countDocuments({ roomCode });
};

const markRoomInactiveIfExpired = async (room) => {
  if (!room) {
    return null;
  }

  if (!room.isActive) {
    const shutdownAtMs = room.shutdownAt ? new Date(room.shutdownAt).getTime() : 0;
    if (!shutdownAtMs || shutdownAtMs <= Date.now()) {
      await shutdownRoomByCode(room.roomCode);
      return null;
    }

    return room;
  }

  if (new Date(room.endsAt).getTime() <= Date.now()) {
    room.isActive = false;
    room.shutdownAt = new Date(Date.now() + ROOM_SHUTDOWN_GRACE_MS);
    await saveRoom(room);
    return room;
  }

  return room;
};

router.post('/create', async (req, res) => {
  try {
    const { host, timeLimit, minigameType, questionTypes = [] } = req.body;
    const normalizedHost = String(host || '').trim();
    const normalizedMinigameType = String(minigameType || 'trivia').trim().toLowerCase();
    const normalizedQuestionTypes = Array.isArray(questionTypes)
      ? questionTypes.map((questionType) => String(questionType).trim()).filter(Boolean)
      : [];
    const minutes = Number(timeLimit);

    if (!normalizedHost) {
      return res.status(400).json({ error: 'host is required' });
    }

    // Auto-generate room code
    let normalizedRoomCode;
    let existingRoom;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      normalizedRoomCode = Math.random().toString(36).slice(2, 8).toUpperCase();
      existingRoom = await getRoomByCode(normalizedRoomCode);
      attempts++;
    } while (existingRoom && existingRoom.isActive && attempts < maxAttempts);

    if (existingRoom && existingRoom.isActive) {
      return res.status(500).json({ error: 'Failed to generate unique room code' });
    }

    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 180) {
      return res.status(400).json({ error: 'timeLimit must be between 1 and 180 minutes' });
    }

    if (existingRoom && !existingRoom.isActive) {
      await shutdownRoomByCode(normalizedRoomCode);
    }

    const startedAt = new Date();
    const endsAt = new Date(startedAt.getTime() + minutes * 60 * 1000);

    let newRoom;
    if (USE_MEMORY_STORE) {
      newRoom = {
        _id: createId(),
        roomCode: normalizedRoomCode,
        host: normalizedHost,
        timeLimit: minutes,
        minigameType: normalizedMinigameType,
        questionTypes: normalizedQuestionTypes,
        startedAt,
        endsAt,
        players: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await saveRoom(newRoom);
    } else {
      newRoom = new GameRoom({
        roomCode: normalizedRoomCode,
        host: normalizedHost,
        timeLimit: minutes,
        minigameType: normalizedMinigameType,
        questionTypes: normalizedQuestionTypes,
        startedAt,
        endsAt,
        players: [],
        isActive: true,
      });
      await newRoom.save();
    }

    return res.status(201).json({
      message: 'Game room created',
      room: mapRoom(newRoom, []),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create game room' });
  }
});

router.post('/join', async (req, res) => {
  try {
    const { roomCode, username } = req.body;
    const normalizedRoomCode = normalizeRoomCode(roomCode);
    const normalizedUsername = String(username || '').trim();

    if (!normalizedRoomCode || !normalizedUsername) {
      return res.status(400).json({ error: 'roomCode and username are required' });
    }

    const room = await getRoomByCode(normalizedRoomCode);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const activeRoom = await markRoomInactiveIfExpired(room);

    if (!activeRoom || !activeRoom.isActive) {
      return res.status(404).json({ error: 'Room not found or inactive' });
    }

    const existingPlayer = await getPlayerByRoomAndUsername(normalizedRoomCode, normalizedUsername);

    if (existingPlayer) {
      return res.status(200).json({
        message: 'Player already in room',
        player: mapPlayer(existingPlayer),
      });
    }

    const newPlayer = await createPlayer({
      roomCode: normalizedRoomCode,
      username: normalizedUsername,
    });

    await attachPlayerToRoom(activeRoom, newPlayer._id);

    return res.status(201).json({
      message: 'Joined room',
      player: mapPlayer(newPlayer),
      roomCode: normalizedRoomCode,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to join game room' });
  }
});

router.patch('/player-score', async (req, res) => {
  try {
    const { roomCode, playerId, username, scoreDelta = 0 } = req.body;
    const normalizedRoomCode = normalizeRoomCode(roomCode);
    const delta = Number(scoreDelta);

    if (!normalizedRoomCode || !Number.isFinite(delta)) {
      return res.status(400).json({ error: 'roomCode and a valid scoreDelta are required' });
    }

    const room = await getRoomByCode(normalizedRoomCode);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    let player = null;

    if (USE_MEMORY_STORE) {
      if (playerId && memoryPlayers.has(String(playerId))) {
        player = memoryPlayers.get(String(playerId));
      } else {
        for (const candidate of memoryPlayers.values()) {
          if (candidate.roomCode === normalizedRoomCode && candidate.username === String(username || '').trim()) {
            player = candidate;
            break;
          }
        }
      }

      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }

      player.score = (Number(player.score) || 0) + delta;
      player.updatedAt = new Date();
      memoryPlayers.set(String(player._id), player);
    } else {
      if (playerId) {
        player = await Player.findById(playerId);
      } else if (username) {
        player = await Player.findOne({ roomCode: normalizedRoomCode, username: String(username).trim() });
      }

      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }

      player.score = (Number(player.score) || 0) + delta;
      await player.save();
    }

    const players = await listPlayersByRoom(normalizedRoomCode);

    return res.status(200).json({
      message: 'Player score updated',
      player: mapPlayer(player),
      leaderboard: players.map(mapPlayer),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update player score' });
  }
});

router.post('/end', async (req, res) => {
  try {
    const { roomCode } = req.body;
    const normalizedRoomCode = normalizeRoomCode(roomCode);

    if (!normalizedRoomCode) {
      return res.status(400).json({ error: 'roomCode is required' });
    }

    const room = await getRoomByCode(normalizedRoomCode);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    room.isActive = false;
    room.endsAt = new Date();
    room.shutdownAt = new Date(Date.now() + ROOM_SHUTDOWN_GRACE_MS);
    await saveRoom(room);

    return res.status(200).json({
      message: 'Game room ended. Shutdown scheduled.',
      roomCode: normalizedRoomCode,
      shutdownAt: room.shutdownAt,
      shutdownRemainingSeconds: getShutdownRemainingSeconds(room.shutdownAt),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to end game room' });
  }
});

router.post('/kick', async (req, res) => {
  try {
    const { roomCode, playerId, username } = req.body;
    const normalizedRoomCode = normalizeRoomCode(roomCode);
    const normalizedUsername = String(username || '').trim();

    if (!normalizedRoomCode || (!playerId && !normalizedUsername)) {
      return res.status(400).json({ error: 'roomCode and playerId or username are required' });
    }

    const room = await getRoomByCode(normalizedRoomCode);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    let resolvedPlayerId = playerId;

    if (!resolvedPlayerId && normalizedUsername) {
      const player = await getPlayerByRoomAndUsername(normalizedRoomCode, normalizedUsername);
      if (player) {
        resolvedPlayerId = player._id;
      }
    }

    if (!resolvedPlayerId) {
      return res.status(404).json({ error: 'Player not found' });
    }

    await removePlayerFromRoom({ room, roomCode: normalizedRoomCode, playerId: resolvedPlayerId });

    const players = await listPlayersByRoom(normalizedRoomCode);

    return res.status(200).json({
      message: 'Player kicked from the room',
      room: mapRoom(room, players),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to kick player' });
  }
});

router.post('/one-on-one/ready', async (req, res) => {
  try {
    const { roomCode, playerId } = req.body;
    const normalizedRoomCode = normalizeRoomCode(roomCode);
    const normalizedPlayerId = String(playerId || '').trim();

    if (!normalizedRoomCode || !normalizedPlayerId) {
      return res.status(400).json({ error: 'roomCode and playerId are required' });
    }

    const room = await getRoomByCode(normalizedRoomCode);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const activeRoom = await markRoomInactiveIfExpired(room);
    if (!activeRoom || !activeRoom.isActive) {
      return res.status(400).json({ error: 'Room has ended' });
    }

    const player = await getPlayerById(normalizedPlayerId);
    if (!player || player.roomCode !== normalizedRoomCode) {
      return res.status(404).json({ error: 'Player not found in room' });
    }

    const players = await listPlayersByRoom(normalizedRoomCode);
    const state = getOneOnOneStateForRoom(normalizedRoomCode);
    sanitizeOneOnOneState(state, players);

    if (state.healthByPlayerId[normalizedPlayerId] == null) {
      state.healthByPlayerId[normalizedPlayerId] = 100;
    }

    if ((state.healthByPlayerId[normalizedPlayerId] ?? 0) <= 0) {
      const duelView = await getOneOnOneViewForPlayer({
        roomCode: normalizedRoomCode,
        playerId: normalizedPlayerId,
      });
      return res.status(200).json(duelView);
    }

    const playerAlreadyQueued = state.queue.includes(normalizedPlayerId);
    const playerInDuel = Boolean(state.currentDuel?.playerIds?.includes(normalizedPlayerId));

    if (!playerAlreadyQueued && !playerInDuel) {
      state.queue.push(normalizedPlayerId);
    }

    startOneOnOneDuelIfPossible(state, players);

    const duelView = await getOneOnOneViewForPlayer({
      roomCode: normalizedRoomCode,
      playerId: normalizedPlayerId,
    });

    return res.status(200).json(duelView);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to ready player for one-on-one' });
  }
});

router.get('/one-on-one/state/:roomCode/:playerId', async (req, res) => {
  try {
    const normalizedRoomCode = normalizeRoomCode(req.params.roomCode);
    const normalizedPlayerId = String(req.params.playerId || '').trim();

    if (!normalizedRoomCode || !normalizedPlayerId) {
      return res.status(400).json({ error: 'roomCode and playerId are required' });
    }

    const room = await getRoomByCode(normalizedRoomCode);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const activeRoom = await markRoomInactiveIfExpired(room);
    if (!activeRoom) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const player = await getPlayerById(normalizedPlayerId);
    if (!player || player.roomCode !== normalizedRoomCode) {
      return res.status(404).json({ error: 'Player not found in room' });
    }

    const duelView = await getOneOnOneViewForPlayer({
      roomCode: normalizedRoomCode,
      playerId: normalizedPlayerId,
    });

    return res.status(200).json(duelView);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch one-on-one state' });
  }
});

router.post('/one-on-one/answer', async (req, res) => {
  try {
    const { roomCode, playerId, answer } = req.body;
    const normalizedRoomCode = normalizeRoomCode(roomCode);
    const normalizedPlayerId = String(playerId || '').trim();
    const normalizedAnswer = String(answer || '').trim();

    if (!normalizedRoomCode || !normalizedPlayerId || !normalizedAnswer) {
      return res.status(400).json({ error: 'roomCode, playerId and answer are required' });
    }

    const room = await getRoomByCode(normalizedRoomCode);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const activeRoom = await markRoomInactiveIfExpired(room);
    if (!activeRoom || !activeRoom.isActive) {
      return res.status(400).json({ error: 'Room has ended' });
    }

    const player = await getPlayerById(normalizedPlayerId);
    if (!player || player.roomCode !== normalizedRoomCode) {
      return res.status(404).json({ error: 'Player not found in room' });
    }

    const players = await listPlayersByRoom(normalizedRoomCode);
    const state = getOneOnOneStateForRoom(normalizedRoomCode);
    sanitizeOneOnOneState(state, players);

    if (!state.currentDuel || !state.currentDuel.playerIds.includes(normalizedPlayerId)) {
      return res.status(400).json({ error: 'Player is not in an active duel' });
    }

    if (state.currentDuel.answers[normalizedPlayerId]) {
      return res.status(400).json({ error: 'Player already answered this duel question' });
    }

    state.currentDuel.answers[normalizedPlayerId] = {
      answer: normalizedAnswer,
      isCorrect: normalizedAnswer === state.currentDuel.question.answer,
      answeredAt: Date.now(),
    };

    const duelPlayerIds = state.currentDuel.playerIds;
    const answers = duelPlayerIds
      .map((id) => ({ playerId: id, ...(state.currentDuel.answers[id] || {}) }))
      .filter((entry) => entry.answeredAt);

    const correctAnswers = answers.filter((entry) => entry.isCorrect);
    const bothAnswered = answers.length === duelPlayerIds.length;

    if (correctAnswers.length > 0 || bothAnswered) {
      let winnerId = null;
      let loserId = null;

      if (correctAnswers.length > 0) {
        correctAnswers.sort((left, right) => left.answeredAt - right.answeredAt);
        winnerId = correctAnswers[0].playerId;
        loserId = duelPlayerIds.find((id) => id !== winnerId) || null;
      }

      if (winnerId && loserId) {
        state.healthByPlayerId[loserId] = Math.max(0, (state.healthByPlayerId[loserId] ?? 100) - ONE_ON_ONE_DAMAGE);
        await incrementPlayerScore({
          roomCode: normalizedRoomCode,
          playerId: winnerId,
          scoreDelta: ONE_ON_ONE_WIN_SCORE,
        });

        const winner = players.find((entry) => String(entry._id) === String(winnerId));
        const loser = players.find((entry) => String(entry._id) === String(loserId));

        state.lastResult = {
          duelId: state.currentDuel.id,
          winnerId,
          winnerUsername: winner?.username || 'Unknown',
          loserId,
          loserUsername: loser?.username || 'Unknown',
          damage: ONE_ON_ONE_DAMAGE,
          message: `${winner?.username || 'A player'} answered fastest and landed an attack.`,
          at: new Date().toISOString(),
        };
      } else {
        state.lastResult = {
          duelId: state.currentDuel.id,
          winnerId: null,
          winnerUsername: null,
          loserId: null,
          loserUsername: null,
          damage: 0,
          message: 'No attack landed this round.',
          at: new Date().toISOString(),
        };
      }

      state.currentDuel = null;
      const refreshedPlayers = await listPlayersByRoom(normalizedRoomCode);

      const alivePlayerIds = refreshedPlayers
        .map((entry) => String(entry._id))
        .filter((playerEntryId) => (state.healthByPlayerId[playerEntryId] ?? 100) > 0);

      if (alivePlayerIds.length <= 1) {
        activeRoom.isActive = false;
        activeRoom.endsAt = new Date();
        activeRoom.shutdownAt = new Date(Date.now() + ROOM_SHUTDOWN_GRACE_MS);
        await saveRoom(activeRoom);
        state.queue = [];
        state.currentDuel = null;
        state.lastResult = {
          ...(state.lastResult || {}),
          message: alivePlayerIds.length === 1
            ? `${refreshedPlayers.find((entry) => String(entry._id) === alivePlayerIds[0])?.username || 'A player'} is the final survivor.`
            : 'All duel players were eliminated.',
          at: new Date().toISOString(),
        };
      } else {
        state.queue = state.queue.filter((queuedId) => (state.healthByPlayerId[String(queuedId)] ?? 100) > 0);
      }

      startOneOnOneDuelIfPossible(state, refreshedPlayers);
    }

    const duelView = await getOneOnOneViewForPlayer({
      roomCode: normalizedRoomCode,
      playerId: normalizedPlayerId,
    });

    return res.status(200).json(duelView);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to submit one-on-one answer' });
  }
});

router.get('/:roomCode/stats', async (req, res) => {
  try {
    const normalizedRoomCode = normalizeRoomCode(req.params.roomCode);

    const [room, activeRooms, totalPlayersInSystem] = await Promise.all([
      getRoomByCode(normalizedRoomCode),
      countActiveRooms(),
      countTotalPlayers(),
    ]);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const activeRoom = await markRoomInactiveIfExpired(room);

    if (!activeRoom) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const playersInRoom = await countPlayersInRoom(normalizedRoomCode);

    return res.status(200).json({
      roomCode: activeRoom.roomCode,
      isActive: activeRoom.isActive,
      timerRemainingSeconds: getRemainingSeconds(activeRoom.endsAt),
      instancesInSystem: {
        activeRooms,
        totalPlayersInSystem,
        playersInRoom,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch room stats' });
  }
});

router.get('/:roomCode/leaderboard', async (req, res) => {
  try {
    const normalizedRoomCode = normalizeRoomCode(req.params.roomCode);
    const players = await listPlayersByRoom(normalizedRoomCode);

    return res.status(200).json(players.map(mapPlayer));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

router.get('/:roomCode', async (req, res) => {
  try {
    const normalizedRoomCode = normalizeRoomCode(req.params.roomCode);
    const { room, players } = await getRoomWithPlayersByCode(normalizedRoomCode);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const activeRoom = await markRoomInactiveIfExpired(room);

    if (!activeRoom) {
      return res.status(404).json({ error: 'Room not found' });
    }

    return res.status(200).json(mapRoom(activeRoom, players));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch room details' });
  }
});

module.exports = router;
