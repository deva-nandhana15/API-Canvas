// ============================================================
// useStore.js — Zustand Global State Store
// ============================================================
// Central state management for ApiCanvas. Keeps track of the
// authenticated user, the active request/response being worked
// on, the selected collection, environment variables, global
// collections/requests cache, and a global loading flag.
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

  // All user collections (shared across Sidebar + Collections page)
  collections: [],

  // Requests keyed by collection_id: { collectionId: [request, ...] }
  requests: {},

  // Tracks whether collections have already been fetched from Firestore
  collectionsLoaded: false,

  // --------------------------------------------------
  // Actions
  // --------------------------------------------------

  // Set the authenticated user (called by onAuthStateChanged listener).
  // Stores the full Firebase user object including displayName, email, uid, etc.
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

  // --------------------------------------------------
  // Collections Actions (global, shared state)
  // --------------------------------------------------

  // Set all collections at once (called after initial Firestore fetch)
  setCollections: (collections) =>
    set({ collections, collectionsLoaded: true }),

  // Add a single new collection to the front of the list
  addCollection: (collection) =>
    set((state) => ({
      collections: [collection, ...state.collections],
    })),

  // Update a single collection by id with partial updates
  updateCollection: (id, updates) =>
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  // Remove a collection by id
  removeCollection: (id) =>
    set((state) => ({
      collections: state.collections.filter((c) => c.id !== id),
    })),

  // --------------------------------------------------
  // Requests Actions (cached per collection)
  // --------------------------------------------------

  // Set requests array for a specific collection
  setCollectionRequests: (collectionId, requests) =>
    set((state) => ({
      requests: {
        ...state.requests,
        [collectionId]: requests,
      },
    })),

  // Add a single request to the front of a collection's list
  addRequest: (collectionId, request) =>
    set((state) => ({
      requests: {
        ...state.requests,
        [collectionId]: [
          request,
          ...(state.requests[collectionId] || []),
        ],
      },
    })),

  // Remove a request by id from a specific collection
  removeRequest: (collectionId, requestId) =>
    set((state) => ({
      requests: {
        ...state.requests,
        [collectionId]: (state.requests[collectionId] || []).filter(
          (r) => r.id !== requestId
        ),
      },
    })),

  // --------------------------------------------------
  // Reset (called on logout to clear cached data)
  // --------------------------------------------------
  resetCollections: () =>
    set({
      collections: [],
      requests: {},
      collectionsLoaded: false,
    }),
}));

export default useStore;