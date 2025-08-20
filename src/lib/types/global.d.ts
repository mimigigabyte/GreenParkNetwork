// 全局类型定义
interface VerificationData {
  code: string;
  expiresAt: number;
  attempts: number;
}

declare global {
  var __verificationCodes: Map<string, VerificationData> | undefined;
}

export {};