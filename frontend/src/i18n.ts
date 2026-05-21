import { useState } from 'react';

export type Language = 'en' | 'ko';

export const translations = {
  en: {
    // Navigation & Modes
    'nav.research': 'Research',
    'nav.review': 'Review',
    'nav.training': 'Training',
    'nav.launch': 'Launch Workstation',
    'nav.open': 'Open Workstation',
    'nav.philosophy': 'Philosophy',
    'nav.vision': 'Vision',
    
    // Sidebar Sections
    'sidebar.guidance': 'RESEARCH GUIDANCE',
    'sidebar.experimentation': 'ACTIVE EXPERIMENTATION',
    'sidebar.knowledge': 'RESEARCH KNOWLEDGE',
    'sidebar.reliability': 'REPLAY & RELIABILITY',
    
    // Common Actions
    'btn.initialize': 'Initialize Environment',
    'btn.terminate': 'Terminate Environment',
    'btn.start_run': 'START RESEARCH RUN',
    'btn.stop_run': 'STOP RESEARCH RUN',
    'btn.sync_replay': 'Sync Replay',
    'btn.audit_trace': 'Audit Trace',
    
    // Labels
    'label.market_depth': 'MARKET DEPTH (L2)',
    'label.activity_log': 'MARKET ACTIVITY LOG',
    'label.run_control': 'RESEARCH RUN CONTROL',
    'label.data_source': 'RESEARCH DATA SOURCE',
    'label.asset_type': 'RESEARCH ASSET TYPE',
    
    // Status
    'status.idle': 'IDLE',
    'status.active': 'ACTIVE',
    'status.live': 'CONNECTED',
    'status.simulation_only': 'SIMULATION ONLY',
  },
  ko: {
    // Navigation & Modes
    'nav.research': '연구 모드',
    'nav.review': '리뷰 모드',
    'nav.training': '트레이닝 모드',
    'nav.launch': '워크스테이션 실행',
    'nav.open': '워크스테이션 열기',
    'nav.philosophy': '철학',
    'nav.vision': '비전',
    
    // Sidebar Sections
    'sidebar.guidance': '연구 가이드',
    'sidebar.experimentation': '활성 실험실',
    'sidebar.knowledge': '연구 지식베이스',
    'sidebar.reliability': '리플레이 및 안정성',
    
    // Common Actions
    'btn.initialize': '연구 환경 초기화',
    'btn.terminate': '연구 환경 종료',
    'btn.start_run': '연구 실행 시작',
    'btn.stop_run': '연구 실행 중지',
    'btn.sync_replay': '리플레이 동기화',
    'btn.audit_trace': '감사 추적',
    
    // Labels
    'label.market_depth': '시장 호가 (L2)',
    'label.activity_log': '시장 활동 로그',
    'label.run_control': '연구 실행 제어',
    'label.data_source': '연구 데이터 소스',
    'label.asset_type': '연구 자산 유형',
    
    // Status
    'status.idle': '대기 중',
    'status.active': '활성',
    'status.live': '연결됨',
    'status.simulation_only': '시뮬레이션 전용',
  }
};

export type TranslationKey = keyof typeof translations.en;

export const useI18n = () => {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('pql_lang') as Language) || 'en';
  });

  const t = (key: TranslationKey): string => {
    return translations[lang][key] || key;
  };

  const changeLanguage = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('pql_lang', newLang);
  };

  return { lang, t, changeLanguage };
};
