// Arcade build stand-in for src/hooks/useAchievements.jsx. Achievements live
// in Supabase and belong to signed-in players, so the arcade skips them.
const noop = async () => {};

export const useAchievements = () => ({
    achievements: [],
    userAchievements: [],
    loading: false,
    unlockAchievement: noop,
    isUnlocked: () => false,
});

export const AchievementProvider = ({ children }) => children;
