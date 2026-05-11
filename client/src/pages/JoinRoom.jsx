import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import Navbar from '../components/layout/Navbar';
import api from '../services/api';
import { QUESTION_TYPE_LABELS, getQuestionsForTypes } from '../data/questionBank';

const QUESTION_REFRESH_MS = 5000;
const DUEL_POLL_MS = 2000;
const TOWER_SLOT_COUNT = 6;
const BASIC_TOWER_COST = 120;
const TOWER_UPGRADE_COST = 80;
const TOWER_ABILITY_CHARGE_PER_CORRECT = 25;
const TOWER_ABILITY_DAMAGE = 45;
const TOWER_PREP_QUESTION_COUNT = 3;
const FACTORY_SPRINT_BASE_COST = 120;
const FACTORY_SPRINT_COST_STEP = 70;
const FACTORY_SPRINT_BOOST_MULTIPLIER = 1.5;
const FACTORY_SPRINT_BOOST_MS = 15000;
const FACTORY_PREP_QUESTION_COUNT = 3;
const DUEL_ROUND_SECONDS = 12;
const TOWER_TYPES = [
  { id: 'blaster', label: 'Blaster Tower', cost: 120, range: 120, damage: 18, fireRateMs: 700 },
  { id: 'frost', label: 'Frost Tower', cost: 140, range: 130, damage: 14, fireRateMs: 850 },
  { id: 'ember', label: 'Ember Tower', cost: 165, range: 108, damage: 24, fireRateMs: 1050 },
  { id: 'sniper', label: 'Sniper Tower', cost: 210, range: 190, damage: 36, fireRateMs: 1400 },
  { id: 'pulse', label: 'Pulse Tower', cost: 155, range: 140, damage: 16, fireRateMs: 760 },
  { id: 'sentinel', label: 'Sentinel Tower', cost: 175, range: 155, damage: 20, fireRateMs: 680 },
];

const ENEMY_ARCHETYPES = {
  scout: { type: 'scout', speed: 2.2, hpMult: 0.8, reward: 20 },
  grunt: { type: 'grunt', speed: 1.5, hpMult: 1, reward: 25 },
  regen: { type: 'regen', speed: 1.25, hpMult: 1.5, reward: 35 },
  tank: { type: 'tank', speed: 0.85, hpMult: 2.4, reward: 45 },
};

const TOWER_MAP = {
  width: 680,
  height: 260,
  routeWidth: 46,
  placementSlots: [
    { id: 'slot-1', x: 90, y: 70, label: 'River Slot A' },
    { id: 'slot-2', x: 230, y: 110, label: 'River Slot B' },
    { id: 'slot-3', x: 270, y: 200, label: 'River Slot C' },
    { id: 'slot-4', x: 430, y: 120, label: 'River Slot D' },
    { id: 'slot-5', x: 610, y: 165, label: 'River Slot E' },
    { id: 'slot-6', x: 520, y: 60, label: 'River Slot F' },
  ],
  pathPoints: [
    { x: 22, y: 120 },
    { x: 150, y: 120 },
    { x: 150, y: 52 },
    { x: 330, y: 52 },
    { x: 330, y: 190 },
    { x: 520, y: 190 },
    { x: 520, y: 110 },
    { x: 658, y: 110 },
  ],
};

const createTowerSlots = () =>
  Array.from({ length: TOWER_SLOT_COUNT }, (_, index) => ({
    id: `slot-${index + 1}`,
    level: 0,
    towerType: null,
  }));

const createWaveEnemies = (wave) =>
  Array.from({ length: Math.min(4 + wave, 12) }, (_, index) => {
    const typePool = wave >= 6
      ? ['scout', 'grunt', 'regen', 'tank']
      : wave >= 4
        ? ['scout', 'grunt', 'regen']
        : ['scout', 'grunt'];
    const chosenType = ENEMY_ARCHETYPES[typePool[Math.floor(Math.random() * typePool.length)]];
    const maxHealth = Math.round((60 + wave * 22 + index * 10) * chosenType.hpMult);
    return {
      id: `wave-${wave}-enemy-${index + 1}`,
      type: chosenType.type,
      reward: chosenType.reward,
      speed: chosenType.speed,
      health: maxHealth,
      maxHealth,
      progress: -index * 14,
    };
  });

const distance = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

const pathSegments = (points) => {
  const segments = [];
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const length = distance(start.x, start.y, end.x, end.y);
    segments.push({ start, end, length });
  }
  return segments;
};

const MAP_SEGMENTS = pathSegments(TOWER_MAP.pathPoints);
const MAP_TOTAL_LENGTH = MAP_SEGMENTS.reduce((sum, segment) => sum + segment.length, 0);

const getPointAtProgress = (progressPercent) => {
  const clampedProgress = Math.max(0, Math.min(100, progressPercent));
  let remaining = (clampedProgress / 100) * MAP_TOTAL_LENGTH;

  for (const segment of MAP_SEGMENTS) {
    if (remaining <= segment.length) {
      const ratio = segment.length === 0 ? 0 : remaining / segment.length;
      return {
        x: segment.start.x + (segment.end.x - segment.start.x) * ratio,
        y: segment.start.y + (segment.end.y - segment.start.y) * ratio,
      };
    }
    remaining -= segment.length;
  }

  const lastPoint = TOWER_MAP.pathPoints[TOWER_MAP.pathPoints.length - 1];
  return { x: lastPoint.x, y: lastPoint.y };
};

const pointToSegmentDistance = (px, py, x1, y1, x2, y2) => {
  const lineDx = x2 - x1;
  const lineDy = y2 - y1;
  const lengthSq = lineDx * lineDx + lineDy * lineDy;
  if (lengthSq === 0) {
    return Math.hypot(px - x1, py - y1);
  }

  let t = ((px - x1) * lineDx + (py - y1) * lineDy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * lineDx;
  const projY = y1 + t * lineDy;
  return Math.hypot(px - projX, py - projY);
};

const shuffleQuestions = (items) => [...items].sort(() => Math.random() - 0.5);

const areArraysEqual = (left, right) => {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
};

const normalizeTextAnswer = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:()]/g, '')
    .replace(/\s+/g, ' ');

const isCorrectAnswer = (correctAnswer, answerValue) => {
  if (Array.isArray(correctAnswer) && Array.isArray(answerValue)) {
    return areArraysEqual(
      [...answerValue].map(normalizeTextAnswer).sort(),
      [...correctAnswer].map(normalizeTextAnswer).sort(),
    );
  }

  return normalizeTextAnswer(correctAnswer) === normalizeTextAnswer(answerValue);
};

const MODE_LABELS = {
  'tower-defence': 'Tower Defence',
  factory: 'Factory',
  'one-on-one': 'One on One',
};

const pickFactoryChoices = () => {
  const shuffled = [...FACTORY_BLUEPRINTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
};

const TOWER_QUESTION_REWARD_BY_TYPE = {
  'true-false': 35,
  'multiple-choice': 45,
  'scenario-choice': 55,
  'select-all': 70,
  'order-steps': 80,
  'match-role': 90,
  'short-answer': 65,
};

const getTowerQuestionReward = (questionType) => TOWER_QUESTION_REWARD_BY_TYPE[questionType] || 45;

const FACTORY_BLUEPRINTS = [
  { key: 'micro', label: 'Micro Plant', incomePerPayout: 5, payoutSeconds: 2, upgradeBase: 95, vibe: 'Fast drip income' },
  { key: 'balanced', label: 'Assembly Hub', incomePerPayout: 8, payoutSeconds: 3, upgradeBase: 120, vibe: 'Balanced production' },
  { key: 'heavy', label: 'Mega Foundry', incomePerPayout: 12, payoutSeconds: 5, upgradeBase: 165, vibe: 'Slow but heavy drops' },
  { key: 'turbo', label: 'Turbo Line', incomePerPayout: 7, payoutSeconds: 2, upgradeBase: 135, vibe: 'Short payout cycle' },
  { key: 'precision', label: 'Precision Lab', incomePerPayout: 10, payoutSeconds: 4, upgradeBase: 150, vibe: 'Reliable high output' },
  { key: 'vault', label: 'Vault Forge', incomePerPayout: 15, payoutSeconds: 6, upgradeBase: 210, vibe: 'Big delayed payouts' },
];

const JoinRoom = () => {
  const { roomCode } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [username, setUsername] = useState(searchParams.get('username') || '');
  const [joinedPlayer, setJoinedPlayer] = useState(null);
  const [room, setRoom] = useState(null);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [now, setNow] = useState(Date.now());
  const [gameOver, setGameOver] = useState(false);

  const [gameQuestions, setGameQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);

  const [towerWave, setTowerWave] = useState(1);
  const [towerCount, setTowerCount] = useState(0);
  const [towerBaseHealth, setTowerBaseHealth] = useState(100);
  const [towerEnemyHealth, setTowerEnemyHealth] = useState(120);
  const [towerSlots, setTowerSlots] = useState(createTowerSlots());
  const [towerEnemies, setTowerEnemies] = useState([]);
  const [towerPlacementSlots, setTowerPlacementSlots] = useState(TOWER_MAP.placementSlots);
  const [selectedTowerSlot, setSelectedTowerSlot] = useState(null);
  const [selectedTowerType, setSelectedTowerType] = useState(TOWER_TYPES[0].id);
  const [selectedSlotId, setSelectedSlotId] = useState('slot-1');
  const [towerAbilityCharge, setTowerAbilityCharge] = useState(0);
  const [towerCoins, setTowerCoins] = useState(0);
  const [towerWaveActive, setTowerWaveActive] = useState(false);
  const [towerPrepActive, setTowerPrepActive] = useState(false);
  const [towerPrepQuestionsLeft, setTowerPrepQuestionsLeft] = useState(0);

  const [factoryMoney, setFactoryMoney] = useState(0);
  const [factoryMachines, setFactoryMachines] = useState([]);
  const [factoryCorrectCount, setFactoryCorrectCount] = useState(0);
  const [factoryQuestionReady, setFactoryQuestionReady] = useState(false);
  const [factoryStreak, setFactoryStreak] = useState(0);
  const [factoryPrepQuestionsLeft, setFactoryPrepQuestionsLeft] = useState(0);
  const [factoryChoiceOptions, setFactoryChoiceOptions] = useState([]);
  const [factoryAwaitingChoice, setFactoryAwaitingChoice] = useState(false);
  const [factorySprintLevel, setFactorySprintLevel] = useState(0);
  const [factoryBoostUntil, setFactoryBoostUntil] = useState(0);

  const [duelState, setDuelState] = useState(null);
  const [duelBusy, setDuelBusy] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [autoDuelQueue, setAutoDuelQueue] = useState(false);
  const [lastAutoQueueAt, setLastAutoQueueAt] = useState(0);
  const towerCanvasRef = useRef(null);
  const towerLastSpawnAtRef = useRef(Date.now());
  const towerSpawnedInWaveRef = useRef(0);
  const towerWaveGoalRef = useRef(createWaveEnemies(1).length);
  const towerLastShotAtRef = useRef({});
  const towerWaveStatsRef = useRef({ kills: 0, damage: 0, startedAt: null });
  const factoryMachinesRef = useRef([]);

  const minigameType = room?.minigameType || 'tower-defence';
  const roomQuestionTypes = room?.questionTypes || [];
  const roomQuestions = useMemo(() => getQuestionsForTypes(roomQuestionTypes), [roomQuestionTypes]);
  const currentQuestion = gameQuestions[currentQuestionIndex] || null;
  const roomHasExpired = Boolean(room?.endsAt) && new Date(room.endsAt).getTime() <= now;
  const roomHasEnded = room?.isActive === false || roomHasExpired;
  const duelElapsedSeconds = duelState?.duel?.startedAt
    ? Math.floor((now - new Date(duelState.duel.startedAt).getTime()) / 1000)
    : 0;
  const duelSecondsRemaining = Math.max(0, DUEL_ROUND_SECONDS - duelElapsedSeconds);
  const duelProgressPercent = (duelSecondsRemaining / DUEL_ROUND_SECONDS) * 100;
  const factoryBoostActive = now < factoryBoostUntil;
  const factoryBoostRemainingSeconds = Math.max(0, Math.ceil((factoryBoostUntil - now) / 1000));
  const factorySprintCost = FACTORY_SPRINT_BASE_COST + factorySprintLevel * FACTORY_SPRINT_COST_STEP;

  const getTowerPlacementCost = (towerTypeId) =>
    TOWER_TYPES.find((tower) => tower.id === towerTypeId)?.cost ?? BASIC_TOWER_COST;

  const drawTowerMap = () => {
    const canvas = towerCanvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const { width, height, pathPoints, routeWidth } = TOWER_MAP;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#061038';
    ctx.fillRect(0, 0, width, height);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = routeWidth + 10;
    ctx.beginPath();
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    pathPoints.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.stroke();

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = routeWidth;
    ctx.beginPath();
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    pathPoints.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.stroke();

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(pathPoints[0].x, pathPoints[0].y, 8, 0, Math.PI * 2);
    ctx.fill();

    const end = pathPoints[pathPoints.length - 1];
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(end.x, end.y, 8, 0, Math.PI * 2);
    ctx.fill();

    towerPlacementSlots.forEach((slot) => {
      const towerSlot = towerSlots.find((entry) => entry.id === slot.id);
      const isSelected = selectedTowerSlot === slot.id;
      const isPlaced = Boolean(towerSlot && towerSlot.level > 0);

      ctx.fillStyle = isPlaced ? '#facc15' : '#fbbf24';
      ctx.strokeStyle = isSelected ? '#f8fafc' : '#1e3a8a';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.beginPath();
      ctx.arc(slot.x, slot.y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    const totalSegments = pathPoints.length - 1;
    towerEnemies
      .filter((enemy) => enemy.health > 0)
      .forEach((enemy) => {
        const progressNorm = Math.max(0, Math.min(0.999, enemy.progress / 100));
        const scaled = progressNorm * totalSegments;
        const segmentIndex = Math.min(totalSegments - 1, Math.floor(scaled));
        const localT = scaled - segmentIndex;
        const start = pathPoints[segmentIndex];
        const finish = pathPoints[segmentIndex + 1];
        const x = start.x + (finish.x - start.x) * localT;
        const y = start.y + (finish.y - start.y) * localT;

        const enemyColorByType = {
          scout: '#fbbf24',
          grunt: '#f87171',
          regen: '#34d399',
          tank: '#ef4444',
        };
        ctx.fillStyle = enemyColorByType[enemy.type] || '#f87171';
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.fill();
      });
  };

  const endGame = () => {
    setGameOver(true);
    setShowEndModal(true);
  };

  const loadRoom = async () => {
    try {
      const roomData = await api.get(`/game-room/${roomCode}`);
      setRoom(roomData);

      if (roomData.isActive === false || (roomData.endsAt && new Date(roomData.endsAt).getTime() <= Date.now())) {
        endGame();
      }
    } catch (loadError) {
      setError(loadError.message || 'Unable to load room details.');
    }
  };

  const syncScore = async (scoreDelta) => {
    if (!joinedPlayer || !scoreDelta) {
      return;
    }

    const response = await api.patch('/game-room/player-score', {
      roomCode,
      playerId: joinedPlayer._id,
      scoreDelta,
    });

    if (response.player) {
      setJoinedPlayer((previous) => ({
        ...previous,
        score: response.player.score,
      }));
    }

    if (Array.isArray(response.leaderboard)) {
      setRoom((previousRoom) => {
        if (!previousRoom) {
          return previousRoom;
        }

        return {
          ...previousRoom,
          players: response.leaderboard,
        };
      });
    }
  };

  const nextQuestion = () => {
    setSelectedOptions([]);
    setTypedAnswer('');
    setIsAnswering(false);

    setCurrentQuestionIndex((previousIndex) => {
      const nextIndex = previousIndex + 1;
      if (nextIndex >= gameQuestions.length) {
        setGameQuestions(shuffleQuestions(roomQuestions));
        return 0;
      }

      return nextIndex;
    });
  };

  const loadDuelState = async () => {
    if (!joinedPlayer) {
      return;
    }

    try {
      const response = await api.get(`/game-room/one-on-one/state/${roomCode}/${joinedPlayer._id}`);
      setDuelState(response);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load duel state.');
    }
  };

  useEffect(() => {
    loadRoom();
  }, [roomCode]);

  useEffect(() => {
    const timerId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (!joinedPlayer || roomQuestions.length === 0 || gameQuestions.length > 0 || gameOver) {
      return;
    }

    setGameQuestions(shuffleQuestions(roomQuestions));
    setCurrentQuestionIndex(0);
    setSelectedOptions([]);
    setIsAnswering(false);

    setTowerWave(1);
    setTowerCount(0);
    setTowerBaseHealth(100);
    setTowerEnemyHealth(0);
    setTowerSlots(createTowerSlots());
    setTowerEnemies([]);
    setTowerPlacementSlots(TOWER_MAP.placementSlots);
    setSelectedTowerSlot(null);
    setSelectedSlotId('slot-1');
    setTowerAbilityCharge(0);
    setTowerCoins(BASIC_TOWER_COST);
    setTowerWaveActive(false);
    setTowerPrepActive(false);
    setTowerPrepQuestionsLeft(0);
    towerLastSpawnAtRef.current = Date.now();
    towerSpawnedInWaveRef.current = 0;
    towerWaveGoalRef.current = createWaveEnemies(1).length;
    towerLastShotAtRef.current = {};
    towerWaveStatsRef.current = { kills: 0, damage: 0, startedAt: null };

    setFactoryQuestionReady(false);
    setFactoryCorrectCount(0);
    setFactoryStreak(0);
    setFactoryPrepQuestionsLeft(0);
    setFactoryChoiceOptions([]);
    setFactoryAwaitingChoice(false);
    setFactorySprintLevel(0);
    setFactoryBoostUntil(0);

    if (minigameType === 'factory') {
      const startMoney = joinedPlayer.score || 0;
      setFactoryMoney(startMoney);
      setFactoryMachines([]);
      factoryMachinesRef.current = [];
    }
  }, [joinedPlayer, roomQuestions, gameQuestions.length, gameOver, minigameType]);

  useEffect(() => {
    if (!joinedPlayer || gameOver) {
      return undefined;
    }

    const pollId = window.setInterval(() => {
      loadRoom();
    }, QUESTION_REFRESH_MS);

    return () => window.clearInterval(pollId);
  }, [joinedPlayer, gameOver, roomCode]);

  useEffect(() => {
    if (joinedPlayer && roomHasEnded && !gameOver) {
      endGame();
      setFeedback('The game ended because the timer ran out or the host stopped it early.');
      setIsAnswering(false);
    }
  }, [joinedPlayer, roomHasEnded, gameOver]);

  useEffect(() => {
    factoryMachinesRef.current = factoryMachines;
  }, [factoryMachines]);

  useEffect(() => {
    if (!joinedPlayer || gameOver || minigameType !== 'factory') {
      return undefined;
    }

    const incomeId = window.setInterval(() => {
      const nowTs = Date.now();
      let income = 0;
      let changed = false;
      const updatedMachines = factoryMachinesRef.current.map((machine) => {
        const intervalMs = machine.payoutSeconds * 1000;
        const baseline = machine.lastPayoutAt || nowTs;
        const cycles = Math.floor((nowTs - baseline) / intervalMs);
        if (cycles <= 0) {
          return machine;
        }

        changed = true;
        income += cycles * machine.incomePerPayout * machine.level;
        return {
          ...machine,
          lastPayoutAt: baseline + cycles * intervalMs,
        };
      });

      if (changed) {
        factoryMachinesRef.current = updatedMachines;
        setFactoryMachines(updatedMachines);
      }

      if (income > 0) {
        const boostedIncome = Math.round(income * (Date.now() < factoryBoostUntil ? FACTORY_SPRINT_BOOST_MULTIPLIER : 1));
        setFactoryMoney((previousMoney) => previousMoney + boostedIncome);
        syncScore(boostedIncome).catch((syncError) => {
          setError(syncError.message || 'Unable to sync factory income.');
        });
      }
    }, 500);

    return () => window.clearInterval(incomeId);
  }, [joinedPlayer, gameOver, minigameType, factoryBoostUntil]);

  useEffect(() => {
    if (!joinedPlayer || gameOver || minigameType !== 'one-on-one') {
      return undefined;
    }

    loadDuelState();

    const duelId = window.setInterval(() => {
      loadDuelState();
    }, DUEL_POLL_MS);

    return () => window.clearInterval(duelId);
  }, [joinedPlayer, gameOver, minigameType, roomCode]);

  useEffect(() => {
    if (!autoDuelQueue || !joinedPlayer || minigameType !== 'one-on-one' || gameOver || duelBusy) {
      return;
    }

    const canQueue = duelState?.status !== 'duel' && (duelState?.queuePosition || 0) === 0;
    if (!canQueue) {
      return;
    }

    const nowTs = Date.now();
    if (nowTs - lastAutoQueueAt < 5000) {
      return;
    }

    setLastAutoQueueAt(nowTs);
    handleDuelReady();
  }, [autoDuelQueue, joinedPlayer, minigameType, gameOver, duelBusy, duelState, lastAutoQueueAt]);

  useEffect(() => {
    if (minigameType !== 'tower-defence' || !joinedPlayer || gameOver) {
      return;
    }
    drawTowerMap();
  }, [minigameType, joinedPlayer, gameOver, towerSlots, selectedTowerSlot, towerEnemies, towerPlacementSlots]);

  useEffect(() => {
    setTowerCount(towerSlots.filter((slot) => slot.level > 0).length);
  }, [towerSlots]);

  useEffect(() => {
    if (!joinedPlayer || gameOver || minigameType !== 'tower-defence' || !towerWaveActive) {
      return undefined;
    }

    let lastTick = Date.now();
    const loopId = window.setInterval(() => {
      const nowTs = Date.now();
      const deltaMs = Math.max(16, Math.min(100, nowTs - lastTick));
      const movementScale = deltaMs / 250;
      lastTick = nowTs;
      let nextEnemies = [...towerEnemies];
      let nextWave = towerWave;
      let nextBase = towerBaseHealth;

      if (towerSpawnedInWaveRef.current < towerWaveGoalRef.current && nowTs - towerLastSpawnAtRef.current >= 1100) {
        const newEnemy = createWaveEnemies(towerWave)[0];
        newEnemy.id = `${towerWave}-${towerSpawnedInWaveRef.current}-${nowTs}`;
        newEnemy.progress = -6;
        nextEnemies.push(newEnemy);
        towerSpawnedInWaveRef.current += 1;
        towerLastSpawnAtRef.current = nowTs;
      }

      nextEnemies = nextEnemies.map((enemy) => ({
        ...enemy,
        progress: enemy.progress + enemy.speed * movementScale,
      }));

      const activeTowers = towerSlots.filter((slot) => slot.level > 0 && slot.towerType);
      activeTowers.forEach((tower) => {
        const slotPosition = towerPlacementSlots.find((slot) => slot.id === tower.id);
        const towerType = TOWER_TYPES.find((type) => type.id === tower.towerType);
        if (!slotPosition || !towerType) {
          return;
        }

        const fireKey = tower.id;
        const lastShotAt = towerLastShotAtRef.current[fireKey] || 0;
        const fireRate = Math.max(200, towerType.fireRateMs - tower.level * 45);
        if (nowTs - lastShotAt < fireRate) {
          return;
        }

        const inRange = nextEnemies
          .filter((enemy) => enemy.health > 0)
          .map((enemy) => {
            const enemyPos = getPointAtProgress(enemy.progress);
            return { enemy, distance: distance(slotPosition.x, slotPosition.y, enemyPos.x, enemyPos.y) };
          })
          .filter((entry) => entry.distance <= towerType.range + tower.level * 6)
          .sort((left, right) => left.distance - right.distance);

        if (inRange.length === 0) {
          return;
        }

        const target = inRange[0].enemy;
        const damage = towerType.damage + tower.level * 4;
        const actualDamage = Math.min(target.health, damage);
        target.health -= damage;
        towerWaveStatsRef.current.damage += actualDamage;
        towerLastShotAtRef.current[fireKey] = nowTs;
      });

      nextEnemies = nextEnemies.filter((enemy) => {
        if (enemy.health <= 0) {
          towerWaveStatsRef.current.kills += 1;
          return false;
        }
        if (enemy.progress >= 100) {
          nextBase = Math.max(0, nextBase - (enemy.type === 'tank' ? 18 : 10));
          return false;
        }
        return true;
      });

      if (towerSpawnedInWaveRef.current >= towerWaveGoalRef.current && nextEnemies.length === 0) {
        nextWave = towerWave + 1;
        const waveScore = calculateTowerWaveScore();
        syncScore(waveScore.total).catch((syncError) => {
          setError(syncError.message || 'Unable to sync wave leaderboard score.');
        });
        setFeedback(`Wave ${towerWave} cleared in ${waveScore.elapsedSeconds}s. Score +${waveScore.total} (kills ${waveScore.killScore}, speed ${waveScore.timeBonus}, damage ${waveScore.damageScore}). Press Start Wave.`);
        setTowerWaveActive(false);
        setTowerPrepQuestionsLeft(0);
        towerSpawnedInWaveRef.current = 0;
        towerWaveGoalRef.current = Math.min(8 + nextWave * 2, 22);
        towerWaveStatsRef.current = { kills: 0, damage: 0, startedAt: null };
      }

      setTowerEnemies(nextEnemies);
      setTowerEnemyHealth(nextEnemies[0]?.health || 0);
      setTowerWave(nextWave);
      setTowerBaseHealth(nextBase);

      if (nextBase <= 0) {
        endGame();
        setFeedback('Your base was destroyed.');
      }
    }, 33);

    return () => window.clearInterval(loopId);
  }, [
    joinedPlayer,
    gameOver,
    minigameType,
    towerWaveActive,
    towerEnemies,
    towerWave,
    towerBaseHealth,
    towerSlots,
    towerPlacementSlots,
  ]);

  useEffect(() => {
    if (!showEndModal) {
      return;
    }

    const redirectTimer = window.setTimeout(() => {
      navigate('/');
    }, 10000);

    return () => window.clearTimeout(redirectTimer);
  }, [showEndModal, navigate]);

  const showQuestionModal = Boolean(towerPrepActive && currentQuestion);

  useEffect(() => {
    if (!showEndModal) {
      document.body.classList.remove('game-over-modal-open');
      return;
    }

    document.body.classList.add('game-over-modal-open');
    return () => {
      document.body.classList.remove('game-over-modal-open');
    };
  }, [showEndModal]);

  useEffect(() => {
    if (!showQuestionModal) {
      document.body.classList.remove('question-modal-open');
      return;
    }

    document.body.classList.add('question-modal-open');
    return () => {
      document.body.classList.remove('question-modal-open');
    };
  }, [showQuestionModal]);

  const startTowerWavePrep = () => {
    if (gameOver || towerWaveActive || towerPrepActive) {
      return;
    }

    setTowerPrepActive(true);
    setTowerPrepQuestionsLeft(TOWER_PREP_QUESTION_COUNT);
    setSelectedOptions([]);
    setIsAnswering(false);
    setFeedback(`Wave ${towerWave} prep started. Answer ${TOWER_PREP_QUESTION_COUNT} questions to launch the wave.`);
  };

  const calculateTowerWaveScore = () => {
    const stats = towerWaveStatsRef.current;
    const elapsedMs = stats.startedAt ? Date.now() - stats.startedAt : 0;
    const elapsedSeconds = Math.max(1, Math.round(elapsedMs / 1000));
    const killScore = stats.kills * 30;
    const timeBonus = Math.max(0, 280 - elapsedSeconds * 10);
    const damageScore = Math.round(stats.damage * 0.35);
    return {
      total: killScore + timeBonus + damageScore,
      killScore,
      timeBonus,
      damageScore,
      elapsedSeconds,
    };
  };

  const submitTowerAnswer = (answerValue) => {
    if (!currentQuestion || isAnswering || gameOver || minigameType !== 'tower-defence' || !towerPrepActive || towerPrepQuestionsLeft <= 0) {
      return;
    }

    setIsAnswering(true);

    const correct = isCorrectAnswer(currentQuestion.answer, answerValue);
    if (correct) {
      const reward = getTowerQuestionReward(currentQuestion.type);
      setTowerCoins((previous) => previous + reward);
      setTowerAbilityCharge((previousCharge) => Math.min(100, previousCharge + TOWER_ABILITY_CHARGE_PER_CORRECT));
      setFeedback(`Correct. +${reward} coins for wave prep.`);
    } else {
      setTowerAbilityCharge((previousCharge) => Math.max(0, previousCharge - 10));
      setFeedback('Wrong answer. No coins earned for this prep question.');
    }

    window.setTimeout(() => {
      const remaining = towerPrepQuestionsLeft - 1;
      setTowerPrepQuestionsLeft(Math.max(0, remaining));
      if (remaining > 0) {
        nextQuestion();
        return;
      }

      setTowerPrepActive(false);
      setTowerWaveActive(true);
      setTowerEnemies([]);
      setTowerEnemyHealth(0);
      towerLastSpawnAtRef.current = Date.now();
      towerSpawnedInWaveRef.current = 0;
      towerWaveGoalRef.current = createWaveEnemies(towerWave).length;
      towerLastShotAtRef.current = {};
      towerWaveStatsRef.current = { kills: 0, damage: 0, startedAt: Date.now() };
      setFeedback(`Wave ${towerWave} started. Defend your base.`);
      nextQuestion();
    }, 900);
  };

  const handleTowerAbility = async () => {
    if (gameOver || towerAbilityCharge < 100 || !towerWaveActive) {
      return;
    }

    const activeEnemies = towerEnemies.filter((enemy) => enemy.health > 0);
    if (activeEnemies.length === 0) {
      setFeedback('No enemies in range for your special ability.');
      return;
    }

    let damageFromAbility = 0;
    const updatedEnemies = towerEnemies.map((enemy) => {
      const actualDamage = Math.min(enemy.health, TOWER_ABILITY_DAMAGE);
      damageFromAbility += actualDamage;
      return {
        ...enemy,
        health: Math.max(0, enemy.health - TOWER_ABILITY_DAMAGE),
        progress: Math.max(0, enemy.progress - 12),
      };
    });

    setTowerEnemies(updatedEnemies);
    setTowerEnemyHealth(updatedEnemies.find((enemy) => enemy.health > 0)?.health || 0);
    setTowerAbilityCharge(0);
    towerWaveStatsRef.current.damage += damageFromAbility;
    setFeedback('Special activated. Shockwave hit all enemies in the lane.');
  };

  const handlePlaceOrUpgradeTower = (slotId) => {
    if (gameOver || !joinedPlayer) {
      return;
    }

    const slot = towerSlots.find((entry) => entry.id === slotId);
    if (!slot) {
      return;
    }

    const placementCost = getTowerPlacementCost(selectedTowerType);
    const cost = slot.level === 0 ? placementCost : TOWER_UPGRADE_COST * slot.level;
    if (towerCoins < cost) {
      setFeedback('Not enough coins to place or upgrade this tower.');
      return;
    }

    if (slot.level >= 5) {
      setFeedback('This tower is already max level.');
      return;
    }

    setSelectedTowerSlot(slotId);
    setTowerSlots((previousSlots) =>
      previousSlots.map((entry) => {
        if (entry.id !== slotId) {
          return entry;
        }

        return {
          ...entry,
          level: entry.level + 1,
          towerType: entry.level === 0 ? selectedTowerType : entry.towerType,
        };
      })
    );

    setTowerCount((previousCount) => (slot.level === 0 ? previousCount + 1 : previousCount));
    setTowerCoins((previousCoins) => Math.max(0, previousCoins - cost));
    setFeedback(slot.level === 0 ? 'Tower placed on the map.' : 'Tower upgraded.');
  };

  const canPlaceTowerAt = (x, y) => {
    if (x < 24 || x > TOWER_MAP.width - 24 || y < 24 || y > TOWER_MAP.height - 24) {
      return false;
    }

    const isOnPath = MAP_SEGMENTS.some((segment) => pointToSegmentDistance(x, y, segment.start.x, segment.start.y, segment.end.x, segment.end.y) < TOWER_MAP.routeWidth / 2 + 10);
    if (isOnPath) {
      return false;
    }

    return !towerPlacementSlots.some((slot) => distance(x, y, slot.x, slot.y) < 26);
  };

  const handleTowerCanvasClick = (event) => {
    if (minigameType !== 'tower-defence' || gameOver) {
      return;
    }

    const canvas = towerCanvasRef.current;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;

    const nearestExisting = towerPlacementSlots
      .map((slot) => ({ slot, d: distance(x, y, slot.x, slot.y) }))
      .sort((left, right) => left.d - right.d)[0];

    if (nearestExisting && nearestExisting.d <= 18) {
      setSelectedTowerSlot(nearestExisting.slot.id);
      setSelectedSlotId(nearestExisting.slot.id);
      return;
    }

    if (!canPlaceTowerAt(x, y)) {
      setFeedback('You can only place towers around the path, not on top of it.');
      return;
    }

    const dynamicId = `slot-custom-${Date.now().toString(36)}`;
    setTowerPlacementSlots((previous) => [...previous, { id: dynamicId, x, y, label: `Custom Slot ${previous.length - TOWER_MAP.placementSlots.length + 1}` }]);
    setTowerSlots((previous) => [...previous, { id: dynamicId, level: 0, towerType: null }]);
    setSelectedSlotId(dynamicId);
    setSelectedTowerSlot(dynamicId);
    setFeedback('New placement slot added. Press "Place at Slot" to deploy.');
  };

  const submitFactoryAnswer = async (answerValue) => {
    if (!currentQuestion || isAnswering || gameOver || !factoryQuestionReady || factoryPrepQuestionsLeft <= 0) {
      return;
    }

    setIsAnswering(true);

    const correct = isCorrectAnswer(currentQuestion.answer, answerValue);
    const nextQuestionsLeft = factoryPrepQuestionsLeft - 1;

    if (correct) {
      const streakBonus = factoryStreak >= 2 ? 20 : 0;
      const reward = 60 + streakBonus;
      setFactoryMoney((previousMoney) => previousMoney + reward);
      setFactoryCorrectCount((previousCount) => previousCount + 1);
      setFactoryStreak((previousStreak) => previousStreak + 1);
      setFeedback(streakBonus > 0 ? 'Correct streak bonus earned. You gained extra cash.' : 'Correct. You earned factory cash.');

      try {
        await syncScore(reward);
      } catch (syncError) {
        setError(syncError.message || 'Unable to sync factory reward.');
      }
    } else {
      setFactoryStreak(0);
      setFeedback('Wrong answer. No cash earned this time.');
    }

    setFactoryPrepQuestionsLeft(Math.max(0, nextQuestionsLeft));
    setSelectedOptions([]);
    setIsAnswering(false);

    if (nextQuestionsLeft > 0) {
      nextQuestion();
      return;
    }

    setFactoryQuestionReady(false);
    setFactoryAwaitingChoice(true);
    setFactoryChoiceOptions(pickFactoryChoices());
  };

  const handleChooseFactory = (choice) => {
    if (!choice || gameOver) {
      return;
    }

    const machineNumber = factoryMachines.length + 1;
    const machine = {
      id: `machine-${Date.now().toString(36)}`,
      name: `${choice.label} ${machineNumber}`,
      level: 1,
      incomePerPayout: choice.incomePerPayout,
      payoutSeconds: choice.payoutSeconds,
      baseUpgradeCost: choice.upgradeBase,
      lastPayoutAt: Date.now(),
    };

    const updatedMachines = [...factoryMachines, machine];
    factoryMachinesRef.current = updatedMachines;
    setFactoryMachines(updatedMachines);
    setFactoryAwaitingChoice(false);
    setFactoryChoiceOptions([]);
    setFeedback(`${choice.label} deployed. Payouts now rolling in every ${choice.payoutSeconds}s.`);
    nextQuestion();
  };

  const handlePlaceAtSelectedSlot = async () => {
    await handlePlaceOrUpgradeTower(selectedSlotId);
  };

  const placedSlots = towerSlots.filter((slot) => slot.level > 0);
  const selectedPlacedTower = towerSlots.find((slot) => slot.id === selectedTowerSlot) || null;
  const selectedUpgradeCost = selectedPlacedTower ? TOWER_UPGRADE_COST * selectedPlacedTower.level : null;
  const canUpgradeSelected = Boolean(
    selectedPlacedTower &&
    selectedPlacedTower.level < 5 &&
    typeof selectedUpgradeCost === 'number' &&
    towerCoins >= selectedUpgradeCost
  );
  const placeCostLabel = getTowerPlacementCost(selectedTowerType);
  const upgradeLabel = !selectedPlacedTower
    ? 'Upgrade Selected'
    : selectedPlacedTower.level >= 5
      ? 'Upgrade Selected (Max)'
      : `Upgrade Selected (Cost ${selectedUpgradeCost})`;

  const handleFactorySprint = async () => {
    if (gameOver) {
      return;
    }

    if (factoryMoney < factorySprintCost) {
      setFeedback('Not enough factory money for a production sprint.');
      return;
    }

    setFactoryMoney((previousMoney) => previousMoney - factorySprintCost);
    setFactorySprintLevel((previousLevel) => previousLevel + 1);
    setFactoryBoostUntil(Date.now() + FACTORY_SPRINT_BOOST_MS);
    setFeedback(`Production sprint online. Earnings boosted to ${FACTORY_SPRINT_BOOST_MULTIPLIER}x for 15s.`);

    try {
      await syncScore(-factorySprintCost);
    } catch (syncError) {
      setError(syncError.message || 'Unable to sync factory sprint cost.');
    }
  };

  const handleUpgradeMachine = async (machineId) => {
    const machine = factoryMachines.find((entry) => entry.id === machineId);
    if (!machine) {
      return;
    }

    const upgradeCost = machine.baseUpgradeCost * machine.level;
    if (factoryMoney < upgradeCost) {
      setFeedback('Not enough money to upgrade this machine.');
      return;
    }

    setFactoryMoney((previousMoney) => previousMoney - upgradeCost);
    setFactoryMachines((previousMachines) =>
      previousMachines.map((entry) => {
        if (entry.id !== machineId) {
          return entry;
        }

        return {
          ...entry,
          level: entry.level + 1,
        };
      })
    );

    setFeedback(`${machine.name} upgraded.`);

    try {
      await syncScore(-upgradeCost);
    } catch (syncError) {
      setError(syncError.message || 'Unable to sync machine upgrade.');
    }
  };

  const handleDuelReady = async () => {
    if (!joinedPlayer || duelBusy || gameOver) {
      return;
    }

    try {
      setDuelBusy(true);
      const response = await api.post('/game-room/one-on-one/ready', {
        roomCode,
        playerId: joinedPlayer._id,
      });
      setDuelState(response);
    } catch (readyError) {
      setError(readyError.message || 'Unable to queue for a duel.');
    } finally {
      setDuelBusy(false);
    }
  };

  const handleDuelAnswer = async (answerValue) => {
    if (!joinedPlayer || duelBusy || gameOver) {
      return;
    }

    try {
      setDuelBusy(true);
      const response = await api.post('/game-room/one-on-one/answer', {
        roomCode,
        playerId: joinedPlayer._id,
        answer: answerValue,
      });
      setDuelState(response);
      await loadRoom();
    } catch (answerError) {
      setError(answerError.message || 'Unable to submit duel answer.');
    } finally {
      setDuelBusy(false);
    }
  };

  const toggleSelectedOption = (option) => {
    setSelectedOptions((previous) => {
      if (currentQuestion?.type === 'order-steps') {
        if (previous.includes(option)) {
          return previous;
        }

        return [...previous, option];
      }

      if (previous.includes(option)) {
        return previous.filter((item) => item !== option);
      }

      return [...previous, option];
    });
  };

  const renderQuestionBody = ({ onSubmit }) => {
    if (!currentQuestion) {
      return null;
    }

    if (currentQuestion.type === 'short-answer') {
      return (
        <div className="d-flex flex-column gap-2">
          <input
            type="text"
            className="form-control"
            value={typedAnswer}
            onChange={(event) => setTypedAnswer(event.target.value)}
            placeholder="Type your answer"
            disabled={isAnswering}
          />
          <button
            type="button"
            className="btn btn-primary align-self-start"
            onClick={() => onSubmit(typedAnswer)}
            disabled={!typedAnswer.trim() || isAnswering}
          >
            Submit Answer
          </button>
        </div>
      );
    }

    if (currentQuestion.type === 'select-all') {
      return (
        <>
          <div className="d-grid gap-2 mb-3">
            {currentQuestion.options.map((option) => (
              <label key={option} className="btn btn-outline-primary text-start">
                <input
                  className="form-check-input me-2"
                  type="checkbox"
                  checked={selectedOptions.includes(option)}
                  onChange={() => toggleSelectedOption(option)}
                />
                {option}
              </label>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onSubmit(selectedOptions)}
            disabled={selectedOptions.length === 0 || isAnswering}
          >
            Submit Answer
          </button>
        </>
      );
    }

    if (currentQuestion.type === 'match-role') {
      return (
        <>
          <div className="d-grid gap-2 mb-3">
            {currentQuestion.options.map((option) => (
              <label key={option} className="btn btn-outline-primary text-start">
                <input
                  className="form-check-input me-2"
                  type="checkbox"
                  checked={selectedOptions.includes(option)}
                  onChange={() => toggleSelectedOption(option)}
                />
                {option}
              </label>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onSubmit(selectedOptions)}
            disabled={selectedOptions.length !== currentQuestion.answer.length || isAnswering}
          >
            Submit Matches
          </button>
        </>
      );
    }

    if (currentQuestion.type === 'order-steps') {
      return (
        <>
          <div className="mb-3">
            <p className="text-secondary mb-2">Build the order by clicking options in sequence.</p>
            <div className="d-flex flex-wrap gap-2 mb-3">
              {selectedOptions.map((option, index) => (
                <button
                  key={`${option}-${index}`}
                  type="button"
                  className="badge text-bg-dark border-0"
                  onClick={() => setSelectedOptions((previous) => previous.filter((item) => item !== option))}
                >
                  {index + 1}. {option}
                </button>
              ))}
            </div>
            <div className="d-grid gap-2">
              {currentQuestion.options
                .filter((option) => !selectedOptions.includes(option))
                .map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="btn btn-outline-primary text-start"
                    onClick={() => toggleSelectedOption(option)}
                    disabled={isAnswering}
                  >
                    {option}
                  </button>
                ))}
            </div>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setSelectedOptions([])}
              disabled={selectedOptions.length === 0 || isAnswering}
            >
              Clear
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onSubmit(selectedOptions)}
              disabled={selectedOptions.length !== currentQuestion.options.length || isAnswering}
            >
              Submit Order
            </button>
          </div>
        </>
      );
    }

    return (
      <div className="d-grid gap-2">
        {currentQuestion.options.map((option) => (
          <button
            key={option}
            type="button"
            className="btn btn-outline-primary text-start"
            onClick={() => onSubmit(option)}
            disabled={isAnswering}
          >
            {option}
          </button>
        ))}
      </div>
    );
  };

  const handleJoin = async () => {
    const normalizedUsername = username.trim();

    if (!normalizedUsername) {
      setError('Enter a username before joining.');
      return;
    }

    try {
      setJoining(true);
      setError('');

      const response = await api.post('/game-room/join', {
        roomCode,
        username: normalizedUsername,
      });

      setJoinedPlayer(response.player);
      setFactoryMoney(response.player?.score || 0);
      await loadRoom();
    } catch (joinError) {
      setError(joinError.message || 'Failed to join room.');
    } finally {
      setJoining(false);
    }
  };

  const renderTowerDefence = () => (
    <section className="card tower-defence-expanded">
      <div className="card-body p-0">
        <div className="p-4 border-bottom">
          <h2 className="h3 mb-2">Tower Defense: River Route</h2>
          <p className="mb-3 text-secondary">Press Start Wave, answer 3 prep questions for coins, then defend. Leaderboard score is based on kills, clear speed, and damage dealt.</p>
          <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={startTowerWavePrep}
              disabled={towerWaveActive || towerPrepActive || gameOver}
            >
              {towerPrepActive ? `Prep in progress (${towerPrepQuestionsLeft} left)` : `Start Wave ${towerWave}`}
            </button>
            <span className={`badge ${towerWaveActive ? 'text-bg-success' : towerPrepActive ? 'text-bg-warning' : 'text-bg-secondary'}`}>
              {towerWaveActive ? 'Wave Active' : towerPrepActive ? 'Prep Questions' : 'Waiting to Start'}
            </span>
          </div>
          <div className="d-flex flex-wrap gap-2 mb-3">
            {TOWER_TYPES.map((towerType) => (
              <button
                key={towerType.id}
                type="button"
                className={`btn btn-sm ${selectedTowerType === towerType.id ? 'btn-info' : 'btn-outline-secondary'}`}
                onClick={() => setSelectedTowerType(towerType.id)}
              >
                {towerType.label} (Cost {towerType.cost})
              </button>
            ))}
          </div>
          <div className="row g-2 align-items-end mb-3">
            <div className="col-12 col-md-8">
              <label htmlFor="tower-slot-picker" className="form-label mb-1">Keyboard placement slot</label>
              <select
                id="tower-slot-picker"
                className="form-select"
                value={selectedSlotId}
                onChange={(event) => setSelectedSlotId(event.target.value)}
              >
                {towerSlots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {(towerPlacementSlots.find((mapSlot) => mapSlot.id === slot.id)?.label || slot.id)} ({slot.level > 0 ? `Level ${slot.level}` : 'Empty'})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-4 d-grid">
              <button type="button" className="btn btn-primary" onClick={handlePlaceAtSelectedSlot}>
                Place at Slot (Cost {placeCostLabel})
              </button>
            </div>
          </div>
          <div className="row g-2 align-items-end mb-2">
            <div className="col-12 col-md-8">
              <label htmlFor="selected-placed-tower" className="form-label mb-1">Select placed tower</label>
              <select
                id="selected-placed-tower"
                className="form-select"
                value={selectedTowerSlot || ''}
                onChange={(event) => setSelectedTowerSlot(event.target.value || null)}
              >
                <option value="">None</option>
                {placedSlots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {(towerPlacementSlots.find((mapSlot) => mapSlot.id === slot.id)?.label || slot.id)} (Level {slot.level})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-4 d-grid">
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() => selectedTowerSlot && handlePlaceOrUpgradeTower(selectedTowerSlot)}
                disabled={!selectedTowerSlot || !canUpgradeSelected}
              >
                {upgradeLabel}
              </button>
            </div>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <span className="badge text-bg-info">Towers: {towerCount}</span>
            <span className="badge text-bg-info">Wave: {towerWave}</span>
            <span className="badge text-bg-info">Remaining: {towerEnemies.filter((enemy) => enemy.health > 0).length}</span>
            <span className="badge text-bg-info">Integrity: {towerBaseHealth}</span>
            <span className="badge text-bg-warning">Coins: {towerCoins}</span>
          </div>
        </div>

        {/* Header Stats */}
        <div className="px-4 py-3 border-bottom d-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
          <div><strong>Wave:</strong> <span className="fs-5" style={{ color: '#0226fa' }}>{towerWave}</span></div>
          <div><strong>Towers:</strong> <span className="fs-5" style={{ color: '#0226fa' }}>{towerCount}</span></div>
          <div><strong>Base HP:</strong> <span className="fs-5" style={{ color: towerBaseHealth > 30 ? '#44fd4e' : '#fd8200' }}>{towerBaseHealth}</span></div>
          <div><strong>Enemy HP:</strong> <span className="fs-5" style={{ color: '#fd8200' }}>{towerEnemyHealth}</span></div>
        </div>
        <div className="px-4 pt-3 pb-2 border-bottom">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="fw-semibold">Special Ability Charge</span>
            <span>{towerAbilityCharge}%</span>
          </div>
          <div className="progress mb-2" role="progressbar" aria-label="Tower special ability charge" aria-valuenow={towerAbilityCharge} aria-valuemin="0" aria-valuemax="100">
            <div className="progress-bar" style={{ width: `${towerAbilityCharge}%` }} />
          </div>
          <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleTowerAbility} disabled={towerAbilityCharge < 100}>
            Activate Shockwave
          </button>
        </div>

        <div className="tower-canvas-wrap px-4 py-3">
          <canvas
            ref={towerCanvasRef}
            id="towerCanvas"
            width={TOWER_MAP.width}
            height={TOWER_MAP.height}
            aria-label="Tower defense map canvas"
            onClick={handleTowerCanvasClick}
          />
          <p className="mb-0 mt-3 text-secondary">Tip: select a tower type, choose a slot, place, then upgrade selected towers.</p>
        </div>

        {/* Question Section */}
        {towerPrepActive ? (
          <p className="p-4 mb-0 text-secondary">Prep question opened. Answer in the pop-up to launch the wave.</p>
        ) : (
          <p className="p-4 mb-0 text-secondary">Press Start Wave to answer prep questions and launch the next wave.</p>
        )}
      </div>
    </section>
  );

  const renderFactory = () => (
    <section className="card factory-mode-card">
      <div className="card-body">
        <div className="factory-hero mb-3">
          <div className="factory-stat-pill">
            <span className="factory-stat-label">Factory Money</span>
            <span className="factory-stat-value">${factoryMoney}</span>
          </div>
          <div className="factory-stat-pill">
            <span className="factory-stat-label">Factories</span>
            <span className="factory-stat-value">{factoryMachines.length}</span>
          </div>
          <div className="factory-stat-pill">
            <span className="factory-stat-label">Correct Answers</span>
            <span className="factory-stat-value">{factoryCorrectCount}</span>
          </div>
        </div>

        <div className="mb-3 factory-console">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <strong>Accuracy Streak</strong>
            <span>{factoryStreak}</span>
          </div>
          <div className="progress mb-2" role="progressbar" aria-label="Factory streak progress" aria-valuenow={Math.min(factoryStreak, 5)} aria-valuemin="0" aria-valuemax="5">
            <div className="progress-bar bg-success" style={{ width: `${Math.min(factoryStreak, 5) * 20}%` }} />
          </div>
          <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleFactorySprint} disabled={factoryMoney < factorySprintCost}>
            Run Production Sprint ({factorySprintCost})
          </button>
          <div className="mt-2 text-secondary small">
            {factoryBoostActive ? `Boost active: ${FACTORY_SPRINT_BOOST_MULTIPLIER}x for ${factoryBoostRemainingSeconds}s` : 'No active sprint boost'}
          </div>
        </div>

        {factoryMachines.length > 0 ? (
          <div className="mb-3">
            <h2 className="h5">Machines</h2>
            <div className="d-grid gap-2">
              {factoryMachines.map((machine) => {
                const upgradeCost = machine.baseUpgradeCost * machine.level;
                return (
                  <div key={machine.id} className="d-flex justify-content-between align-items-center border rounded p-2">
                    <div>
                      <div className="fw-semibold">{machine.name}</div>
                      <div className="text-secondary">Level {machine.level} - +${machine.incomePerPayout * machine.level} every {machine.payoutSeconds}s</div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleUpgradeMachine(machine.id)}
                      disabled={factoryMoney < upgradeCost}
                    >
                      Upgrade ({upgradeCost})
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {!factoryQuestionReady && !factoryAwaitingChoice ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setFactoryQuestionReady(true);
              setFactoryPrepQuestionsLeft(FACTORY_PREP_QUESTION_COUNT);
              setFeedback(`Factory prep started. Answer ${FACTORY_PREP_QUESTION_COUNT} questions, then pick your next factory.`);
            }}
          >
            Start Factory Prep ({FACTORY_PREP_QUESTION_COUNT} Questions)
          </button>
        ) : null}

        {factoryQuestionReady && currentQuestion ? (
          <>
            <div className="mb-2 mt-3">
              <span className="badge text-bg-primary">{QUESTION_TYPE_LABELS[currentQuestion.type] || currentQuestion.type}</span>
              <span className="badge text-bg-warning ms-2">{factoryPrepQuestionsLeft} left</span>
            </div>
            <h2 className="h4 mb-3">{currentQuestion.prompt}</h2>
            {renderQuestionBody({ onSubmit: submitFactoryAnswer })}
          </>
        ) : null}

        {factoryQuestionReady && !currentQuestion ? (
          <p className="mb-0">Loading factory question...</p>
        ) : null}

        {factoryAwaitingChoice ? (
          <div className="mt-4">
            <h2 className="h4 mb-2">Choose Your Next Factory</h2>
            <p className="text-secondary mb-3">Each option changes both payout amount and payout speed.</p>
            <div className="factory-choice-grid">
              {factoryChoiceOptions.map((choice) => (
                <button
                  key={`${choice.key}-${choice.label}`}
                  type="button"
                  className="factory-choice-card"
                  onClick={() => handleChooseFactory(choice)}
                >
                  <span className="factory-choice-title">{choice.label}</span>
                  <span className="factory-choice-rate">${choice.incomePerPayout} / {choice.payoutSeconds}s</span>
                  <span className="factory-choice-vibe">{choice.vibe}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          null
        )}
      </div>
    </section>
  );

  const renderOneOnOne = () => (
    <section className="card duel-mode-card">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
          <strong>Duel Pace</strong>
          <div className="form-check form-switch mb-0">
            <input
              id="auto-duel-queue"
              className="form-check-input"
              type="checkbox"
              checked={autoDuelQueue}
              onChange={(event) => setAutoDuelQueue(event.target.checked)}
            />
            <label className="form-check-label" htmlFor="auto-duel-queue">Auto-ready after each duel</label>
          </div>
        </div>
        <div className="duel-arena mb-3">
          <div className="duel-fighter">
            <div className="duel-fighter-name">You</div>
            <div className="duel-health-track">
              <div className="duel-health-fill duel-health-player" style={{ width: `${Math.max(0, Math.min(100, duelState?.playerHealth ?? 100))}%` }} />
            </div>
            <div className="duel-health-value">{duelState?.playerHealth ?? 100} HP</div>
          </div>
          <div className="duel-vs">VS</div>
          <div className="duel-fighter">
            <div className="duel-fighter-name">{duelState?.duel?.opponent?.username || 'Opponent'}</div>
            <div className="duel-health-track">
              <div className="duel-health-fill duel-health-opponent" style={{ width: `${Math.max(0, Math.min(100, duelState?.opponentHealth ?? 0))}%` }} />
            </div>
            <div className="duel-health-value">{duelState?.opponentHealth ?? '-'} HP</div>
          </div>
        </div>
        <div className="row g-3 mb-3">
          <div className="col-12 col-md-6"><strong>Queue Position:</strong> {duelState?.queuePosition || 0}</div>
          <div className="col-12 col-md-6"><strong>Status:</strong> {duelState?.status === 'duel' ? 'Live Duel' : 'Waiting Room'}</div>
        </div>

        {duelState?.lastResult?.message ? (
          <div className="alert alert-info py-2">{duelState.lastResult.message}</div>
        ) : null}

        {duelState?.status !== 'duel' ? (
          <div className="d-flex flex-column gap-2">
            <p className="mb-0">Queue up to get randomly matched into a duel. Fastest correct answer lands the attack.</p>
            <button
              type="button"
              className="btn btn-primary align-self-start"
              onClick={handleDuelReady}
              disabled={duelBusy || gameOver}
            >
              {duelBusy ? 'Queueing...' : 'Ready to duel'}
            </button>
          </div>
        ) : (
          <>
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span>Answer window</span>
                <span>{duelSecondsRemaining}s</span>
              </div>
              <div className="progress" role="progressbar" aria-label="Duel answer time remaining">
                <div
                  className="progress-bar bg-warning"
                  style={{ width: `${duelProgressPercent}%` }}
                />
              </div>
            </div>
            <p className="mb-2">
              Opponent: <strong>{duelState.duel?.opponent?.username || 'Unknown'}</strong>
            </p>
            <h2 className="h4 mb-3">{duelState.duel?.question?.prompt}</h2>
            <div className="d-grid gap-2">
              {(duelState.duel?.question?.options || []).map((option) => (
                <button
                  key={option}
                  type="button"
                  className="btn btn-outline-primary text-start"
                  onClick={() => handleDuelAnswer(option)}
                  disabled={duelBusy || duelState?.duel?.answered}
                >
                  {option}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );

  return (
    <div className="d-flex flex-column min-vh-100 app-shell">
      <Navbar />
      <main id="main-content" className="container py-5 theme-page flex-grow-1" tabIndex={-1}>
        {error ? <p id="join-form-error" className="text-danger" role="alert">{error}</p> : null}

        <div className="card mb-4" style={{ borderTop: '4px solid var(--bs-primary)' }}>
          <div className="card-body text-center">
            <p className="mb-2 text-secondary">Room Code</p>
            <h2 className="h2 fw-bold mb-0 font-monospace text-primary">{roomCode}</h2>
          </div>
        </div>

        {!joinedPlayer ? (
          <div className="mx-auto" style={{ maxWidth: '720px' }}>
            <h1 className="mb-3">Join Game</h1>
            <p className="text-secondary mb-4">Enter your name to join the hosted game.</p>

            <div className="row g-2 align-items-end">
              <div className="col-12 col-md-8">
                <label className="form-label" htmlFor="join-username">Username</label>
                <input
                  id="join-username"
                  type="text"
                  className="form-control"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="nickname"
                  aria-describedby={error ? 'join-form-error' : undefined}
                />
              </div>
              <div className="col-12 col-md-4 d-grid">
                <button type="button" className="btn btn-success" onClick={handleJoin} disabled={joining}>
                  {joining ? 'Joining...' : 'Join Room'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="row g-3 align-items-start">
            <div className={minigameType === 'tower-defence' ? 'col-12' : 'col-12 col-lg-8'}>
              <div className="card mb-3">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                      <h1 className="h3 mb-1">{MODE_LABELS[minigameType] || 'Game'} Mode</h1>
                      <p className="text-secondary mb-0">{joinedPlayer.username} in room {roomCode}</p>
                    </div>
                    <div>
                      <span className="badge text-bg-primary">Leaderboard score: {joinedPlayer.score}</span>
                    </div>
                  </div>
                </div>
              </div>

              {gameOver ? (
                <section className="card">
                  <div className="card-body text-center py-5">
                    <h2 className="h3 mb-3">Game over</h2>
                    <p className="text-secondary mb-0">The room ended because the timer ran out or the host ended it early.</p>
                  </div>
                </section>
              ) : (
                <>
                  {minigameType === 'factory' ? renderFactory() : null}
                  {minigameType === 'one-on-one' ? renderOneOnOne() : null}
                  {(minigameType === 'tower-defence' || (!['factory', 'one-on-one'].includes(minigameType))) ? renderTowerDefence() : null}
                </>
              )}

              {feedback ? (
                <div className="alert alert-info mt-3 mb-0" role="status" aria-live="polite">
                  {feedback}
                </div>
              ) : null}
            </div>

            {minigameType !== 'tower-defence' && (
              <div className="col-12 col-lg-4">
                <div className="card">
                  <div className="card-body">
                    <h2 className="h5 mb-3">Leaderboard</h2>
                    {room?.players?.length > 0 ? (
                      <ol className="mb-0 ps-3">
                        {room.players.slice(0, 8).map((player) => (
                          <li key={player._id} className="mb-2">
                            <span className="fw-semibold">{player.username}</span>
                            <span className="ms-2 text-secondary">{player.score} pts</span>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="mb-0">Leaderboard will appear here once players start scoring.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {showQuestionModal && createPortal(
          <div className="question-modal" role="presentation">
            <div className="question-modal-content" role="dialog" aria-modal="true" aria-labelledby="tower-question-title">
              <div className="d-flex flex-column gap-3">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <span className="badge text-bg-primary">
                    {QUESTION_TYPE_LABELS[currentQuestion.type] || currentQuestion.type}
                  </span>
                  <span className="badge text-bg-warning">{towerPrepQuestionsLeft} left</span>
                </div>
                <h2 id="tower-question-title" className="display-6 fw-semibold mb-0">
                  {currentQuestion.prompt}
                </h2>
                {renderQuestionBody({ onSubmit: submitTowerAnswer })}
              </div>
            </div>
          </div>,
          document.body,
        )}

        {showEndModal && joinedPlayer && createPortal(
          <div className="game-over-modal" role="presentation">
            <div className="game-over-modal-content" role="dialog" aria-modal="true" aria-labelledby="game-over-title">
              <h2 id="game-over-title">Game Over!</h2>
              <h3 className="h4 mb-4">Final Leaderboard</h3>
              {room?.players?.length > 0 ? (
                <ol className="ps-3 mb-4">
                  {room.players.slice(0, 10).map((player, index) => (
                    <li key={player._id} className="mb-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className={index === 0 ? 'fw-bold' : ''}>{player.username}</span>
                        <span className="badge text-bg-primary">{player.score} pts</span>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mb-4">No final scores available.</p>
              )}
              <p className="text-secondary mb-0 text-center">Redirecting you home in a few seconds...</p>
            </div>
          </div>,
          document.body,
        )}
      </main>
    </div>
  );
};

export default JoinRoom;
