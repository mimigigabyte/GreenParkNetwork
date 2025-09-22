import { NextRequest, NextResponse } from 'next/server'

function randomState(len = 24) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let s = ''
  for (let i = 0; i < len; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)]
  return s
}

export async function GET(request: NextRequest) {
  try {
    const appId = process.env.WECHAT_APP_ID
    const scope = process.env.WECHAT_OAUTH_SCOPE || 'snsapi_userinfo'
    const redirect = request.nextUrl.searchParams.get('redirect')

    if (!appId) {
      return NextResponse.json({ success: false, error: 'WECHAT_APP_ID 未配置' }, { status: 500 })
    }
    if (!redirect) {
      return NextResponse.json({ success: false, error: '缺少 redirect 参数' }, { status: 400 })
    }

    // 允许的redirect必须是本站域名
    // 在多数部署环境下可通过referer/origin校验，这里简化为存在即可；生产建议加白名单校验
    const state = randomState()

    const globalAny = globalThis as any
    if (!globalAny.__wechatStateStore) {
      globalAny.__wechatStateStore = new Map<string, number>()
    }
    const store: Map<string, number> = globalAny.__wechatStateStore
    const now = Date.now()
    store.set(state, now)
    for (const [key, createdAt] of store.entries()) {
      if (now - createdAt > 10 * 60 * 1000) {
        store.delete(key)
      }
    }
    const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${encodeURIComponent(appId)}&redirect_uri=${encodeURIComponent(redirect)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state)}#wechat_redirect`

    const res = NextResponse.json({ success: true, data: { url: authUrl, state } })
    // 写入短期有效的state到cookie，服务端在回调阶段校验
    res.cookies.set('wx_state', state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 10 * 60 // 10分钟
    })
    return res
  } catch (e) {
    return NextResponse.json({ success: false, error: '生成微信授权链接失败' }, { status: 500 })
  }
}
