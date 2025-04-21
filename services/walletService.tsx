import { WalletType, ResponseType } from "@/types";
import { uploadFileToCloudinary } from "./imageServices";
import { doc, setDoc, collection } from "firebase/firestore";
import { firestore } from "@/config/firebase";

export const createOrUpdateWallet = async (
  walletData: Partial<WalletType>
): Promise<ResponseType> => {
  try {
    let walletToSave = { ...walletData };

    // Subir imagen si existe
    if (walletData.image) {
      const imageUploadRes = await uploadFileToCloudinary(
        walletData.image,
        "wallets"
      );

      if (!imageUploadRes.success) {
        return {
          success: false,
          msg: imageUploadRes.msg || "Failed to upload image",
        };
      }

      walletToSave.image = imageUploadRes.data;
    }

    // Si es nuevo, agregar datos por defecto
    if (!walletData.id) {
      walletToSave.amount = 0;
      walletToSave.totalIncome = 0;
      walletToSave.totalExpenses = 0;
      walletToSave.createdAt = new Date();
    }

    // Crear referencia a la billetera
    const walletRef = walletData?.id
      ? doc(firestore, "wallets", walletData?.id)
      : doc(collection(firestore, "wallets"));

    // Guardar en Firestore
    await setDoc(walletRef, walletToSave, { merge: true });

    return {
      success: true,
      data: { ...walletToSave, id: walletRef.id },
    };
  } catch (error: any) {
    console.log("error creating or updating wallet", error);
    return {
      success: false,
      msg: error?.message || "Unknown error",
    };
  }
};
