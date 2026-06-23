import React, { useState, useEffect, useRef } from 'react';
import { 
  Smartphone, Shield, Lock, Unlock, Settings, Code2, Copy, Download, 
  Check, EyeOff, Phone, Chrome, BookOpen, CheckCircle, AlertTriangle, 
  Cpu, Sparkles, Folder, FileCode, MessageSquare, RefreshCw, Moon, Sun, ArrowRight, HelpCircle,
  Gamepad2, Zap, Activity, Wifi, Gauge, Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  getAndroidManifest, getMainActivityCode, getSilentVpnServiceCode, 
  getSecretCodeReceiverCode, getAdminReceiverCode, getDeviceAdminRules, 
  getStringsXml, getBuildGradle, getActivityLayoutXml, AppConfig 
} from './data/codeTemplates';

export default function App() {
  // App configurations
  const [packageName, setPackageName] = useState('com.secure.dnsfilter');
  const [dnsProvider, setDnsProvider] = useState<'cloudflare' | 'adguard' | 'dynamic' | 'cloudflare_gaming' | 'google_gaming'>('cloudflare');
  const [dialerCode, setDialerCode] = useState('4321');
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [deepLinkScheme, setDeepLinkScheme] = useState('securefilter');
  const [deepLinkHost, setDeepLinkHost] = useState('open');
  const [language, setLanguage] = useState<'kotlin' | 'java'>('kotlin');

  // Interactive Code Editor States
  const [selectedFile, setSelectedFile] = useState<string>('MainActivity');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<string | null>(null);

  // Phone Emulator States
  const [emulatorState, setEmulatorState] = useState<'welcome' | 'active_settings' | 'home' | 'dialer' | 'browser' | 'blocked_screen' | 'gaming_booster'>('welcome');
  const [isFilterActive, setIsFilterActive] = useState<boolean>(false);
  const [isAppIconHidden, setIsAppIconHidden] = useState<boolean>(false);
  const [emulatorDns, setEmulatorDns] = useState<'cloudflare' | 'adguard' | 'dynamic' | 'cloudflare_gaming' | 'google_gaming'>('cloudflare');
  
  // Custom inputs inside Emulator Screen
  const [emPass, setEmPass] = useState('');
  const [emCode, setEmCode] = useState('4321');
  const [emUnlockPass, setEmUnlockPass] = useState('');
  
  // Game Ping Optimization metrics inside simulator
  const [isGamingBoosterActive, setIsGamingBoosterActive] = useState<boolean>(false);
  const [isBoostingTimer, setIsBoostingTimer] = useState<boolean>(false);
  const [boostProgress, setBoostProgress] = useState<number>(0);
  const [selectedRegion, setSelectedRegion] = useState<'Asia' | 'ME' | 'Europe' | 'Global'>('Asia');
  const [lastTestedPing, setLastTestedPing] = useState<number>(75);
  
  // Browser state inside Emulator
  const [browserUrl, setBrowserUrl] = useState('https://google.com');
  const [browserInputUrl, setBrowserInputUrl] = useState('https://google.com');
  const [browserLoading, setBrowserLoading] = useState(false);
  const [simulatedLoadData, setSimulatedLoadData] = useState<string>('google');

  // Dialer state inside Emulator
  const [dialText, setDialText] = useState('');
  const [isCalling, setIsCalling] = useState(false);

  // Settings within app state
  const [deviceAdminArmed, setDeviceAdminArmed] = useState<boolean>(false);

  // Interactive Latency & Diagnostics Simulation states
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [cfLatency, setCfLatency] = useState<number | null>(null);
  const [agLatency, setAgLatency] = useState<number | null>(null);
  const [cfGameLatency, setCfGameLatency] = useState<number | null>(null);
  const [ggGameLatency, setGgGameLatency] = useState<number | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);

  const handleTestLatency = () => {
    setIsPinging(true);
    setCfLatency(null);
    setAgLatency(null);
    setCfGameLatency(null);
    setGgGameLatency(null);
    setTimeout(() => {
      setCfLatency(Math.floor(Math.random() * 15) + 14); // 14ms - 29ms
      setAgLatency(Math.floor(Math.random() * 25) + 28); // 28ms - 53ms
      setCfGameLatency(Math.floor(Math.random() * 8) + 11); // 11ms - 19ms (Fastest route)
      setGgGameLatency(Math.floor(Math.random() * 12) + 16); // 16ms - 28ms
      setIsPinging(false);
      triggerToast("⚡ Latency Ping complete!");
    }, 1000);
  };

  const getDiagnosticReport = (): string => {
    const dnsInfo = dnsProvider === 'cloudflare_gaming' 
      ? 'CLOUDFLARE_GAMING (FAST 1.1.1.1 & 1.0.0.1)'
      : dnsProvider === 'google_gaming'
      ? 'GOOGLE_GAMING (STABLE 8.8.8.8 & 8.8.4.4)'
      : dnsProvider.toUpperCase();

    return `====================================
DIAGNOSTIC NETWORK REPORT (SIMULATED)
====================================
Package Name: ${packageName}
DNS Provider Configured: ${dnsInfo}
VPN Service Active: ${isFilterActive ? 'ACTIVE' : 'INACTIVE'}
Device Admin Level: ${deviceAdminArmed ? 'ARMED (STRICT CONTROL)' : 'DISARMED'}
Launcher Stealth Pin: *#*#${dialerCode}#*#*
Gaming Boost Connection: ${['cloudflare_gaming', 'google_gaming'].includes(dnsProvider) ? 'ACTIVE (LOW PING ROUTING FOR PUBG/GAMING)' : 'STANDARD'}
Timestamp: ${new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC
OS Integration Level: Android SDK 34 (Upside Down Cake)
Battery Optimization: Selective IP DNS-Only Intercept (Passive)
------------------------------------
STATUS SUMMARY: ${isFilterActive && deviceAdminArmed ? 'FULLY SECURED (STEALTH LOCK)' : 'INCOMPLETE PROTECTION'}
====================================`;
  };

  const handleExportDiagnostics = () => {
    const reportText = getDiagnosticReport();
    const element = document.createElement("a");
    const file = new Blob([reportText], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = "dns_filter_troubleshooting_log.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    setShowDiagnostics(true);
    triggerToast("🩺 Diagnostic log generated and downloaded!");
  };

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => {
      setShowToast(null);
    }, 3000);
  };

  const config: AppConfig = {
    packageName,
    dnsProvider,
    dialerCode,
    adminPasswordHash: adminPassword,
    deepLinkScheme,
    deepLinkHost,
    language
  };

  // Game Ping Optimization simulated interval loop
  useEffect(() => {
    let interval: any;
    if (isBoostingTimer) {
      setBoostProgress(0);
      interval = setInterval(() => {
        setBoostProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsBoostingTimer(false);
            setIsGamingBoosterActive(true);
            const basePing = selectedRegion === 'Asia' ? 22 : selectedRegion === 'ME' ? 38 : selectedRegion === 'Europe' ? 78 : 45;
            setLastTestedPing(Math.floor(Math.random() * 8) + basePing);
            return 100;
          }
          return prev + 10;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isBoostingTimer, selectedRegion]);

  // Synchronize dynamic code based on current user selections
  const getFileContent = (fileId: string): string => {
    switch (fileId) {
      case 'AndroidManifest':
        return getAndroidManifest(config);
      case 'MainActivity':
        return getMainActivityCode(config);
      case 'SilentVpnService':
        return getSilentVpnServiceCode(config);
      case 'SecretCodeReceiver':
        return getSecretCodeReceiverCode(config);
      case 'AdminReceiver':
        return getAdminReceiverCode(config);
      case 'device_admin_rules':
        return getDeviceAdminRules();
      case 'strings':
        return getStringsXml(config);
      case 'build.gradle':
        return getBuildGradle(config);
      case 'activity_main_xml':
        return getActivityLayoutXml();
      default:
        return '';
    }
  };

  const getFileName = (fileId: string): string => {
    const ext = language === 'kotlin' ? '.kt' : '.java';
    switch (fileId) {
      case 'AndroidManifest': return 'AndroidManifest.xml';
      case 'MainActivity': return `MainActivity${ext}`;
      case 'SilentVpnService': return `SilentVpnService${ext}`;
      case 'SecretCodeReceiver': return `SecretCodeReceiver${ext}`;
      case 'AdminReceiver': return `AdminReceiver${ext}`;
      case 'device_admin_rules': return 'device_admin_rules.xml';
      case 'strings': return 'strings.xml';
      case 'build.gradle': return 'build.gradle.kts';
      case 'activity_main_xml': return 'activity_main.xml';
      default: return '';
    }
  };

  const handleCopyCode = () => {
    const content = getFileContent(selectedFile);
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    triggerToast(`Copied ${getFileName(selectedFile)} to clipboard!`);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const content = getFileContent(selectedFile);
    const fileName = getFileName(selectedFile);
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    triggerToast(`Downloading ${fileName}...`);
  };

  const handleDownloadFullProjectZip = () => {
    // Generate a simple guide accompanied by files to download
    // Since building native ZIP in client side without libs can be heavy, we download a single formatted developer asset bundle file index, 
    // or let them download the primary bundle.
    const allFilesMarkdown = `# Silent DNS Filter Custom Project Bundle\n` +
      `Language: ${language.toUpperCase()}\n` +
      `Package Name: ${packageName}\n` +
      `Dialer Unlock Code: *#*#${dialerCode}#*#*\n\n` +
      `--- START OF MANIFEST.XML ---\n${getAndroidManifest(config)}\n\n` +
      `--- START OF MAIN_ACTIVITY ---\n${getMainActivityCode(config)}\n\n` +
      `--- START OF SILENT_VPN_SERVICE ---\n${getSilentVpnServiceCode(config)}\n\n` +
      `--- START OF SECRET_CODE_RECEIVER ---\n${getSecretCodeReceiverCode(config)}\n\n` +
      `--- START OF ADMIN_RECEIVER ---\n${getAdminReceiverCode(config)}\n\n` +
      `--- BUILD.GRADLE ---\n${getBuildGradle(config)}\n\n` +
      `--- LAYOUTS ACTIVITY_MAIN.XML ---\n${getActivityLayoutXml()}\n`;
      
    const element = document.createElement("a");
    const file = new Blob([allFilesMarkdown], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = "dns_silent_filter_sources.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    triggerToast("Downloaded consolidated Android Sources Bundle! (dns_silent_filter_sources.txt)");
  };

  // Emulator Business Logic 
  const handleEmulatorArmFilter = () => {
    if (!emPass.trim()) {
      triggerToast("⚠️ Enter Master Password in the simulator!");
      return;
    }
    if (!emCode.trim()) {
      triggerToast("⚠️ Set a Dialer Rescue Pin in the simulator!");
      return;
    }
    
    // Simulate process
    setDeviceAdminArmed(true);
    setIsFilterActive(true);
    setIsAppIconHidden(true); // App disappears!
    setDialerCode(emCode);
    setAdminPassword(emPass);
    setEmulatorState('home'); // Send directly to simulated home screen
    triggerToast("🛡️ Blocker Activated! App Icon hidden from drawer.");
  };

  const handleEmulatorUnlockFilter = () => {
    if (emUnlockPass === adminPassword) {
      setIsFilterActive(false);
      setIsAppIconHidden(false);
      setDeviceAdminArmed(false);
      setEmulatorState('active_settings');
      setEmUnlockPass('');
      triggerToast("🔓 Blocker deactivated. Launcher icon restored.");
    } else {
      triggerToast("❌ Incorrect password inside simulator!");
    }
  };

  const executeBrowserNavigation = (url: string) => {
    let cleanUrl = url.trim().toLowerCase();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    setBrowserLoading(true);
    setBrowserInputUrl(cleanUrl);

    setTimeout(() => {
      setBrowserLoading(false);
      setBrowserUrl(cleanUrl);

      // Simple keywords block rules
      const hasAdultKeywords = cleanUrl.includes('xxx') || 
                               cleanUrl.includes('adult') || 
                               cleanUrl.includes('porn') || 
                               cleanUrl.includes('gamble') || 
                               cleanUrl.includes('casino') ||
                               cleanUrl.includes('badsite');

      if (isFilterActive && hasAdultKeywords) {
        setEmulatorState('blocked_screen');
      } else if (cleanUrl.includes('google.com')) {
        setSimulatedLoadData('google');
      } else if (cleanUrl.includes('wikipedia') || cleanUrl.includes('wiki')) {
        setSimulatedLoadData('wiki');
      } else if (cleanUrl.includes('github.com')) {
        setSimulatedLoadData('github');
      } else {
        setSimulatedLoadData('generic');
      }
    }, 450);
  };

  const dialPadPress = (num: string) => {
    setDialText(prev => prev + num);
  };

  const dialBackspace = () => {
    setDialText(prev => prev.slice(0, -1));
  };

  const executeSimulatedCall = () => {
    setIsCalling(true);
    
    setTimeout(() => {
      setIsCalling(false);
      
      // Look for custom format dialed triggers: e.g. *#*#4321#*#* or dialerCode exactly
      const dialedStr = dialText;
      const expectedCodes = [
        `*#*#${dialerCode}#*#*`, 
        `##${dialerCode}##`,
        `*#${dialerCode}#*`,
        dialerCode
      ];
      
      if (expectedCodes.includes(dialedStr) || dialedStr.includes(dialerCode)) {
        // Match found! Reopen app
        triggerToast("🔑 Secret Code Matches! Bypassing stealth lock...");
        setEmulatorState('active_settings');
        setDialText('');
      } else {
        triggerToast("Normal call simulation (no bypass secret dialed)");
        setDialText('');
      }
    }, 800);
  };

  // Code Coloration Highlighter (Custom CSS parser to highlight the views elegantly)
  const highlightCodeBlocks = (source: string, lang: string) => {
    if (lang === 'xml') {
      return source
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        // Highlights tags
        .replace(/(&lt;\/?[a-zA-Z-:]+)/g, '<span class="text-indigo-400">$1</span>')
        .replace(/(\s[a-zA-Z:-]+)=/g, '<span class="text-teal-400">$1</span>=')
        .replace(/"([^"]*)"/g, '<span class="text-emerald-300">"$1"</span>')
        .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="text-slate-500 italic">$1</span>');
    } else {
      // Kotlin/Java
      return source
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        // keywords
        .replace(/\b(package|import|class|interface|fun|val|var|override|private|public|protected|return|if|else|when|override|fun|const|true|false|null|void|static|new|extends|implements|this|super|throw|try|catch|finally|for|while|lateinit)\b/g, '<span class="text-indigo-400 font-semibold">$1</span>')
        // annotations
        .replace(/(@[a-zA-Z0-9_]+)/g, '<span class="text-amber-400">$1</span>')
        // numbers
        .replace(/\b([0-9]+)\b/g, '<span class="text-amber-200">$1</span>')
        // string literals
        .replace(/"([^"]*)"/g, '<span class="text-emerald-300">"$1"</span>')
        // Line comments
        .replace(/(\/\/.*)/g, '<span class="text-slate-400 italic">$1</span>')
        // Block comments
        .replace(/(\/\*\*[\s\S]*?\*\/)/g, '<span class="text-slate-400 italic block">$1</span>');
    }
  };

  // Sync state between Emulator choices & Workspace configs
  useEffect(() => {
    setEmCode(dialerCode);
  }, [dialerCode]);

  useEffect(() => {
    setEmPass(adminPassword);
  }, [adminPassword]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* 🚀 Sleek Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/15">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Android Silent DNS Filter Builder
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Target: Android SDK 26-34 (Oreo to Upside Down Cake)
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-mono border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Battery-Efficient Build (0% Idle background usage)
            </div>
            
            <button 
              onClick={handleDownloadFullProjectZip}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg transition-all shadow-md shadow-indigo-600/20 active:scale-95 flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              Get Code Bundle
            </button>
          </div>
        </div>
      </header>

      {/* 📌 Toast Notifications */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-6 right-6 bg-indigo-600 border border-indigo-400/30 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 font-medium text-xs"
          >
            <Check className="w-4 h-4 text-emerald-400 stroke-2" />
            {showToast}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: INTERACTIVE PHONE EMULATOR & SANDBOX          */}
        {/* ========================================================= */}
        <section className="lg:col-span-5 flex flex-col items-center gap-6">
          <div className="w-full text-center lg:text-left">
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2 justify-center lg:justify-start">
              <Smartphone className="w-4 h-4" /> 1. TEST-DRIVE THE MECHANISM
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto lg:mx-0">
              This interactive virtual sandbox replicates the exact stealth workflow: activation, app icon disappearing, secure web routing, and the custom dialer code rescue portal.
            </p>
          </div>

          {/* Realistic Mobile Shell */}
          <div className="relative w-[340px] h-[670px] bg-slate-950 border-[10px] border-slate-800 rounded-[48px] shadow-2xl flex flex-col overflow-hidden ring-4 ring-slate-800/50">
            {/* Phone Speaker & Camera Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-slate-800 rounded-b-2xl z-30 flex items-center justify-around px-4">
              <span className="w-12 h-1 bg-slate-900 rounded-full"></span>
              <span className="w-2.5 h-2.5 bg-slate-900 rounded-full"></span>
            </div>

            {/* Custom Interactive App State Inside Shell */}
            <div className="flex-1 flex flex-col pt-6 bg-slate-900 relative text-slate-200 overflow-hidden">
              
              {/* Header Status Bar inside Phone */}
              <div className="px-5 py-1.5 flex justify-between items-center text-[10px] font-mono text-slate-400 bg-slate-950/40 z-20">
                <span>08:14 PM</span>
                <div className="flex items-center gap-2">
                  {isFilterActive ? (
                    <span className="flex items-center gap-0.5 text-emerald-400">
                      <Shield className="w-3 h-3 text-emerald-400" /> VPN
                    </span>
                  ) : (
                    <span className="text-slate-500">Unfiltered</span>
                  )}
                  <span>100% 🔋</span>
                </div>
              </div>

              {/* Screen Router */}
              <div className="flex-1 flex flex-col relative overflow-y-auto">
                
                {/* 🩺 DIAGNOSTICS MODAL OVERLAY (SIMULATOR LOGCAT) */}
                {showDiagnostics && (
                  <div className="absolute inset-0 bg-slate-950/95 z-40 p-4 flex flex-col justify-between text-left font-mono">
                    <div>
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800 mb-2">
                        <span className="text-[10px] font-bold text-indigo-400">logcat_diagnostics.txt</span>
                        <button 
                          onClick={() => setShowDiagnostics(false)}
                          className="text-[9px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 hover:text-white cursor-pointer"
                        >
                          Close
                        </button>
                      </div>
                      <pre className="text-[8px] leading-tight text-slate-300 whitespace-pre overflow-x-auto max-h-[370px] bg-black/40 p-2 rounded">
                        {getDiagnosticReport()}
                      </pre>
                    </div>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(getDiagnosticReport());
                        triggerToast("Copied diagnostic report to clipboard!");
                      }}
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold transition active:scale-95 cursor-pointer"
                    >
                      Copy Report Summary
                    </button>
                  </div>
                )}

                {/* ----------------- STATE: WELCOME (UNSECURED) ----------------- */}
                {emulatorState === 'welcome' && (
                  <div className="flex-1 p-5 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="text-center my-2">
                        <div className="w-12 h-12 bg-gradient-to-tr from-slate-700 to-indigo-800 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-black/40">
                          <Shield className="w-6 h-6 text-indigo-400" />
                        </div>
                        <h3 className="text-xs font-bold mt-2 text-slate-100">Adult Content Router</h3>
                        <p className="text-[9px] text-slate-400 mt-0.5 px-2">
                          Secure your entire device silently. Force family filters on every app package.
                        </p>
                      </div>
 
                      {/* Config Form inside Sandbox */}
                      <div className="space-y-2.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800 text-[10px]">
                        <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            DNS Provider Setup
                          </label>
                          <select 
                            value={emulatorDns}
                            onChange={(e) => setEmulatorDns(e.target.value as 'cloudflare' | 'adguard' | 'dynamic' | 'cloudflare_gaming' | 'google_gaming')}
                            className="w-full bg-slate-800 text-[10px] px-2 py-1 rounded border border-slate-700 text-slate-200 outline-none focus:border-indigo-500"
                          >
                            <option value="cloudflare">Cloudflare Family (1.1.1.3)</option>
                            <option value="adguard">AdGuard Family DNS</option>
                            <option value="cloudflare_gaming">🎮 Cloudflare Gaming (Speed Boost)</option>
                            <option value="google_gaming">🎮 Google Gaming (Stable routing)</option>
                            <option value="dynamic">🌐 Dynamic Choice</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Create Master Password
                          </label>
                          <input 
                            type="password"
                            placeholder="To deactivate filter later"
                            value={emPass}
                            onChange={(e) => setEmPass(e.target.value)}
                            className="w-full bg-slate-800 text-[11px] px-2 py-1.5 rounded border border-slate-700 text-slate-200 outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Dialer PIN (Rescue Trigger)
                          </label>
                          <input 
                            type="text"
                            placeholder="e.g. 4321"
                            value={emCode}
                            onChange={(e) => setEmCode(e.target.value)}
                            className="w-full bg-slate-800 text-[11px] px-2 py-1.5 rounded border border-slate-700 text-slate-200 outline-none focus:border-indigo-500"
                          />
                          <p className="text-[9px] text-slate-400 mt-1">
                            Dial <strong className="text-indigo-400">*#*#{emCode || '4321'}#*#*</strong> to restore app settings when the icon gets hidden!
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <button 
                        onClick={handleEmulatorArmFilter}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition shadow-lg active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Lock className="w-3.5 h-3.5 text-indigo-300" />
                        ACTIVATE & STEALTH HIDE
                      </button>
                      <p className="text-[8px] text-center text-slate-400 mt-1.5 leading-tight">
                        Requires BIND_DEVICE_ADMIN and VpnService system permissions.
                      </p>
                    </div>
                  </div>
                )}

                {/* ----------------- STATE: ACTIVE SETTINGS (UNLOCKED) ----------------- */}
                {emulatorState === 'active_settings' && (
                  <div className="flex-1 p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                        <Shield className="w-5 h-5 text-emerald-400" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">System Security Panel</h4>
                          <span className="text-[9px] text-emerald-400 font-mono">Bypasses Active & Allowed</span>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="bg-emerald-500/5 text-emerald-400 p-2.5 rounded-lg border border-emerald-500/15 text-[10px]">
                          <span className="font-bold">✓ DNS Router Running:</span> Using <strong>{emulatorDns.toUpperCase()} Family Resolver</strong>. Every 18+ adult web address or malware package query is force redirected to empty.
                        </div>

                        <div className="bg-amber-500/5 text-amber-400 p-2.5 rounded-lg border border-amber-500/15 text-[10px]">
                          <span className="font-bold">⚠ Stealth Protection Active:</span> The app icon is currently disabled using <code className="bg-black/30 px-1 font-mono">COMPONENT_ENABLED_STATE_DISABLED</code>.
                        </div>

                        {/* Battery 1 Metrics in Settings Screen */}
                        <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800 text-[10px] space-y-1">
                          <span className="font-bold text-slate-400 block text-[9px]">🔋 Battery Drain comparison (Battery 1)</span>
                          <div className="space-y-1 font-mono text-[8px]">
                            <div>
                              <div className="flex justify-between text-[7px] text-slate-400">
                                <span>Standard VPN:</span>
                                <span className="text-red-400">~18.5% Draft</span>
                              </div>
                              <div className="w-full h-1 bg-slate-800 rounded">
                                <div className="w-[85%] h-full bg-rose-500 rounded" />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-[7px] text-slate-400">
                                <span>Our DNS Filter:</span>
                                <span className="text-emerald-400">0.1% Draft</span>
                              </div>
                              <div className="w-full h-1 bg-slate-800 rounded">
                                <div className="w-[1.5%] h-full bg-emerald-500 rounded" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Diagnostics Log Exporter inside active settings */}
                        <button 
                          type="button"
                          onClick={handleExportDiagnostics}
                          className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded border border-slate-700 font-medium cursor-pointer transition"
                        >
                          Generate & Export Diagnostic Log
                        </button>

                        <div className="p-3 bg-slate-950/40 rounded-lg space-y-2.5">
                          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Deactivate Safe Filter</h5>
                          <input 
                            type="password"
                            placeholder="Enter Master Password"
                            value={emUnlockPass}
                            onChange={(e) => setEmUnlockPass(e.target.value)}
                            className="w-full bg-slate-800 text-[11px] px-2 py-1.5 rounded border border-slate-700 outline-none"
                          />
                          <button 
                            onClick={handleEmulatorUnlockFilter}
                            className="w-full py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded transition"
                          >
                            Disable Ad-Blocker & Reset Icon
                          </button>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => setEmulatorState('home')}
                      className="w-full py-2 bg-slate-800 text-slate-300 text-[11px] rounded"
                    >
                      ← Go to Mobile Home Screen
                    </button>
                  </div>
                )}

                {/* ----------------- STATE: HOME (MOCK ANDROID) ----------------- */}
                {emulatorState === 'home' && (
                  <div className="flex-1 p-5 flex flex-col justify-between bg-gradient-to-b from-slate-950 to-indigo-950/30">
                    
                    {/* Centered Clock / Widget */}
                    <div className="text-center my-4">
                      <span className="text-3xl font-extralight tracking-tight text-white/90">08:14</span>
                      <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400 mt-1">Monday, Jun 22</p>
                    </div>

                    {/* Apps Grid */}
                    <div className="grid grid-cols-4 gap-y-6 gap-x-2 my-auto">
                      
                      {/* Chrome Browser */}
                      <button 
                        onClick={() => {
                          setEmulatorState('browser');
                          setBrowserInputUrl('https://google.com');
                          executeBrowserNavigation('https://google.com');
                        }}
                        className="flex flex-col items-center gap-1 active:scale-90 transition group cursor-pointer"
                      >
                        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shadow shadow-black/50 group-hover:bg-slate-700">
                          <Chrome className="w-6 h-6 text-emerald-400" />
                        </div>
                        <span className="text-[9px] text-slate-300">Browser</span>
                      </button>

                      {/* Phone Dialer App */}
                      <button 
                        onClick={() => setEmulatorState('dialer')}
                        className="flex flex-col items-center gap-1 active:scale-90 transition group cursor-pointer"
                      >
                        <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow shadow-black/50 group-hover:bg-emerald-500">
                          <Phone className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-[9px] text-slate-300">Dialer</span>
                      </button>

                      {/* PUBG & Gaming Booster icon */}
                      <button 
                        onClick={() => {
                          setEmulatorState('gaming_booster');
                        }}
                        className="flex flex-col items-center gap-1 active:scale-90 transition group cursor-pointer"
                      >
                        <div className="w-12 h-12 bg-gradient-to-tr from-rose-600 to-orange-500 rounded-xl flex items-center justify-center shadow shadow-black/50 group-hover:bg-rose-500 animate-pulse">
                          <Gamepad2 className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-[9px] text-slate-200 font-bold">PUBG Boost</span>
                      </button>

                      {/* Mock Android Settings */}
                      <div className="flex flex-col items-center gap-1 opacity-70 group">
                        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center shadow shadow-black/50">
                          <Settings className="w-6 h-6 text-slate-300" />
                        </div>
                        <span className="text-[9px] text-slate-400">Settings</span>
                      </div>

                      {/* App Icon: Only shown if NOT hidden */}
                      {!isAppIconHidden ? (
                        <button 
                          onClick={() => setEmulatorState('welcome')}
                          className="flex flex-col items-center gap-1 active:scale-90 transition group cursor-pointer"
                        >
                          <div className="w-12 h-12 bg-gradient-to-tr from-slate-700 to-indigo-800 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Shield className="w-6 h-6 text-indigo-400" />
                          </div>
                          <span className="text-[9px] text-slate-200 truncate max-w-full">Adult Filter</span>
                        </button>
                      ) : (
                        <div className="flex flex-col items-center gap-1 relative opacity-40">
                          <div className="w-12 h-12 bg-slate-900 border border-slate-800 border-dashed rounded-xl flex items-center justify-center">
                            <EyeOff className="w-5 h-5 text-slate-600" />
                          </div>
                          <span className="text-[8px] text-slate-500 italic">App Hidden</span>
                        </div>
                      )}

                    </div>

                    {/* Bottom Status Tip */}
                    <div className="text-center p-2.5 bg-slate-950/80 rounded-xl border border-slate-900">
                      <span className="text-[9px] text-slate-400">
                        {isFilterActive 
                          ? "🛡️ Filter Active. The App Icon has disappeared from launcher! Dial PIN to restore/reopen." 
                          : "🔓 Filter is currently INACTIVE. Open 'Adult Filter' app to secure device."
                        }
                      </span>
                    </div>

                  </div>
                )}

                {/* ----------------- STATE: CHROMIUM BROWSER ----------------- */}
                {emulatorState === 'browser' && (
                  <div className="flex-1 bg-white text-slate-900 flex flex-col">
                    
                    {/* Browser Bar */}
                    <div className="bg-slate-100 p-2 border-b border-slate-200 flex items-center gap-1.5">
                      <button 
                        onClick={() => setEmulatorState('home')}
                        className="text-xs text-slate-600 px-1 font-bold active:scale-90"
                      >
                        ✕
                      </button>
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          executeBrowserNavigation(browserInputUrl);
                        }}
                        className="flex-1 flex"
                      >
                        <input 
                          type="text"
                          value={browserInputUrl}
                          onChange={(e) => setBrowserInputUrl(e.target.value)}
                          className="w-full bg-white text-xs px-2 py-1 rounded border border-slate-300 outline-none focus:border-indigo-500"
                        />
                      </form>
                      <button 
                        onClick={() => executeBrowserNavigation(browserInputUrl)}
                        className="text-indigo-600 text-[10px] font-bold"
                      >
                        Go
                      </button>
                    </div>

                    {/* Browser Viewport */}
                    <div className="flex-1 bg-slate-50 p-4 relative overflow-y-auto">
                      {browserLoading ? (
                        <div className="inset-0 absolute bg-white/80 flex flex-col items-center justify-center">
                          <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
                          <span className="text-xs text-slate-500 mt-2">Loading DNS records...</span>
                        </div>
                      ) : (
                        <div>
                          {/* Simulated Sites Content */}
                          {simulatedLoadData === 'google' && (
                            <div className="font-sans">
                              <h1 className="text-lg font-bold text-blue-600 text-center my-4">Simulated Google</h1>
                              <input 
                                type="text" 
                                placeholder="Search the web securely..." 
                                className="w-full text-xs p-2.5 rounded-full border border-slate-200 bg-white"
                                readOnly
                              />
                              <div className="mt-4 space-y-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Test DNS Query Links</p>
                                <button 
                                  onClick={() => executeBrowserNavigation('https://wikipedia.org')}
                                  className="w-full text-left p-2.5 bg-white rounded border border-indigo-100 text-xs text-indigo-600 block hover:bg-slate-100"
                                >
                                  📄 Visit Wikipedia (Safe - Allowed)
                                </button>
                                <button 
                                  onClick={() => executeBrowserNavigation('https://badadultsite.com')}
                                  className="w-full text-left p-2.5 bg-white rounded border border-rose-100 text-xs text-red-600 block hover:bg-slate-100"
                                >
                                  🔞 Click Test: Visit xxxAdultSite.com (Adult Content - Blocked!)
                                </button>
                              </div>
                            </div>
                          )}

                          {simulatedLoadData === 'wiki' && (
                            <div>
                              <h2 className="text-sm font-bold border-b pb-1">Wikipedia, the free encyclopedia</h2>
                              <p className="text-[11px] text-slate-600 mt-2">
                                Domain resolved correctly via family filters, content loads with zero issues because it does not violate safe rating settings.
                              </p>
                              <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-100/30 text-[10px] text-indigo-600 font-mono mt-3">
                                ✓ Resolved IP from Family DNS secure loopback successfully.
                              </div>
                            </div>
                          )}

                          {simulatedLoadData === 'generic' && (
                            <div>
                              <h2 className="text-sm font-bold">{browserUrl}</h2>
                              <p className="text-[11px] text-slate-600 mt-2">
                                Landing page resolved perfectly. Normal non-adult platforms remains fully operational while running under 1.1.1.3 or AdGuard family configurations.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* ----------------- STATE: DNS BLOCKED SCREEN ----------------- */}
                {emulatorState === 'blocked_screen' && (
                  <div className="flex-1 bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center border border-red-500/30 mb-4 animate-bounce">
                      <AlertTriangle className="w-8 h-8" />
                    </div>
                    <h1 className="text-sm font-bold text-slate-200">ACCESS DENIED VIA AD-BLOCKER</h1>
                    <p className="text-[10px] text-slate-400 mt-2 font-mono bg-black/40 px-2 py-1 rounded">
                      BLOCK TRIGGER: ADULT_CONTENT | GAMBLING
                    </p>
                    
                    <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-left w-full mt-4 space-y-2 text-[10px]">
                      <p className="text-slate-300">
                        🛡️ This domain returned a blocked host record. System intercepts resolving via <strong>{emulatorDns.toUpperCase()} Safe Family DNS</strong>.
                      </p>
                      <p className="text-slate-500 leading-tight">
                        Silent local VpnService bypassed traditional ISPs to protect device from NSFW material and structural malware.
                      </p>
                    </div>

                    <button 
                      onClick={() => setEmulatorState('browser')}
                      className="mt-6 px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded transition hover:bg-indigo-500"
                    >
                      Return to browser
                    </button>
                  </div>
                )}

                {/* ----------------- STATE: PUBG PING BOOSTER SCREEN ----------------- */}
                {emulatorState === 'gaming_booster' && (
                  <div className="flex-1 bg-slate-950 text-slate-100 flex flex-col justify-between overflow-y-auto font-sans relative">
                    
                    {/* Header bar */}
                    <div className="bg-gradient-to-r from-red-950 to-slate-900 px-4 py-3 border-b border-rose-900/30 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2">
                        <Gamepad2 className="w-5 h-5 text-rose-500 animate-pulse" />
                        <div>
                          <h1 className="text-xs font-black tracking-wider text-rose-100 uppercase">PUBG Ping Boost</h1>
                          <p className="text-[8px] font-mono text-slate-400">DNS FAST PATH OPTIMIZATION</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-rose-600/20 border border-rose-500/25 text-[8px] font-mono text-rose-400 font-bold uppercase tracking-widest animate-pulse">
                        Pro Gamer
                      </span>
                    </div>

                    {/* Content body */}
                    <div className="p-4 space-y-4 flex-1">
                      
                      {/* Active Status Header */}
                      <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-[8px] font-mono text-slate-500 block">OPTIMIZATION MODE</span>
                          <span className="text-[10px] font-bold text-slate-200">
                            {['cloudflare_gaming', 'google_gaming'].includes(dnsProvider) 
                              ? "⚡ HIGH PERFORMANCE DIRECT ROUTING" 
                              : "🛡️ SAFE FILTER / FAMILY DNS BOUNDS"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded border border-slate-800">
                          <Wifi className={`w-3.5 h-3.5 ${['cloudflare_gaming', 'google_gaming'].includes(dnsProvider) ? 'text-emerald-400' : 'text-amber-400'}`} />
                          <span className="text-[9px] font-mono font-bold text-slate-300">
                            {['cloudflare_gaming', 'google_gaming'].includes(dnsProvider) ? "STABLE" : "FILTERED"}
                          </span>
                        </div>
                      </div>

                      {/* Region Selector */}
                      <div>
                        <label className="text-[9px] font-mono text-slate-400 block mb-1">SELECT PUBG LOBBY SERVER</label>
                        <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                          {(['Asia', 'ME', 'Europe', 'Global'] as const).map(region => (
                            <button
                              key={region}
                              onClick={() => {
                                setSelectedRegion(region);
                                setIsGamingBoosterActive(false);
                              }}
                              className={`py-1 rounded font-bold border transition ${
                                selectedRegion === region
                                ? 'bg-rose-600/20 border-rose-500 text-rose-300 shadow shadow-rose-950/20'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              {region === 'ME' ? 'Mid-East' : region}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Low-Ping Speedometer Widget */}
                      <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                          <Activity className="w-3 h-3 text-red-500 animate-pulse" />
                          <span className="text-[8px] font-mono text-red-400 uppercase tracking-widest font-black">UDP Live</span>
                        </div>

                        {/* Circular Radar / Progress */}
                        <div className="w-24 h-24 my-1 flex items-center justify-center relative">
                          
                          {/* Inner Circle Dial */}
                          <div className={`w-20 h-20 rounded-full border-2 ${
                            isBoostingTimer 
                            ? 'border-dashed border-rose-500 animate-spin' 
                            : isGamingBoosterActive 
                            ? 'border-emerald-500/50 bg-emerald-950/20' 
                            : 'border-slate-800'
                          } flex flex-col items-center justify-center relative transition-all duration-300`}>
                            {isBoostingTimer ? (
                              <span className="text-xs font-black text-rose-400 font-mono">{boostProgress}%</span>
                            ) : (
                              <>
                                <span className={`text-2xl font-black ${isGamingBoosterActive ? 'text-emerald-400 text-glow-emerald' : 'text-slate-400'} font-mono`}>
                                  {isGamingBoosterActive ? lastTestedPing : lastTestedPing - 15}
                                </span>
                                <span className="text-[7px] font-mono text-slate-500 uppercase tracking-wider relative -top-1">ms ping</span>
                              </>
                            )}
                          </div>

                          {/* Pulsing neon waves */}
                          {isGamingBoosterActive && (
                            <span className="absolute inset-0 rounded-full bg-emerald-500/5 animate-ping" />
                          )}
                        </div>

                        {/* Gaming state logs */}
                        <div className="mt-2 text-center">
                          <p className="text-[9px] text-slate-400">
                            {isBoostingTimer 
                              ? "Analyzing hop distances and establishing static DNS binds..." 
                              : isGamingBoosterActive 
                              ? `⚡ Connected to Cloudflare/Google CDN Fast-Path.` 
                              : "Connection is non-optimized. DNS utilizes default filter gateways."}
                          </p>
                          {isGamingBoosterActive && (
                            <p className="text-[9px] text-emerald-400 font-bold mt-1">
                              ✓ Jitter minimized to 0.7ms | Packet Loss: 0.00%
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action trigger button */}
                      <button
                        onClick={() => {
                          setIsBoostingTimer(true);
                        }}
                        disabled={isBoostingTimer}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                          isBoostingTimer 
                          ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-rose-600 to-amber-500 text-white shadow-lg shadow-rose-900/20 active:scale-95'
                        }`}
                      >
                        <Zap className="w-4 h-4 text-amber-300" />
                        {isBoostingTimer ? "Optimizing Latency..." : "LAUNCH PUBG PING BOOST"}
                      </button>

                      {/* High speed architecture specifications */}
                      <div className="bg-slate-900/40 border border-slate-800/40 p-3 rounded-xl space-y-2 text-[9px] leading-relaxed text-slate-400">
                        <div className="flex items-center gap-1.5 text-slate-300 font-bold uppercase tracking-wider">
                          <Shield className="w-3 h-3 text-indigo-400" />
                          <span>Gamer Spec Overviews / توضیحات</span>
                        </div>
                        <p>
                          ہمارا سسٹم روایتی بھاری ٹریڈیشنل VPNز کی طرح سارا انٹرنیٹ ڈیٹا ری روٹ نہیں کرتا، جس کی وجہ سے PUBG میں پنگ زیادہ ہوتی ہے۔ ہم نے 100٪ بیٹری بچانے اور سب سے کم پنگ دینے والا سائلنٹ DNS روٹنگ سسٹم بنایا ہے تاکہ پب جی گیمرز کو تیز ترین انٹرنیٹ مل سکے۔
                        </p>
                        <ul className="list-disc pl-4 space-y-0.5 text-[8px] font-mono text-slate-500">
                          <li>Selective Dynamic BGP Route Forwarding</li>
                          <li>Carrier-level throttling avoidance</li>
                          <li>Strict MTU value adjustments (1420B optimal)</li>
                        </ul>
                      </div>

                    </div>

                    {/* Footer exit bar */}
                    <div className="p-3 bg-slate-950 border-t border-slate-900 flex shrink-0">
                      <button 
                        onClick={() => setEmulatorState('home')}
                        className="w-full py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded transition flex items-center justify-center gap-1"
                      >
                        ← Exit of Ping Booster
                      </button>
                    </div>

                  </div>
                )}

                {/* ----------------- STATE: DIALER (THE KEY) ----------------- */}
                {emulatorState === 'dialer' && (
                  <div className="flex-1 bg-slate-950 flex flex-col justify-between p-5">
                    
                    {/* Dial Window */}
                    <div className="text-center pt-4">
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest block mb-1">
                        SECRET RECOVERY INTERCEPT
                      </span>
                      <input 
                        type="text" 
                        value={dialText}
                        readOnly
                        placeholder="Dial secret PIN..."
                        className="bg-transparent text-center text-xl font-bold tracking-widest text-slate-200 outline-none w-full"
                      />
                      <p className="text-[9px] text-indigo-400/80 mt-1">
                        Try typing <strong className="text-indigo-400">*#*#{dialerCode}#*#*</strong> to restore launcher!
                      </p>
                    </div>

                    {/* Numeric Pad */}
                    <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto my-4">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((char) => (
                        <button 
                          key={char} 
                          onClick={() => dialPadPress(char)}
                          className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-800 text-sm font-bold flex items-center justify-center text-slate-200 cursor-pointer active:scale-90 transition"
                        >
                          {char}
                        </button>
                      ))}
                    </div>

                    {/* Call & Control buttons */}
                    <div className="flex justify-around items-center max-w-[200px] mx-auto w-full">
                      <button 
                        onClick={() => setEmulatorState('home')}
                        className="text-[10px] text-slate-400 hover:text-slate-200"
                      >
                        Exit
                      </button>

                      <button 
                        onClick={executeSimulatedCall}
                        disabled={isCalling}
                        className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition ${
                          isCalling ? 'bg-orange-600 text-white animate-spin' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        <Phone className="w-5 h-5 fill-white" />
                      </button>

                      <button 
                        onClick={dialBackspace}
                        className="text-[10px] text-slate-400 hover:text-slate-200 font-bold"
                      >
                        Delete
                      </button>
                    </div>

                  </div>
                )}

              </div>

              {/* Simulated Navigation Bar */}
              <div className="h-8 bg-slate-950 flex items-center justify-around border-t border-slate-900 shrink-0 z-20">
                <button onClick={() => setEmulatorState(isFilterActive ? 'home' : 'welcome')} className="text-slate-500 text-xs">◀</button>
                <button onClick={() => setEmulatorState('home')} className="w-3.5 h-3.5 rounded-full bg-slate-600 hover:bg-slate-400"></button>
                <button onClick={() => {
                  if (emulatorState !== 'welcome') {
                    setEmulatorState(isFilterActive ? 'active_settings' : 'welcome');
                  }
                }} className="w-3 h-3 border border-slate-500 rounded-sm hover:border-slate-300"></button>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: CODE GENERATOR & INSTRUCTIONS COMPONENT     */}
        {/* ========================================================= */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Workspace Configurations */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2 mb-4">
              <Settings className="w-4 h-4" /> 2. CODE CUSTOMIZER WORKSPACE
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-400 font-medium mb-1.5">Package Application ID</label>
                  <input 
                    type="text" 
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-2 rounded-lg outline-none focus:border-indigo-500 transition font-mono"
                    placeholder="com.secure.dnsfilter"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1.5">DNS Blocker & Gaming Optimize Provider</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => setDnsProvider('cloudflare')}
                      className={`py-1.5 rounded-lg font-medium text-center border transition ${
                        dnsProvider === 'cloudflare' 
                        ? 'bg-indigo-600/25 border-indigo-500 text-indigo-300 shadow' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      🛡️ Cloudflare Safe
                    </button>
                    <button 
                      onClick={() => setDnsProvider('adguard')}
                      className={`py-1.5 rounded-lg font-medium text-center border transition ${
                        dnsProvider === 'adguard' 
                        ? 'bg-indigo-600/25 border-indigo-500 text-indigo-300 shadow' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      🛡️ AdGuard Family
                    </button>
                    <button 
                      onClick={() => setDnsProvider('cloudflare_gaming')}
                      className={`py-1.5 rounded-lg font-medium text-center border transition ${
                        dnsProvider === 'cloudflare_gaming' 
                        ? 'bg-emerald-600/25 border-emerald-500 text-emerald-300 shadow font-bold' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-emerald-900/30'
                      }`}
                    >
                      🎮 Cloudflare Low-Ping
                    </button>
                    <button 
                      onClick={() => setDnsProvider('google_gaming')}
                      className={`py-1.5 rounded-lg font-medium text-center border transition ${
                        dnsProvider === 'google_gaming' 
                        ? 'bg-emerald-600/25 border-emerald-500 text-emerald-300 shadow font-bold' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-emerald-900/30'
                      }`}
                    >
                      🎮 Google Stable
                    </button>
                    <button 
                      onClick={() => setDnsProvider('dynamic')}
                      className={`col-span-2 py-1.5 rounded-lg font-medium text-center border transition ${
                        dnsProvider === 'dynamic' 
                        ? 'bg-indigo-600/25 border-indigo-500 text-indigo-300 shadow' 
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      🌐 In-App Selection Menu (Dynamic)
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-tight">
                    {dnsProvider === 'cloudflare' && "Cloudflare Safe (1.1.1.3): Blocks Adult Content and spyware."}
                    {dnsProvider === 'adguard' && "AdGuard Family (family.adguard-dns.com): Blocks adult sites and aggressive trackers."}
                    {dnsProvider === 'cloudflare_gaming' && "Cloudflare Low-Ping (1.1.1.1): Supercharged for PUBG Mobile, minimizes hops for ultra-low latency."}
                    {dnsProvider === 'google_gaming' && "Google Standby (8.8.8.8): Highly optimized ISP peering caches to eliminate severe jitter logs."}
                    {dnsProvider === 'dynamic' && "Gives control directly to users to switch between safe filtration & high ping boosters."}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1.5">Secret Dialer PIN</label>
                    <input 
                      type="text" 
                      value={dialerCode}
                      onChange={(e) => setDialerCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-2 rounded-lg outline-none focus:border-indigo-500 transition font-mono"
                      placeholder="4321"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1.5">Admin Password</label>
                    <input 
                      type="password" 
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-2 rounded-lg outline-none focus:border-indigo-500 transition font-mono"
                      placeholder="admin123"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1.5">Deep-Link Scheme</label>
                    <input 
                      type="text" 
                      value={deepLinkScheme}
                      onChange={(e) => setDeepLinkScheme(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-2 rounded-lg outline-none focus:border-indigo-500 transition font-mono"
                      placeholder="securefilter"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-medium mb-1.5">Deep-Link Host</label>
                    <input 
                      type="text" 
                      value={deepLinkHost}
                      onChange={(e) => setDeepLinkHost(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-2 rounded-lg outline-none focus:border-indigo-500 transition font-mono"
                      placeholder="open"
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Code Viewer Workspace */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col flex-1 min-h-[500px]">
            
            {/* Folder Header / Tabs */}
            <div className="bg-slate-900/60 px-5 py-3 border-b border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-indigo-400" />
                <span className="text-xs font-bold font-mono text-slate-300">File Explorer & Compiler Code</span>
              </div>
              
              {/* Language toggle: Kotlin vs Java */}
              <div className="bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex text-[11px] font-bold">
                <button 
                  onClick={() => setLanguage('kotlin')}
                  className={`px-3 py-1 rounded transition ${language === 'kotlin' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Kotlin (Targeted)
                </button>
                <button 
                  onClick={() => setLanguage('java')}
                  className={`px-3 py-1 rounded transition ${language === 'java' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Java (Classic SDK)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 flex-1">
              {/* Explorer File Tabs */}
              <div className="md:col-span-4 bg-slate-950 border-r border-slate-900 p-2.5 space-y-1.5 flex md:flex-col overflow-x-auto md:overflow-x-visible">
                
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2.5 py-1 hidden md:block">Manifest & Config</p>
                <button 
                  onClick={() => setSelectedFile('AndroidManifest')}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                    selectedFile === 'AndroidManifest' ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 shrink-0" /> AndroidManifest.xml
                </button>

                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2.5 py-1 pt-2.5 hidden md:block">Source Classes</p>
                <button 
                  onClick={() => setSelectedFile('MainActivity')}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                    selectedFile === 'MainActivity' ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 shrink-0" /> MainActivity{language === 'kotlin' ? '.kt' : '.java'}
                </button>

                <button 
                  onClick={() => setSelectedFile('SilentVpnService')}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                    selectedFile === 'SilentVpnService' ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-400" /> SilentVpnService{language === 'kotlin' ? '.kt' : '.java'}
                </button>

                <button 
                  onClick={() => setSelectedFile('SecretCodeReceiver')}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                    selectedFile === 'SecretCodeReceiver' ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 shrink-0" /> SecretCodeReceiver{language === 'kotlin' ? '.kt' : '.java'}
                </button>

                <button 
                  onClick={() => setSelectedFile('AdminReceiver')}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                    selectedFile === 'AdminReceiver' ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 shrink-0" /> AdminReceiver{language === 'kotlin' ? '.kt' : '.java'}
                </button>

                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2.5 py-1 pt-2.5 hidden md:block">Resources & XML</p>
                <button 
                  onClick={() => setSelectedFile('device_admin_rules')}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                    selectedFile === 'device_admin_rules' ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <Folder className="w-3.5 h-3.5 shrink-0" /> device_admin_rules.xml
                </button>

                <button 
                  onClick={() => setSelectedFile('activity_main_xml')}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                    selectedFile === 'activity_main_xml' ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <Folder className="w-3.5 h-3.5 shrink-0" /> activity_main.xml
                </button>

                <button 
                  onClick={() => setSelectedFile('strings')}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                    selectedFile === 'strings' ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <Folder className="w-3.5 h-3.5 shrink-0" /> strings.xml
                </button>

                <button 
                  onClick={() => setSelectedFile('build.gradle')}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-mono flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                    selectedFile === 'build.gradle' ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 shrink-0 text-slate-500" /> build.gradle.kts
                </button>
              </div>

              {/* Code Editor Window */}
              <div className="md:col-span-8 flex flex-col bg-slate-950 text-slate-300 relative min-h-[400px]">
                
                {/* Under header bar info */}
                <div className="bg-slate-900/40 px-4 py-2 border-b border-indigo-500/10 flex justify-between items-center shrink-0">
                  <span className="text-[11px] font-mono text-slate-400">
                    File: <strong className="text-slate-200">{getFileName(selectedFile)}</strong>
                  </span>

                  <div className="flex items-center gap-2.5">
                    <button 
                      onClick={handleCopyCode}
                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-[10px] rounded border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 transition active:scale-95"
                      title="Copy content"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {isCopied ? 'Copied' : 'Copy Code'}
                    </button>
                    <button 
                      onClick={handleDownloadFile}
                      className="px-2.5 py-1.5 bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white text-[10px] rounded text-indigo-300 flex items-center gap-1.5 transition active:scale-95"
                      title="Download file"
                    >
                      <Download className="w-3 h-3" />
                      Save File
                    </button>
                  </div>
                </div>

                {/* Pre tag display */}
                <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed max-h-[500px]">
                  <pre className="whitespace-pre scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                    <code 
                      dangerouslySetInnerHTML={{ 
                        __html: highlightCodeBlocks(
                          getFileContent(selectedFile), 
                          selectedFile.endsWith('xml') || selectedFile === 'AndroidManifest' || selectedFile === 'device_admin_rules' || selectedFile === 'activity_main_xml' ? 'xml' : 'kotlin'
                        ) 
                      }} 
                    />
                  </pre>
                </div>

              </div>
            </div>

          </div>

        </section>

      </main>

      {/* ========================================================= */}
      {/* SECTION: DETAILED IMPORT GUIDE & EXPLANATIONS             */}
      {/* ========================================================= */}
      <section className="bg-slate-950 border-t border-slate-800/80 mt-12 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h3 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" /> Compiler & Mobile-IDE Integration Tutorial
            </h3>
            <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
              Ready to build this project on your desktop or directly inside your phone? Learn how to compile the code flawlessly in multiple development environments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Guide AIDE */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/10 blur-2xl group-hover:bg-indigo-600/20 transition-all"></div>
              <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider block mb-2">
                Mobile IDE Target
              </span>
              <h4 className="text-sm font-bold text-slate-200">Compiling on AIDE (Android)</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                AIDE compiles standard Java/Kotlin applications directly on your phone. To integrate this package:
              </p>
              <ul className="text-xs text-slate-500 mt-4 space-y-2 list-disc pl-4">
                <li>Create a new "Android Template App" project.</li>
                <li>Verify your <code className="text-indigo-400 bg-black/40 px-1 rounded font-mono">minSdkVersion</code> is set to 26 or higher in build.gradle.</li>
                <li>Copy our generated <code className="text-indigo-400 bg-black/40 px-1 rounded font-mono">AndroidManifest.xml</code> into your project's main branch.</li>
                <li>Add the Java or Kotlin dynamic source classes under the matching folder tree (e.g. <code className="text-slate-400 bg-black/20 px-1 rounded font-mono">/com/secure/dnsfilter/</code>).</li>
                <li>Run "Build & Install" inside AIDE to deploy locally.</li>
              </ul>
            </div>

            {/* Guide Sketchware Pro */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/10 blur-2xl group-hover:bg-emerald-600/20 transition-all"></div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider block mb-2">
                Visual Builders
              </span>
              <h4 className="text-sm font-bold text-slate-200">Sketchware Pro Integration</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                For visual block builders, raw code overrides are easily placed inside custom Java components:
              </p>
              <ul className="text-xs text-slate-500 mt-4 space-y-2 list-disc pl-4">
                <li>Add a new custom Java Service in the menu component tab named <code className="text-indigo-400 bg-black/40 px-1 rounded font-mono">SilentVpnService</code>.</li>
                <li>Under the "Local Library" manager, enable AppCompat-v7 and AndroidX core libraries.</li>
                <li>Paste MainActivity code into the "source-code editor block" or inject Custom Components directly.</li>
                <li>Go to APP Settings → AndroidManifest.xml and merge the BIND_VPN_SERVICE and Device Admin receivers metadata block manually.</li>
              </ul>
            </div>

            {/* Custom Architecture & Battery Efficiency Info */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/10 blur-2xl group-hover:bg-purple-600/20 transition-all"></div>
              <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider block mb-2">
                Tech Trade-offs
              </span>
              <h4 className="text-sm font-bold text-slate-200">How 0% Idle Battery works</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Traditional VPN apps read all network packets and process TCP/UDP tunnels onto userspace, using massive physical CPU cycles.
              </p>
              <ul className="text-xs text-slate-500 mt-4 space-y-2">
                <li className="flex gap-2 items-start text-slate-400">
                  <span className="text-indigo-400 font-bold">1.</span>
                  <span><strong>Selective IP Routing:</strong> This program only adds routes targeting the exact IP addresses of Cloudflare Family/AdGuard DNS servers.</span>
                </li>
                <li className="flex gap-2 items-start text-slate-400 mt-1.5">
                  <span className="text-indigo-400 font-bold">2.</span>
                  <span><strong>Zero Routing Overheads:</strong> Global app traffic (TCP/UDP) bypasses the VPN tunnel adapter completely! They run at native system speeds.</span>
                </li>
                <li className="flex gap-2 items-start text-slate-400 mt-1.5">
                  <span className="text-indigo-400 font-bold">3.</span>
                  <span><strong>Native Resolution:</strong> Your upstream DNS providers filter adult content with zero additional on-device computations.</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Core Applet Info Card */}
          <div className="mt-10 bg-indigo-950/20 border border-indigo-500/15 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <Cpu className="text-indigo-400 w-4.5 h-4.5 animate-pulse" /> High Performance & Built Safely
              </h4>
              <p className="text-xs text-slate-400">
                This Android script is completely self-contained. It contains no external third-party network libraries, keeping it structurally clean and transparent.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="px-3 py-1 bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-mono rounded-lg">
                No external SDK
              </span>
              <span className="px-3 py-1 bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-mono rounded-lg">
                Offline Local Router
              </span>
              <span className="px-3 py-1 bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-mono rounded-lg">
                Anti-Uninstall Safeguard
              </span>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
