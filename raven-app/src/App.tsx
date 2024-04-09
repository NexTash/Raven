import { FrappeProvider } from 'frappe-react-sdk'
import { Route, RouterProvider, createBrowserRouter, createRoutesFromElements } from 'react-router-dom'
import { MainPage } from './pages/MainPage'
import { ProtectedRoute } from './utils/auth/ProtectedRoute'
import { UserProvider } from './utils/auth/UserProvider'
import { ChannelRedirect } from './utils/channel/ChannelRedirect'
import "cal-sans";
import { ThemeProvider } from './ThemeProvider'
import { Toaster } from './components/common/Toast/Toaster'
import { FullPageLoader } from './components/layout/Loaders'
import { useStickyState } from './hooks/useStickyState'


const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path='/login' lazy={() => import('@/pages/auth/Login')} />
      <Route path='/login-with-email' lazy={() => import('@/pages/auth/LoginWithEmail')} />
      <Route path='/signup' lazy={() => import('@/pages/auth/SignUp')} />
      <Route path='/forgot-password' lazy={()=> import('@/pages/auth/ForgotPassword')} />
      <Route path="/" element={<ProtectedRoute />}>
        <Route path="/" element={<ChannelRedirect />}>
          <Route path="channel" element={<MainPage />} >
            <Route index element={<ChannelRedirect />} />
            <Route path="saved-messages" lazy={() => import('./components/feature/saved-messages/SavedMessages')} />
            <Route path=":channelID" lazy={() => import('@/pages/ChatSpace')} />
          </Route>
          {/* <Route path='settings' lazy={() => import('./pages/settings/Settings')}>
            <Route path='integrations'>
              <Route path='webhooks' lazy={() => import('./pages/settings/Webhooks/WebhookList')} />
              <Route path='webhooks/create' lazy={() => import('./pages/settings/Webhooks/CreateWebhook')} />
              <Route path='webhooks/:ID' lazy={() => import('./pages/settings/Webhooks/ViewWebhook')} />
              <Route path='scheduled-messages' element={<TemporalEvents />} />
              <Route path='scheduled-messages/create' element={<CreateSchedulerEvent />} />
              <Route path='scheduled-messages/:ID' element={<ViewSchedulerEvent />} />
            </Route>
          </Route> */}
        </Route>
      </Route>
    </>
  ), {
  basename: `/${import.meta.env.VITE_BASE_NAME}` ?? '',
}
)
function App() {

  const [appearance, setAppearance] = useStickyState<'light' | 'dark'>('dark', 'appearance');

  const toggleTheme = () => {
    setAppearance(appearance === 'dark' ? 'light' : 'dark');
  };

  // We need to pass sitename only if the Frappe version is v15 or above.

  const getSiteName = () => {
    // @ts-ignore
    if (window.frappe?.boot?.versions?.frappe && (window.frappe.boot.versions.frappe.startsWith('15') || window.frappe.boot.versions.frappe.startsWith('16'))) {
      // @ts-ignore
      return window.frappe?.boot?.sitename ?? import.meta.env.VITE_SITE_NAME
    }
    return import.meta.env.VITE_SITE_NAME

  }

  return (
    <FrappeProvider
      url={import.meta.env.VITE_FRAPPE_PATH ?? ''}
      socketPort={import.meta.env.VITE_SOCKET_PORT ? import.meta.env.VITE_SOCKET_PORT : undefined}
      //@ts-ignore
      siteName={getSiteName()}
    >
      <UserProvider>
        <ThemeProvider
          appearance={appearance}
          // grayColor='slate'
          accentColor='iris'
          panelBackground='translucent'
          toggleTheme={toggleTheme}>
          <RouterProvider router={router} fallbackElement={<FullPageLoader className='w-screen' />} />
          <Toaster />
        </ThemeProvider>
      </UserProvider>
    </FrappeProvider>
  )
}

export default App