import './globals.css';
export const metadata = { title: 'Chalkboard', description: 'Run your school — attendance, records and reports.' };
export default function RootLayout({ children }) {
  return (<html lang="en"><body>{children}</body></html>);
}
