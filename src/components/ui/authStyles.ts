
export const AUTH_STYLES = `
  .auth-wrap {
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    padding: 32px 20px; position: relative; overflow: hidden;
    background: #03050d;
    background-image:
      linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
    background-size: 52px 52px;
  }
  .auth-blob-1 {
    position: absolute; top: 10%; left: -10%;
    width: 600px; height: 600px; border-radius: 50%;
    filter: blur(60px); pointer-events: none;
    animation: blobDrift1 12s ease-in-out infinite;
  }
  .auth-blob-2 {
    position: absolute; bottom: 5%; right: -5%;
    width: 500px; height: 500px; border-radius: 50%;
    background: radial-gradient(circle, rgba(123,200,255,0.05), transparent 65%);
    filter: blur(60px); pointer-events: none;
    animation: blobDrift2 15s ease-in-out infinite;
  }
  @keyframes blobDrift1 {
    0%,100% { transform: translate(0,0) scale(1); }
    50%      { transform: translate(40px,30px) scale(1.08); }
  }
  @keyframes blobDrift2 {
    0%,100% { transform: translate(0,0) scale(1); }
    50%      { transform: translate(-30px,-20px) scale(1.05); }
  }
  .auth-logo-icon {
    width: 64px; height: 64px; border-radius: 18px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; position: relative;
    transition: background 0.5s, border-color 0.5s, box-shadow 0.5s;
  }
  .auth-logo-icon::after {
    content: ''; position: absolute; inset: -1px; border-radius: 19px;
    background: linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 55%);
    pointer-events: none;
  }
  .auth-logo-text {
    font-family: var(--font-display);
    font-size: 44px; font-weight: 800; letter-spacing: 0.04em;
    line-height: 1; padding-bottom: 12px; transition: color 0.5s, text-shadow 0.5s;
  }
  .auth-card {
    background: rgba(255,255,255,0.032);
    backdrop-filter: blur(40px) saturate(1.6);
    -webkit-backdrop-filter: blur(40px) saturate(1.6);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 28px; padding: 36px; position: relative; overflow: hidden;
    box-shadow: 0 32px 90px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 1px 0 rgba(255,255,255,0.07) inset;
  }
  .auth-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
    transition: background 0.5s;
  }
  .auth-guest-btn {
    width: 100%; height: 46px; border-radius: 14px; margin-top: 14px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    color: rgba(232,234,240,0.45); font-family: var(--font-body);
    font-size: 13px; font-weight: 500; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: background 0.2s, color 0.2s, border-color 0.2s;
  }
  .auth-guest-btn:hover { background: rgba(255,255,255,0.07); color: rgba(232,234,240,0.7); border-color: rgba(255,255,255,0.14); }
  .auth-label {
    display: block; font-size: 11px; color: rgba(228,231,240,0.4);
    letter-spacing: 0.10em; text-transform: uppercase;
    font-family: var(--font-body); margin-bottom: 10px;
  }
  .auth-input {
    width: 100%; background: rgba(0,0,0,0.22);
    border: 1px solid rgba(255,255,255,0.07); border-radius: 14px;
    padding: 15px 18px; color: #e8eaf0;
    font-family: var(--font-body); font-size: 15px;
    outline: none; box-sizing: border-box;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  }
  .auth-input::placeholder { color: rgba(232,234,240,0.18); }
  .auth-submit {
    width: 100%; height: 54px; border: none; border-radius: 14px;
    font-family: var(--font-body); font-size: 14px; font-weight: 700; letter-spacing: 0.04em;
    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
    color: #ffffff; position: relative; overflow: hidden;
    transition: opacity 0.2s, transform 0.18s, box-shadow 0.2s;
    background-size: 200% auto;
    animation: btnShimmer 2.8s linear infinite;
  }
  .auth-submit:hover:not(:disabled) { transform: translateY(-2px); }
  .auth-submit:active:not(:disabled) { transform: translateY(0); }
  .auth-submit:disabled { opacity: 0.5; cursor: not-allowed; animation: none; }
  .auth-submit::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 55%);
    pointer-events: none;
  }
  @keyframes btnShimmer {
    0%   { background-position: -100% center; }
    100% { background-position: 200% center; }
  }
  .auth-error {
    background: rgba(224,64,96,0.09); border: 1px solid rgba(224,64,96,0.28);
    border-radius: 12px; padding: 12px 16px; font-size: 13px; color: #E04060;
    margin-bottom: 18px; display: flex; align-items: center; gap: 8px;
  }
  .auth-privacy {
    margin-top: 24px; padding-top: 24px;
    border-top: 1px solid rgba(255,255,255,0.055);
    display: flex; gap: 10px; align-items: flex-start;
  }
  .auth-float { animation: authFloat 4.5s ease-in-out infinite; }
  @keyframes authFloat {
    0%,100% { transform: translateY(0); }
    50%      { transform: translateY(-9px); }
  }
  .auth-spinner {
    width: 18px; height: 18px;
    border: 2.5px solid rgba(255,255,255,0.25); border-top-color: #ffffff;
    border-radius: 50%; animation: spin 0.75s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Campus badge that appears when email is typed */
  .campus-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 10px; border-radius: 99px;
    font-size: 11px; font-family: var(--font-mono); font-weight: 600;
    margin-top: 8px; transition: all 0.3s;
    animation: badgePop 0.3s cubic-bezier(0.22,1,0.36,1);
  }
  @keyframes badgePop {
    from { opacity: 0; transform: scale(0.85) translateY(4px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
`;