'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { authApi } from '@/api/auth';
import { useAuthContext } from './auth-provider';

interface VerificationLoginFormProps {
  onSwitchToLogin: () => void;
  onClose?: () => void;
}

export function VerificationLoginForm({ onSwitchToLogin, onClose }: VerificationLoginFormProps) {
  const { checkUser } = useAuthContext();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [countryCode, setCountryCode] = useState('+86');
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [agreeToPrivacy, setAgreeToPrivacy] = useState(true);

  const handleGetCode = async () => {
    if (!phoneNumber) {
      alert('请输入手机号码');
      return;
    }
    
    try {
      // 调用发送验证码API
      const result = await authApi.sendPhoneCode({
        phone: phoneNumber,
        purpose: 'login',
        countryCode
      });

      if (result.success && 'data' in result && result.data) {
        // 开始倒计时
        setIsCountingDown(true);
        setCountdown(60);
        
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              setIsCountingDown(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        alert(result.data.message || '验证码已发送，请注意查收');
      } else {
        alert('error' in result ? result.error : '发送验证码失败');
      }
    } catch (error) {
      console.error('发送验证码失败:', error);
      alert('发送验证码失败，请稍后重试');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber || !verificationCode) {
      alert('请输入手机号码和验证码');
      return;
    }
    
    try {
      // 调用验证码登录API
      const result = await authApi.phoneCodeLogin({
        phone: phoneNumber,
        code: verificationCode,
        countryCode
      });

      if (result.success && 'data' in result && result.data) {
        // 保存token
        localStorage.setItem('access_token', result.data.token);
        if (result.data.refreshToken) {
          localStorage.setItem('refresh_token', result.data.refreshToken);
        }

        console.log('验证码登录成功:', result.data.user);
        alert('登录成功！');
        await checkUser();
        onClose?.();
      } else {
        alert('error' in result ? result.error : '登录失败，请检查验证码是否正确');
      }
    } catch (error) {
      console.error('验证码登录失败:', error);
      alert('登录失败，请检查验证码是否正确');
    }
  };

  return (
    <div className="max-w-md mx-auto w-full">
      {/* 标题 */}
      <div className="mb-8 mt-0">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">手机验证码登录</h2>
        <div className="flex items-center text-sm text-gray-600">
          <span>没有账号?</span>
          <button 
            onClick={onSwitchToLogin}
            className="ml-1 text-[#00b899] hover:text-[#009a7a] transition-colors"
          >
            免费注册
          </button>
        </div>
      </div>


      {/* 验证码登录表单 */}
      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* 手机号码输入 */}
        <div className="space-y-2">
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            {/* 国家代码选择 */}
            <div className="flex items-center px-3 py-3 bg-gray-50 border-r border-gray-300 cursor-pointer hover:bg-gray-100 transition-colors">
              <span className="text-gray-700 font-medium">{countryCode}</span>
              <ChevronDown className="h-4 w-4 text-gray-500 ml-1" />
            </div>
            {/* 手机号码输入 */}
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="你的手机号"
              className="flex-1 px-4 py-3 border-none outline-none text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

                 {/* 验证码输入 */}
         <div className="space-y-2">
           <div className="flex border border-gray-300 rounded-lg overflow-hidden">
             {/* 验证码输入 */}
             <input
               type="text"
               value={verificationCode}
               onChange={(e) => setVerificationCode(e.target.value)}
               placeholder="收到的验证码"
               className="flex-1 px-4 py-3 border-none outline-none text-gray-700 placeholder-gray-400"
             />
             {/* 获取验证码按钮 */}
             <button
               type="button"
               onClick={handleGetCode}
               disabled={isCountingDown || !phoneNumber}
               className={`px-4 py-3 text-sm font-medium transition-colors ${
                 isCountingDown || !phoneNumber
                   ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                   : 'bg-gray-50 text-gray-600 hover:bg-gray-100 cursor-pointer'
               }`}
             >
               {isCountingDown ? `${countdown}s` : '获取验证码'}
             </button>
           </div>
         </div>

         {/* 隐私条款勾选框 */}
         <div className="flex items-center text-sm text-gray-600">
           <input
             type="checkbox"
             checked={agreeToPrivacy}
             onChange={(e) => setAgreeToPrivacy(e.target.checked)}
             className="w-4 h-4 text-[#00b899] bg-gray-100 border-gray-300 rounded focus:ring-[#00b899] focus:ring-2"
           />
           <span className="ml-2">我已阅读并同意</span>
           <button 
             onClick={() => window.open('/privacy-policy', '_blank')}
             className="text-[#00b899] hover:text-[#009a7a] transition-colors underline"
           >
             《隐私条款》
           </button>
         </div>

                  {/* 登录按钮 */}
          <button
            type="submit"
            disabled={!agreeToPrivacy}
            className={`w-full py-3 px-6 rounded-lg font-medium text-base transition-colors ${
              agreeToPrivacy
                ? 'bg-[#00b899] text-white hover:bg-[#009a7a] cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            登录
          </button>
        </form>

        {/* 密码登录链接 */}
        <div className="text-left mt-2 mb-3">
          <button 
            type="button"
            onClick={onSwitchToLogin}
            className="text-sm text-[#00b899] hover:text-[#009a7a] transition-colors"
          >
            密码登录
          </button>
        </div>

        {/* 分隔线 */}
        <div className="relative mt-3 mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-gray-500">或</span>
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
            微信扫码登录
          </span>
        </div>
    </div>
  );
} 