'use client';

import { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { Container, Title, Paper, Tabs, ScrollArea, TextInput, ActionIcon, Group, Text, Avatar, Center, Tooltip } from '@mantine/core';
import { useAuth } from '@/components/AuthProvider';
import { IconSend, IconTrash, IconRefresh } from '@tabler/icons-react';
import { showError } from '@/lib/error-handling';

interface Message {
    _id: string;
    content: string;
    senderId: string;
    senderName: string;
    type: 'universal' | 'branch' | 'year';
    branch?: string;
    year?: number;
    createdAt: string;
}

export default function ChatPage() {
    const { user, profile } = useAuth();
    const [activeTab, setActiveTab] = useState<string | null>('universal');
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const viewport = useRef<HTMLDivElement>(null);
    const [autoScroll, setAutoScroll] = useState(true);

    const isVITStudent = user?.email?.endsWith('@vitstudent.ac.in');

    const fetchMessages = async () => {
        if (!activeTab) return;

        const type = activeTab;
        const branch = profile?.branch;
        const year = profile?.year;

        if (type === 'branch' && !branch) return;
        if (type === 'year' && !year) return;

        try {
            const query = new URLSearchParams({ type });
            if (type === 'branch' && branch) query.append('branch', branch);
            if (type === 'year' && year) query.append('year', String(year));

            const res = await fetch(`/api/chat?${query.toString()}`);
            const data = await res.json();
            if (res.ok) {
                // Only update if different to avoid re-renders/scroll jumps if possible, 
                // but for now just set it.
                setMessages(prev => {
                    // Simple check to see if we have new messages to decide on scrolling
                    if (data.messages.length > prev.length && autoScroll) {
                        setTimeout(scrollToBottom, 100);
                    }
                    return data.messages;
                });
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const scrollToBottom = () => {
        if (viewport.current) {
            viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
        }
    };

    // Handle scroll to detect if user scrolled up
    const onScrollPositionChange = (position: { x: number; y: number }) => {
        if (viewport.current) {
            const { scrollTop, scrollHeight, clientHeight } = viewport.current;
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
            setAutoScroll(isAtBottom);
        }
    };

    useEffect(() => {
        if (user && isVITStudent) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
            return () => clearInterval(interval);
        }
    }, [user, activeTab, profile]);

    // Initial scroll on tab change
    useEffect(() => {
        setAutoScroll(true);
        scrollToBottom();
    }, [activeTab]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !user || !profile) return;

        const type = activeTab;
        const branch = profile.branch;
        const year = profile.year;

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newMessage,
                    senderId: profile._id,
                    type,
                    branch: type === 'branch' ? branch : undefined,
                    year: type === 'year' ? Number(year) : undefined,
                }),
            });

            if (res.ok) {
                setNewMessage('');
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

    const handleDeleteMessage = async (msgId: string) => {
        if (!confirm('Delete this message?')) return;
        try {
            const res = await fetch(`/api/chat/${msgId}?userId=${profile?._id}`, {
                method: 'DELETE',
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
            <Container size="md" py="xl" h="calc(100vh - 80px)">
                <Paper withBorder shadow="sm" p="md" radius="md" h="100%" display="flex" style={{ flexDirection: 'column' }}>
                    <Tabs value={activeTab} onChange={setActiveTab} mb="md">
                        <Tabs.List grow>
                            <Tabs.Tab value="universal">Universal</Tabs.Tab>
                            <Tabs.Tab value="branch" disabled={!profile?.branch}>
                                {profile?.branch ? `${profile.branch}` : 'Branch (Set in Profile)'}
                            </Tabs.Tab>
                            <Tabs.Tab value="year" disabled={!profile?.year}>
                                {profile?.year ? `Year ${profile.year}` : 'Year (Set in Profile)'}
                            </Tabs.Tab>
                            <Tooltip label="Refresh Messages">
                                <ActionIcon variant="subtle" color="gray" onClick={fetchMessages} ml="auto" my="auto" mr="xs">
                                    <IconRefresh size={16} />
                                </ActionIcon>
                            </Tooltip>
                        </Tabs.List>
                    </Tabs>

                    <ScrollArea 
                        flex={1} 
                        viewportRef={viewport} 
                        mb="md" 
                        type="always" 
                        offsetScrollbars
                        onScrollPositionChange={onScrollPositionChange}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: 10 }}>
                            {messages.map((msg) => {
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
                                            <Paper
                                                p="sm"
                                                radius="md"
                                                bg={isMe ? 'blue.6' : 'gray.1'}
                                                c={isMe ? 'white' : 'black'}
                                                style={{
                                                    borderTopRightRadius: isMe ? 0 : undefined,
                                                    borderTopLeftRadius: !isMe ? 0 : undefined,
                                                    position: 'relative'
                                                }}
                                            >
                                                <Text size="sm" style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{msg.content}</Text>
                                            </Paper>
                                            {isMe && (
                                                <ActionIcon 
                                                    variant="subtle" 
                                                    color="gray" 
                                                    size="xs" 
                                                    onClick={() => handleDeleteMessage(msg._id)}
                                                    style={{ opacity: 0.5 }}
                                                >
                                                    <IconTrash size={12} />
                                                </ActionIcon>
                                            )}
                                        </div>
                                        {isMe && (
                                            <Avatar radius="xl" size="sm" color="blue" src={user.photoURL}>{msg.senderName?.[0]}</Avatar>
                                        )}
                                    </Group>
                                );
                            })}
                            {messages.length === 0 && (
                                <Center h={200}>
                                    <Text c="dimmed">No messages yet. Start the conversation!</Text>
                                </Center>
                            )}
                        </div>
                    </ScrollArea>

                    <Group gap="xs" align="flex-end">
                        <TextInput
                            placeholder={`Message ${activeTab} chat...`}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            style={{ flex: 1 }}
                            size="md"
                            radius="xl"
                        />
                        <ActionIcon 
                            variant="filled" 
                            color="blue" 
                            size={42} 
                            radius="xl" 
                            onClick={handleSendMessage} 
                            disabled={!newMessage.trim()}
                        >
                            <IconSend size={20} />
                        </ActionIcon>
                    </Group>
                </Paper>
            </Container>
        </>
    );
}
