import { Theme } from './settings/types';
import { IELTSTeacherGradingQueue } from './components/generated/IELTSTeacherGradingQueue';

let theme: Theme = 'light';

function App() {
  function setTheme(theme: Theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  setTheme(theme);

  return (
    <>
      <IELTSTeacherGradingQueue />
    </>);
  // %EXPORT_STATEMENT%
}

export default App;