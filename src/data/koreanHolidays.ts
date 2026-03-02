import type { HolidaySuggestion, AnniversaryTemplate } from '../types';

export const holidays2026: HolidaySuggestion[] = [
  { id: 'h-newyear', name: '신정', date: '2026-01-01', category: 'holiday', icon: '\uD83C\uDF89' },
  { id: 'h-seollal1', name: '설날 연휴', date: '2026-02-16', category: 'holiday', icon: '\uD83C\uDFEE' },
  { id: 'h-seollal2', name: '설날', date: '2026-02-17', category: 'holiday', icon: '\uD83C\uDFEE' },
  { id: 'h-seollal3', name: '설날 연휴', date: '2026-02-18', category: 'holiday', icon: '\uD83C\uDFEE' },
  { id: 'h-march1', name: '삼일절', date: '2026-03-01', category: 'holiday', icon: '\uD83C\uDDF0\uD83C\uDDF7' },
  { id: 'h-children', name: '어린이날', date: '2026-05-05', category: 'holiday', icon: '\uD83C\uDF88' },
  { id: 'h-buddha', name: '부처님오신날', date: '2026-05-24', category: 'holiday', icon: '\uD83D\uDD6F\uFE0F' },
  { id: 'h-memorial', name: '현충일', date: '2026-06-06', category: 'holiday', icon: '\uD83C\uDF3A' },
  { id: 'h-liberation', name: '광복절', date: '2026-08-15', category: 'holiday', icon: '\uD83C\uDDF0\uD83C\uDDF7' },
  { id: 'h-chuseok1', name: '추석 연휴', date: '2026-10-02', category: 'holiday', icon: '\uD83C\uDF11' },
  { id: 'h-chuseok2', name: '추석/개천절', date: '2026-10-03', category: 'holiday', icon: '\uD83C\uDF11' },
  { id: 'h-chuseok3', name: '추석 연휴', date: '2026-10-04', category: 'holiday', icon: '\uD83C\uDF11' },
  { id: 'h-chuseok-sub', name: '대체공휴일 (추석)', date: '2026-10-05', category: 'holiday', icon: '\uD83C\uDF11' },
  { id: 'h-hangul', name: '한글날', date: '2026-10-09', category: 'holiday', icon: '\uD83D\uDCDD' },
  { id: 'h-christmas', name: '크리스마스', date: '2026-12-25', category: 'holiday', icon: '\uD83C\uDF84' },
];

export const exams2026: HolidaySuggestion[] = [
  { id: 'e-suneung', name: '수능', date: '2026-11-19', category: 'exam', icon: '\uD83D\uDCDA' },
  { id: 'e-toeic-mar', name: 'TOEIC (3월)', date: '2026-03-15', category: 'exam', icon: '\uD83C\uDF10' },
  { id: 'e-toeic-jun', name: 'TOEIC (6월)', date: '2026-06-14', category: 'exam', icon: '\uD83C\uDF10' },
  { id: 'e-gosi1', name: '9급 공무원 필기', date: '2026-04-11', category: 'exam', icon: '\uD83D\uDCCB' },
  { id: 'e-midterm', name: '중간고사 (예상)', date: '2026-04-20', category: 'exam', icon: '\uD83D\uDDD3\uFE0F' },
  { id: 'e-final', name: '기말고사 (예상)', date: '2026-06-22', category: 'exam', icon: '\uD83D\uDDD3\uFE0F' },
];

export const anniversaryTemplates: AnniversaryTemplate[] = [
  { id: 'a-100', label: '100일', daysFromBase: 100, icon: '\uD83D\uDC95' },
  { id: 'a-200', label: '200일', daysFromBase: 200, icon: '\uD83D\uDC96' },
  { id: 'a-300', label: '300일', daysFromBase: 300, icon: '\uD83D\uDC97' },
  { id: 'a-500', label: '500일', daysFromBase: 500, icon: '\uD83D\uDC9D' },
  { id: 'a-1000', label: '1000일', daysFromBase: 1000, icon: '\uD83D\uDC8E' },
  { id: 'a-1year', label: '1주년', daysFromBase: 365, icon: '\uD83C\uDF82' },
  { id: 'a-2year', label: '2주년', daysFromBase: 730, icon: '\uD83C\uDF89' },
];
