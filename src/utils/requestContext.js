const detectDevice = (userAgent = '') => {
  if (/bot|crawler|spider/i.test(userAgent)) return 'bot';
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  if (/mobile|android|iphone/i.test(userAgent)) return 'mobile';
  return 'desktop';
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
    browser: detectBrowser(userAgent),
    country: req.headers['cf-ipcountry']
      || req.headers['x-vercel-ip-country']
      || req.headers['x-country-code']
      || 'Desconhecido',
  };
};
