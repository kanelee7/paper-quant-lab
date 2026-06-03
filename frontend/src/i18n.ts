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
    'btn.clear': 'Clear',
    'btn.save': 'Save',
    'btn.verify': 'Verify',
    'btn.close': 'Close',
    
    // Labels
    'label.market_depth': 'MARKET DEPTH (L2)',
    'label.activity_log': 'MARKET ACTIVITY LOG',
    'label.run_control': 'SIMULATION CONTROL',
    'label.data_source': 'READ-ONLY DATA SOURCE',
    'label.asset_type': 'ASSET CATEGORY',
    'label.research_notes': 'RESEARCH NOTES',
    'label.research_findings': 'RESEARCH FINDINGS',
    'label.related_records': 'RELATED RECORDS',
    'label.knowledge_archive': 'KNOWLEDGE ARCHIVE',
    'label.analysis_report': 'ANALYSIS REPORT',
    'label.session_summary': 'SESSION SUMMARY',
    'label.signals': 'SIGNALS',
    'label.trace_repository': 'TRACE REPOSITORY',
    'label.quality': 'QUALITY',
    'label.outcomes': 'OUTCOMES',
    'label.trace': 'TRACE',
    'label.logic': 'LOGIC',
    'label.notes_audit': 'NOTES & AUDIT',
    'label.reflections': 'REFLECTIONS',
    
    // Status
    'status.idle': 'IDLE',
    'status.active': 'ACTIVE',
    'status.live': 'LIVE',
    'status.simulated': 'SIMULATED',
    'status.offline': 'OFFLINE',
    'status.simulation_only': 'SIMULATION ONLY',
    
    // Empty States
    'empty.no_signals': 'Awaiting market feed or archive import to begin tracking reasoning traces.',
    'empty.no_notes': 'Qualitative observations are critical for longitudinal synthesis. Add your first note to begin building the research context.',
    'empty.no_findings': 'No established findings yet.',
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
    'sidebar.guidance': '분석 가이드',
    'sidebar.experimentation': '실험 제어',
    'sidebar.knowledge': '연구 아카이브',
    'sidebar.reliability': '기록 리플레이',
    
    // Common Actions
    'btn.initialize': '환경 초기화',
    'btn.terminate': '환경 종료',
    'btn.start_run': '연구 시작',
    'btn.stop_run': '연구 종료',
    'btn.sync_replay': '리플레이 동기화',
    'btn.audit_trace': '로그 감사',
    'btn.clear': '초기화',
    'btn.save': '저장',
    'btn.verify': '검토 완료',
    'btn.close': '닫기',
    
    // Labels
    'label.market_depth': '시장 호가 (L2)',
    'label.activity_log': '시장 활동 로그',
    'label.run_control': '실험 제어',
    'label.data_source': '데이터 소스 (읽기 전용)',
    'label.asset_type': '자산 카테고리',
    'label.research_notes': '연구 노트',
    'label.research_findings': '연구 결과',
    'label.related_records': '관련 기록',
    'label.knowledge_archive': '연구 아카이브',
    'label.analysis_report': '분석 보고서',
    'label.session_summary': '세션 요약',
    'label.signals': '분석 신호',
    'label.trace_repository': '추적 기록',
    'label.quality': '분석 품질',
    'label.outcomes': '예측 결과',
    'label.trace': '추적',
    'label.logic': '판단 논리',
    'label.notes_audit': '노트 및 감사',
    'label.reflections': '분석 성찰',
    
    // Status
    'status.idle': '대기 중',
    'status.active': '활성',
    'status.live': 'LIVE',
    'status.simulated': 'SIMULATED',
    'status.offline': 'OFFLINE',
    'status.simulation_only': '시뮬레이션 전용',
    
    // Empty States
    'empty.no_signals': '시장의 실시간 데이터나 아카이브 데이터를 대기 중입니다.',
    'empty.no_notes': '질적 관찰은 기간별 종합 분석에 필수적입니다. 첫 노트를 작성하여 연구 컨텍스트를 구축하세요.',
    'empty.no_findings': '등록된 연구 결과가 없습니다.',
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
