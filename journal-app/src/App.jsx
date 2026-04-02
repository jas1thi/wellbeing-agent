import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import EntriesPage from './pages/EntriesPage'
import JournalPage from './pages/JournalPage'
import CalendarPage from './pages/CalendarPage'
import ChatPage from './pages/ChatPage'
import SearchModal from './components/SearchModal'
import { SearchProvider } from './hooks/useSearchModal'

function App() {
  return (
    <SearchProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/entries" element={<EntriesPage />} />
              <Route path="/journal/:slug" element={<JournalPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/chat" element={<ChatPage />} />
            </Routes>
          </AnimatePresence>
        </main>
        <SearchModal />
      </div>
    </SearchProvider>
  )
}

export default App
