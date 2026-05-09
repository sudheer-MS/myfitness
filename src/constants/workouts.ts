import { Dumbbell, Heart, ArrowDown, ArrowUp, Footprints } from 'lucide-react';

export interface Exercise {
  id: string;
  name: string;
  sets?: string;
  reps?: string;
  loadRecommendation?: string;
  duration?: string;
  notes?: string;
  tips?: string[];
  type: 'warmup' | 'training';
  image?: string;
}

export interface WorkoutDay {
  id: string;
  title: string;
  icon: any;
  warmup: Exercise[];
  training: Exercise[];
}

export const WORKOUT_PLAN: WorkoutDay[] = [
  {
    id: 'push',
    title: 'PUSH WORKOUT',
    icon: ArrowUp, // Using as a proxy for "push" force
    warmup: [
      { id: 'w1', name: 'HEAD SIDE TO SIDE ROTATION', type: 'warmup', sets: '3', reps: '15', image: '/workout_assets/HEAD SIDE TO SIDE ROTATION.gif', tips: ['Move slowly', 'Keep shoulders down', 'Breathe deeply'] },
      { id: 'w2', name: 'DOUBLE ARM ROTATION', type: 'warmup', sets: '3', reps: '15', image: '/workout_assets/DOUBLE ARM ROTATION.gif', tips: ['Large circles', 'Control the movement', 'Keep core tight'] },
      { id: 'w3', name: 'WRIST ROTATION', type: 'warmup', sets: '3', reps: '15', image: '/workout_assets/WRIST ROTATION.gif', tips: ['Both directions', 'Relax elbows'] },
      { id: 'w4', name: 'WIND MILL', type: 'warmup', sets: '3', reps: '15', image: '/workout_assets/WIND MILL.gif', tips: ['Keep legs straight', 'Touch opposite toe', 'Eyes on top hand'] },
      { id: 'w5', name: 'HIP ROTATION', type: 'warmup', sets: '3', reps: '15', image: '/workout_assets/HIP ROTATION.gif', tips: ['Wide stance', 'Smooth circles'] },
    ],
    training: [
      { id: 't1', name: 'FLAT DB PRESS', type: 'training', sets: '4', reps: '12', image: '/workout_assets/FLAT DB PRESS.gif', tips: ['Drive through heels', 'Squeeze chest at top', 'Elbows at 45 degrees'] },
      { id: 't2', name: 'INCLINE DB PRESS', type: 'training', sets: '3', reps: '12', image: '/workout_assets/INCLINE DB PRESS.gif', tips: ['Focus on upper chest', 'Controlled negative'] },
      { id: 't3', name: 'PEC DEC FLY', type: 'training', sets: '3', reps: '12', image: '/workout_assets/PEC DEC FLY.gif', tips: ['Soft bend in elbows', 'Peak contraction', 'Don\'t overstretch'] },
      { id: 't4', name: 'SEATED OVER HEAD DB PRESS', type: 'training', sets: '3', reps: '12', image: '/workout_assets/SEATED OVER HEAD DB PRESS.gif', tips: ['Full range of motion', 'Core braced'] },
      { id: 't5', name: 'CABLE LATERAL RAISE', type: 'training', sets: '5', reps: '12', image: '/workout_assets/CABLE LATERAL RAISE.gif', tips: ['Lead with elbows', 'Slight lean'] },
      { id: 't6', name: 'TRICEP PUSH DOWN', type: 'training', sets: '3', reps: '12', image: '/workout_assets/TRICEP PUSH DOWN.gif', tips: ['Elbows tucked', 'Full extension'] },
      { id: 't7', name: 'OVER HEAD TRICEP EXT', type: 'training', sets: '3', reps: '12', image: '/workout_assets/OVER HEAD TRICEP EXT.gif', tips: ['Keep elbows in', 'Deep stretch'] },
    ],
  },
  {
    id: 'cardio',
    title: 'CARDIO',
    icon: Heart,
    warmup: [
      { id: 'cw1', name: 'HEAD SIDE TO SIDE ROTATION', type: 'warmup', sets: '3', reps: '15', image: '/workout_assets/HEAD SIDE TO SIDE ROTATION.gif', tips: ['Warm up neck'] },
      { id: 'cw2', name: 'DOUBLE ARM ROTATION', type: 'warmup', sets: '3', reps: '15', image: '/workout_assets/DOUBLE ARM ROTATION.gif', tips: ['Shoulder mobility'] },
      { id: 'cw3', name: 'WRIST ROTATION', type: 'warmup', sets: '3', reps: '15', image: '/workout_assets/WRIST ROTATION.gif', tips: ['Joint prep'] },
      { id: 'cw4', name: 'HIP ROTATION', type: 'warmup', sets: '3', reps: '15', image: '/workout_assets/HIP ROTATION.gif', tips: ['Hip mobility'] },
    ],
    training: [
      { id: 'ct1', name: 'Cycling', type: 'training', duration: '15min', image: '/workout_assets/Cycling.gif', tips: ['Keep steady pace'] },
      { id: 'ct2', name: 'Jumping Jacks', type: 'training', sets: '5', reps: '15', image: '/workout_assets/Jumping Jacks.gif', tips: ['Stay on toes', 'Soft landings'] },
      { id: 'ct3', name: 'Side Shuffle', type: 'training', sets: '5', reps: '10', image: '/workout_assets/Side Shuffle.gif', tips: ['Stay low', 'Athletic stance'] },
      { id: 'ct4', name: 'Battle Rope', type: 'training', sets: '3', duration: '10sec max speed', image: '/workout_assets/Battle Rope.gif', tips: ['Core engaged', 'Small fast waves'] },
      { id: 'ct5', name: 'Kettle Bell Swing', type: 'training', sets: '4', reps: '25', image: '/workout_assets/Kettle Bell Swing.gif', tips: ['Hinge at hips', 'Power from glutes'] },
    ],
  },
  {
    id: 'pull',
    title: 'PULL WORKOUT',
    icon: ArrowDown, // Should be Pull icon, but ArrowDown fits the "pulling towards you" direction if flipped or used as a vector
    warmup: [
      { id: 'pw1', name: 'HEAD SIDE TO SIDE ROTATION', type: 'warmup', sets: '3', reps: '15', image: '/workout_assets/HEAD SIDE TO SIDE ROTATION.gif', tips: ['Neck prep'] },
      { id: 'pw2', name: 'DOUBLE ARM ROTATION', type: 'warmup', sets: '3', reps: '15', image: '/workout_assets/DOUBLE ARM ROTATION.gif', tips: ['Arm swing'] },
      { id: 'pw3', name: 'WRIST ROTATION', type: 'warmup', sets: '3', reps: '15', image: '/workout_assets/WRIST ROTATION.gif', tips: ['Wrist circles'] },
      { id: 'pw4', name: 'WIND MILL', type: 'warmup', sets: '3', reps: '15', image: '/workout_assets/WIND MILL.gif', tips: ['Back stretch'] },
      { id: 'pw5', name: 'HIP ROTATION', type: 'warmup', sets: '3', reps: '15', image: '/workout_assets/HIP ROTATION.gif', tips: ['Lower back prep'] },
    ],
    training: [
      { id: 'pt1', name: 'LAT PULL DOWN', type: 'training', sets: '4', reps: '12', image: '/workout_assets/LAT PULL DOWN.gif', tips: ['Pull to chest', 'Leaning slightly back'] },
      { id: 'pt2', name: 'REVERSE GRIP PULL DOWN', type: 'training', sets: '3', reps: '12', image: '/workout_assets/REVERSE GRIP PULL DOWN.gif', tips: ['Bicep focus', 'Drive elbows down'] },
      { id: 'pt3', name: 'SINGLE ARM DB ROW', type: 'training', sets: '3', reps: '12', image: '/workout_assets/SINGLE ARM DB ROW.gif', tips: ['Flat back', 'Pull to hip'] },
      { id: 'pt4', name: 'SHRUGS', type: 'training', sets: '3', reps: '12', image: '/workout_assets/SHRUGS.gif', tips: ['Control the traps', 'Deep squeeze'] },
      { id: 'pt5', name: 'REVERSE FLY', type: 'training', sets: '4', reps: '12', image: '/workout_assets/REVERSE FLY.gif', tips: ['Rear delt focus', 'Control the descent'] },
      { id: 'pt6', name: 'DB CURL', type: 'training', sets: '3', reps: '12', image: '/workout_assets/DB CURL.gif', tips: ['No swinging', 'Full squeeze'] },
      { id: 'pt7', name: 'HAMMER CURL', type: 'training', sets: '4', reps: '12', image: '/workout_assets/HAMMER CURL.gif', tips: ['Neutral grip', 'Forearm work'] },
      { id: 'pt8', name: 'PRECHAIR CURL', type: 'training', sets: '4', reps: '12', image: '/workout_assets/PRECHAIR CURL.gif', tips: ['Isolate biceps', 'Elbows forward'] },
    ],
  },
  {
    id: 'legs',
    title: 'LOWER BODY WORKOUT',
    icon: Footprints,
    warmup: [
      { id: 'lw1', name: 'HEAD SIDE TO SIDE ROTATION', type: 'warmup', sets: '3', reps: '15', image: '/workout_assets/HEAD SIDE TO SIDE ROTATION.gif', tips: ['Neck warm up'] },
      { id: 'lw2', name: 'DOUBLE ARM ROTATION', type: 'warmup', sets: '3', reps: '15', image: '/workout_assets/DOUBLE ARM ROTATION.gif', tips: ['Shoulder circles'] },
      { id: 'lw3', name: 'WRIST ROTATION', type: 'warmup', sets: '3', reps: '15', image: '/workout_assets/WRIST ROTATION.gif', tips: ['Joint mobility'] },
      { id: 'lw4', name: 'HIP ROTATION', type: 'warmup', sets: '3', reps: '15', image: '/workout_assets/HIP ROTATION.gif', tips: ['Lower body prep'] },
    ],
    training: [
      { id: 'lt1', name: 'LEG PRESS', type: 'training', sets: '5', reps: '10', image: '/workout_assets/LEG PRESS.gif', tips: ['Don\'t lock knees', 'Feet shoulder width'] },
      { id: 'lt2', name: 'LEG EXT', type: 'training', sets: '5', reps: '10', image: '/workout_assets/LEG EXT.gif', tips: ['Hold at top', 'Control weight down'] },
      { id: 'lt3', name: 'LEG CURL', type: 'training', sets: '5', reps: '10', image: '/workout_assets/LEG CURL.gif', tips: ['Hamstring focus', 'Don\'t arch back'] },
      { id: 'lt4', name: 'STANDIN HILL RAISE', type: 'training', sets: '4', reps: '10', image: '/workout_assets/STANDIN HILL RAISE.gif', tips: ['Full stretch at bottom', 'Peak calf squeeze'] },
      { id: 'lt5', name: 'PLANK', type: 'training', sets: '3', duration: 'max hold', image: '/workout_assets/PLANK.gif', tips: ['Straight line', 'Glutes tight'] },
      { id: 'lt6', name: 'SIDE PLANK', type: 'training', sets: '3', duration: 'max hold', image: '/workout_assets/SIDE PLANK.gif', tips: ['Hips high', 'Core braced'] },
    ],
  },
];

export const WEEKLY_SCHEDULE: { [key: string]: string | null } = {
  'Monday': 'push',
  'Tuesday': 'cardio',
  'Wednesday': 'pull',
  'Thursday': 'cardio',
  'Friday': 'legs',
  'Saturday': null,
  'Sunday': null,
};

export const WORKOUT_SEQUENCE = [
  { day: 'Monday', type: 'push' },
  { day: 'Tuesday', type: 'cardio' },
  { day: 'Wednesday', type: 'pull' },
  { day: 'Thursday', type: 'cardio' },
  { day: 'Friday', type: 'legs' },
];
