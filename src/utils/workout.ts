import { Exercise, WorkoutDay } from '../constants/workouts';

export interface HealthProfile {
  age: string;
  gender: string;
  height: string;
  currentWeight: string;
  activityLevel: string;
  fitnessGoal: string;
}

export function getAdjustedExercise(exercise: Exercise, profile?: HealthProfile): Exercise {
  if (exercise.type === 'warmup') return exercise;
  
  const adj = { ...exercise };
  
  const goal = profile?.fitnessGoal || 'Maintenance';
  const activityLevel = profile?.activityLevel || 'Moderate';

  let baseSets = parseInt(exercise.sets || '0', 10);
  let baseReps = exercise.reps ? parseInt(exercise.reps, 10) : 0;

  if (baseSets > 0 && baseReps > 0) {
    if (goal === 'Muscle Gain') {
      baseSets = Math.max(3, baseSets + 1);
      baseReps = 8; // Heavier weights, lower reps
    } else if (goal === 'Weight Loss') {
      baseReps = 15; // Lighter weights, higher reps
    } else if (goal === 'Endurance') {
      baseSets = Math.max(2, baseSets - 1);
      baseReps = 20; // Sustained endurance
    }

    if (activityLevel === 'Sedentary') {
      baseSets = Math.max(1, baseSets - 1);
      baseReps = Math.max(5, baseReps - 2);
    } else if (activityLevel === 'Light') {
      baseSets = Math.max(1, baseSets - 1);
    } else if (activityLevel === 'Active') {
      baseSets = baseSets + 1;
    } else if (activityLevel === 'Very Active') {
      baseSets = baseSets + 1;
      baseReps = baseReps + 2;
    }
  }

  if (adj.sets) adj.sets = baseSets > 0 ? baseSets.toString() : adj.sets;
  if (adj.reps) adj.reps = baseReps > 0 ? baseReps.toString() : adj.reps;

  if (profile?.currentWeight && !isNaN(parseFloat(profile.currentWeight))) {
    const bw = parseFloat(profile.currentWeight);
    let liftRatio = 0.2; 
    if (profile.gender === 'Female') liftRatio = 0.12;
    if (goal === 'Muscle Gain') liftRatio *= 1.2;
    else if (goal === 'Endurance') liftRatio *= 0.8;
    
    if (activityLevel === 'Active' || activityLevel === 'Very Active') liftRatio *= 1.2;
    else if (activityLevel === 'Sedentary') liftRatio *= 0.8;

    let estKg = Math.max(2, (bw * liftRatio));
    
    const name = exercise.name.toLowerCase();
    if (name.includes('lateral raise') || name.includes('fly')) estKg = Math.max(2, estKg * 0.4);
    else if (name.includes('press') && !name.includes('leg')) estKg = Math.max(2, estKg * 0.8);
    else if (name.includes('leg press')) estKg = Math.max(10, estKg * 2.5);
    else if (name.includes('squat') || name.includes('deadlift')) estKg = Math.max(10, estKg * 1.5);
    else if (name.includes('curl') || name.includes('tricep') || name.includes('extension')) estKg = Math.max(2, estKg * 0.5);
    else if (name.includes('row')) estKg = Math.max(2, estKg * 0.9);
    
    estKg = Math.round(estKg / 2.5) * 2.5;
    const beginnerKg = Math.max(2, Math.round((estKg * 0.5) / 2.5) * 2.5);

    let unit = 'each DB';
    if (name.includes('barbell') || name.includes('leg press') || name.includes('lat pull down') || name.includes('push down') || name.includes('cable') || name.includes('machine') || name.includes('smith')) {
       unit = 'total load';
    }

    if (beginnerKg < estKg) {
      adj.loadRecommendation = `${beginnerKg}kg - ${estKg}kg (${unit})`;
    } else {
      adj.loadRecommendation = `${estKg}kg (${unit})`;
    }
    
    // Add a tip for beginners about weight selection
    adj.tips = [...(exercise.tips || [])];
    if (!adj.tips.some(t => t.includes('Start with the lighter weight'))) {
      adj.tips.push('Start with the lighter weight. If you can perform all reps with perfect form, increase gradually.');
    }
  }

  return adj;
}

export function getAdjustedWorkout(day: WorkoutDay | null | undefined, profile?: HealthProfile): WorkoutDay | null {
  if (!day) return null;
  return {
    ...day,
    training: day.training.map(ex => getAdjustedExercise(ex, profile))
  };
}
