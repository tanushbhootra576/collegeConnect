'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Container, Title, Button, Group, Card, Badge, Text, SimpleGrid, TextInput, Select, Modal, Textarea, LoadingOverlay, Avatar, Collapse, Divider, Alert, Pagination, Tabs, ThemeIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useAuth } from '@/components/AuthProvider';
import { IconMessage, IconPlus, IconThumbUp, IconCode, IconBrain, IconDatabase, IconDeviceDesktop, IconDeviceMobile, IconLock, IconCloud, IconServer, IconCurrencyBitcoin, IconCheck, IconEdit } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { showError } from '@/lib/error-handling';

interface Thread {
    _id: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
    authorId: {
        _id: string;
        name: string;
    };
    createdAt: string;
    upvotes: string[];
    comments: {
        _id?: string;
        authorId: { name: string };
        content: string;
        createdAt: string;
    }[];
}

const CATEGORIES = [
    { value: 'GENERAL', label: 'General', icon: IconMessage },
    { value: 'BRANCH', label: 'Branch', icon: IconDeviceDesktop },
    { value: 'YEAR', label: 'Year', icon: IconDeviceDesktop },
    { value: 'PLACEMENT', label: 'Placement', icon: IconDeviceDesktop },
    { value: 'SWE', label: 'Software Engineering', icon: IconCode },
    { value: 'AI', label: 'AI', icon: IconBrain },
    { value: 'ML', label: 'Machine Learning', icon: IconBrain },
    { value: 'DATASCIENCE', label: 'Data Science', icon: IconDatabase },
    { value: 'WEBDEV', label: 'Web Dev', icon: IconDeviceDesktop },
    { value: 'APPDEV', label: 'App Dev', icon: IconDeviceMobile },
    { value: 'CYBERSECURITY', label: 'Cybersecurity', icon: IconLock },
    { value: 'BLOCKCHAIN', label: 'Blockchain', icon: IconCurrencyBitcoin },
    { value: 'CLOUD', label: 'Cloud', icon: IconCloud },
    { value: 'DEVOPS', label: 'DevOps', icon: IconServer },
];

const RESTRICTED_CATEGORIES = ['SWE', 'AI', 'ML', 'DATASCIENCE', 'WEBDEV', 'APPDEV', 'CYBERSECURITY', 'BLOCKCHAIN', 'CLOUD', 'DEVOPS'];

export default function DiscussionsPage() {
    const { user, profile } = useAuth();
    const queryClient = useQueryClient();

    // Filters & pagination
    const [categoryFilter, setCategoryFilter] = useState<string | null>('GENERAL');
    const [sort, setSort] = useState<string>('newest');
    const [page, setPage] = useState<number>(1);
    const [pageSize] = useState<number>(10);

    // New thread modal
    const [opened, { open, close }] = useDisclosure(false);
    const [newThread, setNewThread] = useState({
        title: '',
        content: '',
        category: 'GENERAL',
        tags: '',
    });

    // Check if user is Alumni (Passout)
    const isAlumni = profile ? profile.role === 'alumni' || profile.role === 'admin' : false;

    // Local UI state for comments
    const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
    const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
    const [mobileCategoryOpened, { toggle: toggleMobileCategory }] = useDisclosure(false);

    // Edit thread modal
    const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
    const [editingThread, setEditingThread] = useState<Thread | null>(null);
    const [editForm, setEditForm] = useState({
        title: '',
        content: '',
        category: '',
        tags: '',
    });

    const handleEditClick = (thread: Thread) => {
        setEditingThread(thread);
        setEditForm({
            title: thread.title,
            content: thread.content,
            category: thread.category,
            tags: thread.tags.join(', '),
        });
        openEdit();
    };

    const sanitize = (raw: any): Thread => ({
        _id: String(raw._id),
        title: raw.title,
        content: raw.content,
        category: raw.category,
        tags: Array.isArray(raw.tags) ? raw.tags : [],
        authorId: raw.authorId || { name: 'Unknown' },
        createdAt: raw.createdAt,
        upvotes: Array.isArray(raw.upvotes) ? raw.upvotes.map((u: any) => String(u)) : [],
        comments: Array.isArray(raw.comments) ? raw.comments.map((c: any) => ({
            _id: c._id,
            authorId: c.authorId || { name: 'Unknown' },
            content: c.content,
            createdAt: c.createdAt,
        })) : []
    });

    // Query: fetch threads
    const threadsQuery = useQuery({
        queryKey: ['threads', { page, pageSize, sort, category: categoryFilter }],
        queryFn: async (): Promise<{ threads: Thread[]; page: number; pageSize: number; total: number; ok: boolean }> => {
            const params = new URLSearchParams();
            params.append('page', String(page));
            params.append('pageSize', String(pageSize));
            params.append('debug', '1');
            if (sort === 'upvotes') params.append('sort', 'upvotes');
            if (categoryFilter) params.append('category', categoryFilter);
            const res = await fetch(`/api/discussions?${params.toString()}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || data.error || 'Failed to load discussions');
            return data;
        },
        select: (data) => ({
            ...data,
            threads: Array.isArray(data.threads) ? data.threads.map(sanitize) : [],
        }),
        placeholderData: (prev) => prev,
    });

    // Mutation: create thread
    const createThreadMutation = useMutation({
        mutationFn: async () => {
            if (!profile) throw new Error('Not authenticated');
            const res = await fetch('/api/discussions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newThread,
                    authorId: profile._id,
                    tags: newThread.tags.split(',').map(t => t.trim()).filter(t => t),
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || data.error || 'Failed to create discussion');
            return data;
        },
        onSuccess: () => {
            notifications.show({ color: 'green', title: 'Discussion Created', message: 'Your discussion has been posted.' });
            close();
            setNewThread({ title: '', content: '', category: 'GENERAL', tags: '' });
            queryClient.invalidateQueries({ queryKey: ['threads'] });
        },
        onError: (e: any) => {
            showError(e, 'Create Failed');
        }
    });

    // Mutation: toggle upvote (optimistic)
    const upvoteMutation = useMutation<{ threadId: string; thread: Thread | null }, any, string, { prev: any | undefined }>({
        mutationFn: async (threadId: string) => {
            if (!profile) throw new Error('Not authenticated');
            const res = await fetch(`/api/discussions/${threadId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: profile._id })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || data.error || 'Failed to toggle upvote');
            return { threadId, thread: data.thread ? sanitize(data.thread) : null };
        },
        onMutate: async (threadId) => {
            if (!profile) return { prev: undefined };
            await queryClient.cancelQueries({ queryKey: ['threads'] });
            const prev = queryClient.getQueryData<any>(['threads', { page, pageSize, sort, category: categoryFilter }]);
            if (prev) {
                const nextThreads = prev.threads.map((t: Thread) => {
                    if (t._id !== threadId) return t;
                    const set = new Set(t.upvotes);
                    const pid = String(profile._id);
                    if (set.has(pid)) set.delete(pid); else set.add(pid);
                    return { ...t, upvotes: Array.from(set) };
                });
                queryClient.setQueryData(['threads', { page, pageSize, sort, category: categoryFilter }], { ...prev, threads: nextThreads });
            }
            return { prev };
        },
        onError: (e, _id, ctx) => {
            if (ctx?.prev) queryClient.setQueryData(['threads', { page, pageSize, sort, category: categoryFilter }], ctx.prev);
            showError(e, 'Upvote Failed');
        },
        onSuccess: (data) => {
            if (data.thread) {
                queryClient.setQueryData(['threads', { page, pageSize, sort, category: categoryFilter }], (old: any) => {
                    if (!old) return old;
                    return { ...old, threads: old.threads.map((t: Thread) => t._id === data.threadId ? data.thread : t) };
                });
            } else {
                queryClient.invalidateQueries({ queryKey: ['threads'] });
            }
        }
    });

    // Mutation: add comment
    const commentMutation = useMutation<{ threadId: string; thread: Thread | null }, any, { threadId: string; content: string }>({
        mutationFn: async ({ threadId, content }) => {
            if (!profile) throw new Error('Not authenticated');
            const res = await fetch(`/api/discussions/${threadId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: profile._id, content })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || data.error || 'Failed to add comment');
            return { threadId, thread: data.thread ? sanitize(data.thread) : null };
        },
        onSuccess: (data) => {
            modals.open({
                title: 'Success',
                children: (
                    <Group>
                        <ThemeIcon color="green" size="lg" radius="xl">
                            <IconCheck size={20} />
                        </ThemeIcon>
                        <Text size="sm">Your comment has been posted successfully!</Text>
                    </Group>
                ),
                centered: true,
            });
            
            if (data.thread) {
                queryClient.setQueryData(['threads', { page, pageSize, sort, category: categoryFilter }], (old: any) => {
                    if (!old) return old;
                    return { ...old, threads: old.threads.map((t: Thread) => t._id === data.threadId ? data.thread : t) };
                });
            } else {
                queryClient.invalidateQueries({ queryKey: ['threads'] });
            }
        },
        onError: (e: any) => {
            showError(e, 'Comment Failed');
        }
    });

    // Mutation: update thread
    const updateThreadMutation = useMutation({
        mutationFn: async () => {
            if (!profile || !editingThread) throw new Error('Not authenticated or no thread selected');
            const res = await fetch(`/api/discussions/${editingThread._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: profile._id,
                    title: editForm.title,
                    content: editForm.content,
                    category: editForm.category,
                    tags: editForm.tags.split(',').map(t => t.trim()).filter(t => t),
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || data.error || 'Failed to update discussion');
            return data;
        },
        onSuccess: () => {
            notifications.show({ color: 'green', title: 'Discussion Updated', message: 'Your discussion has been updated.' });
            closeEdit();
            setEditingThread(null);
            queryClient.invalidateQueries({ queryKey: ['threads'] });
        },
        onError: (e: any) => {
            showError(e, 'Update Failed');
        }
    });

    const toggleComments = (id: string) => {
        setOpenComments(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <>
            <Navbar />
            <Container size="xl" py="xl">
                <Group justify="space-between" mb="xl">
                    <div>
                        <Title>Discussions</Title>
                        {profile && (
                            <Text size="xs" c="dimmed" mt={4}>
                                Logged in as: <Text span fw={600}>{profile.name}</Text> ({profile.role === 'alumni' ? 'Alumni' : profile.role === 'admin' ? 'Admin' : 'Student'})
                            </Text>
                        )}
                    </div>
                    {user && isAlumni && (
                        <Button leftSection={<IconPlus size={14} />} onClick={open}>
                            New Discussion
                        </Button>
                    )}
                </Group>

                <Group align="flex-start" style={{ position: 'relative' }}>
                    {/* Desktop Sidebar */}
                    <div style={{ width: 250, flexShrink: 0 }} className="hidden-mobile">
                        <Text fw={700} mb="sm" size="sm" c="dimmed" tt="uppercase">Categories</Text>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {CATEGORIES.map(cat => (
                                <Button
                                    key={cat.value}
                                    variant={categoryFilter === cat.value ? 'light' : 'subtle'}
                                    color={categoryFilter === cat.value ? 'blue' : 'gray'}
                                    justify="flex-start"
                                    leftSection={<cat.icon size={16} />}
                                    onClick={() => { setPage(1); setCategoryFilter(cat.value); }}
                                >
                                    {cat.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Mobile Category Select */}
                    <div className="visible-mobile" style={{ width: '100%', marginBottom: '1rem', display: 'none' }}>
                         <Select
                            label="Category"
                            placeholder="Select Category"
                            data={CATEGORIES.map(c => ({ value: c.value, label: c.label }))}
                            value={categoryFilter}
                            onChange={(val) => { setPage(1); setCategoryFilter(val); }}
                            mb="md"
                        />
                    </div>

                    <div style={{ flex: 1, width: '100%' }}>
                        <Group mb="md" justify="space-between">
                            <Title order={3}>{CATEGORIES.find(c => c.value === categoryFilter)?.label || 'All Discussions'}</Title>
                            <Select
                                placeholder="Sort"
                                data={[{ value: 'newest', label: 'Newest' }, { value: 'upvotes', label: 'Top Upvotes' }]}
                                value={sort}
                                onChange={(val) => { setPage(1); setSort(val || 'newest'); }}
                                w={150}
                            />
                        </Group>

                        <style jsx global>{`
                            @media (max-width: 768px) {
                                .hidden-mobile {
                                    display: none !important;
                                }
                                .visible-mobile {
                                    display: block !important;
                                }
                            }
                        `}</style>

                        <div style={{ position: 'relative', minHeight: 200 }}>
                            {threadsQuery.isError && !threadsQuery.isLoading && (
                                <Alert title="Error" color="red" mb="md" variant="light">
                                    {(threadsQuery.error as any)?.message || 'Failed to load discussions'}
                                </Alert>
                            )}
                            <LoadingOverlay visible={threadsQuery.isLoading || threadsQuery.isFetching} />
                            <SimpleGrid cols={1} spacing="md">
                                {threadsQuery.data?.threads.map((thread) => (
                                    <Card key={thread._id} shadow="sm" padding="lg" radius="md" withBorder style={{ transition: 'transform 0.2s', cursor: 'pointer' }}>
                                        <Group justify="space-between" mb="xs">
                                            <Group gap="xs">
                                                <Avatar radius="xl" color="blue" size="md">{thread.authorId.name[0]}</Avatar>
                                                <div>
                                                    <Text size="sm" fw={600}>{thread.authorId.name}</Text>
                                                    <Text size="xs" c="dimmed">{new Date(thread.createdAt).toLocaleDateString()}</Text>
                                                </div>
                                            </Group>
                                            <Badge variant="light" color="blue">{thread.category}</Badge>
                                        </Group>

                                        <Text fw={700} size="lg" mt="sm" style={{ lineHeight: 1.3 }}>{thread.title}</Text>
                                        <Text size="sm" mt="xs" c="dimmed" lineClamp={3} style={{ whiteSpace: 'pre-wrap' }}>
                                            {thread.content}
                                        </Text>

                                        <Group mt="md" gap="xs">
                                            {thread.tags.map(tag => (
                                                <Badge key={tag} variant="outline" size="sm" color="gray">#{tag}</Badge>
                                            ))}
                                        </Group>

                                        <Divider my="md" />

                                        <Group justify="space-between">
                                            <Group gap="xs">
                                                <Button
                                                    variant={profile && thread.upvotes.includes(String(profile._id)) ? 'light' : 'subtle'}
                                                    color={profile && thread.upvotes.includes(String(profile._id)) ? 'blue' : 'gray'}
                                                    size="xs"
                                                    leftSection={<IconThumbUp size={16} />}
                                                    onClick={(e) => { e.stopPropagation(); upvoteMutation.mutate(thread._id); }}
                                                    disabled={!profile || upvoteMutation.isPending}
                                                >
                                                    {thread.upvotes.length}
                                                </Button>
                                                <Button
                                                    variant={openComments[thread._id] ? 'light' : 'subtle'}
                                                    color="gray"
                                                    size="xs"
                                                    leftSection={<IconMessage size={16} />}
                                                    onClick={(e) => { e.stopPropagation(); toggleComments(thread._id); }}
                                                >
                                                    {thread.comments?.length || 0}
                                                </Button>
                                                {profile && (String(profile._id) === String(thread.authorId._id) || profile.role === 'admin') && (
                                                    <Button
                                                        variant="subtle"
                                                        color="gray"
                                                        size="xs"
                                                        leftSection={<IconEdit size={16} />}
                                                        onClick={(e) => { e.stopPropagation(); handleEditClick(thread); }}
                                                    >
                                                        Edit
                                                    </Button>
                                                )}
                                            </Group>
                                        </Group>

                                        <Collapse in={!!openComments[thread._id]}>
                                            <Divider my="sm" />
                                            <Group mb="xs" gap={4}>
                                                <Text fw={600} size="sm">Comments</Text>
                                            </Group>
                                            {thread.comments && thread.comments.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                                                    {thread.comments.map((c) => (
                                                        <Group key={c._id || Math.random()} align="flex-start" wrap="nowrap">
                                                            <Avatar size={28} radius="xl" color="cyan">{c.authorId.name[0]}</Avatar>
                                                            <div style={{ flex: 1, backgroundColor: '#f8f9fa', padding: '8px 12px', borderRadius: '8px' }}>
                                                                <Group justify="space-between" mb={2}>
                                                                    <Text size="xs" fw={600}>{c.authorId.name}</Text>
                                                                    <Text size="xs" c="dimmed">{new Date(c.createdAt).toLocaleDateString()}</Text>
                                                                </Group>
                                                                <Text size="sm">{c.content}</Text>
                                                            </div>
                                                        </Group>
                                                    ))}
                                                </div>
                                            ) : (
                                                <Text size="xs" c="dimmed" mb="sm">No comments yet. Be the first to share your thoughts!</Text>
                                            )}
                                            {profile && (
                                                <Group align="flex-start" gap="xs">
                                                    <Avatar size={32} radius="xl" src={user?.photoURL} color="blue">{profile.name[0]}</Avatar>
                                                    <div style={{ flex: 1 }}>
                                                        <Textarea
                                                            placeholder="Write a comment..."
                                                            autosize
                                                            minRows={1}
                                                            radius="md"
                                                            value={commentDrafts[thread._id] || ''}
                                                            onChange={(e) => setCommentDrafts(prev => ({ ...prev, [thread._id]: e.target.value }))}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                                    e.preventDefault();
                                                                    const content = commentDrafts[thread._id] || '';
                                                                    if (!content.trim()) return;
                                                                    commentMutation.mutate({ threadId: thread._id, content });
                                                                    setCommentDrafts(prev => ({ ...prev, [thread._id]: '' }));
                                                                }
                                                            }}
                                                        />
                                                        <Group justify="flex-end" mt="xs">
                                                            <Button
                                                                size="xs"
                                                                loading={commentMutation.isPending}
                                                                onClick={() => {
                                                                    const content = commentDrafts[thread._id] || '';
                                                                    if (!content.trim()) return;
                                                                    commentMutation.mutate({ threadId: thread._id, content });
                                                                    setCommentDrafts(prev => ({ ...prev, [thread._id]: '' }));
                                                                }}
                                                            >
                                                                Post Comment
                                                            </Button>
                                                        </Group>
                                                    </div>
                                                </Group>
                                            )}
                                        </Collapse>
                                    </Card>
                                ))}
                            </SimpleGrid>
                            {!threadsQuery.isLoading && threadsQuery.data?.threads.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                    <ThemeIcon size={60} radius="xl" color="gray" variant="light" mb="md">
                                        <IconMessage size={30} />
                                    </ThemeIcon>
                                    <Text size="lg" fw={500} c="dimmed">No discussions found in this category.</Text>
                                    <Text size="sm" c="dimmed">Be the first to start a conversation!</Text>
                                </div>
                            )}
                            {threadsQuery.data && threadsQuery.data.total > threadsQuery.data.pageSize && (
                                <Group justify="center" mt="lg">
                                    <Pagination
                                        total={Math.ceil(threadsQuery.data.total / threadsQuery.data.pageSize)}
                                        value={page}
                                        onChange={(p) => setPage(p)}
                                    />
                                </Group>
                            )}
                        </div>
                    </div>
                </Group>
            </Container>

            <Modal opened={opened} onClose={close} title="Start Discussion" size="lg">
                <TextInput
                    label="Title"
                    placeholder="What's on your mind?"
                    required
                    mb="md"
                    value={newThread.title}
                    onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
                />
                <Select
                    label="Category"
                    data={CATEGORIES.map(c => ({ value: c.value, label: c.label }))}
                    required
                    mb="md"
                    value={newThread.category}
                    onChange={(val) => setNewThread({ ...newThread, category: val as any })}
                    description={
                        RESTRICTED_CATEGORIES.includes(newThread.category) 
                        ? "Note: Only Alumni (Passouts) can post in this category." 
                        : undefined
                    }
                    error={
                        RESTRICTED_CATEGORIES.includes(newThread.category) && !isAlumni
                        ? "You must be an Alumni (Passout) to post here."
                        : null
                    }
                />
                <Textarea
                    label="Content"
                    placeholder="Share your thoughts, questions, or guidance..."
                    required
                    mb="md"
                    minRows={6}
                    value={newThread.content}
                    onChange={(e) => setNewThread({ ...newThread, content: e.target.value })}
                />
                <TextInput
                    label="Tags"
                    placeholder="e.g. react, career, internship (comma separated)"
                    mb="xl"
                    value={newThread.tags}
                    onChange={(e) => setNewThread({ ...newThread, tags: e.target.value })}
                />
                <Group justify="flex-end">
                    <Button variant="default" onClick={close}>Cancel</Button>
                    <Button 
                        loading={createThreadMutation.isPending} 
                        onClick={() => createThreadMutation.mutate()}
                        disabled={RESTRICTED_CATEGORIES.includes(newThread.category) && !isAlumni}
                    >
                        Post Discussion
                    </Button>
                </Group>
            </Modal>

            <Modal opened={editOpened} onClose={closeEdit} title="Edit Discussion" size="lg">
                <TextInput
                    label="Title"
                    placeholder="What's on your mind?"
                    required
                    mb="md"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
                <Select
                    label="Category"
                    data={CATEGORIES.map(c => ({ value: c.value, label: c.label }))}
                    required
                    mb="md"
                    value={editForm.category}
                    onChange={(val) => setEditForm({ ...editForm, category: val as any })}
                />
                <Textarea
                    label="Content"
                    placeholder="Share your thoughts, questions, or guidance..."
                    required
                    mb="md"
                    minRows={6}
                    value={editForm.content}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                />
                <TextInput
                    label="Tags"
                    placeholder="e.g. react, career, internship (comma separated)"
                    mb="xl"
                    value={editForm.tags}
                    onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                />
                <Group justify="flex-end">
                    <Button variant="default" onClick={closeEdit}>Cancel</Button>
                    <Button 
                        loading={updateThreadMutation.isPending} 
                        onClick={() => updateThreadMutation.mutate()}
                    >
                        Update Discussion
                    </Button>
                </Group>
            </Modal>
        </>
    );
}
