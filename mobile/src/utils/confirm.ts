import { Alert, Platform } from 'react-native';

/**
 * Cross-platform confirmation.
 *
 * `Alert.alert` with buttons is a no-op on React Native Web (the button
 * callbacks never fire), which makes actions like "Log out" appear broken in
 * the browser. On web we fall back to the native `window.confirm`; on iOS /
 * Android we use the real `Alert`.
 */
export function confirm(opts: {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
}): void {
  if (Platform.OS === 'web') {
    const text = opts.message ? `${opts.title}\n\n${opts.message}` : opts.title;
    // eslint-disable-next-line no-alert
    if (typeof window !== 'undefined' && window.confirm(text)) opts.onConfirm();
    return;
  }
  Alert.alert(opts.title, opts.message, [
    { text: opts.cancelLabel, style: 'cancel' },
    {
      text: opts.confirmLabel,
      style: opts.destructive ? 'destructive' : 'default',
      onPress: opts.onConfirm,
    },
  ]);
}
