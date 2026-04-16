import { StyleSheet, View, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import React, { useEffect, useState } from 'react';
import ModalWrapper from '@/components/ModalWrapper';
import { spacingY, colors, radius, spacingX } from '@/constants/theme';
import { scale, verticalScale } from '@/utils/styling';
import Header from '@/components/Header';
import BackButton from '@/components/BackButton';
import { ScrollView } from 'moti';
import { getProfileImage } from '@/services/imageServices';
import { Image } from 'expo-image';
import * as Icon from 'phosphor-react-native';
import Typo from '@/components/Typo';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { useAuth } from '@/context/authContext';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { updateUser } from '@/services/userService';
import { getAuth, updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { UserDataType } from '@/types';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import CustomAlert from '@/components/CustomAlert';

const { width, height } = Dimensions.get('window');

// We need a separate interface for the form data since UserDataType doesn't include email/password fields
interface ProfileFormData {
  name: string;
  image: any;
  email: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

// Alert state type
interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  onConfirm?: () => void;
}

const ProfileModal = () => {
  const { user, updateUserData } = useAuth();
  const [formData, setFormData] = useState<ProfileFormData>({
    name: "",
    image: null,
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'profile' | 'email' | 'password'>('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: '',
    message: '',
  });
  const router = useRouter();
  const auth = getAuth();

  // Function to show custom alert
  const showAlert = (title: string, message: string, confirmText: string = 'OK', onConfirm?: () => void) => {
    setAlertState({
      visible: true,
      title,
      message,
      confirmText,
      onConfirm
    });
  };

  // Function to close alert
  const closeAlert = () => {
    if (alertState.onConfirm) {
      alertState.onConfirm();
    }
    setAlertState((prev) => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    setFormData({
      name: user?.name || "",
      image: user?.image || null,
      email: user?.email || "",
    });
  }, [user]);

  const onPickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormData({ ...formData, image: result.assets[0] });
    }
  };

  const validateBasicProfile = () => {
    if (!formData.name.trim()) {
      showAlert("Profile Update", "Please enter your name");
      return false;
    }
    return true;
  };

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      showAlert("Email Update", "Please enter a valid email address");
      return false;
    }
    return true;
  };

  const validatePassword = () => {
    if (!formData.currentPassword) {
      showAlert("Password Update", "Please enter your current password");
      return false;
    }
    if (!formData.newPassword || formData.newPassword.length < 6) {
      showAlert("Password Update", "New password must be at least 6 characters");
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      showAlert("Password Update", "Passwords do not match");
      return false;
    }
    return true;
  };

  const updateBasicProfile = async () => {
    if (!validateBasicProfile()) return;

    setLoading(true);
    // Only pass the properties that exist in UserDataType
    const userData: UserDataType = {
      name: formData.name,
      image: formData.image
    };
    
    const res = await updateUser(user?.uid as string, userData);
    setLoading(false);

    if (res.success) {
      updateUserData(user?.uid as string);
      showAlert("Success", "Profile updated successfully");
    } else {
      showAlert("Error", res.msg || "Failed to update profile");
    }
  };

  const { updateEmailWithVerification } = useAuth();

  const updateUserEmail = async () => {
    if (!validateEmail()) return;
    if (!formData.currentPassword) {
      showAlert("Authentication Required", "Please enter your current password to change email");
      return;
    }
  
    setLoading(true);
  
    const res = await updateEmailWithVerification(formData.email, formData.currentPassword);
  
    setLoading(false);
  
    if (res.success) {
      showAlert("Verification Sent", res.msg || "Check your new email to confirm the change.");
      setFormData({ ...formData, currentPassword: "" });
    } else {
      showAlert("Error", res.msg || "Failed to update email");
    }
  };

  const updateUserPassword = async () => {
    if (!validatePassword()) return;

    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) throw new Error("User not found");

      // Re-authenticate
      const credential = EmailAuthProvider.credential(currentUser.email, formData.currentPassword!);
      await reauthenticateWithCredential(currentUser, credential);
      
      // Update password
      await updatePassword(currentUser, formData.newPassword!);
      
      showAlert("Success", "Password updated successfully");
      setFormData({
        ...formData, 
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      console.log("Password update error:", error);
      let errorMessage = "Failed to update password";
      if (error.code === 'auth/wrong-password') {
        errorMessage = "Current password is incorrect";
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = "This operation requires recent authentication. Please log in again before retrying.";
      }
      showAlert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    switch (activeSection) {
      case 'profile':
        await updateBasicProfile();
        break;
      case 'email':
        await updateUserEmail();
        break;
      case 'password':
        await updateUserPassword();
        break;
    }
  };

  const renderProfileSection = () => (
    <Animated.View 
      entering={FadeIn.duration(300)} 
      style={styles.section}
    >
      <View style={styles.avatarContainer}>
        <View style={styles.avatarWrapper}>
          <Image
            style={styles.avatar}
            source={getProfileImage(formData.image)}
            contentFit="cover"
            transition={200}
          />
          <TouchableOpacity onPress={onPickImage} style={styles.editIcon}>
            <Icon.Camera
              size={verticalScale(20)}
              color={colors.white}
              weight="bold"
            />
          </TouchableOpacity>
        </View>
        <Typo color={colors.neutral400} size={14} style={{marginTop: spacingY._10}}>
          Tap to update profile picture
        </Typo>
      </View>
      
      <View style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <Icon.User size={22} color={colors.primary} weight="fill" />
          <Typo size={18} fontWeight="600" color={colors.neutral100}>Personal Information</Typo>
        </View>
        
        <View style={styles.inputContainer}>
          <Typo color={colors.neutral200}>Full Name</Typo>
          <View style={styles.customInputContainer}>
            <Icon.User size={20} color={colors.neutral400} style={styles.inputIcon} />
            <Input
              placeholder="Enter your name"
              value={formData.name}
              onChangeText={(value) => setFormData({...formData, name: value})}
              containerStyle={styles.inputWithIcon}
            />
          </View>
        </View>
        
        <View style={styles.inputContainer}>
          <Typo color={colors.neutral200}>Email</Typo>
          <View style={styles.customInputContainer}>
            <Icon.Envelope size={20} color={colors.neutral400} style={styles.inputIcon} />
            <Input
              placeholder="Your email address"
              value={formData.email}
              editable={false}
              containerStyle={{...styles.inputWithIcon, opacity: 0.7}}
            />
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setActiveSection('email')}
            >
              <Typo size={12} color={colors.primary}>CHANGE</Typo>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const renderEmailSection = () => (
    <Animated.View 
      entering={FadeIn.duration(300)} 
      style={styles.section}
    >
      <View style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <Icon.Envelope size={22} color={colors.primary} weight="fill" />
          <Typo size={18} fontWeight="600" color={colors.neutral100}>Change Email Address</Typo>
        </View>
        
        <View style={styles.inputGroup}>
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Current Email</Typo>
            <View style={styles.customInputContainer}>
              <Icon.Envelope size={20} color={colors.neutral400} style={styles.inputIcon} />
              <Input
                value={user?.email || ""}
                editable={false}
                containerStyle={{...styles.inputWithIcon, opacity: 0.7}}
              />
            </View>
          </View>
          
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>New Email Address</Typo>
            <View style={styles.customInputContainer}>
              <Icon.Envelope size={20} color={colors.primary} style={styles.inputIcon} />
              <Input
                placeholder="Enter new email address"
                value={formData.email}
                onChangeText={(value) => setFormData({...formData, email: value})}
                keyboardType="email-address"
                autoCapitalize="none"
                containerStyle={styles.inputWithIcon}
              />
            </View>
          </View>
          
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Enter Password to Confirm</Typo>
            <View style={styles.customInputContainer}>
              <Icon.Lock size={20} color={colors.neutral400} style={styles.inputIcon} />
              <Input
                placeholder="Your current password"
                value={formData.currentPassword || ''}
                onChangeText={(value) => setFormData({...formData, currentPassword: value})}
                secureTextEntry={!showCurrentPassword}
                containerStyle={styles.inputWithIcon}
              />
              <TouchableOpacity 
                style={styles.passwordToggle}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? 
                  <Icon.Eye size={20} color={colors.neutral400} /> : 
                  <Icon.EyeSlash size={20} color={colors.neutral400} />
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        <View style={styles.infoBox}>
          <Icon.Info size={16} color={colors.primary} />
          <Typo size={12} color={colors.neutral300} style={{flex: 1, marginLeft: spacingX._10}}>
            For security reasons, you need to verify your identity by entering your current password.
          </Typo>
        </View>
      </View>
    </Animated.View>
  );

  const renderPasswordSection = () => (
    <Animated.View 
      entering={FadeIn.duration(300)} 
      style={styles.section}
    >
      <View style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <Icon.Lock size={22} color={colors.primary} weight="fill" />
          <Typo size={18} fontWeight="600" color={colors.neutral100}>Change Password</Typo>
        </View>
        
        <View style={styles.inputGroup}>
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Current Password</Typo>
            <View style={styles.customInputContainer}>
              <Icon.Lock size={20} color={colors.neutral400} style={styles.inputIcon} />
              <Input
                placeholder="Enter current password"
                value={formData.currentPassword || ''}
                onChangeText={(value) => setFormData({...formData, currentPassword: value})}
                secureTextEntry={!showCurrentPassword}
                containerStyle={styles.inputWithIcon}
              />
              <TouchableOpacity 
                style={styles.passwordToggle}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? 
                  <Icon.Eye size={20} color={colors.neutral400} /> : 
                  <Icon.EyeSlash size={20} color={colors.neutral400} />
                }
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>New Password</Typo>
            <View style={styles.customInputContainer}>
              <Icon.LockKey size={20} color={colors.primary} style={styles.inputIcon} />
              <Input
                placeholder="Enter new password"
                value={formData.newPassword || ''}
                onChangeText={(value) => setFormData({...formData, newPassword: value})}
                secureTextEntry={!showNewPassword}
                containerStyle={styles.inputWithIcon}
              />
              <TouchableOpacity 
                style={styles.passwordToggle}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? 
                  <Icon.Eye size={20} color={colors.neutral400} /> : 
                  <Icon.EyeSlash size={20} color={colors.neutral400} />
                }
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Confirm New Password</Typo>
            <View style={styles.customInputContainer}>
              <Icon.LockKey size={20} color={colors.primary} style={styles.inputIcon} />
              <Input
                placeholder="Confirm new password"
                value={formData.confirmPassword || ''}
                onChangeText={(value) => setFormData({...formData, confirmPassword: value})}
                secureTextEntry={!showNewPassword}
                containerStyle={styles.inputWithIcon}
              />
            </View>
          </View>
        </View>
        
        <View style={styles.infoBox}>
          <Icon.ShieldCheck size={16} color={colors.primary} />
          <Typo size={12} color={colors.neutral300} style={{flex: 1, marginLeft: spacingX._10}}>
            Password must be at least 6 characters long. We recommend using a combination of letters, numbers, and special characters.
          </Typo>
        </View>
      </View>
    </Animated.View>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSection();
      case 'email':
        return renderEmailSection();
      case 'password':
        return renderPasswordSection();
      default:
        return renderProfileSection();
    }
  };

  return (
    <ModalWrapper>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <Header 
            title="Account Settings" 
            leftIcon={<BackButton />} 
            style={styles.header}
          />

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeSection === 'profile' && styles.activeTab
              ]}
              onPress={() => setActiveSection('profile')}
            >
              <Icon.User 
                size={22} 
                color={activeSection === 'profile' ? colors.white : colors.neutral400} 
                weight={activeSection === 'profile' ? "fill" : "regular"}
              />
              <Typo 
                size={14} 
                color={activeSection === 'profile' ? colors.white : colors.neutral400}
                fontWeight={activeSection === 'profile' ? "600" : "400"}
              >
                Profile
              </Typo>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.tab,
                activeSection === 'email' && styles.activeTab
              ]}
              onPress={() => setActiveSection('email')}
            >
              <Icon.Envelope 
                size={22} 
                color={activeSection === 'email' ? colors.white : colors.neutral400} 
                weight={activeSection === 'email' ? "fill" : "regular"}
              />
              <Typo 
                size={14} 
                color={activeSection === 'email' ? colors.white : colors.neutral400}
                fontWeight={activeSection === 'email' ? "600" : "400"}
              >
                Email
              </Typo>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.tab,
                activeSection === 'password' && styles.activeTab
              ]}
              onPress={() => setActiveSection('password')}
            >
              <Icon.Lock 
                size={22} 
                color={activeSection === 'password' ? colors.white : colors.neutral400} 
                weight={activeSection === 'password' ? "fill" : "regular"}
              />
              <Typo 
                size={14} 
                color={activeSection === 'password' ? colors.white : colors.neutral400}
                fontWeight={activeSection === 'password' ? "600" : "400"}
              >
                Password
              </Typo>
            </TouchableOpacity>
          </View>

          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {renderActiveSection()}
          </ScrollView>
        </View>
        
        <Animated.View 
          entering={FadeInUp.duration(300)}
          style={styles.footer}
        >
          <Button 
            onPress={() => router.back()} 
            style={styles.cancelButton}
          >
            <Typo size={16} color={colors.neutral100} fontWeight="600">Cancel</Typo>
          </Button>
          
          <Button 
            onPress={handleSubmit} 
            loading={loading} 
            style={styles.saveButton}
          >
            <Typo size={16} color={colors.white} fontWeight="600">
              {activeSection === 'profile' ? 'Save Changes' : 
               activeSection === 'email' ? 'Update Email' : 'Change Password'}
            </Typo>
          </Button>
        </Animated.View>

        {/* Custom Alert */}
        <CustomAlert
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          confirmText={alertState.confirmText}
          onClose={closeAlert}
        />
      </KeyboardAvoidingView>
    </ModalWrapper>
  );
};

export default ProfileModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
  },
  header: {
    marginBottom: spacingY._15,
  },
  scrollContent: {
    paddingBottom: spacingY._20,
  },
  section: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: spacingY._20,
    backgroundColor: colors.neutral900,
    borderRadius: radius._15,
    padding: spacingY._5,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacingY._10,
    gap: spacingX._7,
    borderRadius: radius._12,
    marginHorizontal: spacingX._3,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._15,
    gap: spacingX._10,
    borderTopWidth: 1,
    borderTopColor: colors.neutral900,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.neutral900,
    borderWidth: 1,
    borderColor: colors.neutral700,
  },
  saveButton: {
    flex: 2,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: spacingY._20,
    marginTop: spacingY._5,
  },
  avatarWrapper: {
    position: 'relative',
    padding: spacingY._5,
  },
  avatar: {
    width: verticalScale(120),
    height: verticalScale(120),
    borderRadius: 100,
    borderWidth: 4,
    borderColor: colors.primary,
  },
  editIcon: {
    position: 'absolute',
    bottom: spacingY._10,
    right: spacingY._5,
    backgroundColor: colors.primary,
    borderRadius: 100,
    padding: spacingY._7,
    borderWidth: 3,
    borderColor: colors.neutral900,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  cardContainer: {
    backgroundColor: colors.neutral900,
    borderRadius: radius._15,
    padding: spacingY._15,
    marginBottom: spacingY._15,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacingY._15,
    paddingBottom: spacingY._10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral800,
    gap: spacingX._10,
  },
  inputGroup: {
    gap: spacingY._15,
    marginBottom: spacingY._5,
  },
  inputContainer: {
    gap: spacingY._5,
    marginBottom: spacingY._10,
  },
  customInputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: spacingX._10,
    zIndex: 1,
  },
  inputWithIcon: {
    flex: 1,
    paddingLeft: spacingX._35,
  },
  passwordToggle: {
    position: 'absolute',
    right: spacingX._10,
    padding: spacingY._5,
  },
  editButton: {
    position: 'absolute',
    right: spacingX._10,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    paddingHorizontal: spacingX._7,
    paddingVertical: spacingY._5,
    borderRadius: radius._6,
  },
  infoBox: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderRadius: radius._10,
    padding: spacingY._10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacingY._5,
  },
});