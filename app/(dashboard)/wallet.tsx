import { StyleSheet, View, TouchableOpacity, FlatList } from 'react-native';
import React, { useEffect } from 'react';
import ScreenWrapper from '@/components/ScreenWrapper';
import { colors, radius, spacingX, spacingY } from '@/constants/theme';
import { verticalScale } from '@/utils/styling';
import Typo from '@/components/Typo';
import * as Icons from 'phosphor-react-native';
import { useRouter } from 'expo-router';
import { WalletType } from '@/types';
import { useAuth } from '@/context/authContext';
import useFetchData from '@/hooks/useFetchData';
import { where, orderBy } from 'firebase/firestore';
import Loading from '@/components/Loading';
import WalletListItem from '@/components/WalletListItem';

const Wallet = () => {
  const router = useRouter();
  const { user } = useAuth();
  
  // Don't apply constraints if user is not available yet
  const constraints = user?.uid 
    ? [
        where('uid', '==', user.uid),
        orderBy('createdAt', 'desc')
      ] 
    : [];
  
  const { data: wallets, error, loading } = useFetchData<WalletType>(
    'wallets', 
    constraints
  );

  // Debug logging
  useEffect(() => {
    console.log("Wallets count:", wallets.length);
    console.log("User UID:", user?.uid);
    console.log("Loading:", loading);
    console.log("Error:", error);
  }, [wallets, user, loading, error]);

  const getTotalBalance = () => {
    return wallets.reduce((total, item) => {
      return total + (item.amount || 0);
    }, 0);
  };

  return (
    <ScreenWrapper style={{ backgroundColor: colors.black }}>
      <View style={styles.container}>
        {/* Balance view */}
        <View style={styles.balanceView}>
          <Typo size={45} fontWeight="500" color={colors.white}>
            ${getTotalBalance().toFixed(2)}
          </Typo>
          <Typo size={16} color={colors.neutral300}>
            Total Balance
          </Typo>
        </View>
        
        {/* Wallets view */}
        <View style={styles.wallets}>
          {/* Header */}
          <View style={styles.flexRow}>
            <Typo size={20} fontWeight="500">
              My Wallets
            </Typo>
            <TouchableOpacity onPress={() => router.push('../(modals)/walletModal')}>
              <Icons.PlusCircle 
                size={verticalScale(33)}
                color={colors.primary}
                weight="fill" 
              />
            </TouchableOpacity>
          </View>

          {/* Status indicator */}
          {error && (
            <View style={styles.statusContainer}>
              <Typo color={colors.danger}>Error: {error}</Typo>
            </View>
          )}

          {/* Loading indicator */}
          {loading ? (
            <Loading />
          ) : (
            <>
              {/* Empty state */}
              {wallets.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Icons.Wallet 
                    size={verticalScale(50)}
                    color={colors.neutral500}
                    weight="light"
                  />
                  <Typo color={colors.neutral400} style={styles.emptyText}>
                    No wallets found. Tap + to add one.
                  </Typo>
                </View>
              ) : (
                /* Wallet list */
              <FlatList
                data={wallets}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString(36).substring(7)}
                renderItem={({item, index}) => (
                  <WalletListItem item={item} index={index} router={router} />
                )}
                contentContainerStyle={styles.listStyle}
                showsVerticalScrollIndicator={false}
              />
              )}
            </>
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Wallet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  balanceView: {
    height: verticalScale(160),
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flexRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._10,
  },
  wallets: {
    flex: 1,
    backgroundColor: colors.neutral900,
    borderTopLeftRadius: radius._30, 
    borderTopRightRadius: radius._30,
    paddingTop: spacingX._25,
    padding: spacingX._20,
  },
  listStyle: {
    paddingVertical: spacingY._25,
    paddingTop: spacingY._15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: verticalScale(100),
  },
  emptyText: {
    marginTop: spacingY._15,
    textAlign: 'center',
  },
  statusContainer: {
    marginTop: spacingY._10,
    padding: spacingY._10,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: radius._10,
    alignItems: 'center',
  },
});