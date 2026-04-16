import { useState, useEffect } from 'react';
import { onSnapshot, QueryConstraint, query, collection } from 'firebase/firestore';
import { firestore } from '@/config/firebase';

const useFetchData = <T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!collectionName) return;
    
    // Reset loading state when constraints change
    setLoading(true);
    
    const collectionRef = collection(firestore, collectionName);
    const q = query(collectionRef, ...constraints);

    const unsub = onSnapshot(q, 
      (snapshot) => {
        const fetchedData = snapshot.docs.map(doc => {
          return {
            id: doc.id,
            ...doc.data(),
          };
        }) as T[];
        
        setData(fetchedData);
        setLoading(false);
      },
      (err) => {
        console.log("Error fetching data:", err);
        setError(err.message);
        setLoading(false);
      }
    );
    
    // Cleanup function
    return () => unsub();
  }, [collectionName, JSON.stringify(constraints)]); // Add constraints as dependency

  return { data, loading, error };
};

export default useFetchData;