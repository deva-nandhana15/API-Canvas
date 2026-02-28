// ============================================================
// useStore.js — Zustand Global State Store
// ============================================================
// Central state management for ApiCanvas. Keeps track of the
// authenticated user, the active request/response being worked
// on, the selected collection, environment variables, and a
// global loading flag.
// ============================================================

import { create } from "zustand";

const useStore = create((set) => ({
  // --------------------------------------------------
  // State
  // --------------------------------------------------

  // Current authenticated Firebase user object (null = logged out)
  user: null,

  // The HTTP request currently being built in the API Tester
  activeRequest: null,

  // The last response received from the proxy server
  activeResponse: null,

  // The currently selected collection in the sidebar
  activeCollection: null,

  // List of environment variable key-value pairs
  environments: [],

  // Global loading flag for async operations
  isLoading: false,

  // --------------------------------------------------
  // Actions
  // --------------------------------------------------

  // Set the authenticated user (called by onAuthStateChanged listener)
  setUser: (user) => set({ user }),

  // Set the request currently being edited in the API Tester
  setActiveRequest: (request) => set({ activeRequest: request }),

  // Store the latest proxy response
  setActiveResponse: (response) => set({ activeResponse: response }),

  // Set the currently selected collection
  setActiveCollection: (collection) => set({ activeCollection: collection }),

  // Replace the entire environments list
  setEnvironments: (environments) => set({ environments }),

  // Toggle the global loading spinner
  setIsLoading: (bool) => set({ isLoading: bool }),
}));

export default useStore;