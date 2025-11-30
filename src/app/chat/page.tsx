'use client';

import { useState, useEffect, useRef, Suspense, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Container, Title, Paper, ScrollArea, TextInput, ActionIcon, Group, Text, Avatar, Center, Tooltip, Badge, Menu, Button, Box, Stack, Modal, UnstyledButton, LoadingOverlay, Skeleton } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useAuth } from '@/components/AuthProvider';
import { IconSend, IconTrash, IconRefresh, IconMoodSmile, IconArrowBackUp, IconX, IconSticker, IconThumbUp, IconHeart, IconMoodHappy, IconMoodSurprised, IconMoodSad, IconFlame, IconSearch, IconArrowDown, IconHash, IconBuilding, IconCalendar, IconMessage, IconUserPlus, IconBan, IconDotsVertical, IconArrowLeft, IconEye, IconPinned, IconPinnedOff, IconStarFilled, IconBell, IconBellRinging } from '@tabler/icons-react';
import { showError, showSuccess, showInfo } from '@/lib/error-handling';
import { getAuthHeaders } from '@/lib/api';

interface Reaction {
    userId: string;
    emoji: string;
}

interface Message {
    _id: string;
    content: string;
    senderId: string;
    senderName: string;
    type: 'universal' | 'branch' | 'year' | 'dm';
    branch?: string;
    year?: number;
    createdAt: string;
    replyTo?: {
        _id: string;
        content: string;
        senderName: string;
    };
    reactions: Reaction[];
    sticker?: string;
}

interface ConversationSummary {
    _id: string;
    name: string;
    photoURL?: string;
    unreadCount?: number;
    lastMessagePreview?: string;
    lastMessageAt?: string;
    isPinned?: boolean;
}

const REACTION_ICONS: Record<string, any> = {
    '👍': IconThumbUp,
    '❤️': IconHeart,
    '😂': IconMoodHappy,
    '😮': IconMoodSurprised,
    '😢': IconMoodSad,
    '🔥': IconFlame,
};

const STICKERS = [
    'https://cdn-icons-png.flaticon.com/512/742/742751.png', // Smile
    'https://cdn-icons-png.flaticon.com/512/742/742752.png', // Laugh
    'https://cdn-icons-png.flaticon.com/512/742/742920.png', // Cool
    'https://cdn-icons-png.flaticon.com/512/742/742760.png', // Sad
    'https://cdn-icons-png.flaticon.com/512/742/742822.png', // Angry
    'https://cdn-icons-png.flaticon.com/512/742/742745.png', // Love
    'https://cdn-icons-png.flaticon.com/512/4712/4712109.png', // Thumbs Up
    'https://cdn-icons-png.flaticon.com/512/4712/4712139.png', // Party
    'https://cdn-icons-png.flaticon.com/512/4712/4712009.png', // Thinking
    'https://cdn-icons-png.flaticon.com/512/4712/4712128.png', // Sleepy
    'https://cdn-icons-png.flaticon.com/512/4712/4712038.png', // Confused
    'https://cdn-icons-png.flaticon.com/512/1651/1651623.png', // Study
    'https://cdn-icons-png.flaticon.com/512/2936/2936886.png', // Coffee
    'https://cdn-icons-png.flaticon.com/512/1651/1651586.png', // Laptop
];

function ChatPageContent() {
    const { user, profile, refreshProfile } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();
    const dmRecipientId = searchParams.get('dm');
    const [activeTab, setActiveTab] = useState<string | null>('universal');
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isMessagesLoading, setIsMessagesLoading] = useState(false);
    const [isConversationsLoading, setIsConversationsLoading] = useState(false);
    const viewport = useRef<HTMLDivElement>(null);
    const [autoScroll, setAutoScroll] = useState(true);
    const [onlineCount, setOnlineCount] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [totalMessages, setTotalMessages] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [dmUser, setDmUser] = useState<{ name: string } | null>(null);
    const [recentDms, setRecentDms] = useState<ConversationSummary[]>([]);
    const [totalDmUnread, setTotalDmUnread] = useState(0);
    const dmUnreadSnapshot = useRef<Record<string, number>>({});
    const dmSnapshotReady = useRef(false);
    const messagesHashRef = useRef('');
    const conversationsHashRef = useRef('');
    const messagesRef = useRef<Message[]>([]);
    const recentDmsRef = useRef<ConversationSummary[]>([]);
    const autoScrollRef = useRef(true);
    const pinnedCount = useMemo(() => recentDms.filter(dm => dm.isPinned).length, [recentDms]);
    
    // New State
    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
    
    const isMobile = useMediaQuery('(max-width: 768px)');
    const isTablet = useMediaQuery('(max-width: 1024px)');
    const sidebarWidth = useMemo(() => (isMobile ? '100%' : isTablet ? 260 : 320), [isMobile, isTablet]);
    const sidebarMaxWidth = useMemo(() => (isMobile ? '100%' : isTablet ? 300 : 360), [isMobile, isTablet]);
    const [showSidebar, setShowSidebar] = useState(true);
    const [supportsNotifications, setSupportsNotifications] = useState(true);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
    const [windowInFocus, setWindowInFocus] = useState(true);

    const isVITStudent = user?.email?.endsWith('@vitstudent.ac.in');

    useEffect(() => {
        if (profile?.blockedUsers) {
            setBlockedUsers(profile.blockedUsers);
        }
    }, [profile]);

    useEffect(() => {
        dmSnapshotReady.current = false;
        dmUnreadSnapshot.current = {};
    }, [profile?._id]);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        recentDmsRef.current = recentDms;
    }, [recentDms]);

    useEffect(() => {
        autoScrollRef.current = autoScroll;
    }, [autoScroll]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const hasSupport = 'Notification' in window;
        setSupportsNotifications(hasSupport);
        if (hasSupport) {
            setNotificationPermission(Notification.permission);
        }

        const handleFocus = () => setWindowInFocus(true);
        const handleBlur = () => setWindowInFocus(false);
        const handleVisibility = () => {
            if (typeof document !== 'undefined') {
                setWindowInFocus(!document.hidden);
            }
        };

        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, []);

    const requestBrowserNotifications = useCallback(async () => {
        if (!supportsNotifications || typeof Notification === 'undefined') {
            showError({ message: 'Browser does not support notifications.' }, 'Notifications');
            return;
        }
        try {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
            if (permission === 'granted') {
                showSuccess('Browser notifications enabled for DMs');
            } else {
                showError({ message: 'Notification permission denied.' }, 'Notifications');
            }
        } catch (error) {
            showError(error, 'Notifications');
        }
    }, [supportsNotifications]);

    const sendBrowserNotification = useCallback((senderName: string, preview?: string) => {
        if (!supportsNotifications || typeof Notification === 'undefined') return;
        if (Notification.permission !== 'granted') return;

        const body = preview?.trim()?.slice(0, 120) || 'New message in your DMs';
        try {
            new Notification(`${senderName} sent a message`, {
                body,
                icon: '/favicon.ico',
                tag: `dm-${senderName}`,
            });
        } catch (error) {
            console.warn('Failed to show browser notification', error);
        }
    }, [supportsNotifications]);

    const handleSearchUsers = async (query: string) => {
        setUserSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            const res = await fetch(`/api/users?search=${query}&limit=5`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (data.users) setSearchResults(data.users);
        } catch (error) {
            console.error(error);
        }
    };

    const startDm = (userId: string) => {
        setSearchModalOpen(false);
        router.push(`/chat?dm=${userId}`);
    };

    const handleBlockUser = async () => {
        if (!dmRecipientId || !profile) return;
        const isBlocked = blockedUsers.includes(dmRecipientId);
        const action = isBlocked ? 'unblock' : 'block';
        
        if (!confirm(`Are you sure you want to ${action} this user?`)) return;

        try {
            const res = await fetch('/api/users/block', {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: profile._id,
                    targetUserId: dmRecipientId,
                    action
                })
            });
            const data = await res.json();
            if (data.success) {
                setBlockedUsers(data.blockedUsers);
                // Update local profile if needed, or just rely on state
                refreshProfile(); 
                showSuccess(`User ${action}ed successfully`);
            }
        } catch (error) {
            showError(error, 'Block Failed');
        }
    };

    const fetchConversations = useCallback(async (options?: { showSpinner?: boolean }) => {
        if (!profile?._id) return;
        const shouldShowSpinner = options?.showSpinner || recentDmsRef.current.length === 0;
        if (shouldShowSpinner) setIsConversationsLoading(true);
        try {
            const res = await fetch(`/api/chat?type=conversations&userId=${profile._id}`, { headers: getAuthHeaders() });
            if (!res.ok) return;
            const data = await res.json();
            setTotalDmUnread(data.totalUnread || 0);
            const incoming = Array.isArray(data.conversations) ? data.conversations : [];
            const hash = incoming.map((dm: any) => `${dm._id}:${dm.unreadCount ?? 0}:${dm.lastMessageAt ?? ''}:${dm.isPinned ? 1 : 0}`).join('|');
            if (conversationsHashRef.current === hash) return;
            conversationsHashRef.current = hash;
            setRecentDms(incoming);
        } catch (error) {
            console.error(error);
        } finally {
            if (shouldShowSpinner) setIsConversationsLoading(false);
        }
    }, [profile?._id]);

    useEffect(() => {
        if (!profile?._id) return;
        fetchConversations({ showSpinner: true });
        const interval = setInterval(() => fetchConversations(), 5000);
        return () => clearInterval(interval);
    }, [profile?._id, fetchConversations]);

    const handleConversationAction = useCallback(async (targetId: string, action: 'pin' | 'unpin' | 'delete') => {
        if (!profile?._id) return;
        if (action === 'pin' && pinnedCount >= 3) {
            showError({ message: 'You can pin up to 3 conversations.' }, 'Pin Limit');
            return;
        }
        if (action === 'delete' && !confirm('Delete this conversation for both participants?')) {
            return;
        }

        try {
            const res = await fetch('/api/chat/preferences', {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: profile._id, targetId, action })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to update conversation');
            }
            showSuccess(data.message || 'Conversation updated');
            await fetchConversations({ showSpinner: true });
            if (action === 'delete' && dmRecipientId === targetId) {
                router.push('/chat');
                setActiveTab('universal');
                setMessages([]);
                setDmUser(null);
            }
        } catch (error) {
            showError(error, 'Action Failed');
        }
    }, [profile?._id, pinnedCount, fetchConversations, dmRecipientId, router]);

    useEffect(() => {
        if (dmRecipientId) {
            setActiveTab('dm');
            if (isMobile) setShowSidebar(false);
            (async () => {
                try {
                    const res = await fetch(`/api/users/${dmRecipientId}`, { headers: getAuthHeaders() });
                    const data = await res.json();
                    if (data.user) setDmUser(data.user);
                } catch (e) {
                    console.error(e);
                }
            })();
        }
    }, [dmRecipientId]);

    const fetchMessages = useCallback(async (options?: { showSpinner?: boolean }) => {
        if (!activeTab) return;

        const type = activeTab;
        const branch = profile?.branch;
        const year = profile?.year;

        if (type === 'branch' && !branch) return;
        if (type === 'year' && !year) return;
        if (type === 'dm' && !dmRecipientId) return;

        const shouldShowSpinner = options?.showSpinner || messagesRef.current.length === 0;
        if (shouldShowSpinner) {
            setIsMessagesLoading(true);
        }

        try {
            const query = new URLSearchParams({ type });
            if (type === 'branch' && branch) query.append('branch', branch);
            if (type === 'year' && year) query.append('year', String(year));
            if (type === 'dm' && dmRecipientId) query.append('recipientId', dmRecipientId);
            if (profile?._id) query.append('userId', String(profile._id));

            const res = await fetch(`/api/chat?${query.toString()}`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (res.ok) {
                setOnlineCount(data.onlineCount || 0);
                setTotalUsers(data.totalUsers || 0);
                setTotalMessages(data.totalMessages || 0);
                const incomingMessages: Message[] = data.messages || [];
                const payloadHash = incomingMessages.map((msg: Message) => `${msg._id}:${msg.createdAt}`).join('|');
                if (messagesHashRef.current === payloadHash && messagesRef.current.length === incomingMessages.length) {
                    return;
                }
                messagesHashRef.current = payloadHash;

                const prev = messagesRef.current;
                const shouldScroll = incomingMessages.length > prev.length && autoScrollRef.current;
                setMessages(incomingMessages);
                if (shouldScroll) {
                    requestAnimationFrame(() => scrollToBottom());
                }
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            if (shouldShowSpinner) {
                setIsMessagesLoading(false);
            }
        }
    }, [activeTab, profile?.branch, profile?.year, dmRecipientId, profile?._id]);

    const scrollToBottom = () => {
        if (viewport.current) {
            viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
            setShowScrollButton(false);
        }
    };

    // Handle scroll to detect if user scrolled up
    const onScrollPositionChange = (position: { x: number; y: number }) => {
        if (viewport.current) {
            const { scrollTop, scrollHeight, clientHeight } = viewport.current;
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
            setAutoScroll(isAtBottom);
            setShowScrollButton(!isAtBottom);
        }
    };

    const filteredMessages = messages.filter(msg => 
        msg.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
        msg.senderName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        if (!(user && isVITStudent)) return;
        fetchMessages({ showSpinner: true });
        const interval = setInterval(() => fetchMessages(), 4000);
        return () => clearInterval(interval);
    }, [user, isVITStudent, fetchMessages]);

    // Initial scroll on tab change
    useEffect(() => {
        setAutoScroll(true);
        scrollToBottom();
        fetchMessages({ showSpinner: true });
    }, [activeTab, fetchMessages]);

    useEffect(() => {
        if (recentDms.length === 0) {
            dmUnreadSnapshot.current = {};
            dmSnapshotReady.current = false;
            return;
        }

        if (!dmSnapshotReady.current) {
            dmUnreadSnapshot.current = recentDms.reduce<Record<string, number>>((acc, dm) => {
                acc[dm._id] = dm.unreadCount || 0;
                return acc;
            }, {});
            dmSnapshotReady.current = true;
            return;
        }

        const nextSnapshot: Record<string, number> = {};
        const isDocumentHidden = typeof document !== 'undefined' ? document.hidden : false;
        recentDms.forEach((dm) => {
            const current = dm.unreadCount || 0;
            const previous = dmUnreadSnapshot.current[dm._id] || 0;
            if (current > previous) {
                const conversationActive = activeTab === 'dm' && dmRecipientId === dm._id;
                if (!conversationActive) {
                    const delta = current - previous;
                    showInfo(`${dm.name} sent ${delta} new message${delta > 1 ? 's' : ''}`);
                }

                if (!conversationActive || !windowInFocus || isDocumentHidden) {
                    sendBrowserNotification(dm.name, dm.lastMessagePreview);
                }
            }
            nextSnapshot[dm._id] = current;
        });

        dmUnreadSnapshot.current = nextSnapshot;
    }, [recentDms, activeTab, dmRecipientId, windowInFocus, sendBrowserNotification]);

    const handleSendMessage = async (stickerUrl?: string) => {
        if ((!newMessage.trim() && !stickerUrl) || !user || !profile) return;

        const type = activeTab;
        const branch = profile.branch;
        const year = profile.year;

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 
                    ...getAuthHeaders()
                },
                body: JSON.stringify({
                    content: newMessage,
                    senderId: profile._id,
                    type,
                    branch: type === 'branch' ? branch : undefined,
                    year: type === 'year' ? Number(year) : undefined,
                    recipientId: type === 'dm' ? dmRecipientId : undefined,
                    replyTo: replyingTo ? {
                        _id: replyingTo._id,
                        content: replyingTo.content,
                        senderName: replyingTo.senderName
                    } : undefined,
                    sticker: stickerUrl
                }),
            });

            if (res.ok) {
                setNewMessage('');
                setReplyingTo(null);
                setAutoScroll(true); // Force scroll on own message
                fetchMessages();
            } else {
                const data = await res.json();
                showError({ message: data.error || 'Failed to send message' }, 'Message Failed');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            showError(error, 'Message Failed');
        }
    };

    const handleReaction = async (msgId: string, emoji: string) => {
        if (!profile) return;
        try {
            const res = await fetch(`/api/chat/${msgId}`, {
                method: 'PATCH',
                headers: { ...getAuthHeaders() },
                body: JSON.stringify({
                    action: 'react',
                    userId: profile._id,
                    emoji
                })
            });
            if (res.ok) {
                fetchMessages();
            }
        } catch (error) {
            console.error('Error reacting:', error);
        }
    };

    const handleDeleteMessage = async (msgId: string) => {
        if (!confirm('Delete this message?')) return;
        try {
            const res = await fetch(`/api/chat/${msgId}?userId=${profile?._id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (res.ok) {
                fetchMessages();
            }
        } catch (error) {
            console.error('Error deleting message:', error);
        }
    };

    if (!user) {
        return (
            <>
                <Navbar />
                <Container size="sm" py="xl" ta="center">
                    <Text>Please log in to access chat.</Text>
                </Container>
            </>
        );
    }

    if (!isVITStudent) {
        return (
            <>
                <Navbar />
                <Container size="sm" py="xl" ta="center">
                    <Title order={2} c="red">Access Denied</Title>
                    <Text mt="md">This chat is restricted to VIT students only (@vitstudent.ac.in).</Text>
                </Container>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <Container size="xl" py={isMobile ? 0 : 'xl'} h={isMobile ? 'calc(100dvh - 60px)' : 'calc(100vh - 80px)'} px={isMobile ? 0 : 'md'}>
                <Paper 
                    withBorder={!isMobile} 
                    shadow={isMobile ? 'none' : 'sm'} 
                    radius={isMobile ? 0 : 'md'} 
                    h="100%" 
                    style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
                >
                    <Box style={{ display: 'flex', flex: 1, minHeight: 0 }}>
                        <Box
                            component="aside"
                            style={{
                                borderRight: '1px solid var(--mantine-color-default-border)',
                                minHeight: 0,
                                width: sidebarWidth,
                                maxWidth: sidebarMaxWidth,
                                flexShrink: 0,
                                display: isMobile && !showSidebar ? 'none' : 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            <Stack p="md" gap="xs" style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
                                <Group justify="space-between" mb="xs">
                                    <Text fw={700} c="dimmed" size="xs" tt="uppercase">Channels</Text>
                                    <Tooltip label="Refresh Messages">
                                        <ActionIcon variant="subtle" color="gray" onClick={() => fetchMessages({ showSpinner: true })} size="xs">
                                            <IconRefresh size={14} />
                                        </ActionIcon>
                                    </Tooltip>
                                </Group>
                                
                                <Button 
                                    variant={activeTab === 'universal' ? 'filled' : 'subtle'} 
                                    color={activeTab === 'universal' ? 'blue' : 'gray'}
                                    onClick={() => {
                                        setActiveTab('universal');
                                        if (isMobile) setShowSidebar(false);
                                    }}
                                    justify="flex-start"
                                    leftSection={<IconHash size={16} />}
                                    fullWidth
                                >
                                    Universal
                                </Button>
                                <Button 
                                    variant={activeTab === 'branch' ? 'filled' : 'subtle'} 
                                    color={activeTab === 'branch' ? 'blue' : 'gray'}
                                    onClick={() => {
                                        setActiveTab('branch');
                                        if (isMobile) setShowSidebar(false);
                                    }}
                                    disabled={!profile?.branch}
                                    justify="flex-start"
                                    leftSection={<IconBuilding size={16} />}
                                    fullWidth
                                >
                                    {profile?.branch ? `${profile.branch}` : 'Branch'}
                                </Button>
                                <Button 
                                    variant={activeTab === 'year' ? 'filled' : 'subtle'} 
                                    color={activeTab === 'year' ? 'blue' : 'gray'}
                                    onClick={() => {
                                        setActiveTab('year');
                                        if (isMobile) setShowSidebar(false);
                                    }}
                                    disabled={!profile?.year}
                                    justify="flex-start"
                                    leftSection={<IconCalendar size={16} />}
                                    fullWidth
                                >
                                    {profile?.year ? `Year ${profile.year}` : 'Year'}
                                </Button>

                                <Group justify="space-between" mt="md" mb="xs">
                                    <Group gap={6} align="center">
                                        <Text fw={700} c="dimmed" size="xs" tt="uppercase">Direct Messages</Text>
                                        {totalDmUnread > 0 && (
                                            <Badge size="xs" color="red" variant="filled">
                                                {totalDmUnread}
                                            </Badge>
                                        )}
                                    </Group>
                                    <Group gap={4}>
                                        {supportsNotifications && (
                                            <Tooltip label={notificationPermission === 'granted' ? 'Browser notifications enabled' : 'Enable browser notifications for DMs'}>
                                                <ActionIcon
                                                    variant="subtle"
                                                    color={notificationPermission === 'granted' ? 'yellow' : 'gray'}
                                                    size="xs"
                                                    onClick={() => {
                                                        if (notificationPermission === 'granted') {
                                                            showInfo('Notifications already enabled');
                                                        } else {
                                                            requestBrowserNotifications();
                                                        }
                                                    }}
                                                >
                                                    {notificationPermission === 'granted' ? (
                                                        <IconBellRinging size={14} />
                                                    ) : (
                                                        <IconBell size={14} />
                                                    )}
                                                </ActionIcon>
                                            </Tooltip>
                                        )}
                                        <Tooltip label="New Chat">
                                            <ActionIcon variant="subtle" color="gray" size="xs" onClick={() => setSearchModalOpen(true)}>
                                                <IconUserPlus size={14} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Group>
                                </Group>

                                {isConversationsLoading && recentDms.length === 0 ? (
                                    Array.from({ length: 4 }).map((_, idx) => (
                                        <Skeleton key={`dm-skeleton-${idx}`} height={36} radius="md" />
                                    ))
                                ) : recentDms.map(dm => {
                                    const isActive = activeTab === 'dm' && dmRecipientId === dm._id;
                                    return (
                                        <UnstyledButton
                                            key={dm._id}
                                            onClick={() => {
                                                router.push(`/chat?dm=${dm._id}`);
                                                if (isMobile) setShowSidebar(false);
                                            }}
                                            onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                router.push(`/chat?dm=${dm._id}`);
                                if (isMobile) setShowSidebar(false);
                            }
                        }}
                                            style={{
                                                width: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: '0.5rem',
                                                padding: '0.6rem 0.75rem',
                                                borderRadius: 8,
                                                backgroundColor: isActive ? 'var(--mantine-color-blue-filled)' : 'transparent',
                                                color: isActive ? 'white' : 'inherit'
                                            }}
                                        >
                                            <Group gap={8} wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                                                <Avatar size={32} radius="xl" src={dm.photoURL} color="blue">{dm.name?.[0]}</Avatar>
                                                <Group gap={4} wrap="nowrap" style={{ minWidth: 0 }}>
                                                    <Text truncate size="sm" c={isActive ? 'white' : undefined}>{dm.name}</Text>
                                                    {dm.isPinned && <IconStarFilled size={12} color="#ffd43b" />}
                                                </Group>
                                            </Group>
                                            <Group gap={6} wrap="nowrap" align="center" style={{ flexShrink: 0 }}>
                                                {(dm.unreadCount ?? 0) > 0 && (
                                                    <Badge size="xs" color="red" variant="filled">
                                                        {dm.unreadCount}
                                                    </Badge>
                                                )}
                                                <Menu shadow="md" position="bottom-end" withinPortal>
                                                    <Menu.Target>
                                                        <ActionIcon 
                                                            variant="subtle" 
                                                            color={isActive ? 'white' : 'gray'} 
                                                            size="sm"
                                                            component="div"
                                                            role="button"
                                                            tabIndex={0}
                                                            onClick={(event) => event.stopPropagation()}
                                                            aria-label="Conversation actions"
                                                        >
                                                            <IconDotsVertical size={14} />
                                                        </ActionIcon>
                                                    </Menu.Target>
                                                    <Menu.Dropdown>
                                                        <Menu.Item 
                                                            leftSection={<IconEye size={14} />}
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                router.push(`/users/${dm._id}`);
                                                            }}
                                                        >
                                                            View Profile
                                                        </Menu.Item>
                                                        <Menu.Item 
                                                            leftSection={dm.isPinned ? <IconPinnedOff size={14} /> : <IconPinned size={14} />}
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                handleConversationAction(dm._id, dm.isPinned ? 'unpin' : 'pin');
                                                            }}
                                                        >
                                                            {dm.isPinned ? 'Unpin' : 'Pin'} Conversation
                                                        </Menu.Item>
                                                        <Menu.Item 
                                                            color="red"
                                                            leftSection={<IconTrash size={14} />}
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                handleConversationAction(dm._id, 'delete');
                                                            }}
                                                        >
                                                            Delete Conversation
                                                        </Menu.Item>
                                                    </Menu.Dropdown>
                                                </Menu>
                                            </Group>
                                        </UnstyledButton>
                                    );
                                })}

                                {dmRecipientId && !recentDms.find(d => d._id === dmRecipientId) && (
                                    <Button 
                                        variant="filled"
                                        color="blue"
                                        justify="flex-start"
                                        leftSection={<IconMessage size={16} />}
                                        fullWidth
                                    >
                                        {dmUser ? dmUser.name : 'Chat'}
                                    </Button>
                                )}
                            </Stack>
                        </Box>

                        <Box
                            component="section"
                            style={{
                                flex: 1,
                                display: isMobile && showSidebar ? 'none' : 'flex',
                                flexDirection: 'column',
                                minHeight: 0
                            }}
                        >
                            <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                                <Group 
                                    justify="space-between" 
                                    wrap={isTablet ? 'wrap' : 'nowrap'}
                                    align={isTablet ? 'flex-start' : 'center'}
                                    gap={isTablet ? 'sm' : 'md'}
                                >
                                    <Group gap="xs" wrap={isTablet ? 'wrap' : 'nowrap'} style={{ flex: 1, minWidth: 0 }}>
                                        {isMobile && (
                                            <ActionIcon variant="subtle" color="gray" onClick={() => setShowSidebar(true)}>
                                                <IconArrowLeft size={20} />
                                            </ActionIcon>
                                        )}
                                        <Box style={{ flex: 1, minWidth: 0 }}>
                                            <Title order={4} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {activeTab === 'universal' && '# Universal Chat'}
                                                {activeTab === 'branch' && `# ${profile?.branch} Chat`}
                                                {activeTab === 'year' && `# Year ${profile?.year} Chat`}
                                                {activeTab === 'dm' && `@ ${dmUser?.name || 'User'}`}
                                            </Title>
                                        </Box>
                                        {activeTab !== 'dm' && (
                                            <Badge color="green" variant="dot" size="sm" style={{ flexShrink: 0 }}>
                                                {onlineCount} Online
                                            </Badge>
                                        )}
                                        {activeTab === 'dm' && dmRecipientId && (
                                            <Menu shadow="md" width={200}>
                                                <Menu.Target>
                                                    <ActionIcon variant="subtle" color="gray">
                                                        <IconDotsVertical size={16} />
                                                    </ActionIcon>
                                                </Menu.Target>
                                                <Menu.Dropdown>
                                                    <Menu.Item 
                                                        color={blockedUsers.includes(dmRecipientId) ? 'green' : 'red'}
                                                        leftSection={<IconBan size={14} />}
                                                        onClick={handleBlockUser}
                                                    >
                                                        {blockedUsers.includes(dmRecipientId) ? 'Unblock User' : 'Block User'}
                                                    </Menu.Item>
                                                </Menu.Dropdown>
                                            </Menu>
                                        )}
                                    </Group>
                                    {!isMobile && (
                                        <Box style={{ flexBasis: isTablet ? '100%' : 'auto', flexGrow: isTablet ? 1 : 0 }}>
                                            <TextInput 
                                                placeholder="Search..." 
                                                size="xs" 
                                                leftSection={<IconSearch size={12} />}
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                style={{ width: '100%' }}
                                                mt={isTablet ? 'sm' : 0}
                                            />
                                        </Box>
                                    )}
                                </Group>
                            </Box>

                            <Box style={{ position: 'relative', flex: 1, minHeight: 0 }}>
                                <LoadingOverlay visible={isMessagesLoading} zIndex={10} overlayProps={{ radius: 'sm', blur: 2 }} loaderProps={{ color: 'blue' }} />
                                <ScrollArea 
                                    viewportRef={viewport} 
                                    p="md" 
                                    type="always" 
                                    offsetScrollbars
                                    onScrollPositionChange={onScrollPositionChange}
                                    style={{ flex: 1, minHeight: 0 }}
                                >
                                {showScrollButton && (
                                    <ActionIcon 
                                        variant="filled" 
                                        color="blue" 
                                        radius="xl" 
                                        size="lg"
                                        style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}
                                        onClick={scrollToBottom}
                                    >
                                        <IconArrowDown size={20} />
                                    </ActionIcon>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: 10 }}>
                                    {isMessagesLoading && messages.length === 0 ? (
                                        Array.from({ length: 6 }).map((_, idx) => (
                                            <Skeleton key={`msg-skeleton-${idx}`} height={78} radius="lg" />
                                        ))
                                    ) : filteredMessages.map((msg) => {
                                        const myId = String(profile?._id ?? '');
                                        const isMe = msg.senderId === myId;
                                        return (
                                            <Group key={msg._id} align="flex-start" justify={isMe ? 'flex-end' : 'flex-start'} gap="xs" wrap="nowrap">
                                                {!isMe && (
                                                    <Avatar radius="xl" size="sm" color="blue">{msg.senderName?.[0]}</Avatar>
                                                )}
                                                <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                                                    <Group gap={6} mb={2}>
                                                        {!isMe && <Text size="xs" fw={700} c="dimmed">{msg.senderName}</Text>}
                                                        <Text size="xs" c="dimmed" style={{ fontSize: 10 }}>
                                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </Text>
                                                    </Group>
                                                    
                                                    {msg.replyTo && (
                                                        <Paper 
                                                            p="xs" 
                                                            mb={4} 
                                                            bg={isMe ? 'rgba(255, 255, 255, 0.15)' : 'var(--mantine-color-default-hover)'} 
                                                            radius="sm" 
                                                            style={{ 
                                                                borderLeft: `3px solid ${isMe ? 'rgba(255,255,255,0.8)' : '#228be6'}`, 
                                                                fontSize: '0.85rem', 
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            <Text size="xs" fw={700} c={isMe ? 'white' : 'dimmed'}>{msg.replyTo.senderName}</Text>
                                                            <Text size="xs" lineClamp={1} c={isMe ? 'rgba(255,255,255,0.9)' : 'dimmed'}>{msg.replyTo.content}</Text>
                                                        </Paper>
                                                    )}

                                                    {msg.sticker ? (
                                                        <img src={msg.sticker} alt="sticker" style={{ width: 100, height: 100, objectFit: 'contain' }} />
                                                    ) : (
                                                        <Paper
                                                            p="sm"
                                                            radius="md"
                                                            bg={isMe ? 'blue.6' : 'var(--mantine-color-default-hover)'}
                                                            style={{
                                                                borderTopRightRadius: isMe ? 0 : undefined,
                                                                borderTopLeftRadius: !isMe ? 0 : undefined,
                                                                position: 'relative'
                                                            }}
                                                        >
                                                            <Text size="sm" c={isMe ? 'white' : 'inherit'} style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{msg.content}</Text>
                                                        </Paper>
                                                    )}

                                                    {/* Reactions Display */}
                                                    {msg.reactions && msg.reactions.length > 0 && (
                                                        <Group gap={4} mt={4}>
                                                            {Array.from(new Set(msg.reactions.map(r => r.emoji))).map(emoji => {
                                                                const count = msg.reactions.filter(r => r.emoji === emoji).length;
                                                                const userReacted = msg.reactions.some(r => r.emoji === emoji && r.userId === myId);
                                                                const Icon = REACTION_ICONS[emoji];
                                                                return (
                                                                    <Badge 
                                                                        key={emoji} 
                                                                        size="xs" 
                                                                        variant={userReacted ? "filled" : "light"} 
                                                                        color="gray"
                                                                        style={{ cursor: 'pointer', textTransform: 'none', paddingLeft: 6, paddingRight: 6 }}
                                                                        onClick={() => handleReaction(msg._id, emoji)}
                                                                    >
                                                                        <Group gap={4} align="center">
                                                                            {Icon ? <Icon size={12} /> : emoji}
                                                                            <span>{count}</span>
                                                                        </Group>
                                                                    </Badge>
                                                                );
                                                            })}
                                                        </Group>
                                                    )}

                                                    <Group gap={4} mt={2} style={{ opacity: 0.5 }}>
                                                        <ActionIcon 
                                                            variant="subtle" 
                                                            color="gray" 
                                                            size="xs" 
                                                            onClick={() => setReplyingTo(msg)}
                                                        >
                                                            <IconArrowBackUp size={12} />
                                                        </ActionIcon>
                                                        
                                                        <Menu shadow="md" width={200}>
                                                            <Menu.Target>
                                                                <ActionIcon variant="subtle" color="gray" size="xs">
                                                                    <IconMoodSmile size={12} />
                                                                </ActionIcon>
                                                            </Menu.Target>
                                                            <Menu.Dropdown>
                                                                <Group gap={4} p={4} justify="center">
                                                                    {Object.entries(REACTION_ICONS).map(([emoji, Icon]) => (
                                                                        <ActionIcon 
                                                                            key={emoji} 
                                                                            variant="subtle" 
                                                                            onClick={() => handleReaction(msg._id, emoji)}
                                                                        >
                                                                            <Icon size={18} />
                                                                        </ActionIcon>
                                                                    ))}
                                                                </Group>
                                                            </Menu.Dropdown>
                                                        </Menu>

                                                        {isMe && (
                                                            <ActionIcon 
                                                                variant="subtle" 
                                                                color="gray" 
                                                                size="xs" 
                                                                onClick={() => handleDeleteMessage(msg._id)}
                                                            >
                                                                <IconTrash size={12} />
                                                            </ActionIcon>
                                                        )}
                                                    </Group>
                                                </div>
                                                {isMe && (
                                                    <Avatar radius="xl" size="sm" color="blue" src={user.photoURL}>{msg.senderName?.[0]}</Avatar>
                                                )}
                                            </Group>
                                        );
                                    })}
                                    {!isMessagesLoading && messages.length === 0 && (
                                        <Center h={200}>
                                            <Text c="dimmed">No messages yet. Start the conversation!</Text>
                                        </Center>
                                    )}
                                </div>
                                </ScrollArea>
                            </Box>

                            <Box 
                                p="md" 
                                pt="sm" 
                                style={{ 
                                    borderTop: '1px solid var(--mantine-color-default-border)', 
                                    flexShrink: 0,
                                    backgroundColor: 'var(--mantine-color-body)'
                                }}
                            >
                                {replyingTo && (
                                    <Paper 
                                        p="sm" 
                                        mb="xs" 
                                        withBorder 
                                        radius="md"
                                        style={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            borderLeft: '4px solid #228be6'
                                        }}
                                    >
                                        <Box>
                                            <Text size="xs" fw={700} c="auto">Replying to {replyingTo.senderName}</Text>
                                            <Text size="sm" lineClamp={1} c="auto">{replyingTo.content}</Text>
                                        </Box>
                                        <ActionIcon variant="subtle" color="gray" onClick={() => setReplyingTo(null)}>
                                            <IconX size={16} />
                                        </ActionIcon>
                                    </Paper>
                                )}

                                <Group gap="xs" align="center" wrap="nowrap">
                                    <Menu shadow="md" width={200} position="top-start">
                                        <Menu.Target>
                                            <ActionIcon variant="subtle" color="gray" radius="xl" size="lg">
                                                <IconSticker size={20} />
                                            </ActionIcon>
                                        </Menu.Target>
                                        <Menu.Dropdown>
                                            <Text size="xs" c="dimmed" p="xs">Send a sticker</Text>
                                            <Group gap="xs" p="xs" style={{ maxWidth: 300 }}>
                                                {STICKERS.map((sticker, index) => (
                                                    <ActionIcon 
                                                        key={index} 
                                                        variant="subtle" 
                                                        size="xl" 
                                                        onClick={() => handleSendMessage(sticker)}
                                                    >
                                                        <img src={sticker} alt="sticker" style={{ width: 30, height: 30 }} />
                                                    </ActionIcon>
                                                ))}
                                            </Group>
                                        </Menu.Dropdown>
                                    </Menu>

                                    <TextInput
                                        placeholder={`Message ${activeTab === 'dm' ? (dmUser?.name || 'User') : activeTab}...`}
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        size="md"
                                        radius="xl"
                                        disabled={activeTab === 'dm' && !!dmRecipientId && blockedUsers.includes(dmRecipientId)}
                                        style={{ flex: 1 }}
                                    />

                                    <ActionIcon 
                                        variant="filled" 
                                        color="blue" 
                                        size={42} 
                                        radius="xl" 
                                        onClick={() => handleSendMessage()} 
                                        disabled={(!newMessage.trim() && !loading) || (activeTab === 'dm' && !!dmRecipientId && blockedUsers.includes(dmRecipientId))}
                                    >
                                        <IconSend size={20} />
                                    </ActionIcon>
                                </Group>
                            </Box>
                        </Box>
                    </Box>
                </Paper>
            </Container>

            <Modal opened={searchModalOpen} onClose={() => setSearchModalOpen(false)} title="New Message">
                <TextInput
                    placeholder="Search users by name..."
                    value={userSearchQuery}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                    mb="md"
                    leftSection={<IconSearch size={16} />}
                />
                <Stack gap="xs">
                    {searchResults.map(u => (
                        <UnstyledButton 
                            key={u._id} 
                            onClick={() => startDm(u._id)}
                            style={{ padding: '8px', borderRadius: '4px' }}
                            className="hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <Group>
                                <Avatar color="blue" radius="xl">{u.name[0]}</Avatar>
                                <Box style={{ flex: 1 }}>
                                    <Text size="sm" fw={500}>{u.name}</Text>
                                    <Text size="xs" c="dimmed">{u.branch} • Year {u.year}</Text>
                                </Box>
                            </Group>
                        </UnstyledButton>
                    ))}
                    {userSearchQuery.length >= 2 && searchResults.length === 0 && (
                        <Text c="dimmed" ta="center" size="sm">No users found</Text>
                    )}
                </Stack>
            </Modal>
        </>
    );
}

export default function ChatPage() {
    return (
        <Suspense fallback={null}>
            <ChatPageContent />
        </Suspense>
    );
}
