'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { X, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { RegisterForm } from './register-form';
import { VerificationLoginForm } from './verification-login-form';
import { ResetPasswordModal } from './reset-password-modal';
import { TurnstileWidget } from './turnstile-widget';
import { authApi } from '@/api/auth';
import { customAuthApi } from '@/api/customAuth';
import { isValidEmail, isValidPhone, emailError, phoneError } from '@/lib/validators';

import { useAuthContext } from './auth-provider';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAction?: 'register' | 'login' | 'reset-password' | null;
}

export function AuthModal({ isOpen, onClose, initialAction }: AuthModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('auth');
  const { user, checkUser } = useAuthContext();
  const [isLogin, setIsLogin] = useState(initialAction !== 'register');
  
  // 检测当前语言
  const locale = pathname.startsWith('/en') ? 'en' : 'zh';
  const [isVerificationLogin, setIsVerificationLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [agreeToPrivacy, setAgreeToPrivacy] = useState(true);
  const [loginData, setLoginData] = useState({
    account: '',
    password: ''
  });
  const [loginLoading, setLoginLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(initialAction === 'reset-password');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);

  // 获取Turnstile站点密钥
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  // 监听用户登录状态，登录成功后自动关闭模态框
  useEffect(() => {
    if (user && isOpen) {
      console.log('检测到用户已登录，关闭登录模态框');
      onClose();
    }
  }, [user, isOpen, onClose]);

  // 检测账号类型（邮箱或手机号）
  const detectAccountType = (account: string): 'email' | 'phone' => {
    return isValidEmail(account) ? 'email' : 'phone';
  };

  // 密码登录处理
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.account || !loginData.password) {
      alert('请填写完整的登录信息');
      return;
    }

    // 基本账号格式校验（邮箱或手机号）
    const accountType = detectAccountType(loginData.account);
    if (accountType === 'email') {
      if (!isValidEmail(loginData.account)) {
        alert(emailError(locale as 'en' | 'zh'))
        return
      }
    } else {
      // 登录未提供国家代码，默认+86
      if (!isValidPhone(loginData.account, '+86')) {
        alert(phoneError(locale as 'en' | 'zh'))
        return
      }
    }

    // 检查人机验证（管理员账号除外）
    if (!(loginData.account === 'admin' && loginData.password === 'Ecocenter2025')) {
      if (!turnstileToken) {
        alert('请完成人机验证');
        return;
      }
    }

    setLoginLoading(true);

    try {
      // 检查是否是管理员账号
      if (loginData.account === 'admin' && loginData.password === 'Ecocenter2025') {
        const currentTime = Date.now().toString();
        
        // 管理员登录
        localStorage.setItem('admin_authenticated', 'true');
        localStorage.setItem('admin_auth_time', currentTime);
        
        // 设置cookie用于API请求验证
        document.cookie = `admin_authenticated=true; path=/; max-age=${8 * 60 * 60}; SameSite=strict`;
        document.cookie = `admin_auth_time=${currentTime}; path=/; max-age=${8 * 60 * 60}; SameSite=strict`;
        
        alert('管理员登录成功！');
        onClose(); // 关闭登录弹窗
        router.push('/admin'); // 跳转到管理员控制台
        return;
      }

      // 普通用户登录
      // accountType 已在前置校验中计算
      console.log('🔐 密码登录尝试:', { account: loginData.account, type: accountType });
      
      let loginSuccess = false;
      
      // 如果是手机号，先尝试自定义认证
      if (accountType === 'phone') {
        try {
          console.log('📱 尝试自定义手机号密码登录');
          const customResult = await customAuthApi.phoneLogin({
            phone: loginData.account,
            password: loginData.password,
            countryCode: '+86', // 默认+86，后续可以改为用户选择
            turnstileToken: turnstileToken || undefined // 添加人机验证token
          });

          if (customResult.success && customResult.data) {
            console.log('✅ 自定义手机号密码登录成功:', customResult.data.user);
            alert('登录成功！');
            await checkUser(); // 更新认证状态
            onClose(); // 关闭登录弹窗
            // 跳转到用户控制台
            window.location.href = '/user';
            loginSuccess = true;
          } else {
            console.log('⚠️ 自定义认证失败，尝试传统认证:', customResult.error);
          }
        } catch (customError) {
          console.log('⚠️ 自定义认证异常，尝试传统认证:', customError);
        }
      }
      
      // 如果自定义认证失败或者是邮箱登录，使用传统认证
      if (!loginSuccess) {
        const result = await authApi.passwordLogin({
          account: loginData.account,
          password: loginData.password,
          type: accountType,
          turnstileToken: turnstileToken || undefined // 添加人机验证token
        });

        if (result.success && 'data' in result && result.data) {
          // 保存token
          localStorage.setItem('access_token', result.data.token);
          if (result.data.refreshToken) {
            localStorage.setItem('refresh_token', result.data.refreshToken);
          }

          console.log('✅ 传统密码登录成功:', result.data.user);
          alert('登录成功！');
          await checkUser(); // 更新认证状态
          onClose(); // 关闭登录弹窗
          // 跳转到用户控制台
          window.location.href = '/user';
        } else {
          alert('error' in result ? result.error : '登录失败，请检查账号和密码');
        }
      }
    } catch (error) {
      console.error('登录错误:', error);
      alert('登录失败，请稍后重试');
    } finally {
      setLoginLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                               <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex relative overflow-hidden">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X size={24} />
        </button>

                           {/* 左侧表单 */}
          <div className="flex-1 p-8 flex flex-col justify-start pt-12 overflow-y-auto">

                       {isLogin && !isVerificationLogin ? (
              <div className="max-w-md mx-auto w-full">
                                                {/* 标题 */}
                 <div className="mb-8 mt-0">
                   <h2 className="text-3xl font-bold text-gray-800 mb-2">{t('login')}</h2>
                  <div className="flex items-center text-sm text-gray-600">
                    <span>{t('switchToRegister')}</span>
                    <button 
                      onClick={() => setIsLogin(false)}
                      className="ml-1 text-[#00b899] hover:text-[#009a7a] transition-colors"
                    >
                      {t('register')}
                    </button>
                  </div>
                </div>

                               {/* 登录表单 */}
                <form className="space-y-6" onSubmit={handlePasswordLogin}>
                  {/* 手机号/邮箱输入 */}
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder={locale === 'en' ? 'Phone/Email' : '手机号/邮箱'}
                      value={loginData.account}
                      onChange={(e) => setLoginData(prev => ({ ...prev, account: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b899] focus:border-transparent outline-none transition-all text-gray-700 placeholder-gray-400"
                      required
                    />
                  </div>

                  {/* 密码输入 */}
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder={locale === 'en' ? 'Password' : '密码'}
                        value={loginData.password}
                        onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00b899] focus:border-transparent outline-none transition-all text-gray-700 placeholder-gray-400"
                        required
                      />
                                             <button
                         type="button"
                         onClick={() => setShowPassword(!showPassword)}
                         className="absolute inset-y-0 right-0 pr-3 flex items-center"
                       >
                         {showPassword ? (
                           <EyeOff className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                         ) : (
                           <Eye className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                         )}
                       </button>
                    </div>
                  </div>

                  {/* 隐私政策协议和忘记密码 - 同一行 */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={agreeToPrivacy}
                        onChange={(e) => setAgreeToPrivacy(e.target.checked)}
                        className="w-4 h-4 text-[#00b899] bg-gray-100 border-gray-300 rounded focus:ring-[#00b899] focus:ring-2 flex-shrink-0"
                      />
                      <span className="ml-2 whitespace-nowrap">
                        {locale === 'en' ? 'I agree to the' : '我已阅读并同意'}
                      </span>
                      <button 
                        type="button"
                        onClick={() => window.open('/privacy-policy', '_blank')}
                        className="text-[#00b899] hover:text-[#009a7a] transition-colors underline ml-1 whitespace-nowrap"
                      >
                        {locale === 'en' ? 'Privacy Policy' : '《隐私条款》'}
                      </button>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setShowResetPassword(true)}
                      className="text-sm text-[#00b899] hover:text-[#009a7a] transition-colors whitespace-nowrap"
                    >
                      {locale === 'en' ? 'Forgot Password?' : '忘记密码?'}
                    </button>
                  </div>

                  {/* Turnstile 人机验证 */}
                  {turnstileSiteKey && (
                    <div className="space-y-2">
                      <TurnstileWidget
                        siteKey={turnstileSiteKey}
                        onSuccess={(token) => {
                          setTurnstileToken(token);
                          setTurnstileError(null);
                        }}
                        onError={(error) => {
                          setTurnstileToken(null);
                          setTurnstileError(locale === 'en' ? 'Verification failed, please try again' : '人机验证失败，请重试');
                        }}
                        onExpired={() => {
                          setTurnstileToken(null);
                          setTurnstileError(locale === 'en' ? 'Verification expired, please verify again' : '验证已过期，请重新验证');
                        }}
                        theme="auto"
                        size="normal"
                        className="mb-4"
                      />
                      {turnstileError && (
                        <p className="text-sm text-red-600">{turnstileError}</p>
                      )}
                    </div>
                  )}

                                                        {/* 登录按钮 */}
                   <button
                     type="submit"
                     disabled={!agreeToPrivacy || loginLoading || (!!turnstileSiteKey && !turnstileToken)}
                     className={`w-full py-3 px-6 rounded-lg font-medium text-base transition-colors ${
                       agreeToPrivacy && !loginLoading && (!turnstileSiteKey || !!turnstileToken)
                         ? 'bg-[#00b899] text-white hover:bg-[#009a7a] cursor-pointer'
                         : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                     }`}
                                       >
                      {loginLoading ? (locale === 'en' ? 'Logging in...' : '登录中...') : (locale === 'en' ? 'Login' : '登录')}
                    </button>
                  </form>
                  
                                    {/* 手机验证码登录链接 */}
                  <div className="text-left mt-2 mb-3">
                    <button 
                      type="button"
                      onClick={() => setIsVerificationLogin(true)}
                      className="text-sm text-[#00b899] hover:text-[#009a7a] transition-colors"
                    >
{locale === 'en' ? 'Login with SMS Code' : '手机验证码登录'}
                    </button>
                  </div>

                  {/* 分隔线 */}
                  <div className="relative mt-3 mb-6">
                   <div className="absolute inset-0 flex items-center">
                     <div className="w-full border-t border-gray-300"></div>
                   </div>
                   <div className="relative flex justify-center text-sm">
                     <span className="bg-white px-4 text-gray-500">{locale === 'en' ? 'or' : '或'}</span>
                   </div>
                 </div>

                                   {/* 微信图标和文字 */}
                  <div className="flex justify-center items-center mb-2 -mt-2 space-x-2">
                    <div className="relative">
                      <Image
                        src="/images/icons/wechat-icon.png"
                        alt="微信登录"
                        width={28}
                        height={28}
                        className="rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        priority
                        onError={(e) => {
                          // 如果图片加载失败，显示默认的微信图标
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      {/* 备用微信图标 */}
                      <div className="hidden w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center absolute inset-0 cursor-pointer hover:opacity-80 transition-opacity">
                        <span className="text-white font-bold text-xs">微</span>
                      </div>
                    </div>
                    <span className="text-sm text-gray-600 cursor-pointer hover:text-gray-800 transition-colors">
                      {locale === 'en' ? 'WeChat Login' : '微信扫码登录'}
                    </span>
                  </div>
             </div>
                         ) : isVerificationLogin ? (
               <VerificationLoginForm 
                onSwitchToLogin={() => setIsVerificationLogin(false)}
                onSwitchToRegister={() => {
                  setIsVerificationLogin(false);
                  setIsLogin(false);
                }}
                onClose={onClose} 
              />
            ) : (
              <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
            )}
         </div>

                                                       {/* 右侧欢迎区域 */}
          <div className="flex-1 bg-blue-50 flex items-start justify-center p-8 pt-12 overflow-y-auto">
            <div className="flex flex-col items-center space-y-16 max-w-md">
              {/* Logo和文字 */}
              <div className="flex items-center space-x-4">
                {/* Logo */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <Image
                      src="/images/logo/绿盟logo.png"
                      alt="绿色技术平台Logo"
                      width={48}
                      height={48}
                      className="rounded-full object-cover"
                      style={{
                        filter: 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(86deg) brightness(118%) contrast(119%)'
                      }}
                      priority
                      onError={(e) => {
                        // 如果图片加载失败，显示默认的绿色圆形Logo
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    {/* 备用绿色圆形Logo */}
                    <div className="hidden w-12 h-12 bg-green-600 rounded-full flex items-center justify-center absolute inset-0">
                      <span className="text-white font-bold text-lg">U</span>
                    </div>
                  </div>
                </div>
                
                {/* 文字内容 */}
                <div className="flex flex-col">
                  {/* 主标题 */}
                  <h1 className="text-lg font-bold text-gray-900 mb-0">
                    {locale === 'en' 
                      ? 'National Economic Development Zone Green Low-Carbon Technology Promotion Platform' 
                      : '国家级经开区绿色低碳技术推广平台'}
                  </h1>
                  
                  {/* 副标题 */}
                  <p className="text-[10px] text-gray-500 -mt-1">
                    {locale === 'en' 
                      ? 'Promoting sustainable development for a better future'
                      : '推动可持续发展，共建绿色未来'}
                  </p>
                </div>
              </div>
              
                                            {/* 主图片 */}
               <div className="relative">
                 <Image
                   src="/images/auth/welcome-image.png"
                   alt="欢迎图片"
                   width={320}
                   height={240}
                   className="object-cover"
                   priority
                   onError={(e) => {
                     // 如果图片加载失败，显示默认的占位图
                     const target = e.target as HTMLImageElement;
                     target.style.display = 'none';
                     target.nextElementSibling?.classList.remove('hidden');
                   }}
                 />
                 {/* 备用占位图 */}
                 <div className="hidden w-80 h-60 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                   <div className="text-center">
                     <div className="w-16 h-16 bg-blue-300 rounded-full flex items-center justify-center mx-auto mb-2">
                       <span className="text-blue-600 font-bold text-xl">绿</span>
                     </div>
                     <p className="text-blue-600 text-sm">欢迎图片</p>
                   </div>
                 </div>
               </div>
            </div>
          </div>
      </div>

      {/* 密码找回弹窗 */}
      <ResetPasswordModal
        isOpen={showResetPassword}
        onClose={() => setShowResetPassword(false)}
      />
    </div>
  );
} 
