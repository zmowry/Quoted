import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQuoteBank } from '@/src/hooks/useQuoteBank';
import { colors } from '@/src/theme';

const pad = (value: number): string => value.toString().padStart(2, '0');
type Meridiem = 'AM' | 'PM';

const displayHour = (hour24: number): number => hour24 % 12 || 12;
const meridiemFor = (hour24: number): Meridiem => hour24 >= 12 ? 'PM' : 'AM';

export default function SettingsScreen(): JSX.Element {
  const { notificationTime, updateNotificationTime } = useQuoteBank();
  const [hour, setHour] = useState(String(displayHour(notificationTime.hour)));
  const [minute, setMinute] = useState(pad(notificationTime.minute));
  const [meridiem, setMeridiem] = useState<Meridiem>(meridiemFor(notificationTime.hour));
  useEffect(() => {
    setHour(String(displayHour(notificationTime.hour)));
    setMinute(pad(notificationTime.minute));
    setMeridiem(meridiemFor(notificationTime.hour));
  }, [notificationTime.hour, notificationTime.minute]);
  const save = async (): Promise<void> => {
    const h = Number(hour); const m = Number(minute);
    if (!Number.isInteger(h) || !Number.isInteger(m) || h < 1 || h > 12 || m < 0 || m > 59) { Alert.alert('Use a valid time', 'Hour: 1–12. Minute: 0–59.'); return; }
    const hour24 = (h % 12) + (meridiem === 'PM' ? 12 : 0);
    await updateNotificationTime({ hour: hour24, minute: m });
    Alert.alert('Saved', `Your daily quote will arrive at ${h}:${pad(m)} ${meridiem}.`);
  };
  return <View style={styles.page}><Text style={styles.title}>Daily delivery</Text><Text style={styles.copy}>Choose when your local daily quote notification should arrive. Notifications gracefully do nothing on web if permission is unavailable.</Text><View style={styles.time}><TextInput accessibilityLabel="Notification hour" keyboardType="number-pad" maxLength={2} value={hour} onChangeText={setHour} style={styles.input} /><Text style={styles.colon}>:</Text><TextInput accessibilityLabel="Notification minute" keyboardType="number-pad" maxLength={2} value={minute} onChangeText={setMinute} style={styles.input} /><View style={styles.meridiem}><Pressable accessibilityRole="button" accessibilityState={{ selected: meridiem === 'AM' }} onPress={() => setMeridiem('AM')} style={[styles.period, meridiem === 'AM' && styles.periodSelected]}><Text style={[styles.periodText, meridiem === 'AM' && styles.periodTextSelected]}>AM</Text></Pressable><Pressable accessibilityRole="button" accessibilityState={{ selected: meridiem === 'PM' }} onPress={() => setMeridiem('PM')} style={[styles.period, meridiem === 'PM' && styles.periodSelected]}><Text style={[styles.periodText, meridiem === 'PM' && styles.periodTextSelected]}>PM</Text></Pressable></View></View><Pressable accessibilityRole="button" onPress={() => void save()} style={styles.button}><Text style={styles.buttonText}>Save notification time</Text></Pressable>{Platform.OS === 'web' ? <Text style={styles.note}>Web demo: notifications depend on your browser permission.</Text> : null}</View>;
}
const styles = StyleSheet.create({ page: { flex: 1, padding: 20, backgroundColor: colors.cream }, title: { fontSize: 26, fontWeight: '800', color: colors.chocolate }, copy: { marginTop: 10, color: colors.mutedChocolate, lineHeight: 22 }, time: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 28 }, input: { backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1, width: 66, padding: 14, borderRadius: 10, textAlign: 'center', fontSize: 20, color: colors.chocolate }, colon: { fontSize: 25, fontWeight: '800', color: colors.chocolate, marginHorizontal: 7 }, meridiem: { flexDirection: 'row', overflow: 'hidden', marginLeft: 12, borderRadius: 10, borderColor: colors.border, borderWidth: 1 }, period: { paddingHorizontal: 12, paddingVertical: 15, backgroundColor: colors.white }, periodSelected: { backgroundColor: colors.burntCaramel }, periodText: { color: colors.mutedChocolate, fontWeight: '800' }, periodTextSelected: { color: colors.white }, button: { backgroundColor: colors.caramel, padding: 15, borderRadius: 10, marginTop: 20, alignItems: 'center' }, buttonText: { color: colors.white, fontWeight: '800' }, note: { marginTop: 20, color: colors.mutedChocolate, fontSize: 13 } });
