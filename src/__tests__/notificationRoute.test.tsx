import type { ReactElement } from 'react';
import { View } from 'react-native';
import { render } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useNotificationRoute } from '@/src/hooks/useNotificationRoute';

const DEFAULT_ACTION = 'expo.modules.notifications.actions.DEFAULT';

/**
 * The shape the hook reads out of a notification response.
 *
 * `data` is omitted entirely by default, which is exactly what a notification
 * scheduled by an earlier build looks like — those cases double as the proof
 * that reading the payload cannot throw on one.
 */
const responseFor = (identifier: string, actionIdentifier = DEFAULT_ACTION, data?: unknown) =>
  ({
    actionIdentifier,
    notification: { request: { identifier, ...(data === undefined ? {} : { content: { data } }) } },
  } as unknown as ReturnType<typeof Notifications.useLastNotificationResponse>);

const setResponse = (response: ReturnType<typeof Notifications.useLastNotificationResponse>): void => {
  jest.mocked(Notifications.useLastNotificationResponse).mockReturnValue(response);
};

function Probe(): ReactElement {
  useNotificationRoute();
  return <View />;
}

beforeEach(() => jest.clearAllMocks());
afterEach(() => setResponse(null));

describe('Notification tap routing', () => {
  it('opens the Quote Bank home screen', async () => {
    setResponse(responseFor('quote-1'));
    render(<Probe />);
    expect(router.navigate).toHaveBeenCalledWith('/');
  });

  it('stays put when no notification has been tapped', () => {
    setResponse(null);
    render(<Probe />);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('routes once per tap rather than on every render', () => {
    // The hook keeps handing back the same response, so re-rendering must not
    // keep navigating on top of whatever the user has since opened.
    setResponse(responseFor('quote-1'));
    const view = render(<Probe />);
    view.rerender(<Probe />);
    view.rerender(<Probe />);
    expect(router.navigate).toHaveBeenCalledTimes(1);
  });

  it('routes again when a different notification is tapped', () => {
    setResponse(responseFor('quote-1'));
    const view = render(<Probe />);
    setResponse(responseFor('quote-2'));
    view.rerender(<Probe />);
    expect(router.navigate).toHaveBeenCalledTimes(2);
  });

  it('ignores a dismissal rather than pulling the app open', () => {
    setResponse(responseFor('quote-1', 'expo.modules.notifications.actions.DISMISS'));
    render(<Probe />);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('focuses the quote the notification carried', () => {
    setResponse(responseFor('quote-1', DEFAULT_ACTION, { quoteId: 'einstein-2', authorId: 'einstein' }));
    render(<Probe />);
    expect(router.navigate).toHaveBeenCalledWith('/?quote=einstein-2');
  });

  it('falls back to the home screen when the payload is not a quote id', () => {
    // A guard rather than a fail-before test: routing always went to '/' before.
    // It earns its place by failing a bare `data.quoteId as string` cast, which
    // would paste a number straight into the URL — the payload crosses the OS
    // boundary untyped, so its shape is a claim rather than a guarantee.
    setResponse(responseFor('quote-1', DEFAULT_ACTION, { quoteId: 42 }));
    render(<Probe />);
    expect(router.navigate).toHaveBeenCalledWith('/');
  });
});
