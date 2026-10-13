const P = { width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
/** trilha: uma escada com bandeira no alto (cada degrau é um passo) */
export const IconPath = () => <svg {...P}><path d="M3 21h5v-5h5v-5h5V7" /><path d="M18 7V2.5l4 1.7-4 1.7" /></svg>;
export const IconHome = () => <svg {...P}><path d="M4 11.5 12 4l8 7.5" /><path d="M6 10v10h4.5v-5.5h3V20H18V10" /></svg>;
export const IconCamera = () => <svg {...P}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>;
export const IconCube = () => <svg {...P}><path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z" /><path d="M4 7.5 12 12l8-4.5M12 12v9" /></svg>;
export const IconFlame = () => <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 4 6 6 6 12a6 6 0 1 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-3-1-6 1-9z" fill="#FF8A12" stroke="var(--ink)" strokeWidth="1.8" strokeLinejoin="round" /></svg>;
export const IconStar = () => <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.8 2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" fill="#FFD233" stroke="var(--ink)" strokeWidth="1.8" strokeLinejoin="round" /></svg>;
export const IconLock = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;
export const IconSound = ({ on }: { on: boolean }) => <svg {...P} width={22} height={22}><path d="M4 10h3l5-4v12l-5-4H4z" />{on ? <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" /> : <path d="m16 9 5 6m0-6-5 6" />}</svg>;
