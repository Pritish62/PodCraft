import Home from './components/home'
import AuthCard from './features/auth/components/AuthCard'
import { useAuth } from './features/auth/hooks/useAuth'

function App() {
  const {
    mode,
    authError,
    authMessage,
    isAuthSubmitting,
    token,
    user,
    isAuthenticated,
    switchMode,
    signup,
    login,
    logout,
  } = useAuth()

  if (isAuthenticated) {
    return (
      <Home
        authToken={token}
        userEmail={user?.email || 'user@example.com'}
        onLogout={logout}
      />
    )
  }

  return <AuthCard mode={mode} authError={authError} authMessage={authMessage} isAuthSubmitting={isAuthSubmitting} onSwitchMode={switchMode} onSignup={signup} onLogin={login} />
}

export default App
