import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import Header from '@/components/Header';
import BackButton from '@/components/BackButton';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import { ClientType } from '@/types';
import { getClientById } from '@/services/clientService';
import Loading from '@/components/Loading';
import * as Icons from 'phosphor-react-native';
import { Image } from 'expo-image';
import { getProfileImage } from '@/services/imageServices';

const ClientDetail = () => {
  const params = useLocalSearchParams();
  const clientId = params.id as string;
  const router = useRouter();
  
  const [client, setClient] = useState<ClientType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClientDetails = async () => {
      try {
        setLoading(true);
        const result = await getClientById(clientId);
        
        if (result.success && result.data) {
          setClient(result.data as ClientType);
        } else {
          setError(result.msg || 'Error fetching client details');
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchClientDetails();
  }, [clientId]);

  const handleEditClient = () => {
    router.push({
      pathname: '/(modals)/clientModal',
      params: { id: clientId }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Activo':
        return colors.success;
      case 'En mora':
        return colors.danger;
      case 'Inactivo':
        return colors.neutral600;
      default:
        return colors.primary;
    }
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <Header title="Detalle del Cliente" leftIcon={<BackButton />} />
        <Loading />
      </ScreenWrapper>
    );
  }

  if (error || !client) {
    return (
      <ScreenWrapper>
        <Header title="Detalle del Cliente" leftIcon={<BackButton />} />
        <View style={styles.errorContainer}>
          <Icons.Warning size={50} color={colors.danger} />
          <Typo size={18} color={colors.danger} style={styles.errorText}>
            {error || 'No se pudo cargar la información del cliente'}
          </Typo>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Header 
          title="Detalle del Cliente" 
          leftIcon={<BackButton />}
          rightIcon={
            <TouchableOpacity onPress={handleEditClient}>
              <Icons.PencilSimple size={24} color={colors.primary} />
            </TouchableOpacity>
          }
        />
        
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Client Header */}
          <View style={styles.clientHeader}>
            <View style={styles.avatarContainer}>
              <Image
                source={getProfileImage(client.image)}
                style={styles.avatar}
                contentFit="cover"
              />
            </View>
            
            <View style={styles.clientInfo}>
              <Typo size={24} fontWeight="700" color={colors.text}>
                {client.name}
              </Typo>
              
              <View style={styles.statusContainer}>
                <View 
                  style={[
                    styles.statusBadge, 
                    { backgroundColor: getStatusColor(client.status) }
                  ]}
                >
                  <Typo size={12} color={colors.white} fontWeight="600">
                    {client.status}
                  </Typo>
                </View>
              </View>
            </View>
          </View>
          
          {/* Client Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Icons.Phone size={20} color={colors.primary} />
                <View style={styles.infoContent}>
                  <Typo size={14} color={colors.neutral400}>Teléfono</Typo>
                  <Typo size={16} color={colors.text}>
                    {client.phone || 'No disponible'}
                  </Typo>
                </View>
              </View>
              
              <View style={styles.infoRow}>
                <Icons.Envelope size={20} color={colors.primary} />
                <View style={styles.infoContent}>
                  <Typo size={14} color={colors.neutral400}>Email</Typo>
                  <Typo size={16} color={colors.text}>
                    {client.email || 'No disponible'}
                  </Typo>
                </View>
              </View>
              
              <View style={styles.infoRow}>
                <Icons.MapPin size={20} color={colors.primary} />
                <View style={styles.infoContent}>
                  <Typo size={14} color={colors.neutral400}>Dirección</Typo>
                  <Typo size={16} color={colors.text}>
                    {client.address || 'No disponible'}
                  </Typo>
                </View>
              </View>
            </View>
            
            {/* Loan Summary */}
            <View style={styles.loanSummary}>
              <View style={styles.loanStat}>
                <Typo size={22} fontWeight="700" color={colors.primary}>
                  {client.loans || 0}
                </Typo>
                <Typo size={14} color={colors.neutral400}>
                  Préstamos
                </Typo>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.loanStat}>
                <Typo size={22} fontWeight="700" color={colors.primary}>
                  ${client.totalDebt?.toFixed(2) || '0.00'}
                </Typo>
                <Typo size={14} color={colors.neutral400}>
                  Deuda Total
                </Typo>
              </View>
            </View>
            
            {/* Notes */}
            {client.notes ? (
              <View style={styles.notesContainer}>
                <Typo size={16} fontWeight="600" color={colors.text} style={styles.sectionTitle}>
                  Notas
                </Typo>
                <View style={styles.notesCard}>
                  <Typo color={colors.neutral300}>
                    {client.notes}
                  </Typo>
                </View>
              </View>
            ) : null}
            
            {/* Actions */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push({
                  pathname: '/(modals)/loanModal',
                  params: { clientId: client.id }
                })}
              >
                <Icons.CurrencyDollar size={24} color={colors.white} />
                <Typo color={colors.white} size={16} fontWeight="600">
                  Nuevo Préstamo
                </Typo>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => router.push({
                  pathname: '/(client)/loans',
                  params: { clientId: client.id }
                })}
              >
                <Icons.ClockCounterClockwise size={24} color={colors.primary} />
                <Typo color={colors.primary} size={16} fontWeight="600">
                  Ver Historial
                </Typo>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

export default ClientDetail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacingX._20,
  },
  errorText: {
    textAlign: 'center',
    marginTop: spacingY._15,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacingY._20,
    marginBottom: spacingY._25,
  },
  avatarContainer: {
    marginRight: spacingX._15,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.neutral800,
  },
  clientInfo: {
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    marginTop: spacingY._5,
  },
  statusBadge: {
    paddingHorizontal: spacingX._10,
    paddingVertical: spacingY._5,
    borderRadius: 20,
  },
  detailsContainer: {
    gap: spacingY._20,
    paddingBottom: spacingY._30,
  },
  infoCard: {
    backgroundColor: colors.neutral900,
    borderRadius: radius._15,
    padding: spacingY._15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacingY._10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral800,
  },
  infoContent: {
    marginLeft: spacingX._15,
  },
  loanSummary: {
    flexDirection: 'row',
    backgroundColor: colors.neutral900,
    borderRadius: radius._15,
    padding: spacingY._15,
  },
  loanStat: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: colors.neutral800,
    height: '80%',
    alignSelf: 'center',
  },
  notesContainer: {
    gap: spacingY._10,
  },
  sectionTitle: {
    marginLeft: spacingX._5,
  },
  notesCard: {
    backgroundColor: colors.neutral900,
    borderRadius: radius._15,
    padding: spacingY._15,
  },
  actionsContainer: {
    marginTop: spacingY._10,
    gap: spacingY._15,
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: radius._15,
    paddingVertical: spacingY._15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacingX._10,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
});