import React from 'react';
import { ThemeSelector } from '@librechat/client';
import type { TStartupConfig } from 'librechat-data-provider';
import { ErrorMessage } from '~/components/Auth/ErrorMessage';
import { TranslationKeys, useLocalize } from '~/hooks';
import SocialLoginRender from './SocialLoginRender';
import { Banner } from '../Banners';
import Footer from './Footer';

// 使用你已放置的原始 Eye 源码（命名导出）
import { Eye } from '~/components/Eye';

const YELLOW = '#f6d233';
const FRAME = '#F2E6C7';

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
        <div className="mx-auto w-full max-w-[460px] px-6">
          <ErrorMessage>{localize('com_auth_error_login_server')}</ErrorMessage>
        </div>
      );
    }

    if (error === 'com_auth_error_invalid_reset_token') {
      return (
        <div className="mx-auto w-full max-w-[460px] px-6">
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
        <div className="mx-auto w-full max-w-[460px] px-6">
          <ErrorMessage>{localize(error)}</ErrorMessage>
        </div>
      );
    }

    return null;
  };

  const showSocial =
    !pathname.includes('2fa') && (pathname.includes('login') || pathname.includes('register'));

  return (
    <div className="relative flex min-h-screen flex-col" style={{ backgroundColor: YELLOW }}>
      <Banner />

      <div className="mt-4">
        <DisplayError />
      </div>

      <div className="absolute bottom-0 left-0 md:m-4">
        <ThemeSelector />
      </div>

      <main className="flex flex-1 items-center justify-center px-6 py-6">
        <div className="w-full max-w-[460px]">
          {/* ✅ 更高级的“边框”实现：压窄 20% 且天然压住溢出内容 */}
          <div
            className="w-full"
            style={{
              border: `14px solid ${FRAME}`,
              backgroundColor: YELLOW,
            }}
          >
            {/* ✅ 裁切容器：手机端眼白超出时会被边框压住 */}
            <div className="w-full" style={{ backgroundColor: YELLOW, overflow: 'hidden' }}>
              {/* ✅ Eye 区 5:4 */}
              <div
                className="w-full flex items-center justify-center"
                style={{
                  backgroundColor: YELLOW,
                  aspectRatio: '5 / 4',
                  padding: 10,
                }}
              >
                <div className="flex items-center justify-center gap-4">
                  <Eye />
                  <Eye />
                </div>
              </div>

              {/* ✅ 白色表单区更紧凑 */}
              <div className="bg-white px-7 pt-5 pb-5">
                {children}

                {!hasStartupConfigError && !isFetching && showSocial && (
                  <div className="mt-3">
                    <SocialLoginRender startupConfig={startupConfig} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ✅ footer：永远显示品牌版权行；隐私/条款链接可选 */}
        <div className="pb-6">
          <div className="mt-2 text-center text-xs text-black/80 tracking-wide">
            AI Radio by RELOAD © 2026
          </div>

          {/* 可选：隐私/条款（有 externalUrl 才会显示；没有也不影响版权行） */}
          <div className="mt-2">
            <Footer startupConfig={startupConfig} />
          </div>
        </div>
    </div>
  );
}

export default AuthLayout;
