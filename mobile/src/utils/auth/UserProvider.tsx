import { useFrappeAuth, useSWRConfig } from 'frappe-react-sdk'
import localforage from 'localforage'
import { FC, PropsWithChildren } from 'react'
import { createContext } from 'react'

interface UserContextProps {
    isLoading: boolean,
    isLoggedIn: boolean,
    currentUser: string,
    login: (username: string, password: string) => Promise<void>,
    logout: () => Promise<void>,
    updateCurrentUser: VoidFunction,
}

export const UserContext = createContext<UserContextProps>({
    currentUser: '',
    isLoading: false,
    isLoggedIn: false,
    login: () => Promise.resolve(),
    logout: () => Promise.resolve(),
    updateCurrentUser: () => { },
})

export const UserProvider: FC<PropsWithChildren> = ({ children }) => {

    const { mutate } = useSWRConfig()
    const { login, logout, currentUser, error, updateCurrentUser, isLoading } = useFrappeAuth()

    const isLoggedIn = currentUser !== undefined && currentUser !== null && currentUser !== "Guest"

    const handleLogout = async () => {
        // @ts-expect-error
        window.frappePushNotification?.disableNotification()
            .then(() => logout())
            .then(() => {
                window.localStorage.setItem("currentUser", "Guest")
                localforage.setItem("currentUser", "Guest")
            })
            .then(() => {
                //Clear cache on logout
                return mutate((key) => {
                    if (key === 'raven.api.login.get_context') {
                        return false
                    }
                    return true
                }, undefined, false)
            })

    }

    const handleLogin = async (username: string, password: string) => {
        return login({
            username,
            password,
        })
            .then(() => {
                //Reload the page so that the boot info is fetched again
                window.location.reload()
            })
    }
    return (
        <UserContext.Provider value={{ isLoading, isLoggedIn, updateCurrentUser, login: handleLogin, logout: handleLogout, currentUser: currentUser ?? "" }}>
            {children}
        </UserContext.Provider>
    )
}