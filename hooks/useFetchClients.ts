// hooks/useFetchClients.ts
import { useState, useEffect } from 'react';
import { ClientType } from '@/types';
import { collection, query, where, orderBy, onSnapshot, QueryConstraint } from 'firebase/firestore';
import { firestore } from '@/config/firebase';

const useFetchClients = (
  userId: string | undefined,
  constraints: QueryConstraint[] = []
) => {
  const [clients, setClients] = useState<ClientType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    
    // Base constraints that always apply
    const baseConstraints = [
      where('uid', '==', userId),
      orderBy('createdAt', 'desc')
    ];
    
    // Combine with any additional constraints
    const finalConstraints = [...baseConstraints, ...constraints];
    
    const clientsRef = collection(firestore, 'clients');
    const q = query(clientsRef, ...finalConstraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedClients = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ClientType[];
        
        setClients(fetchedClients);
        setLoading(false);
      },
      (err) => {
        console.log('Error fetching clients:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, JSON.stringify(constraints)]);

  return { clients, loading, error };
};

export default useFetchClients;