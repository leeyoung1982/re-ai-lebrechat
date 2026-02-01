import React from 'react';
import { ThemeSelector } from '@librechat/client';
import type { TStartupConfig } from 'librechat-data-provider';
import { ErrorMessage } from '~/components/Auth/ErrorMessage';
import { TranslationKeys, useLocalize } from '~/hooks';
import SocialLoginRender from './SocialLoginRender';
import { Banner } from '../Banners';
import Footer from './Footer';
import LoginBackground from './LoginBackground';
import { LOGIN_TITLE, REGISTER_TITLE } from './brandCopy';

// TODO(ai-radio): Add full-screen Auth Splash (first-visit) via <AuthSplashGate />.
// Replaces old BlinkAnimation-based logo blink.

function AuthLayout({
  children,
  header,
  isFetching,
  startupConfig,
  startupConfigError,
  pathname,
  error,
}: {
  children: React.ReactNode;
  header: React.ReactNode;
  isFetching: boolean;
  startupConfig: TStartupConfig | null | undefined;
  startupConfigError: unknown | null | undefined;
  pathname: string;
  error: TranslationKeys | null;
}) {
  const localize = useLocalize();

  const hasStartupConfigError = startupConfigError !== null && startupConfigError !== undefined;

  const DisplayError = () => {
    if (hasStartupConfigError) {
      return (
        <div className="mx-auto sm:max-w-sm">
          <ErrorMessage>{localize('com_auth_error_login_server')}</ErrorMessage>
        </div>
      );
    }

    if (error === 'com_auth_error_invalid_reset_token') {
      return (
        <div className="mx-auto sm:max-w-sm">
          <ErrorMessage>
            {localize('com_auth_error_invalid_reset_token')}{' '}
            <a className="font-semibold text-[#d4258e] hover:underline" href="/forgot-password">
              {localize('com_auth_click_here')}
            </a>{' '}
            {localize('com_auth_to_try_again')}
          </ErrorMessage>
        </div>
      );
    }

    if (error != null && error) {
      return (
        <div className="mx-auto sm:max-w-sm">
          <ErrorMessage>{localize(error)}</ErrorMessage>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-white dark:bg-gray-900">
      {/* Background layer (fixed, behind everything) */}
      <LoginBackground />

      {/* Foreground content layer */}
      <div className="relative z-10 flex min-h-screen flex-col">
        <Banner />

        <DisplayError />

        <div className="absolute bottom-0 left-0 md:m-4">
          <ThemeSelector />
        </div>

        <main className="flex flex-grow items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-authPageWidth overflow-hidden bg-white/85 px-6 py-4 backdrop-blur-sm dark:bg-gray-900/70 sm:max-w-md sm:rounded-lg">
              {!hasStartupConfigError && !isFetching && header && (
                <h1
                  className="mb-4 text-center text-2xl font-medium text-black dark:text-white"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {pathname.includes('register') ? REGISTER_TITLE : LOGIN_TITLE}
                </h1>
              )}

              {children}

              {!pathname.includes('2fa') &&
                (pathname.includes('login') || pathname.includes('register')) && (
                  <SocialLoginRender startupConfig={startupConfig} />
                )}
            </div>

            {/* Auth page footer (under the card) */}
            {startupConfig?.customFooter && (
              <div className="mt-6 text-center text-xs text-gray-700 dark:text-gray-200">
                {startupConfig.customFooter}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AuthLayout;
