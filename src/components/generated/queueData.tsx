export type Ticket = {
  id: string;
  type: 'WRITING' | 'SPEAKING';
  student: string;
  test: string;
  aiBand: number;
  teacherBand?: number;
  status: 'PENDING' | 'CLAIMED' | 'IN_PROGRESS' | 'COMPLETED';
  date: string;
  teacher?: string;
  commission?: number;
};
export const TICKETS: Ticket[] = [
  {
    id: 'a31f8c20',
    type: 'WRITING',
    student: 'Nguyễn Minh Anh',
    test: 'Cambridge 18 - Test 2',
    aiBand: 6.5,
    status: 'PENDING',
    date: '31/05/2026',
  },
  {
    id: 'b7d4e918',
    type: 'SPEAKING',
    student: 'Trần Văn Hùng',
    test: 'IELTS Speaking Mock 4',
    aiBand: 5.5,
    status: 'PENDING',
    date: '31/05/2026',
  },
  {
    id: 'c9a02f31',
    type: 'WRITING',
    student: 'Lê Thu Hà',
    test: 'Cambridge 17 - Test 1',
    aiBand: 7.0,
    status: 'PENDING',
    date: '30/05/2026',
  },
  {
    id: 'd2e51b88',
    type: 'WRITING',
    student: 'Phạm Quốc Bảo',
    test: 'Academic Writing Set A',
    aiBand: 6.0,
    status: 'CLAIMED',
    date: '30/05/2026',
    teacher: 'Bạn',
  },
  {
    id: 'e8f73a45',
    type: 'SPEAKING',
    student: 'Đỗ Mai Chi',
    test: 'IELTS Speaking Mock 2',
    aiBand: 6.5,
    status: 'IN_PROGRESS',
    date: '29/05/2026',
    teacher: 'Bạn',
  },
  {
    id: 'b8e21c47',
    type: 'WRITING',
    student: 'Ngô Khánh Linh',
    test: 'Cambridge 15 - Test 4',
    aiBand: 6.5,
    status: 'IN_PROGRESS',
    date: '28/05/2026',
    teacher: 'Bạn',
  },
  {
    id: 'f1c64d27',
    type: 'WRITING',
    student: 'Vũ Đức Long',
    test: 'Cambridge 16 - Test 3',
    aiBand: 5.5,
    teacherBand: 6.0,
    status: 'COMPLETED',
    date: '28/05/2026',
    teacher: 'Bạn',
    commission: 50000,
  },
  {
    id: 'a0b95e63',
    type: 'SPEAKING',
    student: 'Hoàng Lan',
    test: 'IELTS Speaking Mock 1',
    aiBand: 6.0,
    teacherBand: 6.5,
    status: 'COMPLETED',
    date: '27/05/2026',
    teacher: 'Bạn',
    commission: 40000,
  },
];
