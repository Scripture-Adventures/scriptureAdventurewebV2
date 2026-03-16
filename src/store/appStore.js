import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set) => ({
      loggedIn: false,
      setLoggedIn: (loggedIn) => set({ loggedIn }),

      adventureType: { paulineprayer1: '', paulinee2: '' },
      setAdventureType: (adventureType) => set({ adventureType }),

      startDate: new Date(1715468400000).toISOString(),
      setStartDate: (startDate) => set({ startDate }),

      previousDate: null,
      setPreviousDate: (previousDate) => set({ previousDate }),

      totalSub: 0,
      setTotalSub: (totalSub) => set({ totalSub }),

      newcommer: false,
      setNewcommer: (newcommer) => set({ newcommer }),

      date1set: false,
      setDate1Set: (date1set) => set({ date1set }),

      date2set: false,
      setDate2Set: (date2set) => set({ date2set }),

      tasterbBool: false,
      setTasterBool: (tasterbBool) => set({ tasterbBool }),

      tasterOnboardingDone: false,
      setTasterOnboardingDone: (tasterOnboardingDone) => set({ tasterOnboardingDone }),

      tasterEmail: '',
      setTasterEmail: (tasterEmail) => set({ tasterEmail }),

      tasterDetails: {},
      setTasterDetails: (tasterDetails) => set({ tasterDetails }),

      numberOfDays: '',
      setNumberOfDays: (numberOfDays) => set({ numberOfDays }),

      mainGroupLink: '',
      setMainGroupLink: (mainGroupLink) => set({ mainGroupLink }),

      currentCohort: {},
      setCurrentCohort: (currentCohort) => set({ currentCohort }),

      userDataCohortMember: {},
      setUserDataCohortMember: (userDataCohortMember) => set({ userDataCohortMember }),

      currentCohortUserData: {},
      setCurrentCohortUserData: (currentCohortUserData) => set({ currentCohortUserData }),

      tribes: null,
      setTribes: (tribes) => set({ tribes }),

      currentCohortId: '',
      setCurrentCohortId: (currentCohortId) => set({ currentCohortId }),

      currentCohortCircle: [],
      setCurrentCohortCircle: (currentCohortCircle) => set({ currentCohortCircle }),
      addToCurrentCohortCircle: (item) => set((state) => ({ 
        currentCohortCircle: [...state.currentCohortCircle, item] 
      })),
      removeFromCurrentCohortCircle: (index) => set((state) => ({
        currentCohortCircle: state.currentCohortCircle.filter((_, i) => i !== index)
      })),

      reset: () => set({
        loggedIn: false,
        adventureType: { paulineprayer1: '', paulinee2: '' },
        startDate: new Date(1715468400000).toISOString(),
        previousDate: null,
        totalSub: 0,
        newcommer: false,
        date1set: false,
        date2set: false,
        tasterbBool: false,
        tasterOnboardingDone: false,
        tasterEmail: '',
        tasterDetails: {},
        numberOfDays: '',
        mainGroupLink: '',
        currentCohort: {},
        userDataCohortMember: {},
        currentCohortUserData: {},
        tribes: null,
        currentCohortId: '',
        currentCohortCircle: []
      })
    }),
    {
      name: 'ff_app_state', // matching shared_preferences key prefix concept
    }
  )
);
