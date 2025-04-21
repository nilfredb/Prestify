// services/clientService.tsx
import { ClientType, ResponseType } from "@/types";
import { uploadFileToCloudinary } from "./imageServices";
import { doc, setDoc, collection, updateDoc, deleteDoc, getDocs, query, where, getDoc } from "firebase/firestore";
import { firestore } from "@/config/firebase";

// Create or update a client
export const createOrUpdateClient = async (
  clientData: Partial<ClientType>
): Promise<ResponseType> => {
  try {
    let clientToSave = { ...clientData };

    // Upload image if it exists
    if (clientData.image) {
      const imageUploadRes = await uploadFileToCloudinary(
        clientData.image,
        "clients"
      );

      if (!imageUploadRes.success) {
        return {
          success: false,
          msg: imageUploadRes.msg || "Failed to upload image",
        };
      }

      clientToSave.image = imageUploadRes.data;
    }

    // Set default values for new clients
    if (!clientData.id) {
      clientToSave.loans = 0;
      clientToSave.totalDebt = 0;
      clientToSave.createdAt = new Date();
      clientToSave.status = 'Activo';
    }
    
    // Always update the updatedAt timestamp
    clientToSave.updatedAt = new Date();

    // Create reference to the client
    const clientRef = clientData?.id
      ? doc(firestore, "clients", clientData.id)
      : doc(collection(firestore, "clients"));

    // Save to Firestore
    await setDoc(clientRef, clientToSave, { merge: true });

    return {
      success: true,
      data: { ...clientToSave, id: clientRef.id },
    };
  } catch (error: any) {
    console.log("Error creating or updating client", error);
    return {
      success: false,
      msg: error?.message || "Unknown error",
    };
  }
};

// Get all clients for a user
export const getClients = async (userId?: string): Promise<ResponseType> => {
  try {
    const clientsRef = collection(firestore, "clients");
    
    let q;
    if (userId) {
      // If userId is provided, filter by that user
      q = query(clientsRef, where("uid", "==", userId));
    } else {
      // Otherwise get all clients (this might be used in admin scenarios)
      q = clientsRef;
    }
    
    const querySnapshot = await getDocs(q);
    
    const clients: ClientType[] = [];
    querySnapshot.forEach((doc) => {
      clients.push({ id: doc.id, ...doc.data() } as ClientType);
    });
    
    return {
      success: true,
      data: clients
    };
  } catch (error: any) {
    console.log("Error fetching clients", error);
    return {
      success: false,
      msg: error?.message || "Failed to fetch clients"
    };
  }
};

// Get a client by ID
export const getClientById = async (clientId: string): Promise<ResponseType> => {
  try {
    const clientRef = doc(firestore, "clients", clientId);
    const clientDoc = await getDoc(clientRef);
    
    if (!clientDoc.exists()) {
      return {
        success: false,
        msg: "Client not found"
      };
    }
    
    return {
      success: true,
      data: { id: clientDoc.id, ...clientDoc.data() }
    };
  } catch (error: any) {
    console.log("Error fetching client", error);
    return {
      success: false,
      msg: error?.message || "Failed to fetch client"
    };
  }
};

// Delete a client
export const deleteClient = async (clientId: string): Promise<ResponseType> => {
  try {
    await deleteDoc(doc(firestore, "clients", clientId));
    
    return {
      success: true,
      msg: "Client deleted successfully"
    };
  } catch (error: any) {
    console.log("Error deleting client", error);
    return {
      success: false,
      msg: error?.message || "Failed to delete client"
    };
  }
};

// Update client status
export const updateClientStatus = async (
  clientId: string, 
  status: ClientType['status']
): Promise<ResponseType> => {
  try {
    const clientRef = doc(firestore, "clients", clientId);
    await updateDoc(clientRef, { 
      status, 
      updatedAt: new Date() 
    });
    
    return {
      success: true,
      msg: "Client status updated successfully"
    };
  } catch (error: any) {
    console.log("Error updating client status", error);
    return {
      success: false,
      msg: error?.message || "Failed to update client status"
    };
  }
};

// Update client loan count
export const updateClientLoanCount = async (
  clientId: string,
  increment: number = 1
): Promise<ResponseType> => {
  try {
    const clientRef = doc(firestore, "clients", clientId);
    const clientDoc = await getDoc(clientRef);
    
    if (!clientDoc.exists()) {
      return {
        success: false,
        msg: "Client not found"
      };
    }
    
    const currentData = clientDoc.data();
    const currentLoans = currentData.loans || 0;
    
    await updateDoc(clientRef, { 
      loans: currentLoans + increment,
      updatedAt: new Date()
    });
    
    return {
      success: true,
      msg: "Client loan count updated successfully"
    };
  } catch (error: any) {
    console.log("Error updating client loan count", error);
    return {
      success: false,
      msg: error?.message || "Failed to update client loan count"
    };
  }
};

// Update client debt amount
export const updateClientDebt = async (
  clientId: string,
  amount: number
): Promise<ResponseType> => {
  try {
    const clientRef = doc(firestore, "clients", clientId);
    const clientDoc = await getDoc(clientRef);
    
    if (!clientDoc.exists()) {
      return {
        success: false,
        msg: "Client not found"
      };
    }
    
    const currentData = clientDoc.data();
    const currentDebt = currentData.totalDebt || 0;
    
    await updateDoc(clientRef, { 
      totalDebt: currentDebt + amount,
      updatedAt: new Date()
    });
    
    return {
      success: true,
      msg: "Client debt updated successfully"
    };
  } catch (error: any) {
    console.log("Error updating client debt", error);
    return {
      success: false,
      msg: error?.message || "Failed to update client debt"
    };
  }
};

// Search clients by name
export const searchClientsByName = async (
  searchTerm: string,
  userId: string
): Promise<ResponseType> => {
  try {
    const clientsRef = collection(firestore, "clients");
    
    // Create a query against the collection
    const q = query(
      clientsRef,
      where("uid", "==", userId),
      where("name", ">=", searchTerm),
      where("name", "<=", searchTerm + '\uf8ff')
    );
    
    const querySnapshot = await getDocs(q);
    
    const clients: ClientType[] = [];
    querySnapshot.forEach((doc) => {
      clients.push({ id: doc.id, ...doc.data() } as ClientType);
    });
    
    return {
      success: true,
      data: clients
    };
  } catch (error: any) {
    console.log("Error searching clients", error);
    return {
      success: false,
      msg: error?.message || "Failed to search clients"
    };
  }
};