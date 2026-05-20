import { create } from 'zustand';

const useJobStore = create((set) => ({
  jobs: [],
  preferences: null,
  skillGaps: {},
  setJobs: (jobs) => set({ jobs }),
  setPreferences: (preferences) => set({ preferences }),
  setSkillGap: (hash, data) => set((state) => ({
    skillGaps: { ...state.skillGaps, [hash]: data }
  }))
}));

export default useJobStore;