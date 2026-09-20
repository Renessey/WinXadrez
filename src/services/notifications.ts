import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getSetting } from '../database/db';

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {
  // Ignora se não for suportado no ambiente atual
}

let isInitialized = false;

export async function initNotifications(): Promise<void> {
  if (isInitialized) return;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('active-games', {
        name: 'Partidas em andamento',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#81b64c',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    isInitialized = finalStatus === 'granted';
  } catch (err) {
    console.warn('Erro ao inicializar notificações:', err);
  }
}

export async function notifyGameInProgress(opponent = 'Bot WinXadrez'): Promise<void> {
  try {
    const isEnabled = getSetting('notifications', 'true') === 'true';
    if (!isEnabled) return;

    await initNotifications();
    await cancelGameNotifications();

    await Notifications.scheduleNotificationAsync({
      identifier: 'winxadrez_active_match',
      content: {
        title: '♟️ Partida em andamento!',
        body: `Você tem um duelo ativo contra ${opponent}. Seu próximo lance o aguarda!`,
        data: { screen: 'Game' },
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
      },
    });
  } catch (err) {
    console.warn('Falha ao agendar notificação de partida:', err);
  }
}

export async function cancelGameNotifications(): Promise<void> {
  try {
    await Notifications.dismissNotificationAsync('winxadrez_active_match');
    await Notifications.cancelScheduledNotificationAsync('winxadrez_active_match');
  } catch {
    // ignorar caso não exista notificação ativa
  }
}
