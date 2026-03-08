// ============================================================
// useCollections.js — Custom Hook for Global Collections
// ============================================================
// Fetches collections from Firestore ONCE per session and
// stores them in the Zustand global store. Any component that
// calls this hook receives the same shared collections array.
// The `collectionsLoaded` flag prevents duplicate fetches.
// ============================================================

import { useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import useStore from "../store/useStore";

export function useCollections() {
  const user = useStore((s) => s.user);
  const collections = useStore((s) => s.collections);
  const collectionsLoaded = useStore((s) => s.collectionsLoaded);
  const setCollections = useStore((s) => s.setCollections);

  useEffect(() => {
    // Only fetch if user is logged in and data hasn't been loaded yet
    if (!user?.uid || collectionsLoaded) return;

    const fetchCollections = async () => {
      try {
        // No orderBy — avoids Firestore composite index requirement.
        // Sort client-side instead.
        const q = query(
          collection(db, "collections"),
          where("user_id", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .sort((a, b) => {
            const dateA = a.created_at?.toDate?.() || new Date(a.created_at);
            const dateB = b.created_at?.toDate?.() || new Date(b.created_at);
            return dateB - dateA;
          });
        // Store in Zustand — sets collectionsLoaded = true
        setCollections(data);
      } catch (err) {
        console.error("Error fetching collections:", err);
      }
    };

    fetchCollections();
  }, [user, collectionsLoaded, setCollections]);

  return collections;
}
