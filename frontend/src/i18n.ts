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
    'sidebar.guidance': 'GUIDANCE',
    'sidebar.experimentation': 'EXPERIMENT',
    'sidebar.knowledge': 'KNOWLEDGE',
    'sidebar.reliability': 'REPLAY',
    
    // Common Actions
    'btn.initialize': 'Initialize',
    'btn.terminate': 'Terminate',
    'btn.start_run': 'START RUN',
    'btn.stop_run': 'STOP RUN',
    'btn.sync_replay': 'Sync Replay',
    'btn.audit_trace': 'Audit Trace',
    
    // Labels
    'label.market_depth': 'MARKET DEPTH (L2)',
    'label.activity_log': 'MARKET ACTIVITY LOG',
    'label.run_control': 'SIMULATION CONTROL',
    'label.data_source': 'READ-ONLY DATA SOURCE',
    'label.asset_type': 'ASSET CATEGORY',
    
    // Status
    'status.idle': 'IDLE',
    'status.active': 'ACTIVE',
    'status.live': 'LIVE',
    'status.simulated': 'SIMULATED',
    'status.offline': 'OFFLINE',
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
    'sidebar.guidance': '분석 프로토콜',
    'sidebar.experimentation': '시뮬레이션 제어',
    'sidebar.knowledge': '종합 아카이브',
    'sidebar.reliability': '결정론적 리플레이',
    
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
    'label.run_control': '시뮬레이션 제어',
    'label.data_source': '읽기 전용 데이터 소스',
    'label.asset_type': '자산 카테고리',
    
    // Status
    'status.idle': '대기 중',
    'status.active': '활성',
    'status.live': '라이브',
    'status.simulated': '시뮬레이션',
    'status.offline': '오프라인',
    'status.simulation_only': '시뮬레이션 전용',
  }
};

export type TranslationKey = keyof typeof translations.en;

export const useI18n = () => {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('pql_lang') as Language) || 'en';
  });

  const t = (key: TranslationKey): string => {
    return (translations[lang] as any)[key] || key;
  };

  const changeLanguage = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('pql_lang', newLang);
  };

  return { lang, t, changeLanguage };
};
