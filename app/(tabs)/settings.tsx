import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MAX_EXTRA_QUOTES } from '@/src/services/storage';
import { Ionicons } from '@expo/vector-icons';
import { isCustomQuote } from '@/src/customQuotes';
import { coverageLabel } from '@/src/format';
import { themesForQuote, themesInBank } from '@/src/data/authorsData';
import { themeLabel } from '@/src/data/themes';
import type { ThemeId } from '@/src/data/themes';
import { deliveryScopeActive } from '@/src/services/queueManager';
import { ALL_QUOTES, sameScope } from '@/src/types';
import { useNotificationPermission } from '@/src/hooks/useNotificationPermission';
import { useQuoteBank } from '@/src/hooks/useQuoteBank';
import { useTheme } from '@/src/hooks/useTheme';
import type { TextSize } from '@/src/hooks/useTheme';
import { measure } from '@/src/theme';
import type { Colors, ThemeMode } from '@/src/theme';
import type { AdditionalQuotesSettings, DeliveryScope, NotificationTime, QuoteOrder } from '@/src/types';

const pad = (value: number): string => value.toString().padStart(2, '0');
type Meridiem = 'AM' | 'PM';
const displayHour = (h24: number): number => h24 % 12 || 12;
const meridiemFor = (h24: number): Meridiem => h24 >= 12 ? 'PM' : 'AM';
const to24 = (h: number, m: Meridiem): number => (h % 12) + (m === 'PM' ? 12 : 0);

type TimeState = { hour: string; minute: string; meridiem: Meridiem };
const fromNT = (t: NotificationTime): TimeState => ({ hour: String(displayHour(t.hour)), minute: pad(t.minute), meridiem: meridiemFor(t.hour) });
const toNT = (t: TimeState): NotificationTime | null => {
  const h = Number(t.hour); const m = Number(t.minute);
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 1 || h > 12 || m < 0 || m > 59) return null;
  return { hour: to24(h, t.meridiem), minute: m };
};

function TimePicker({ value, label, onChange, compact = false, colors, scale }: { value: TimeState; label: string; onChange: (v: TimeState) => void; compact?: boolean; colors: Colors; scale: (n: number) => number }): ReactElement {
  const styles = useMemo(() => makeStyles(colors, scale), [colors, scale]);
  const inp = compact ? styles.inputSm : styles.inputMd;
  const col = compact ? styles.colonSm : styles.colonMd;
  const mer = compact ? styles.meridiemSm : styles.meridiemMd;
  const per = compact ? styles.periodSm : styles.periodMd;
  const perT = compact ? styles.periodTextSm : styles.periodTextMd;
  return (
    <View style={[styles.timeRow, { marginTop: compact ? 8 : 14 }]}>
      <TextInput accessibilityLabel={`${label} hour`} keyboardType="number-pad" maxLength={2} value={value.hour} onChangeText={(v) => onChange({ ...value, hour: v })} style={inp} />
      <Text style={col}>:</Text>
      <TextInput accessibilityLabel={`${label} minute`} keyboardType="number-pad" maxLength={2} value={value.minute} onChangeText={(v) => onChange({ ...value, minute: v })} style={inp} />
      <View style={mer}>
        <Pressable accessibilityRole="button" accessibilityState={{ selected: value.meridiem === 'AM' }} onPress={() => onChange({ ...value, meridiem: 'AM' })} style={[per, value.meridiem === 'AM' && styles.periodSelected]}>
          <Text style={[perT, value.meridiem === 'AM' && styles.periodTextSelected]}>AM</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityState={{ selected: value.meridiem === 'PM' }} onPress={() => onChange({ ...value, meridiem: 'PM' })} style={[per, value.meridiem === 'PM' && styles.periodSelected]}>
          <Text style={[perT, value.meridiem === 'PM' && styles.periodTextSelected]}>PM</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function SettingsScreen(): ReactElement {
  const { notificationTime, additionalQuotes, quotes, collections, loading, updateNotificationTime, updateAdditionalQuotes, clearAllData, quoteOrder, updateQuoteOrder, soundEnabled, updateSoundEnabled, deliveryScope, updateDeliveryScope, deliveryPool, extraPools, scheduleCoverage } = useQuoteBank();
  const { colors, mode, resolvedMode, setMode, textSize, setTextSize, scale } = useTheme();
  const { status: permissionStatus, request: requestPermission, openSystemSettings } = useNotificationPermission();
  // 'unknown' means the check itself failed; stay quiet rather than raise a false alarm.
  const needsPermission = permissionStatus === 'denied' || permissionStatus === 'undetermined';
  const styles = useMemo(() => makeStyles(colors, scale), [colors, scale]);

  const [mainTime, setMainTime] = useState<TimeState>(fromNT(notificationTime));
  const [mainSaved, setMainSaved] = useState(false);

  const saveMain = async (): Promise<void> => {
    const nt = toNT(mainTime);
    if (!nt) { Alert.alert('Use a valid time', 'Hour: 1-12. Minute: 0-59.'); return; }
    await updateNotificationTime(nt);
    setMainSaved(true);
  };

  const [extraEnabled, setExtraEnabled] = useState(additionalQuotes.enabled);
  const [extraCount, setExtraCount] = useState(additionalQuotes.count);
  const [extraTimes, setExtraTimes] = useState<TimeState[]>(additionalQuotes.times.map(fromNT));
  const [extraScopes, setExtraScopes] = useState<(DeliveryScope | null)[]>(additionalQuotes.scopes);
  const [extraSaved, setExtraSaved] = useState(false);

  // Stored settings arrive asynchronously, so seed the form from them exactly once.
  // Re-syncing on every context change would clobber unsaved input: the provider
  // hands back a fresh `additionalQuotes` object on each update, so an effect keyed
  // on it fires after the user has already started editing and resets their choices.
  const hydrated = useRef(false);
  useEffect(() => {
    if (loading || hydrated.current) return;
    hydrated.current = true;
    setMainTime(fromNT(notificationTime));
    setExtraEnabled(additionalQuotes.enabled);
    setExtraCount(additionalQuotes.count);
    setExtraTimes(additionalQuotes.times.map(fromNT));
    setExtraScopes(additionalQuotes.scopes);
  }, [loading, notificationTime, additionalQuotes]);

  const markDirty = (): void => setExtraSaved(false);

  const saveExtra = async (): Promise<void> => {
    const parsed = extraTimes.map(toNT);
    if (parsed.some((t) => t === null)) { Alert.alert('Use valid times', 'Each hour must be 1-12 and minute 0-59.'); return; }
    const newSettings: AdditionalQuotesSettings = {
      enabled: extraEnabled,
      count: extraCount,
      times: parsed as NotificationTime[],
      // Padded rather than trimmed to the current count, so turning the count
      // back up restores the scope each slot had before.
      scopes: Array.from({ length: MAX_EXTRA_QUOTES }, (_, i) => extraScopes[i] ?? null),
    };
    await updateAdditionalQuotes(newSettings);
    setExtraSaved(true);
  };

  const setSlotScope = (slot: number, scope: DeliveryScope | null): void => {
    setExtraScopes((prev) => Array.from({ length: MAX_EXTRA_QUOTES }, (_, i) => i === slot ? scope : (prev[i] ?? null)));
    markDirty();
  };

  const modeOptions: { value: ThemeMode; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];

  const orderOptions: { value: QuoteOrder; label: string }[] = [
    { value: 'sequential', label: 'In order' },
    { value: 'shuffle', label: 'Shuffle' },
  ];

  const textSizeOptions: { value: TextSize; label: string }[] = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
  ];

  // Destructive and irreversible, so it asks twice and never defaults to the
  // affirmative button.
  const confirmClearAll = (): void => {
    // Quotes the user wrote are the only data here that cannot be recovered from
    // the built-in catalogue, and there is no backup, so the count is named
    // explicitly rather than hidden inside the total.
    const own = quotes.filter(isCustomQuote).length;
    const ownClause = own ? `, including ${own} you wrote yourself` : '';
    Alert.alert(
      'Clear all data?',
      `This deletes ${quotes.length} saved ${quotes.length === 1 ? 'quote' : 'quotes'}${ownClause} and ${collections.length} ${collections.length === 1 ? 'collection' : 'collections'} from this device. It cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete everything', style: 'destructive', onPress: () => void clearAllData() },
      ],
    );
  };

  // True when a scope is chosen but `deliveryPool` has widened back to the whole
  // bank, i.e. it matches none of the user's saved quotes. Asked of the service
  // rather than recomputed here, so the screen cannot disagree with the pool it
  // is describing.
  const scopeFellBack = deliveryScope.kind !== 'all' && !deliveryScopeActive(quotes, collections, deliveryScope);

  // Only themes something in the bank actually carries: a scope matching nothing
  // would silently fall back to the whole bank the moment it was chosen.
  const bankThemes = useMemo(() => themesInBank(quotes), [quotes]);
  const themeSize = (id: ThemeId): number => quotes.filter((q) => themesForQuote(q).includes(id)).length;

  const [openDisplay, setOpenDisplay] = useState(false);
  const [openDelivery, setOpenDelivery] = useState(false);
  const [openExtra, setOpenExtra] = useState(false);
  const [openData, setOpenData] = useState(false);

  // Don't render the form over stale defaults; the fields would visibly reset
  // under the user the moment the stored settings land.
  if (loading) return <View style={styles.center}><ActivityIndicator /></View>;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>

      {/* Sits above the cards, not inside one: the cards start collapsed, so a
          warning nested in one would never be seen by the people it is for. */}
      {needsPermission ? (
        <View style={styles.permissionBanner}>
          <Ionicons name="notifications-off-outline" size={18} color={colors.burntCaramel} />
          <View style={styles.permissionText}>
            <Text style={styles.permissionTitle}>Notifications are turned off</Text>
            <Text style={styles.permissionCopy}>
              {permissionStatus === 'denied'
                ? 'Quoted cannot deliver quotes until you allow notifications in system settings. The times below will not fire.'
                : 'Allow notifications so your daily quote can reach you.'}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => void (permissionStatus === 'denied' ? openSystemSettings() : requestPermission())}
            style={styles.permissionBtn}
          >
            <Text style={styles.permissionBtnText}>{permissionStatus === 'denied' ? 'Open settings' : 'Allow'}</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Appearance and text size are one card: two collapsed headers for two
          three-button rows was more chrome than content, and both answer the same
          question about how the app looks. */}
      <View style={styles.card}>
        <Pressable style={styles.cardHeader} onPress={() => setOpenDisplay((v) => !v)}>
          <Text style={styles.cardTitle}>Display</Text>
          <Ionicons name={openDisplay ? 'chevron-up' : 'chevron-down'} size={16} color={colors.mutedChocolate} />
        </Pressable>
        {openDisplay ? (
          <View style={styles.cardBody}>
            <Text style={styles.label}>Display mode</Text>
            <View style={styles.modeRow}>
              {modeOptions.map(({ value, label }) => (
                <Pressable key={value} onPress={() => void setMode(value)} style={[styles.modeBtn, mode === value && styles.modeBtnActive]}>
                  <Text style={[styles.modeBtnText, mode === value && styles.modeBtnTextActive]}>{label}</Text>
                </Pressable>
              ))}
            </View>
            {mode === 'system' ? <Text style={styles.copy}>Following your device appearance ({resolvedMode}).</Text> : null}

            <Text style={[styles.label, { marginTop: 18 }]}>Text size</Text>
            <View style={styles.modeRow}>
              {textSizeOptions.map(({ value, label }) => (
                <Pressable key={value} onPress={() => void setTextSize(value)} style={[styles.modeBtn, textSize === value && styles.modeBtnActive]}>
                  <Text style={[styles.modeBtnText, textSize === value && styles.modeBtnTextActive]}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <Pressable style={styles.cardHeader} onPress={() => setOpenDelivery((v) => !v)}>
          <Text style={styles.cardTitle}>Daily delivery</Text>
          <Ionicons name={openDelivery ? 'chevron-up' : 'chevron-down'} size={16} color={colors.mutedChocolate} />
        </Pressable>
        {openDelivery ? (
          <View style={styles.cardBody}>
            <Text style={styles.copy}>Choose when your daily quote notification should arrive.</Text>
            <TimePicker value={mainTime} label="Notification" colors={colors} scale={scale} onChange={(v) => { setMainTime(v); setMainSaved(false); }} />
            <Pressable accessibilityRole="button" onPress={() => void saveMain()} style={({ pressed }) => [styles.button, { marginTop: 16, opacity: pressed ? 0.75 : 1 }]}>
              {({ pressed }) => <Text style={styles.buttonText}>{pressed ? 'Saving...' : 'Save notification time'}</Text>}
            </Pressable>
            {mainSaved ? <Text style={styles.savedMsg}>(Setting saved)</Text> : null}

            {/* The runway is otherwise invisible: quotes are written to the OS in
                advance and only topped up on launch, so someone who stops opening
                the app stops receiving quotes with nothing to explain it. */}
            {scheduleCoverage?.through ? (
              <View style={styles.runway} testID="schedule-runway">
                <Ionicons name="calendar-outline" size={14} color={colors.mutedChocolate} />
                <Text style={styles.runwayText}>
                  Queued through {coverageLabel(scheduleCoverage.through)}. Opening the app extends
                  the run; if it lapses, a reminder will tell you quotes have paused.
                  {scheduleCoverage.truncated
                    ? ' More quotes per day shortens this — iOS caps how many notifications can wait at once.'
                    : ''}
                </Text>
              </View>
            ) : null}

            <Text style={[styles.label, { marginTop: 18 }]}>Which quote comes next?</Text>
            <View style={styles.modeRow}>
              {orderOptions.map(({ value, label }) => (
                <Pressable key={value} accessibilityRole="button" onPress={() => void updateQuoteOrder(value)} style={[styles.modeBtn, quoteOrder === value && styles.modeBtnActive]}>
                  <Text style={[styles.modeBtnText, quoteOrder === value && styles.modeBtnTextActive]}>{label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.copy}>
              {quoteOrder === 'shuffle'
                ? 'Picks at random, still showing every saved quote once before any repeats.'
                : 'Works through your saved quotes in the order you saved them.'}
            </Text>

            <Text style={[styles.label, { marginTop: 18 }]}>Which quotes can be delivered?</Text>
            <View style={styles.scopeList}>
              {[{ scope: ALL_QUOTES, name: 'All saved quotes', size: quotes.length }, ...collections.map((col) => ({
                scope: { kind: 'collection', id: col.id } as DeliveryScope,
                name: col.name,
                // Counted against the bank, not `col.quoteIds.length`: a
                // collection can still reference quotes that have been deleted.
                size: quotes.filter((q) => col.quoteIds.includes(q.id)).length,
              }))].map(({ scope, name, size }) => {
                const selected = sameScope(deliveryScope, scope);
                return (
                  <Pressable
                    key={scope.kind === 'all' ? 'all' : scope.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => void updateDeliveryScope(scope)}
                    style={[styles.scopeRow, selected && styles.scopeRowActive]}
                  >
                    <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={16} color={selected ? colors.caramel : colors.taupe} />
                    <Text style={[styles.scopeText, selected && styles.scopeTextActive]} numberOfLines={1}>{name}</Text>
                    <Text style={styles.scopeCount}>{size}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* A chip row rather than more radio rows: there are 21 themes in the
                vocabulary against a handful of collections, and a list that long
                would bury the sound toggle below it. Selecting either kind still
                replaces the other — one scope, two ways to name it. */}
            {bankThemes.length ? (
              <>
                <Text style={styles.slotScopeLabel}>Or by theme</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} testID="delivery-theme-chips" style={styles.slotScope} contentContainerStyle={styles.slotScopeContent}>
                  {bankThemes.map((id) => {
                    const selected = deliveryScope.kind === 'theme' && deliveryScope.id === id;
                    return (
                      <Pressable
                        key={id}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={`Deliver from theme ${themeLabel(id)}`}
                        onPress={() => void updateDeliveryScope({ kind: 'theme', id })}
                        style={[styles.slotChip, selected && styles.slotChipActive]}
                      >
                        <Text style={[styles.slotChipText, selected && styles.slotChipTextActive]}>{themeLabel(id)} · {themeSize(id)}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </>
            ) : null}

            {scopeFellBack ? (
              // The fallback is deliberate but silent otherwise: someone whose
              // scope is empty would see a quote from outside it with no
              // explanation and assume the setting was ignored.
              <Text style={styles.scopeWarning}>
                {deliveryScope.kind === 'theme'
                  ? 'Nothing in your bank carries that theme right now, so quotes are being delivered from your whole bank until something does.'
                  : 'That collection has no saved quotes right now, so quotes are being delivered from your whole bank until you add some.'}
              </Text>
            ) : deliveryScope.kind === 'all' ? (
              <Text style={styles.copy}>
                {collections.length === 0 && bankThemes.length === 0
                  ? 'Create a collection in your quote bank to narrow what gets delivered.'
                  : 'Every quote in your bank is in the rotation.'}
              </Text>
            ) : (
              <Text style={styles.copy}>
                Delivering from {deliveryPool.length} {deliveryPool.length === 1 ? 'quote' : 'quotes'}
                {deliveryScope.kind === 'theme' ? ` tagged ${themeLabel(deliveryScope.id)}.` : ' in this collection.'}
              </Text>
            )}

            <View style={styles.yesNoRow}>
              <Text style={styles.label}>Play a sound on notification?</Text>
              <View style={styles.toggle}>
                <Pressable accessibilityRole="button" accessibilityLabel="Play a sound: No" accessibilityState={{ selected: !soundEnabled }} onPress={() => void updateSoundEnabled(false)} style={[styles.toggleBtn, !soundEnabled && styles.toggleActive]}>
                  <Text style={[styles.toggleText, !soundEnabled && styles.toggleTextActive]}>No</Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Play a sound: Yes" accessibilityState={{ selected: soundEnabled }} onPress={() => void updateSoundEnabled(true)} style={[styles.toggleBtn, soundEnabled && styles.toggleActive]}>
                  <Text style={[styles.toggleText, soundEnabled && styles.toggleTextActive]}>Yes</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <Pressable style={styles.cardHeader} onPress={() => setOpenExtra((v) => !v)}>
          <Text style={styles.cardTitle}>More quotes per day</Text>
          <Ionicons name={openExtra ? 'chevron-up' : 'chevron-down'} size={16} color={colors.mutedChocolate} />
        </Pressable>
        {openExtra ? (
          <View style={styles.cardBody}>
            <Text style={styles.copy}>Receive additional quotes throughout the day as push notifications.</Text>
            <View style={styles.yesNoRow}>
              <Text style={styles.label}>Do you want more quotes per day?</Text>
              <View style={styles.toggle}>
                <Pressable accessibilityRole="button" accessibilityLabel="More quotes per day: No" accessibilityState={{ selected: !extraEnabled }} onPress={() => { setExtraEnabled(false); markDirty(); }} style={[styles.toggleBtn, !extraEnabled && styles.toggleActive]}>
                  <Text style={[styles.toggleText, !extraEnabled && styles.toggleTextActive]}>No</Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="More quotes per day: Yes" accessibilityState={{ selected: extraEnabled }} onPress={() => { setExtraEnabled(true); markDirty(); }} style={[styles.toggleBtn, extraEnabled && styles.toggleActive]}>
                  <Text style={[styles.toggleText, extraEnabled && styles.toggleTextActive]}>Yes</Text>
                </Pressable>
              </View>
            </View>
            {extraEnabled ? (
              <>
                <Text style={[styles.label, { marginTop: 16 }]}>How many additional quotes?</Text>
                <View testID="extra-count" style={styles.countRow}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Pressable key={n} onPress={() => { setExtraCount(n); markDirty(); }} style={[styles.countBtn, extraCount === n && styles.countBtnActive]}>
                      <Text style={[styles.countText, extraCount === n && styles.countTextActive]}>{n}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={[styles.label, { marginTop: 16 }]}>Notification times</Text>
                {extraTimes.slice(0, extraCount).map((t, i) => {
                  const slotScope = extraScopes[i] ?? null;
                  // Reported against the bank rather than the scope's own
                  // membership, and only once saved: the pools come from the
                  // provider, so an unsaved pick has no pool behind it yet.
                  const slotSize = extraPools[i]?.length;
                  const saved = additionalQuotes.scopes[i] ?? null;
                  // "Same as daily" first, then every way to narrow it. Themes
                  // are offered here too, or narrowing the daily scope to a theme
                  // would leave the slots unable to say the same thing.
                  const options: { key: string; label: string; scope: DeliveryScope | null }[] = [
                    { key: 'same', label: 'Same as daily', scope: null },
                    ...collections.map((col) => ({ key: `c-${col.id}`, label: col.name, scope: { kind: 'collection', id: col.id } as DeliveryScope })),
                    ...bankThemes.map((id) => ({ key: `t-${id}`, label: themeLabel(id), scope: { kind: 'theme', id } as DeliveryScope })),
                  ];
                  return (
                    <View key={i} style={styles.extraSlot}>
                      <Text style={styles.slotLabel}>Quote {i + 2}</Text>
                      <TimePicker compact colors={colors} scale={scale} value={t} label={`Extra quote ${i + 1}`} onChange={(v) => { setExtraTimes((prev) => prev.map((ts, idx) => idx === i ? v : ts)); markDirty(); }} />
                      {options.length > 1 ? (
                        <>
                          <Text style={styles.slotScopeLabel}>Draw from</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} testID={`slot-collections-${i}`} style={styles.slotScope} contentContainerStyle={styles.slotScopeContent}>
                            {options.map(({ key, label, scope }) => {
                              // "Same as daily" rather than "All saved quotes": the
                              // slot follows the delivery scope above, so it stays
                              // correct if that is narrowed later.
                              const active = scope === null ? slotScope === null : !!slotScope && sameScope(slotScope, scope);
                              return (
                                <Pressable
                                  key={key}
                                  accessibilityRole="button"
                                  accessibilityState={{ selected: active }}
                                  accessibilityLabel={`Quote ${i + 2} from: ${label}`}
                                  onPress={() => setSlotScope(i, scope)}
                                  style={[styles.slotChip, active && styles.slotChipActive]}
                                >
                                  <Text style={[styles.slotChipText, active && styles.slotChipTextActive]}>{label}</Text>
                                </Pressable>
                              );
                            })}
                          </ScrollView>
                          {slotScope !== null && saved !== null && sameScope(slotScope, saved) && slotSize !== undefined ? (
                            <Text style={styles.slotScopeCopy}>
                              {deliveryScopeActive(quotes, collections, slotScope)
                                ? `Drawing from ${slotSize} ${slotSize === 1 ? 'quote' : 'quotes'}.`
                                : slotScope.kind === 'theme'
                                  ? 'Nothing in your bank carries that theme right now, so this one falls back to your whole bank.'
                                  : 'That collection has no saved quotes right now, so this one falls back to your whole bank.'}
                            </Text>
                          ) : null}
                        </>
                      ) : null}
                    </View>
                  );
                })}
              </>
            ) : null}
            <Pressable accessibilityRole="button" onPress={() => void saveExtra()} style={({ pressed }) => [styles.button, { marginTop: 16, opacity: pressed ? 0.75 : 1 }]}>
              {({ pressed }) => <Text style={styles.buttonText}>{pressed ? 'Saving...' : 'Save additional settings'}</Text>}
            </Pressable>
            {extraSaved ? <Text style={styles.savedMsg}>(Setting saved)</Text> : null}
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <Pressable style={styles.cardHeader} onPress={() => setOpenData((v) => !v)}>
          <Text style={styles.cardTitle}>Your data</Text>
          <Ionicons name={openData ? 'chevron-up' : 'chevron-down'} size={16} color={colors.mutedChocolate} />
        </Pressable>
        {openData ? (
          <View style={styles.cardBody}>
            <Text style={styles.copy}>
              Everything lives on this device only. Clearing removes your saved quotes, collections,
              and notification settings, and cancels any quotes already queued for delivery.
            </Text>
            <Text style={styles.dataCount}>{quotes.length} saved {quotes.length === 1 ? 'quote' : 'quotes'} · {collections.length} {collections.length === 1 ? 'collection' : 'collections'}</Text>
            <Pressable accessibilityRole="button" onPress={confirmClearAll} style={({ pressed }) => [styles.dangerButton, { opacity: pressed ? 0.75 : 1 }]}>
              <Ionicons name="trash-outline" size={13} color={colors.white} />
              <Text style={styles.buttonText}>Clear all data</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

    </ScrollView>
  );
}

function makeStyles(colors: Colors, scale: (n: number) => number) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: colors.cream },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream },
    page: { padding: 14, paddingBottom: 40, gap: 12, ...measure },
    card: { backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.border, shadowColor: colors.chocolate, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 },
    permissionBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.softCream, borderRadius: 14, borderWidth: 1, borderColor: colors.burntCaramel, padding: 14 },
    permissionText: { flex: 1 },
    permissionTitle: { fontSize: scale(14), fontWeight: '800', color: colors.chocolate },
    permissionCopy: { marginTop: 3, fontSize: scale(12), lineHeight: scale(17), color: colors.mutedChocolate },
    permissionBtn: { backgroundColor: colors.burntCaramel, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 8 },
    permissionBtnText: { color: colors.white, fontWeight: '800', fontSize: scale(11) },
    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    cardBody: { paddingHorizontal: 16, paddingBottom: 16 },
    cardTitle: { fontSize: scale(18), fontWeight: '800', color: colors.chocolate, flex: 1 },
    copy: { marginTop: 6, fontSize: scale(13), color: colors.mutedChocolate, lineHeight: scale(19) },
    modeRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
    modeBtn: { flex: 1, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.softCream, alignItems: 'center' },
    modeBtnActive: { backgroundColor: colors.chocolate, borderColor: colors.chocolate },
    modeBtnText: { fontSize: scale(12), fontWeight: '700', color: colors.mutedChocolate },
    modeBtnTextActive: { color: colors.white },
    timeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
    inputMd: { backgroundColor: colors.softCream, borderColor: colors.border, borderWidth: 1, width: 44, padding: 7, borderRadius: 7, textAlign: 'center', fontSize: scale(14), color: colors.chocolate },
    colonMd: { fontSize: scale(16), fontWeight: '800', color: colors.chocolate, marginHorizontal: 4 },
    meridiemMd: { flexDirection: 'row', overflow: 'hidden', marginLeft: 8, borderRadius: 7, borderColor: colors.border, borderWidth: 1 },
    periodMd: { paddingHorizontal: 9, paddingVertical: 9, backgroundColor: colors.softCream },
    inputSm: { backgroundColor: colors.softCream, borderColor: colors.border, borderWidth: 1, width: 44, padding: 7, borderRadius: 7, textAlign: 'center', fontSize: scale(14), color: colors.chocolate },
    colonSm: { fontSize: scale(15), fontWeight: '800', color: colors.chocolate, marginHorizontal: 4 },
    meridiemSm: { flexDirection: 'row', overflow: 'hidden', marginLeft: 7, borderRadius: 7, borderColor: colors.border, borderWidth: 1 },
    periodSm: { paddingHorizontal: 8, paddingVertical: 8, backgroundColor: colors.softCream },
    periodSelected: { backgroundColor: colors.burntCaramel },
    periodTextMd: { color: colors.mutedChocolate, fontWeight: '800', fontSize: scale(11) },
    periodTextSm: { color: colors.mutedChocolate, fontWeight: '800', fontSize: scale(11) },
    periodTextSelected: { color: colors.white },
    button: { backgroundColor: colors.caramel, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, alignItems: 'center' },
    dangerButton: { flexDirection: 'row', gap: 6, backgroundColor: colors.burntCaramel, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
    dataCount: { marginTop: 10, fontSize: scale(12), fontWeight: '700', color: colors.chocolate },
    buttonText: { color: colors.white, fontWeight: '800', fontSize: scale(12) },
    savedMsg: { marginTop: 7, color: '#2E7D32', fontWeight: '700', fontSize: scale(12), textAlign: 'center' },
    label: { fontSize: scale(13), fontWeight: '700', color: colors.chocolate, marginTop: 10 },
    yesNoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
    toggle: { flexDirection: 'row', backgroundColor: colors.border, borderRadius: 7, padding: 2, gap: 2 },
    toggleBtn: { paddingVertical: 5, paddingHorizontal: 13, borderRadius: 5 },
    toggleActive: { backgroundColor: colors.chocolate },
    toggleText: { fontSize: scale(13), fontWeight: '700', color: colors.mutedChocolate },
    toggleTextActive: { color: colors.white },
    runway: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginTop: 12, padding: 10, borderRadius: 9, backgroundColor: colors.softCream },
    runwayText: { flex: 1, fontSize: scale(12), lineHeight: scale(17), color: colors.mutedChocolate },
    scopeList: { marginTop: 10, gap: 6 },
    scopeRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.softCream },
    scopeRowActive: { borderColor: colors.caramel },
    scopeText: { flex: 1, fontSize: scale(13), fontWeight: '700', color: colors.mutedChocolate },
    scopeTextActive: { color: colors.chocolate },
    scopeCount: { fontSize: scale(12), fontWeight: '700', color: colors.taupe },
    scopeWarning: { marginTop: 8, fontSize: scale(12), lineHeight: scale(18), color: colors.burntCaramel, fontWeight: '600' },
    countRow: { flexDirection: 'row', gap: 7, marginTop: 10 },
    countBtn: { width: 38, height: 38, borderRadius: 7, backgroundColor: colors.softCream, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    countBtnActive: { backgroundColor: colors.chocolate, borderColor: colors.chocolate },
    countText: { fontSize: scale(14), fontWeight: '700', color: colors.mutedChocolate },
    countTextActive: { color: colors.white },
    extraSlot: { marginTop: 10, backgroundColor: colors.softCream, borderRadius: 9, borderWidth: 1, borderColor: colors.border, padding: 10 },
    slotLabel: { fontSize: scale(11), fontWeight: '700', color: colors.mutedChocolate, textTransform: 'uppercase', letterSpacing: 0.6 },
    slotScopeLabel: { marginTop: 12, fontSize: scale(11), fontWeight: '700', color: colors.mutedChocolate, textTransform: 'uppercase', letterSpacing: 0.6 },
    // flexShrink pinned as well as flexGrow: ScrollView's own base style sets
    // both to 1, and leaving the shrink in place lets a tight card clip the row.
    slotScope: { flexGrow: 0, flexShrink: 0, marginTop: 7 },
    slotScopeContent: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 4 },
    slotChip: { paddingVertical: 5, paddingHorizontal: 11, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
    slotChipActive: { backgroundColor: colors.caramel, borderColor: colors.caramel },
    slotChipText: { fontSize: scale(11), fontWeight: '700', color: colors.mutedChocolate },
    slotChipTextActive: { color: colors.white },
    slotScopeCopy: { marginTop: 7, fontSize: scale(11), lineHeight: scale(16), color: colors.mutedChocolate },
  });
}
