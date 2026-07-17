const detectDevice = (userAgent = '') => {
  if (/bot|crawler|spider/i.test(userAgent)) return 'bot';
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  if (/mobile|android|iphone/i.test(userAgent)) return 'mobile';
  return 'desktop';
};

const detectPlatform = (userAgent = '') => {
  if (/iphone|ipad|ipod|macintosh.*mobile/i.test(userAgent)) return 'ios';
  if (/android/i.test(userAgent)) return 'android';
  return null;
};

const detectBrowser = (userAgent = '') => {
  if (/edg/i.test(userAgent)) return 'Edge';
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/chrome|crios/i.test(userAgent)) return 'Chrome';
  if (/safari/i.test(userAgent)) return 'Safari';
  return 'Outro';
};

export const getRequestContext = (req) => {
  const userAgent = req.headers['user-agent'] || '';
  return {
    device: detectDevice(userAgent),
    platform: detectPlatform(userAgent),
    browser: detectBrowser(userAgent),
    country: req.headers['cf-ipcountry']
      || req.headers['x-vercel-ip-country']
      || req.headers['x-country-code']
      || 'Desconhecido',
  };
};
