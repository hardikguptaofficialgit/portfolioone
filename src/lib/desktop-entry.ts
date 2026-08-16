export const DESKTOP_DIRECT_KEY = 'portfolio_desktop_direct_v1';

export const markDesktopDirectEntry = () => {
  sessionStorage.setItem(DESKTOP_DIRECT_KEY, '1');
};
