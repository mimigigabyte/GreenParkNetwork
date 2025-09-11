"use client";

import { useRouter } from 'next/navigation';

interface PageProps {
  params: { locale: string };
}

export default function TermsOfServiceLocalePage({ params }: PageProps) {
  const router = useRouter();
  const isEn = params.locale === 'en';

  const handleBack = () => {
    try {
      // Prefer history index check (Next.js manages idx)
      // @ts-ignore - idx is not typed on history.state
      const idx = typeof window !== 'undefined' && (window.history as any)?.state?.idx;
      const hasIdx = typeof idx === 'number' && idx > 0;
      const sameOriginReferrer = typeof document !== 'undefined'
        && document.referrer
        && (() => {
          try { return new URL(document.referrer).origin === window.location.origin; } catch { return false; }
        })();

      if (hasIdx || sameOriginReferrer) {
        router.back();
      } else {
        router.push(`/${params.locale}`);
      }
    } catch {
      router.push(`/${params.locale}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md sm:max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center">
            <a
              href={`/${params.locale}`}
              onClick={(e) => { e.preventDefault(); handleBack(); }}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {isEn ? 'Back' : '返回'}
            </a>
            <h1 className="ml-4 text-base sm:text-xl font-semibold text-gray-900">
              {isEn ? 'Terms of Service' : '用户协议'}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md sm:max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 text-[13px] sm:text-[15px] leading-relaxed">
        {isEn ? (
          <div className="prose prose-sm sm:prose-base max-w-none">
            <p className="text-gray-600">Last updated: Dec 2024</p>
            <p>
              Welcome to the National Economic Development Zone Green Low-Carbon Technology Promotion Platform. By
              using our services, you agree to the following terms.
            </p>
            <h2>1. Account and Registration</h2>
            <p>
              You are responsible for the accuracy of the information you provide and for safeguarding your account
              credentials. You must not share your account with others.
            </p>
            <h2>2. Use of Services</h2>
            <p>
              You agree to use the platform in compliance with applicable laws and not to engage in activities that may
              harm the platform, other users, or third parties.
            </p>
            <h2>3. Content and Intellectual Property</h2>
            <p>
              Unless otherwise stated, the platform and its contents are protected by intellectual property laws. You
              may not copy, reproduce, or distribute content without authorization.
            </p>
            <h2>4. Data and Privacy</h2>
            <p>
              Your use of the platform is also governed by our Privacy Policy. Please review it to understand how we
              collect and process your data.
            </p>
            <h2>5. Service Changes and Termination</h2>
            <p>
              We may modify, suspend, or terminate services at any time. We will notify users of material changes where
              appropriate.
            </p>
            <h2>6. Liability Limitation</h2>
            <p>
              To the extent permitted by law, we are not liable for indirect or consequential damages arising from your
              use of the services.
            </p>
            <h2>7. Dispute Resolution</h2>
            <p>
              Disputes shall be resolved in accordance with applicable laws and the jurisdiction where the platform is
              operated.
            </p>
            <h2>8. Contact Us</h2>
            <p>
              If you have any questions, please contact our support team.
            </p>
          </div>
        ) : (
          <div className="prose prose-sm sm:prose-base max-w-none">
            <p className="text-gray-600">最近更新：2024年12月</p>
            <p>
              欢迎使用国家级经开区绿色低碳技术推广平台。您使用本平台服务即表示同意以下协议条款。
            </p>
            <h2>一、账户与注册</h2>
            <p>
              您需确保所提供信息真实准确，并妥善保管账号与密码。不得出借、转让或与他人共用账户。
            </p>
            <h2>二、服务使用规范</h2>
            <p>
              您承诺依法依规使用本平台，不进行任何损害平台、其他用户或第三方合法权益的行为。
            </p>
            <h2>三、内容与知识产权</h2>
            <p>
              除另有说明外，平台及其内容受知识产权法律保护。未经授权，不得复制、转载、分发或用于商业用途。
            </p>
            <h2>四、数据与隐私</h2>
            <p>
              您对本平台的使用同时适用《隐私政策》。请阅读了解我们如何收集与处理您的数据。
            </p>
            <h2>五、服务变更与终止</h2>
            <p>
              我们可能在必要时调整、暂停或终止部分或全部服务，并在适当情况下对重大变更进行通知。
            </p>
            <h2>六、责任限制</h2>
            <p>
              在法律允许范围内，因使用本服务所产生的间接或后果性损失，我们概不承担责任。
            </p>
            <h2>七、争议解决</h2>
            <p>
              因本协议引发的争议，适用相关法律，并由平台运营地具有管辖权的法院处理。
            </p>
            <h2>八、联系我们</h2>
            <p>
              如有任何问题，欢迎与我们联系。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

