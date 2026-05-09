/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  LayoutList,
  Dumbbell, 
  History, 
  Settings, 
  Play, 
  CheckCircle2, 
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Clock,
  ArrowLeft,
  X,
  Utensils,
  Trash2,
  Check,
  Heart,
  User
} from 'lucide-react';
import { WORKOUT_PLAN, WORKOUT_SEQUENCE, WEEKLY_SCHEDULE, WorkoutDay, Exercise } from './constants/workouts';
import { getAdjustedWorkout } from './utils/workout';

type Screen = 'dashboard' | 'plan' | 'active' | 'history' | 'nutrition' | 'settings' | 'profile';

// --- Types ---
interface HealthProfile {
  age: string;
  gender: string;
  height: string;
  currentWeight: string;
  activityLevel: string;
  fitnessGoal: string;
}

interface ProgressRecord {
  id: string;
  date: string;
  workoutId: string;
  completedExercises: string[];
}

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function App() {
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [previewDay, setPreviewDay] = useState<WorkoutDay | null>(null);
  const [history, setHistory] = useState<ProgressRecord[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);
  const [settings, setSettings] = useState({
    name: 'Athlete',
    targetWeight: '75',
    restInterval: 60,
    themeColor: '#CDFF07',
    health: {
      age: '',
      gender: 'Male',
      height: '',
      currentWeight: '',
      activityLevel: 'Moderate',
      fitnessGoal: 'Muscle Gain'
    } as HealthProfile
  });
  const [activeSession, setActiveSession] = useState<{
    day: WorkoutDay;
    startTime: number;
    currentIndex: number;
    completedIds: string[];
  } | null>(null);

  // Load persistence
  useEffect(() => {
    const savedOnboarding = localStorage.getItem('fitness-onboarded');
    if (savedOnboarding === 'true') setIsOnboarded(true);

    const savedHistory = localStorage.getItem('fitness-history');
    if (savedHistory) {
      const parsed: ProgressRecord[] = JSON.parse(savedHistory);
      // Ensure all records have an ID (for legacy data)
      const sanitized = parsed.map((h, i) => ({
        ...h,
        id: h.id || `${h.date}-${h.workoutId}-${i}`
      }));
      setHistory(sanitized);
    }

    const savedSettings = localStorage.getItem('fitness-settings');
    let loadedSettings = settings;
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      loadedSettings = {
        ...settings,
        ...parsed,
        health: { ...settings.health, ...(parsed.health || {}) }
      };
      setSettings(loadedSettings);
    }

    const savedSession = localStorage.getItem('active-session');
    if (savedSession) {
      const parsed = JSON.parse(savedSession);
      // Re-map the day object from WORKOUT_PLAN to ensure icon references etc are intact
      const fullDay = getAdjustedWorkout(WORKOUT_PLAN.find(w => w.id === parsed.dayId), loadedSettings.health);
      if (fullDay) {
        setActiveSession({
          ...parsed,
          day: fullDay
        });
      }
    }
  }, []);

  // Save session when it changes
  useEffect(() => {
    if (activeSession) {
      localStorage.setItem('active-session', JSON.stringify({
        dayId: activeSession.day.id,
        currentIndex: activeSession.currentIndex,
        completedIds: activeSession.completedIds,
        startTime: activeSession.startTime
      }));
    } else {
      localStorage.removeItem('active-session');
    }
  }, [activeSession]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const deleteFromHistory = (id: string) => {
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem('fitness-history', JSON.stringify(newHistory));
    setToast({ message: 'Workout record deleted', type: 'info' });
  };

  const saveToHistory = (record: Omit<ProgressRecord, 'id'>) => {
    const newRecord: ProgressRecord = {
      ...record,
      id: Date.now().toString()
    };
    const newHistory = [...history, newRecord];
    setHistory(newHistory);
    localStorage.setItem('fitness-history', JSON.stringify(newHistory));
    localStorage.removeItem('active-session'); // Clear session on completion
  };

  const updateSettings = (newSettings: any) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('fitness-settings', JSON.stringify(updated));
    
    // Update theme color variable
    document.documentElement.style.setProperty('--color-brand-primary', updated.themeColor);
  };

  useEffect(() => {
    document.documentElement.style.setProperty('--color-brand-primary', settings.themeColor);
  }, []);

  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDayName = dayNames[today.getDay()];
  const todayWorkoutId = WEEKLY_SCHEDULE[currentDayName];
  
  const customWorkoutPlan = useMemo(() => {
    return WORKOUT_PLAN.map(day => getAdjustedWorkout(day, settings.health) as WorkoutDay);
  }, [settings.health]);

  const todayWorkout = todayWorkoutId ? customWorkoutPlan.find(w => w.id === todayWorkoutId) : null;

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) {
        setCurrentScreen('dashboard');
        setPreviewDay(null);
        return;
      }
      
      const [screen, previewId] = hash.split('/');
      const validScreens = ['dashboard', 'plan', 'active', 'history', 'nutrition', 'settings', 'profile'];
      if (validScreens.includes(screen)) {
        setCurrentScreen(screen as Screen);
      } else {
        setCurrentScreen('dashboard');
      }

      if (previewId) {
        const day = customWorkoutPlan.find(w => w.id === previewId) || null;
        setPreviewDay(day);
      } else {
        setPreviewDay(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Initialize state from hash on mount
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [customWorkoutPlan]);

  const changeScreen = (screen: Screen) => {
    if (screen === currentScreen && !previewDay) return;
    window.location.hash = `#${screen}`;
  };

  const handleSelectPreviewDay = (day: WorkoutDay) => {
    if (previewDay && previewDay.id === day.id) return;
    window.location.hash = `#plan/${day.id}`;
  };

  const startWorkout = (day: WorkoutDay, resume = false) => {
    if (resume && activeSession && activeSession.day.id === day.id) {
      if (currentScreen === 'active') return;
      window.location.hash = '#active';
      return;
    }

    setActiveSession({
      day,
      startTime: Date.now(),
      currentIndex: 0,
      completedIds: []
    });
    
    if (currentScreen !== 'active') {
      window.location.hash = '#active';
    }
  };

  return (
    <div className="h-[100dvh] bg-[#0A0A0A] text-white flex flex-col font-sans max-w-[500px] mx-auto shadow-2xl overflow-hidden relative">
      <AnimatePresence>
        {!isOnboarded ? (
          <OnboardingScreen 
            onComplete={(finalSettings: any) => {
              updateSettings(finalSettings);
              setIsOnboarded(true);
              localStorage.setItem('fitness-onboarded', 'true');
              setToast({ message: 'Welcome to your training mission', type: 'success' });
            }} 
          />
        ) : (
          <>
            {/* Header */}
      <header className="p-6 pb-2 border-b border-white/5 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter mono italic">MY FITNESS</h1>
          <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] mt-1 font-mono">Precision Discipline Growth</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => changeScreen('settings')}
            className={`p-2 rounded-xl transition-colors ${currentScreen === 'settings' ? 'bg-[var(--color-brand-primary)] text-black' : 'text-white/20 hover:bg-white/5'}`}
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
        <AnimatePresence mode="wait">
          {currentScreen === 'dashboard' && (
            <Dashboard 
              key="dashboard"
              todayWorkout={todayWorkout} 
              onStart={startWorkout} 
              history={history}
              onViewPlan={() => changeScreen('plan')}
              activeSession={activeSession}
              settings={settings}
              plan={customWorkoutPlan}
            />
          )}
          {currentScreen === 'plan' && (
            previewDay ? (
              <WorkoutPreview 
                key="preview"
                day={previewDay}
                onBack={() => window.history.back()}
                onStart={(resume?: boolean) => startWorkout(previewDay, resume)}
                activeSession={activeSession}
              />
            ) : (
              <WorkoutPlan 
                key="plan"
                onBack={() => window.history.back()} 
                onSelect={handleSelectPreviewDay}
                onStartImmediate={startWorkout}
                plan={customWorkoutPlan}
              />
            )
          )}
          {currentScreen === 'active' && activeSession && (
            <ActiveSession 
              key="active"
              session={activeSession}
              updateSession={setActiveSession}
              settings={settings}
              onComplete={(ids: string[]) => {
                saveToHistory({
                  date: new Date().toISOString().split('T')[0],
                  workoutId: activeSession.day.id,
                  completedExercises: ids
                });
                setActiveSession(null);
                window.location.replace('#dashboard');
              }}
              onCancel={() => {
                window.location.hash = '#dashboard';
              }}
            />
          )}
          {currentScreen === 'history' && (
             <HistoryScreen key="history" onBack={() => window.history.back()} history={history} onDelete={deleteFromHistory} plan={customWorkoutPlan} />
          )}
          {currentScreen === 'nutrition' && (
             <NutritionScreen key="nutrition" onBack={() => window.history.back()} />
          )}
          {currentScreen === 'settings' && (
            <SettingsScreen 
              key="settings" 
              settings={settings} 
              onUpdate={updateSettings} 
              onClearHistory={() => {
                setHistory([]);
                localStorage.removeItem('fitness-history');
                setToast({ message: 'All history cleared', type: 'success' });
              }}
              onDeleteProfile={() => {
                localStorage.removeItem('fitness-settings');
                localStorage.removeItem('fitness-onboarded');
                localStorage.removeItem('fitness-history');
                localStorage.removeItem('active-session');
                setIsOnboarded(false);
                setSettings({
                  name: 'Athlete',
                  targetWeight: '75',
                  restInterval: 60,
                  themeColor: '#CDFF07',
                  health: {
                    age: '',
                    gender: 'Male',
                    height: '',
                    currentWeight: '',
                    activityLevel: 'Moderate',
                    fitnessGoal: 'Muscle Gain'
                  }
                });
                setHistory([]);
                setActiveSession(null);
                window.location.replace('#dashboard');
                setToast({ message: 'Profile and data deleted', type: 'info' });
              }}
              onBack={() => window.history.back()}
            />
          )}
        </AnimatePresence>

        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-48px)] max-w-[400px]"
            >
              <div className="bg-[#1A1A1A] border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center gap-3">
                <div className={`p-2 rounded-xl ${toast.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-white/5 text-white/60'}`}>
                  {toast.type === 'success' ? <CheckCircle2 size={18} /> : <Trash2 size={18} />}
                </div>
                <p className="text-sm font-bold uppercase tracking-tight flex-1">{toast.message}</p>
                <div className="h-1 bg-white/5 absolute bottom-0 left-4 right-4 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: '100%' }}
                     animate={{ width: '0%' }}
                     transition={{ duration: 3, ease: 'linear' }}
                     className="h-full bg-[var(--color-brand-primary)]"
                   />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
          </>
        )}
      </AnimatePresence>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] bg-[#0A0A0A]/80 backdrop-blur-xl border-t border-white/5 flex justify-around p-4 z-50">
        <NavButton active={currentScreen === 'dashboard'} onClick={() => changeScreen('dashboard')} icon={Dumbbell} label="Home" />
        <NavButton active={currentScreen === 'plan'} onClick={() => changeScreen('plan')} icon={Calendar} label="Plan" />
        <NavButton active={currentScreen === 'nutrition'} onClick={() => changeScreen('nutrition')} icon={Utensils} label="Diet" />
        <NavButton active={currentScreen === 'history'} onClick={() => changeScreen('history')} icon={History} label="Stats" />
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-[var(--color-brand-primary)]' : 'text-white/30'}`}
    >
      <Icon size={22} strokeWidth={active ? 2.5 : 2} />
      <span className="text-[9px] uppercase font-bold tracking-widest leading-none">{label}</span>
    </button>
  );
}

// --- Sub-Screens ---

function deriveFitnessGoal(current: string, target: string, fallback: string): { goal: string, derived: boolean } {
  const c = parseFloat(current);
  const t = parseFloat(target);
  if (!isNaN(c) && !isNaN(t)) {
    if (t < c) return { goal: 'Weight Loss', derived: true };
    else if (t > c) return { goal: 'Muscle Gain', derived: true };
    else return { goal: 'Maintenance', derived: true };
  }
  return { goal: fallback, derived: false };
}

function SetsRepsMatrix({ goal, activityLevel, isAutoDerived, weight, gender }: { goal: string, activityLevel: string, isAutoDerived?: boolean, weight?: string, gender?: string }) {
  const [isRefOpen, setIsRefOpen] = useState(false);
  let sets = 3;
  let reps = 12;
  let load = "Moderate";
  let loadDesc = "60-70% 1RM";

  if (goal === 'Muscle Gain') {
    sets = Math.max(3, sets + 1);
    reps = 8;
    load = "Heavy";
    loadDesc = "75-85% 1RM";
  } else if (goal === 'Weight Loss') {
    reps = 15;
    load = "Light";
    loadDesc = "50-65% 1RM";
  } else if (goal === 'Endurance') {
    sets = Math.max(2, sets - 1);
    reps = 20;
    load = "Very Lgt";
    loadDesc = "40-50% 1RM";
  }

  if (activityLevel === 'Sedentary') {
    sets = Math.max(1, sets - 1);
    reps = Math.max(5, reps - 2);
    loadDesc = "Focus on form";
  } else if (activityLevel === 'Light') {
    sets = Math.max(1, sets - 1);
  } else if (activityLevel === 'Active') {
    sets += 1;
  } else if (activityLevel === 'Very Active') {
    sets += 1;
    reps += 2;
  }

  let dbWeight = "";
  if (weight && !isNaN(parseFloat(weight))) {
    const bw = parseFloat(weight);
    let liftRatio = 0.2; 
    if (gender === 'Female') liftRatio = 0.12;
    if (goal === 'Muscle Gain') liftRatio *= 1.2;
    else if (goal === 'Endurance') liftRatio *= 0.8;
    
    if (activityLevel === 'Active' || activityLevel === 'Very Active') liftRatio *= 1.2;
    else if (activityLevel === 'Sedentary') liftRatio *= 0.8;

    const estKg = Math.max(2, Math.round((bw * liftRatio) / 2.5) * 2.5);
    dbWeight = `${estKg}kg DBs`;
  }

  return (
    <div className="bg-[#141414] p-4 rounded-3xl border border-white/5 space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="text-[10px] uppercase font-bold tracking-widest text-white/40">Target Matrix (Est.)</h4>
        {isAutoDerived && <span className="text-[9px] bg-[var(--color-brand-primary)] text-black font-bold uppercase px-2 py-0.5 rounded-full">Pre-selected</span>}
      </div>
      <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
         <div className="text-center flex-1">
             <div className="text-[10px] uppercase text-white/30 font-bold tracking-widest mb-1">Sets</div>
             <div className="text-2xl font-black">{sets}</div>
         </div>
         <div className="w-px h-8 bg-white/10"></div>
         <div className="text-center flex-1">
             <div className="text-[10px] uppercase text-white/30 font-bold tracking-widest mb-1">Reps</div>
             <div className="text-2xl font-black">{reps}</div>
         </div>
         <div className="w-px h-8 bg-white/10"></div>
         <div className="text-center flex-1">
             <div className="text-[10px] uppercase text-white/30 font-bold tracking-widest mb-1">Load</div>
             <div className="text-lg font-black leading-[1.1] mt-1">{dbWeight || load}</div>
             <div className="text-[8px] uppercase text-white/40 mt-1">{loadDesc}</div>
         </div>
      </div>
      {isAutoDerived ? (
        <p className="text-[9px] text-[var(--color-brand-primary)] text-center font-bold uppercase tracking-wider">Objectives auto-adjusted based on body weight goal.</p>
      ) : (
        <p className="text-[9px] text-white/30 text-center uppercase tracking-wider">Dynamic adjustments based on profile</p>
      )}

      <div className="border-t border-white/5 pt-3 mt-3">
        <button 
          onClick={(e) => { e.preventDefault(); setIsRefOpen(!isRefOpen); }}
          className="w-full flex items-center justify-between text-[10px] text-white/40 uppercase font-bold tracking-widest hover:text-white/60 transition-colors"
        >
          <span>Matrix Reference Chart</span>
          {isRefOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        <AnimatePresence>
          {isRefOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-2">
                 <div className="grid grid-cols-4 gap-2 text-[8px] uppercase tracking-widest font-bold text-white/30 border-b border-white/5 pb-2">
                    <div>Goal</div>
                    <div className="text-center">Sets</div>
                    <div className="text-center">Reps</div>
                    <div className="text-right">Load</div>
                 </div>
                 <div className="grid grid-cols-4 gap-2 text-[10px] font-medium text-white/60 py-1">
                    <div className="text-white font-bold">Muscle Gain</div>
                    <div className="text-center">3-5</div>
                    <div className="text-center">6-10</div>
                    <div className="text-right">75-85%</div>
                 </div>
                 <div className="grid grid-cols-4 gap-2 text-[10px] font-medium text-white/60 py-1">
                    <div className="text-white font-bold">Weight Loss</div>
                    <div className="text-center">2-4</div>
                    <div className="text-center">12-15+</div>
                    <div className="text-right">50-65%</div>
                 </div>
                 <div className="grid grid-cols-4 gap-2 text-[10px] font-medium text-white/60 py-1">
                    <div className="text-white font-bold">Endurance</div>
                    <div className="text-center">2-3</div>
                    <div className="text-center">15-20+</div>
                    <div className="text-right">40-50%</div>
                 </div>
                 <div className="grid grid-cols-4 gap-2 text-[10px] font-medium text-white/60 py-1">
                    <div className="text-white font-bold">Maintenance</div>
                    <div className="text-center">3</div>
                    <div className="text-center">10-12</div>
                    <div className="text-right">60-70%</div>
                 </div>
                 <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                    <h5 className="text-[9px] uppercase tracking-widest font-bold text-white/40">How it works</h5>
                    <ul className="text-[10px] text-white/60 space-y-1 list-disc pl-3">
                       <li><strong className="text-white">Weight Loss:</strong> Target Weight &lt; Current Weight</li>
                       <li><strong className="text-white">Muscle Gain:</strong> Target Weight &gt; Current Weight</li>
                       <li><strong className="text-white">Maintenance:</strong> Target Weight = Current Weight</li>
                    </ul>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Dashboard({ todayWorkout, onStart, history, onViewPlan, activeSession, settings, plan }: any) {
  const completedToday = history.some((h: any) => h.date === new Date().toISOString().split('T')[0]);
  const streak = history.length; // Simplified streak check
  const isResumable = todayWorkout && activeSession && activeSession.day.id === todayWorkout.id;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 space-y-8"
    >
      <div className="flex items-baseline gap-2">
        <h2 className="text-3xl font-bold tracking-tighter uppercase leading-none">Welcome, {settings.name}</h2>
      </div>
      {/* Active Workout Banner */}
      {activeSession && (
        <div className="bg-[var(--color-brand-primary)]/10 border border-[var(--color-brand-primary)]/20 rounded-2xl p-4 flex justify-between items-center">
           <div className="flex items-center gap-3">
              <div className="animate-pulse bg-[var(--color-brand-primary)] w-2 h-2 rounded-full" />
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-brand-primary)]">Session in Progress</span>
           </div>
           <button 
             onClick={() => onStart(activeSession.day, true)}
             className="text-[10px] font-bold uppercase tracking-widest bg-[var(--color-brand-primary)] text-black px-3 py-1.5 rounded-lg"
           >
             Resume
           </button>
        </div>
      )}

      {/* Hero Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#141414] p-5 border border-white/5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-brand-primary)]/5 blur-2xl rounded-full" />
          <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-2">Current Streak</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold mono">{streak}</span>
            <span className="text-sm text-white/20 uppercase font-bold">Days</span>
          </div>
        </div>
        <div className="bg-[#141414] p-5 border border-white/5 rounded-2xl">
          <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-2">Completed</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold mono">{history.length}</span>
            <span className="text-sm text-white/20 uppercase font-bold">Total</span>
          </div>
        </div>
      </div>

      {/* Today's Call to Action */}
      <div className="bg-[#141414] border border-white/5 rounded-3xl p-6 space-y-6 relative overflow-hidden">
        {todayWorkout ? (
          <>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-[10px] text-[var(--color-brand-primary)] font-bold uppercase tracking-[0.2em] mb-1">TODAY'S MISSION</h2>
                <h3 className="text-2xl font-bold tracking-tight uppercase leading-none">{todayWorkout.title}</h3>
              </div>
              <div className="bg-white/5 p-3 rounded-2xl">
                <todayWorkout.icon className="text-white/40" size={24} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-white/40 text-xs">
                 <Clock size={14} />
                 <span>Estimated: {todayWorkout.id === 'cardio' ? '30-40 min' : '45-60 min'}</span>
              </div>
              <div className="flex items-center gap-3 text-white/40 text-xs text-brand-primary">
                 <Dumbbell size={14} className="text-[var(--color-brand-primary)]" />
                 <span className="text-white/80">Intense Hypertrophy</span>
              </div>
            </div>

            <button 
              onClick={() => onStart(todayWorkout)}
              disabled={completedToday}
              className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 transition-transform active:scale-95 font-bold uppercase tracking-widest text-black ${completedToday ? 'bg-white/10 text-white/30 cursor-not-allowed' : 'bg-[var(--color-brand-primary)]'}`}
            >
              {completedToday ? (
                <>
                  <CheckCircle2 size={24} />
                  <span>Workout Completed</span>
                </>
              ) : (
                <>
                  <Play size={24} fill="currentColor" />
                  <span>Initiate Training</span>
                </>
              )}
            </button>
          </>
        ) : (
          <div className="py-10 text-center space-y-4">
             <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
               <Heart size={32} className="text-white/10" />
             </div>
             <h3 className="text-xl font-bold uppercase tracking-tight">Active Recovery</h3>
             <p className="text-xs text-white/40 uppercase tracking-widest">Rest is as important as training. Take it easy today!</p>
          </div>
        )}
      </div>

      {/* Plan Preview */}
      <div>
        <div className="flex justify-between items-center mb-4 px-2">
          <h4 className="text-sm font-bold uppercase tracking-widest text-white/60">Weekly Routine</h4>
          <button onClick={onViewPlan} className="text-xs text-[var(--color-brand-primary)] font-bold">View All</button>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {WORKOUT_SEQUENCE.map((s) => {
             const day = plan.find((w: WorkoutDay) => w.id === s.type)!;
             return (
               <div key={s.day} className="flex-shrink-0 w-32 bg-[#141414] p-4 rounded-2xl border border-white/5 space-y-3">
                  <div className="text-[10px] text-white/30 uppercase font-bold">{s.day}</div>
                  <div className="text-xs font-bold uppercase truncate">{day.id === 'cardio' ? 'Cardio' : day.id}</div>
                  <day.icon size={16} className="text-white/20" />
               </div>
             )
          })}
        </div>
      </div>
    </motion.div>
  );
}

function WorkoutPlan({ onBack, onSelect, onStartImmediate, plan }: any) {
  return (
    <motion.div 
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="p-6 space-y-6"
    >
      <header className="flex items-center gap-4 mb-8">
        <h2 className="text-xl font-bold tracking-tight uppercase">Master Routine</h2>
      </header>

        <div className="space-y-4">
        {plan.map((day: WorkoutDay) => (
          <div 
            key={day.id} 
            onClick={() => onSelect(day)}
            className="bg-[#141414] border border-white/5 rounded-3xl p-6 group transition-all hover:bg-white/5 cursor-pointer active:scale-[0.98]"
          >
             <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white/5 p-3 rounded-2xl text-white/40 group-hover:text-[var(--color-brand-primary)]">
                    <day.icon size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold uppercase tracking-tight">{day.title}</h3>
                    <p className="text-[10px] text-white/30 uppercase font-bold">{day.training.length} Training Phases</p>
                  </div>
                </div>
                <button 
                   onClick={(e) => {
                     e.stopPropagation();
                     onStartImmediate(day);
                   }}
                   className="p-3 text-[var(--color-brand-primary)] hover:scale-110 transition-transform bg-white/5 rounded-xl"
                >
                  <Play size={20} fill="currentColor" />
                </button>
             </div>
             <div className="space-y-2 border-t border-white/5 pt-4">
                {day.training.slice(0, 3).map((ex: any) => (
                  <div key={ex.id} className="flex justify-between items-center text-xs text-white/40">
                    <div>
                      <span>{ex.name}</span>
                      {ex.loadRecommendation && <div className="text-[9px] text-[var(--color-brand-primary)] mt-0.5">{ex.loadRecommendation}</div>}
                    </div>
                    <span className="mono">{ex.sets} × {ex.reps || ex.duration}</span>
                  </div>
                ))}
                {day.training.length > 3 && <div className="text-[10px] text-white/20 pt-1">+ {day.training.length - 3} more</div>}
             </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function WorkoutPreview({ day, onBack, onStart, activeSession }: any) {
  const allExercises = [...day.warmup, ...day.training];
  const hasProgress = activeSession && activeSession.day.id === day.id;

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="p-6 space-y-6"
    >
      <header className="flex items-center justify-between mb-4">
        <div></div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-white/40">Workout Preview</h2>
        <div className="w-10"></div>
      </header>

      <div className="bg-[#141414] rounded-3xl border border-white/5 p-6 mb-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-[var(--color-brand-primary)]/10 p-4 rounded-2xl text-[var(--color-brand-primary)]">
            <day.icon size={32} />
          </div>
          <div>
            <h3 className="text-2xl font-bold tracking-tight uppercase leading-none mb-1">{day.title}</h3>
            <p className="text-xs text-white/40 uppercase font-bold tracking-widest">{allExercises.length} Total Exercises</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          {hasProgress && (
            <button 
              onClick={() => onStart(true)}
              className="w-full bg-[var(--color-brand-primary)] text-black py-4 rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-transform"
            >
              <History size={20} />
              <span>Resume Progress</span>
            </button>
          )}
          <button 
            onClick={() => onStart(false)}
            className={`w-full py-4 rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-transform ${hasProgress ? 'bg-white/5 text-white/40 border border-white/10' : 'bg-[var(--color-brand-primary)] text-black'}`}
          >
            <Play size={20} fill={!hasProgress ? "currentColor" : "none"} />
            <span>{hasProgress ? 'Restart Session' : 'Start Session'}</span>
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 px-2 mb-2">Exercise List</h4>
        {allExercises.map((ex, idx) => (
          <div key={ex.id} className="bg-[#141414]/50 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm font-medium">
              <span className="text-[10px] mono text-white/20 w-4">{idx + 1}</span>
              <div className="flex flex-col">
                <span className="uppercase tracking-tight text-white/80">{ex.name}</span>
                {ex.loadRecommendation && <span className="text-[9px] text-[var(--color-brand-primary)] mt-0.5">{ex.loadRecommendation}</span>}
              </div>
            </div>
            <div className="text-[10px] mono text-[var(--color-brand-primary)] font-bold">
              {ex.sets} × {ex.reps || ex.duration}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function ActiveSession({ session, onComplete, onCancel, updateSession, settings }: any) {
  const { day, currentIndex, completedIds } = session;
  const [restTime, setRestTime] = useState(0);
  const [isResting, setIsResting] = useState(false);

  const allExercises = [...day.warmup, ...day.training];
  const current = allExercises[currentIndex];
  const isLast = currentIndex === allExercises.length - 1;

  useEffect(() => {
    let timer: any;
    if (isResting && restTime > 0) {
      timer = setInterval(() => setRestTime(t => t - 1), 1000);
    } else if (restTime === 0) {
      setIsResting(false);
    }
    return () => clearInterval(timer);
  }, [isResting, restTime]);

  const handleBack = () => {
    if (currentIndex > 0) {
      updateSession({
        ...session,
        currentIndex: currentIndex - 1
      });
      setIsResting(false);
    }
  };

  const handleNext = () => {
    const newCompletedIds = completedIds.includes(current.id) 
      ? completedIds 
      : [...completedIds, current.id];
    
    if (isLast) {
      onComplete(newCompletedIds);
    } else {
      setRestTime(settings.restInterval || 60); // Use user rest interval
      setIsResting(true);
      updateSession({
        ...session,
        currentIndex: currentIndex + 1,
        completedIds: newCompletedIds
      });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-[100] bg-[#0A0A0A] flex flex-col p-6 sm:p-8"
    >
      {/* Session Header */}
      <div className="flex justify-between items-center pb-6">
        <div className="flex items-center gap-4">
          <div className="text-[10px] mono bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] px-2 py-1 rounded">
            {currentIndex + 1} / {allExercises.length}
          </div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-white/40 truncate max-w-[150px]">{session.day.title}</h2>
        </div>
        <button onClick={onCancel} className="bg-white/5 p-2 rounded-xl text-white/40"><X size={20}/></button>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-12">
        <motion.div 
          className="h-full bg-[var(--color-brand-primary)]"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / allExercises.length) * 100}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        {isResting ? (
          <motion.div 
            key="rest"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex-1 flex flex-col items-center justify-center space-y-8"
          >
            <div className="text-center">
              <h3 className="text-[10px] text-[var(--color-brand-primary)] font-bold uppercase tracking-[0.3em] mb-2">RECOVERY PHASE</h3>
              <div className="text-8xl font-bold mono tabular-nums">
                {restTime}
              </div>
            </div>
            <div className="space-y-2 text-center px-12">
              <p className="text-xs text-white/40 uppercase tracking-widest">Next Up</p>
              <h4 className="text-xl font-bold tracking-tight uppercase leading-tight">{allExercises[currentIndex]?.name}</h4>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setRestTime(t => t + 10)} className="text-[10px] font-bold uppercase tracking-widest border border-white/10 px-4 py-2 rounded-lg">+10s</button>
              <button onClick={() => setIsResting(false)} className="text-[10px] font-bold uppercase tracking-widest bg-white/5 px-4 py-2 rounded-lg">Skip Rest</button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="exercise"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto no-scrollbar pt-2">
              <div className="bg-[#141414] aspect-[4/3] rounded-3xl border border-white/5 flex items-center justify-center overflow-hidden relative mb-6 group shrink-0">
                {current.image ? (
                  <img 
                    src={current.image.startsWith('/') ? import.meta.env.BASE_URL + current.image.slice(1) : current.image} 
                    alt={current.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Dumbbell size={60} className="text-white/10 group-hover:scale-110 transition-transform duration-700" />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 pt-12">
                  <div className="inline-block bg-[var(--color-brand-primary)] text-black text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest mb-2">
                    {current.type}
                  </div>
                  <h3 className="text-2xl font-bold tracking-tighter leading-none uppercase">{current.name}</h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 shrink-0">
                <div className="bg-[#141414] p-6 rounded-2xl border border-white/5 flex flex-col justify-center">
                  <p className="text-[10px] text-white/30 uppercase font-bold mb-1">Target Sets</p>
                  <p className="text-3xl font-bold mono">{current.sets || '—'}</p>
                </div>
                <div className="bg-[#141414] p-6 rounded-2xl border border-white/5 flex flex-col justify-center">
                  <p className="text-[10px] text-white/30 uppercase font-bold mb-1">{current.duration ? 'Duration' : 'Target Reps'}</p>
                  <p className="text-2xl font-bold mono truncate">{current.reps || current.duration || '—'}</p>
                </div>
              </div>
              
              {current.loadRecommendation && (
                <div className="mb-6 p-4 bg-[var(--color-brand-primary)]/10 border border-[var(--color-brand-primary)]/20 rounded-2xl shrink-0">
                  <p className="text-[10px] text-[var(--color-brand-primary)] uppercase font-bold tracking-widest mb-1">Est. Load Recommendation</p>
                  <p className="text-xl font-bold text-white mono">{current.loadRecommendation}</p>
                </div>
              )}

              {current.tips && (
                <div className="mb-8 p-4 bg-white/5 border border-white/5 rounded-2xl shrink-0">
                   <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Pro Tips</h4>
                   <ul className="space-y-1">
                     {current.tips.map((tip: string, i: number) => (
                       <li key={i} className="text-xs text-white/60">· {tip}</li>
                     ))}
                   </ul>
                </div>
              )}
            </div>

            <div className="pt-4 shrink-0 flex gap-4 bg-[#0A0A0A]">
              {currentIndex > 0 && (
                <button 
                  onClick={handleBack}
                  className="bg-white/5 text-white/40 border border-white/10 px-6 rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center active:scale-95 transition-transform"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              <button 
                onClick={handleNext}
                className="flex-1 bg-[var(--color-brand-primary)] text-black py-5 rounded-2xl font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-transform"
              >
                <span>{isLast ? 'Finish Session' : 'Register Set'}</span>
                <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function HistoryScreen({ onBack, history, onDelete, plan }: any) {
  const [selectedRecord, setSelectedRecord] = useState<ProgressRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [viewDate, setViewDate] = useState(new Date());

  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));

  const changeMonth = (delta: number) => {
    const next = new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1);
    setViewDate(next);
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const days = [];
    const monthName = viewDate.toLocaleString('default', { month: 'long' });
    const weekdayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    // Empty slots before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />);
    }

    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const workoutOnThisDay = history.find((h: any) => h.date === dateStr);
      
      days.push(
        <div 
          key={d} 
          onClick={() => workoutOnThisDay && setSelectedRecord(workoutOnThisDay)}
          className={`h-10 flex items-center justify-center rounded-xl text-[10px] font-bold transition-all relative ${
            workoutOnThisDay 
              ? 'bg-[var(--color-brand-primary)] text-black cursor-pointer scale-110 shadow-lg shadow-[var(--color-brand-primary)]/20' 
              : 'text-white/20'
          }`}
        >
          {d}
          {workoutOnThisDay && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-black rounded-full" />
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <button onClick={() => changeMonth(-1)} className="bg-white/5 p-2 rounded-lg text-white/40"><ChevronLeft size={16}/></button>
          <div className="text-center">
            <h4 className="text-xs font-bold uppercase tracking-widest">{monthName}</h4>
            <p className="text-[10px] text-white/20 mono">{year}</p>
          </div>
          <button onClick={() => changeMonth(1)} className="bg-white/5 p-2 rounded-lg text-white/40"><ChevronRight size={16}/></button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weekdayNames.map((name, i) => (
            <div key={`${name}-${i}`} className="h-8 flex items-center justify-center text-[10px] font-bold text-white/20 uppercase">{name}</div>
          ))}
          {days}
        </div>
        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-[var(--color-brand-primary)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Workout Completed</span>
          </div>
          <p className="text-[9px] text-white/20 leading-relaxed uppercase">Tap on highlighted dates to view workout details and exercise logs.</p>
        </div>
      </div>
    );
  };

  if (selectedRecord) {
    const matchedPlan = plan.find((p: any) => p.id === selectedRecord.workoutId);
    const allEx = matchedPlan ? [...matchedPlan.warmup, ...matchedPlan.training] : [];
    
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 space-y-6"
      >
        <header className="flex justify-between items-center mb-4">
          <div className="text-left">
            <h2 className="text-lg font-bold uppercase tracking-tight">{plan?.title}</h2>
            <p className="text-[10px] text-white/30 mono">{selectedRecord.date}</p>
          </div>
          {deletingId === selectedRecord.id ? (
            <div className="flex gap-2">
              <button 
                onClick={() => setDeletingId(null)}
                className="bg-white/10 p-2 rounded-xl text-white/40"
              >
                <X size={20}/>
              </button>
              <button 
                onClick={() => {
                  onDelete(selectedRecord.id);
                  setSelectedRecord(null);
                  setDeletingId(null);
                }}
                className="bg-red-500 p-2 rounded-xl text-white"
              >
                <Check size={20}/>
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setDeletingId(selectedRecord.id)}
              className="bg-red-500/10 p-2 rounded-xl text-red-500"
            >
              <Trash2 size={20}/>
            </button>
          )}
        </header>

        <div className="space-y-3">
          {allEx.map((ex) => {
            const isCompleted = selectedRecord.completedExercises.includes(ex.id);
            return (
              <div key={ex.id} className={`p-4 rounded-2xl border flex items-center justify-between ${isCompleted ? 'bg-[var(--color-brand-primary)]/5 border-[var(--color-brand-primary)]/20' : 'bg-white/5 border-white/5 opacity-40'}`}>
                <div className="flex items-center gap-3">
                  {isCompleted ? <CheckCircle2 size={16} className="text-[var(--color-brand-primary)]" /> : <div className="w-4 h-4 rounded-full border border-white/20" />}
                  <span className="text-sm font-bold uppercase">{ex.name}</span>
                </div>
                <div className="text-[10px] mono">
                  {ex.sets}×{ex.reps || ex.duration}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      className="p-6 space-y-8"
    >
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold tracking-tight uppercase">Activity Stream</h2>
        </div>
        <div className="bg-[#141414] p-1 rounded-xl flex border border-white/5">
          <button 
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/20'}`}
          >
            <LayoutList size={16} />
          </button>
          <button 
            onClick={() => setViewMode('calendar')}
            className={`p-1.5 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-white/10 text-white' : 'text-white/20'}`}
          >
            <Calendar size={16} />
          </button>
        </div>
      </header>

      <div className="space-y-4">
        {viewMode === 'calendar' ? (
          renderCalendar()
        ) : sorted.length === 0 ? (
          <div className="text-center py-20 text-white/20">
            <History size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm uppercase tracking-widest font-bold">No history recorded yet</p>
          </div>
        ) : (
          sorted.map((item) => {
            const matchedPlan = plan.find((p: any) => p.id === item.workoutId);
            return (
              <div 
                key={item.id} 
                onClick={() => setSelectedRecord(item)}
                className="bg-[#141414] border border-white/5 rounded-2xl p-5 flex justify-between items-center cursor-pointer hover:bg-white/5 active:scale-[0.98] transition-all"
              >
                <div className="flex gap-4 items-center">
                   <div className="bg-white/5 p-3 rounded-xl">
                      {matchedPlan ? <matchedPlan.icon size={20} className="text-white/40" /> : <Dumbbell size={20} className="text-white/40" />}
                   </div>
                   <div>
                      <h4 className="text-sm font-bold uppercase">{matchedPlan?.title || 'Unknown Workout'}</h4>
                      <p className="text-[10px] text-white/30 mono">{item.date}</p>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <div className="text-[10px] font-bold text-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 px-2 py-1 rounded">
                      {item.completedExercises.length} Done
                   </div>
                   {deletingId === item.id ? (
                     <div className="flex items-center gap-1 bg-red-500/10 p-1 rounded-xl">
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           setDeletingId(null);
                         }}
                         className="p-1.5 text-white/40"
                       >
                         <X size={14} />
                       </button>
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           onDelete(item.id);
                           setDeletingId(null);
                         }}
                         className="p-1.5 text-red-500"
                       >
                         <Check size={14} />
                       </button>
                     </div>
                   ) : (
                     <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         setDeletingId(item.id);
                       }}
                       className="p-2 text-white/10 hover:text-red-500 transition-colors"
                     >
                       <Trash2 size={16} />
                     </button>
                   )}
                   <ChevronRight size={16} className="text-white/10" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}


function NutritionScreen({ onBack }: any) {
  const nutritionPlan = [
    { label: 'BREAK FAST', content: '2 dates + 1 banana + 1 scoop whey' },
    { label: 'SNACKS', content: '3 boiled eggs + 100gm papaya' },
    { label: 'LUNCH', content: '150gm rice + 200gm chicken + any curry (200gm curd add any 1 seasonal fruit + 1 tbsp honey)' },
    { label: 'SNACKS', content: 'Chana salad' },
    { label: 'DINNER', content: '150gm rice + 150gm paneer or chicken + any curry + 250ml milk or 200gm curd' },
  ];

  return (
    <motion.div 
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="p-6 space-y-8"
    >
      <header className="flex items-center gap-4">
        <h2 className="text-xl font-bold tracking-tight uppercase">Nutrition Plan</h2>
      </header>

      <div className="space-y-6">
        <div className="bg-[#141414] p-6 rounded-3xl border border-white/5 space-y-2">
           <h3 className="text-[10px] text-[var(--color-brand-primary)] font-bold tracking-[0.2em] uppercase">Phase: Muscle Building</h3>
           <p className="text-sm text-white/40 italic">Consistency in diet is as vital as training intensity.</p>
        </div>

        {nutritionPlan.map((item, idx) => (
          <div key={`meal-${idx}`} className="relative pl-8 border-l border-white/10 space-y-1">
            <div className="absolute left-[-5px] top-1 w-[9px] h-[9px] rounded-full bg-[var(--color-brand-primary)] shadow-[0_0_10px_rgba(204,255,0,0.5)]" />
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40">{item.label}</h4>
            <p className="text-sm leading-relaxed">{item.content}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function SettingsScreen({ settings, onUpdate, onClearHistory, onDeleteProfile, onBack }: any) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [localHealth, setLocalHealth] = useState(settings.health || {
    age: '',
    gender: 'Male',
    height: '',
    currentWeight: '',
    activityLevel: 'Moderate',
    fitnessGoal: 'Muscle Gain'
  });
  const [localName, setLocalName] = useState(settings.name || 'Athlete');
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isAutoDerived, setIsAutoDerived] = useState(false);

  const colors = [
    '#CDFF07',
    '#00F2FF',
    '#FF3D00',
    '#AD00FF',
    '#FFD600'
  ];
  
  const activityLevels = ['Sedentary', 'Light', 'Moderate', 'Active', 'Very Active'];
  const goals = ['Weight Loss', 'Muscle Gain', 'Maintenance', 'Endurance'];

  const handleUpdateHealth = (field: string, value: string) => {
    let updatedHealth = { ...localHealth, [field]: value };
    if (field === 'currentWeight') {
       const derivation = deriveFitnessGoal(value, localSettings.targetWeight, updatedHealth.fitnessGoal);
       updatedHealth.fitnessGoal = derivation.goal;
       setIsAutoDerived(derivation.derived);
    }
    if (field === 'fitnessGoal') setIsAutoDerived(false);
    setLocalHealth(updatedHealth);
    onUpdate({ health: updatedHealth });
  };

  return (
    <motion.div 
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="p-6 space-y-8"
    >
      <header className="flex items-center gap-4">
        <h2 className="text-xl font-bold tracking-tight uppercase">Settings</h2>
      </header>

      <div className="space-y-6">
        {/* Basic Stats */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-2">Account & Stats</h3>
          <div className="bg-[#141414] rounded-3xl border border-white/5 overflow-hidden divide-y divide-white/5">
            <div className="p-4">
              <label className="text-[10px] text-white/20 uppercase font-bold mb-1 block">Display Name</label>
              <input 
                type="text" 
                value={localName}
                onChange={(e) => {
                  setLocalName(e.target.value);
                  onUpdate({ name: e.target.value });
                }}
                className="w-full bg-transparent text-white font-bold outline-none"
              />
            </div>
            <div className="grid grid-cols-2">
              <div className="p-4 border-r border-white/5">
                <label className="text-[10px] text-white/20 uppercase font-bold mb-1 block">Age</label>
                <input 
                  type="number" 
                  value={localHealth.age}
                  placeholder="24"
                  onChange={(e) => handleUpdateHealth('age', e.target.value)}
                  className="w-full bg-transparent text-white font-bold outline-none"
                />
              </div>
              <div className="p-4">
                <label className="text-[10px] text-white/20 uppercase font-bold mb-1 block">Gender</label>
                <select 
                  value={localHealth.gender}
                  onChange={(e) => handleUpdateHealth('gender', e.target.value)}
                  className="w-full bg-transparent text-white font-bold outline-none appearance-none cursor-pointer"
                >
                  <option value="Male" className="bg-[#141414]">Male</option>
                  <option value="Female" className="bg-[#141414]">Female</option>
                  <option value="Other" className="bg-[#141414]">Other</option>
                </select>
              </div>
            </div>
            <div className="p-4">
              <label className="text-[10px] text-white/20 uppercase font-bold mb-1 block">Height (CM)</label>
              <input 
                type="number" 
                value={localHealth.height}
                placeholder="175"
                onChange={(e) => handleUpdateHealth('height', e.target.value)}
                className="w-full bg-transparent text-white font-bold outline-none"
              />
            </div>
            <div className="grid grid-cols-2">
              <div className="p-4 border-r border-white/5">
                <label className="text-[10px] text-white/20 uppercase font-bold mb-1 block">Current Weight (KG)</label>
                <input 
                  type="number" 
                  value={localHealth.currentWeight}
                  placeholder="70"
                  onChange={(e) => handleUpdateHealth('currentWeight', e.target.value)}
                  className="w-full bg-transparent text-white font-bold outline-none"
                />
              </div>
              <div className="p-4">
                <label className="text-[10px] text-white/20 uppercase font-bold mb-1 block">Target Weight (KG)</label>
                <input 
                  type="number" 
                  value={localSettings.targetWeight}
                  placeholder="75"
                  onChange={(e) => {
                    const val = e.target.value;
                    const derivation = deriveFitnessGoal(localHealth.currentWeight, val, localHealth.fitnessGoal);
                    const updatedHealth = { ...localHealth, fitnessGoal: derivation.goal };
                    setLocalSettings({ ...localSettings, targetWeight: val });
                    setLocalHealth(updatedHealth);
                    setIsAutoDerived(derivation.derived);
                    onUpdate({ targetWeight: val, health: updatedHealth });
                  }}
                  className="w-full bg-transparent text-white font-bold outline-none"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Goals & Activity */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-2">Objectives</h3>
          <SetsRepsMatrix 
            goal={localHealth.fitnessGoal} 
            activityLevel={localHealth.activityLevel} 
            isAutoDerived={isAutoDerived}
            weight={localHealth.currentWeight}
            gender={localHealth.gender}
          />
          <div className="bg-[#141414] rounded-3xl border border-white/5 p-4 space-y-4">
            <div>
              <label className="text-[10px] text-white/20 uppercase font-bold mb-3 block">Fitness Goal</label>
              <div className="flex flex-wrap gap-2">
                {goals.map(goal => (
                  <button 
                    key={goal}
                    onClick={() => handleUpdateHealth('fitnessGoal', goal)}
                    className={`text-[10px] font-bold px-3 py-2 rounded-xl transition-all ${localHealth.fitnessGoal === goal ? 'bg-[var(--color-brand-primary)] text-black' : 'bg-white/5 text-white/40'}`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-white/20 uppercase font-bold mb-3 block">Activity Level</label>
              <div className="flex flex-wrap gap-2">
                {activityLevels.map(level => (
                  <button 
                    key={level}
                    onClick={() => handleUpdateHealth('activityLevel', level)}
                    className={`text-[10px] font-bold px-3 py-2 rounded-xl transition-all ${localHealth.activityLevel === level ? 'bg-[var(--color-brand-primary)] text-black' : 'bg-white/5 text-white/40'}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Health BMI Preview (Simple logic) */}
        {localHealth.height && localHealth.currentWeight && (
          <section className="bg-[var(--color-brand-primary)]/10 border border-[var(--color-brand-primary)]/20 rounded-3xl p-6">
            <h3 className="text-[10px] text-[var(--color-brand-primary)] font-bold uppercase tracking-widest mb-4">Calculated BMI</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black">
                {(parseFloat(localHealth.currentWeight) / Math.pow(parseFloat(localHealth.height)/100, 2)).toFixed(1)}
              </span>
              <span className="text-xs text-white/40 font-bold uppercase tracking-widest">Normal Range: 18.5 - 24.9</span>
            </div>
          </section>
        )}

        {/* Preferences Section */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-2">Preferences</h3>
          <div className="bg-[#141414] rounded-3xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
              <div>
                <label className="text-[10px] text-white/20 uppercase font-bold mb-1 block">Rest Interval</label>
                <span className="text-sm font-bold">{localSettings.restInterval} Seconds</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => {
                  const newSettings = { ...localSettings, restInterval: Math.max(10, localSettings.restInterval - 10) };
                  setLocalSettings(newSettings);
                  onUpdate(newSettings);
                }} className="bg-white/5 p-2 rounded-xl text-white/40">-10</button>
                <button onClick={() => {
                  const newSettings = { ...localSettings, restInterval: localSettings.restInterval + 10 };
                  setLocalSettings(newSettings);
                  onUpdate(newSettings);
                }} className="bg-white/5 p-2 rounded-xl text-white/40">+10</button>
              </div>
            </div>
            <div className="p-4">
              <label className="text-[10px] text-white/20 uppercase font-bold mb-3 block">Theme Accent</label>
              <div className="flex gap-3">
                {colors.map(color => (
                  <button 
                    key={color}
                    onClick={() => {
                      const newSettings = { ...localSettings, themeColor: color };
                      setLocalSettings(newSettings);
                      onUpdate(newSettings);
                    }}
                    className={`w-8 h-8 rounded-full border-2 transition-transform active:scale-90 ${localSettings.themeColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Data Section */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-2">Data Management & Danger Zone</h3>
          <div className="grid grid-cols-2 gap-4">
            
            {/* Clear History Button Container */}
            <div className="col-span-1">
              {isConfirmingClear ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex flex-col gap-3 h-full">
                  <p className="text-xs text-red-500 font-bold uppercase text-center text-[10px] tracking-widest">Sure?</p>
                  <div className="flex flex-col gap-2 mt-auto">
                    <button onClick={() => setIsConfirmingClear(false)} className="bg-white/5 text-white/60 py-2 rounded-xl font-bold uppercase text-[10px]">Cancel</button>
                    <button onClick={() => { onClearHistory(); setIsConfirmingClear(false); }} className="bg-red-500 text-white py-2 rounded-xl font-bold uppercase text-[10px]">Confirm</button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setIsConfirmingClear(true)}
                  className="w-full h-full min-h-[100px] bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl font-bold uppercase tracking-widest flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform"
                >
                  <Trash2 size={20} />
                  <span className="text-[10px] text-center">Clear History</span>
                </button>
              )}
            </div>
            
            {/* Delete Profile Button Container */}
            <div className="col-span-1">
              {isConfirmingDelete ? (
                <div className="bg-red-500 border border-red-500/20 rounded-2xl p-4 flex flex-col gap-3 h-full justify-between shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                  <p className="text-white font-bold uppercase text-center text-[10px] tracking-widest">Wipe Data?</p>
                  <div className="flex flex-col gap-2 mt-auto">
                    <button onClick={() => setIsConfirmingDelete(false)} className="bg-black/20 text-white py-2 rounded-xl font-bold uppercase text-[10px]">Cancel</button>
                    <button onClick={() => { onDeleteProfile(); setIsConfirmingDelete(false); }} className="bg-black/40 text-white py-2 rounded-xl font-bold uppercase text-[10px]">Delete</button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setIsConfirmingDelete(true)}
                  className="w-full h-full min-h-[100px] bg-red-500 border border-red-500/20 text-white p-4 rounded-2xl font-bold uppercase tracking-widest flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform"
                >
                  <Trash2 size={20} />
                  <span className="text-[10px] text-center">Delete Profile</span>
                </button>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="pt-10 pb-6 text-center">
        <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">App Version 2.1.0</p>
        <p className="text-[8px] text-white/10 uppercase tracking-[0.4em] mt-1">Built for Performance</p>
      </div>
    </motion.div>
  );
}



function OnboardingScreen({ onComplete }: { onComplete: (settings: any) => void }) {
  const [step, setStep] = useState(0);
  const [isAutoDerived, setIsAutoDerived] = useState(false);
  const [form, setForm] = useState({
    name: '',
    targetWeight: '75',
    restInterval: 60,
    themeColor: '#CDFF07',
    health: {
      age: '',
      gender: 'Male',
      height: '',
      currentWeight: '',
      activityLevel: 'Moderate',
      fitnessGoal: 'Muscle Gain'
    }
  });

  const next = () => {
    if (step === 1) { // Moving from Physical Stats to Objectives
      const derivation = deriveFitnessGoal(form.health.currentWeight, form.targetWeight, form.health.fitnessGoal);
      setForm(prev => ({ ...prev, health: { ...prev.health, fitnessGoal: derivation.goal } }));
      setIsAutoDerived(derivation.derived);
    }
    setStep(s => s + 1);
  };
  const back = () => setStep(s => s - 1);

  const colors = ['#CDFF07', '#00F2FF', '#FF3D00', '#AD00FF', '#FFD600'];
  const activityLevels = ['Sedentary', 'Light', 'Moderate', 'Active', 'Very Active'];
  const goals = ['Weight Loss', 'Muscle Gain', 'Maintenance', 'Endurance'];

  const steps = [
    {
      title: 'Identity',
      desc: 'Let\'s start with the basics.',
      content: (
        <div className="space-y-6">
          <div className="bg-[#141414] p-6 rounded-3xl border border-white/5 space-y-4">
            <div>
              <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-1 block">Your Name</label>
              <input 
                autoFocus
                className="w-full bg-transparent text-2xl font-bold outline-none border-b border-white/10 pb-2 focus:border-[var(--color-brand-primary)] transition-colors"
                placeholder="Elite Athlete"
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-1 block">Age</label>
                <input 
                  type="number"
                  className="w-full bg-transparent text-2xl font-bold outline-none border-b border-white/10 pb-2 focus:border-[var(--color-brand-primary)] transition-colors"
                  placeholder="24"
                  value={form.health.age}
                  onChange={e => setForm({...form, health: {...form.health, age: e.target.value}})}
                />
              </div>
              <div>
                <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-1 block">Gender</label>
                <select 
                  className="w-full bg-transparent text-xl font-bold outline-none border-b border-white/10 pb-2 cursor-pointer"
                  value={form.health.gender}
                  onChange={e => setForm({...form, health: {...form.health, gender: e.target.value}})}
                >
                  <option value="Male" className="bg-black text-white">Male</option>
                  <option value="Female" className="bg-black text-white">Female</option>
                  <option value="Other" className="bg-black text-white">Other</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Physical Stats',
      desc: 'Critical for tracking your progress.',
      content: (
        <div className="space-y-6">
          <div className="bg-[#141414] p-6 rounded-3xl border border-white/5 space-y-6">
            <div>
              <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-1 block">Height (CM)</label>
              <input 
                type="number"
                className="w-full bg-transparent text-2xl font-bold outline-none border-b border-white/10 pb-2 focus:border-[var(--color-brand-primary)] transition-colors"
                placeholder="175"
                value={form.health.height}
                onChange={e => setForm({...form, health: {...form.health, height: e.target.value}})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-1 block">Weight (KG)</label>
                <input 
                  type="number"
                  className="w-full bg-transparent text-2xl font-bold outline-none border-b border-white/10 pb-2 focus:border-[var(--color-brand-primary)] transition-colors"
                  placeholder="70"
                  value={form.health.currentWeight}
                  onChange={e => setForm({...form, health: {...form.health, currentWeight: e.target.value}})}
                />
              </div>
              <div>
                <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-1 block">Goal Weight</label>
                <input 
                  type="number"
                  className="w-full bg-transparent text-2xl font-bold outline-none border-b border-white/10 pb-2 focus:border-[var(--color-brand-primary)] transition-colors"
                  placeholder="75"
                  value={form.targetWeight}
                  onChange={e => setForm({...form, targetWeight: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Objectives',
      desc: 'Define your path to mastery.',
      content: (
        <div className="space-y-6">
          <SetsRepsMatrix 
            goal={form.health.fitnessGoal} 
            activityLevel={form.health.activityLevel} 
            isAutoDerived={isAutoDerived}
            weight={form.health.currentWeight}
            gender={form.health.gender}
          />
          <div className="bg-[#141414] p-6 rounded-3xl border border-white/5 space-y-6">
            <div>
              <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-3 block">Fitness Goal</label>
              <div className="flex flex-wrap gap-2">
                {goals.map(goal => (
                  <button 
                    key={goal}
                    onClick={() => {
                      setForm({...form, health: {...form.health, fitnessGoal: goal}});
                      setIsAutoDerived(false);
                    }}
                    className={`text-[10px] font-bold px-4 py-3 rounded-2xl transition-all ${form.health.fitnessGoal === goal ? 'bg-[var(--color-brand-primary)] text-black' : 'bg-white/5 text-white/40'}`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-3 block">Activity Level</label>
              <div className="flex flex-wrap gap-2">
                {activityLevels.map(level => (
                  <button 
                    key={level}
                    onClick={() => setForm({...form, health: {...form.health, activityLevel: level}})}
                    className={`text-[10px] font-bold px-4 py-3 rounded-2xl transition-all ${form.health.activityLevel === level ? 'bg-[var(--color-brand-primary)] text-black' : 'bg-white/5 text-white/40'}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Style & Rhythm',
      desc: 'One final touch.',
      content: (
        <div className="space-y-6">
          <div className="bg-[#141414] p-6 rounded-3xl border border-white/5 space-y-8">
            <div>
              <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-4 block text-center">Theme Accent</label>
              <div className="flex justify-center gap-4">
                {colors.map(color => (
                  <button 
                    key={color}
                    onClick={() => setForm({...form, themeColor: color})}
                    className={`w-10 h-10 rounded-full border-2 transition-all active:scale-90 ${form.themeColor === color ? 'border-white scale-125' : 'border-transparent opacity-50'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="text-center">
              <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-3 block">Rest Interval</label>
              <div className="flex items-center justify-center gap-6">
                <button 
                  onClick={() => setForm({...form, restInterval: Math.max(10, form.restInterval - 10)})}
                  className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-xl"
                >-</button>
                <div className="text-3xl font-black">{form.restInterval}<span className="text-xs text-white/30 ml-1">S</span></div>
                <button 
                   onClick={() => setForm({...form, restInterval: form.restInterval + 10})}
                   className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-xl"
                >+</button>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const current = steps[step];
  const isComplete = step === steps.length - 1;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-[500] bg-black flex flex-col p-6 sm:p-8"
    >
      <div className="flex-1 flex flex-col min-h-0">
        <div className="mb-8 flex-shrink-0">
          <div className="flex gap-1 mb-6">
            {steps.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-[var(--color-brand-primary)]' : 'bg-white/10'}`} />
            ))}
          </div>
          <h2 className="text-4xl font-black uppercase tracking-tighter leading-none mb-2">{current.title}</h2>
          <p className="text-white/40 uppercase text-[10px] font-bold tracking-widest">{current.desc}</p>
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 mb-4 pb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
            >
              {current.content}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex gap-4 flex-shrink-0">
          {step > 0 && (
            <button 
              onClick={back}
              className="px-8 py-5 rounded-2xl bg-white/5 font-bold uppercase text-[10px] tracking-widest"
            >
              Back
            </button>
          )}
          <button 
            onClick={isComplete ? () => onComplete(form) : next}
            disabled={step === 0 && !form.name}
            className={`flex-1 py-5 rounded-2xl font-bold uppercase tracking-widest transition-all active:scale-95 ${step === 0 && !form.name ? 'bg-white/10 text-white/20' : 'bg-[var(--color-brand-primary)] text-black'}`}
          >
            {isComplete ? 'Commence Program' : 'Continue'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
