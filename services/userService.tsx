import { UserDataType, ResponseType } from "@/types";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { firestore } from "@/config/firebase";
import { uploadFileToCloudinary } from "./imageServices";


export const updateUser = async (
    uid: string,
    updatedData: UserDataType
): Promise<ResponseType> => {
    try {
        if (updatedData.image && updatedData?.image?.uri){
            const imageUploadRes = await uploadFileToCloudinary(updatedData.image, "users");
                if(!imageUploadRes.success){
                    return {success: false, msg: imageUploadRes.msg || "Error uploading image"};
                }
                updatedData.image = imageUploadRes.data;
        }
        const userRef = doc(firestore, "users", uid);
        await updateDoc(userRef, updatedData);

        //fetch the updated user data
        return {success: true, msg: "updated sucessfully"};
    } catch (error: any) {
        console.log('error updating user', error);
        return { success: false, msg: error?.message };
    }
};