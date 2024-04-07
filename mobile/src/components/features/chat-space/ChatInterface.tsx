import { IonHeader, IonFooter, IonContent, useIonViewWillEnter, IonBackButton, IonButton, IonIcon, IonSpinner } from '@ionic/react'
import { useFrappeGetCall } from 'frappe-react-sdk'
import { useMemo, useRef, createContext, useState, useContext } from 'react'
import { ErrorBanner } from '../../layout'
import { ChatInput } from '../chat-input'
import { ChatHeader } from './chat-header'
import { ChannelListItem, DMChannelListItem, useChannelList } from '@/utils/channel/ChannelListProvider'
import { UserFields } from '@/utils/users/UserListProvider'
import { ChatLoader } from '@/components/layout/loaders/ChatLoader'
import { MessageActionModal, useMessageActionModal } from './MessageActions/MessageActionModal'
import { Link } from 'react-router-dom'
import { arrowDownOutline } from 'ionicons/icons'
import useChatStream from './useChatStream'
import { useInView } from 'react-intersection-observer'
import { DateSeparator } from './chat-view/DateSeparator'
import { MessageBlockItem } from './chat-view/MessageBlock'
import ChatViewFirstMessage from './chat-view/ChatViewFirstMessage'
import { UserContext } from '@/utils/auth/UserProvider'
import JoinChannelButton from './JoinChannelButton'
import { clearNotifications } from '@/utils/pushNotifications'

export type ChannelMembersMap = Record<string, UserFields>
export const ChannelMembersContext = createContext<ChannelMembersMap>({})

export const ChatInterface = ({ channel }: { channel: ChannelListItem | DMChannelListItem }) => {

    const conRef = useRef<HTMLIonContentElement>(null);

    useIonViewWillEnter(() => {
        conRef.current?.scrollToBottom()

        // Clear all notifications for this channel
        clearNotifications(channel.name)
    })

    const {
        messages,
        hasOlderMessages,
        loadOlderMessages,
        hasNewMessages,
        loadNewerMessages,
        loadingOlderMessages,
        highlightedMessage,
        scrollToMessage,
        goToLatestMessages,
        error,
        isLoading } = useChatStream(channel.name, conRef)


    const onReplyMessageClick = (messageID: string) => {
        scrollToMessage(messageID)
    }

    const { ref: oldLoaderRef } = useInView({
        fallbackInView: true,
        initialInView: false,
        skip: !hasOlderMessages || loadingOlderMessages,
        onChange: (async (inView) => {
            if (inView && hasOlderMessages) {
                const lastMessage = messages ? messages[0] : null;
                await loadOlderMessages()
                // Restore the scroll position to the last message before loading more
                if (lastMessage?.message_type === 'date') {
                    document.getElementById(`date-${lastMessage?.creation}`)?.scrollIntoView()
                } else {
                    document.getElementById(`message-${lastMessage?.name}`)?.scrollIntoView()
                }
            }
        })
    });

    const { ref: newLoaderRef } = useInView({
        fallbackInView: true,
        skip: !hasNewMessages,
        initialInView: false,
        onChange: (inView) => {
            if (inView && hasNewMessages) {
                loadNewerMessages()
            }
        }
    });

    const { data: channelMembers } = useFrappeGetCall<{ message: ChannelMembersMap }>('raven.api.chat.get_channel_members', {
        channel_id: channel.name
    }, `raven.api.chat.get_channel_members.${channel.name}`, {
        revalidateOnFocus: false,
        revalidateIfStale: false,
        revalidateOnReconnect: false
    })

    const { selectedMessage, onMessageSelected, onDismiss } = useMessageActionModal()

    const { channels } = useChannelList()

    const parsedChannels = useMemo(() => {
        return channels.map(c => ({ id: c.name, value: c.channel_name }))
    }, [channels])

    const parsedMembers = useMemo(() => {
        if (channelMembers) {
            return Object.values(channelMembers.message).map((member) => ({ id: member.name, value: member.full_name }))
        }
        return []
    }, [channelMembers])

    const isOpenChannel = channel.type === 'Open'

    const [isScrolling, setIsScrolling] = useState(false)

    const { currentUser } = useContext(UserContext)
    const isUserInChannel = useMemo(() => {
        if (currentUser && channelMembers) {
            return currentUser in channelMembers.message
        }
        return false
    }, [currentUser, channelMembers])

    const isDM = channel?.is_direct_message === 1 || channel?.is_self_message === 1

    return (
        <>
            <IonHeader>
                <div className='px-2 py-2 inset-x-0 top-0 overflow-hidden min-h-5 bg-background border-b border-b-gray-4'>
                    <div className='flex gap-2 items-center'>
                        <div className='flex items-center'>
                            <IonBackButton color='dark' text="" className='back-button' />
                        </div>
                        <div className='flex items-center justify-between gap-2 w-full'>
                            <div className='grow p-1'>
                                {
                                    isOpenChannel ?

                                        <ChatHeader channel={channel} /> :
                                        <Link to={`${channel.name}/channel-settings`}>
                                            <ChatHeader channel={channel} />
                                        </Link>

                                }
                            </div>
                            {/* TO-DO: Add Other optional buttons here later */}
                            {/* <div hidden aria-hidden>
                                <IconButton variant="ghost" icon={BsThreeDotsVertical} className='active:bg-accent' />
                            </div> */}
                        </div>
                    </div>
                </div>
            </IonHeader>
            <IonContent
                className='flex flex-col'
                onIonScrollStart={() => setIsScrolling(true)}
                onIonScrollEnd={() => setIsScrolling(false)}
                fullscreen
                ref={conRef}>

                <div ref={oldLoaderRef}>
                    {hasOlderMessages && !isLoading && <div className='flex w-full min-h-8 py-4 justify-center items-center' >
                        <IonSpinner name='lines' />
                    </div>}
                </div>
                {!isLoading && !hasOlderMessages && <ChatViewFirstMessage channel={channel} />}
                {isLoading && <ChatLoader />}
                {error && <ErrorBanner error={error} />}


                {messages &&
                    <ChannelMembersContext.Provider value={channelMembers?.message ?? {}}>
                        <div className='flex flex-col'>
                            {messages.map((message) => {

                                if (message.message_type === "date") {
                                    return <DateSeparator
                                        key={`date-${message.creation}`}
                                        date={message.creation} />
                                } else {
                                    return (
                                        <MessageBlockItem
                                            key={`${message.name}_${message.modified}`}
                                            message={message}
                                            isScrolling={isScrolling}
                                            isHighlighted={highlightedMessage === message.name}
                                            onReplyMessageClick={onReplyMessageClick}
                                            onMessageSelect={onMessageSelected} />
                                    )
                                }
                            }
                            )}
                        </div>
                    </ChannelMembersContext.Provider>
                }

                {hasNewMessages && <div ref={newLoaderRef}>
                    <div className='flex w-full min-h-8 pb-4 justify-center items-center'>
                        <IonSpinner name='lines' />
                    </div>
                </div>}

                {/* Commented out the button because it was unreliable. We only scroll to bottom when the user is at the bottom. */}
                {hasNewMessages && <IonButton
                    size='small'
                    type="button"
                    onClick={goToLatestMessages}
                    shape='round'
                    // fill="outline"
                    className="fixed bottom-24 left-1/2 -translate-x-1/2 "
                >
                    New messages
                    <IonIcon slot="end" icon={arrowDownOutline} />
                </IonButton>
                }
                <div className='h-8'>
                </div>
            </IonContent>

            <IonFooter
                hidden={!!error}
                className='block relative z-10 order-1 w-full'
            >
                {channel && channel.is_archived === 0 && !isDM && !isUserInChannel && channel.type !== 'Open' ?
                    <JoinChannelButton channelData={channel} /> :

                    <div
                        className='overflow-visible 
                    text-foreground
                    bg-background
                    border-t-gray-4
                    border-t
                    px-1
                    pb-2
                    pt-1'
                    >
                        <ChatInput channelID={channel.name} allMembers={parsedMembers} allChannels={parsedChannels} />
                    </div>
                }
            </IonFooter>
            <MessageActionModal selectedMessage={selectedMessage} onDismiss={onDismiss} />
        </>
    )

}