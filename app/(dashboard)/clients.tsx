import { FlatList, StyleSheet, View } from 'react-native';
import React from 'react';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { colors, spacingX, spacingY } from '@/constants/theme';
import { verticalScale } from '@/utils/styling';
import Button from '@/components/Button';
import { MagnifyingGlass, UserPlus, DotsThreeVertical } from 'phosphor-react-native';

const clients = [
  { id: '1', name: 'Juan Pérez', status: 'Activo', loans: 3 },
  { id: '2', name: 'Ana Martínez', status: 'En mora', loans: 1 },
  { id: '3', name: 'Luis Gómez', status: 'Activo', loans: 2 },
];

const ClientCard = ({ client }: { client: typeof clients[0] }) => (
  <View style={styles.card}>
    <View>
      <Typo size={18} fontWeight="700" color={colors.text}>{client.name}</Typo>
      <Typo size={14} color={colors.textLighter}>{client.loans} préstamos</Typo>
    </View>
    <DotsThreeVertical size={24} color={colors.textLighter} />
  </View>
);

const Clients = () => {
  return (
    <ScreenWrapper style={styles.wrapper}>
      <View style={styles.header}>
        <Typo size={28} fontWeight="800" color={colors.text}>Clientes</Typo>
        <Button style={styles.addButton}>
          <UserPlus size={20} color={colors.neutral950} />
        </Button>
      </View>

      {/* Búsqueda */}
      <View style={styles.searchBar}>
        <MagnifyingGlass size={20} color={colors.neutral300} />
        <Typo color={colors.textLighter}>Buscar cliente...</Typo>
      </View>

      {/* Lista */}
      <FlatList
        data={clients}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ClientCard client={item} />}
        contentContainerStyle={{ gap: spacingY._20 }}
      />
    </ScreenWrapper>
  );
};

export default Clients;

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacingX._20,
    gap: spacingY._20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._10,
    borderRadius: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.neutral900,
    padding: 10,
    borderRadius: 10,
  },
  card: {
    backgroundColor: colors.neutral900,
    padding: spacingY._20,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
