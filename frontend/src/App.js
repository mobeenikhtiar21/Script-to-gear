import { BrowserRouter } from 'react-router-dom';
import AppRouter from './AppRouter';
import { Toaster } from 'sonner';
import '@/App.css';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      <Toaster position="top-right" theme="dark" />
    </div>
  );
}

export default App;