export const TEST_USERS = [
  { email: 'aaaa@gmail.com', password: 'aaaa1234' },
  { email: 'bbbb@gmail.com', password: 'bbbb1234' },
  { email: 'cccc@gmail.com', password: 'cccc1234' }
] as const;

export function getTestUsersHint(): string {
  return [
    'aaaa@gmail.com / aaaa1234',
    'bbbb@gmail.com / bbbb1234',
    'cccc@gmail.com / cccc1234'
  ].join(', ');
}
