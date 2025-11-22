'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Container, Title, Button, Group, Card, Badge, Text, SimpleGrid, TextInput, Select, Modal, Textarea, LoadingOverlay } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useAuth } from '@/components/AuthProvider';
import { IconSearch, IconPlus, IconBrandGmail, IconBrandWindows, IconBrandYahoo, IconMail, IconCheck, IconTrash } from '@tabler/icons-react';
import { showError } from '@/lib/error-handling';

interface Skill {
    _id: string;
    title: string;
    description: string;
    type: 'OFFER' | 'REQUEST';
    category: 'ACADEMIC' | 'NON_ACADEMIC';
    status: 'OPEN' | 'CLOSED';
    tags: string[];
    // userId may be populated object, raw id string, or null if user removed
    userId?: {
        _id: string;
        name?: string;
        email?: string;
        branch?: string;
        year?: number;
    } | string | null;
    createdAt: string;
}

export default function SkillsPage() {
    const { user, profile } = useAuth();
    const [skills, setSkills] = useState<Skill[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string | null>(null);

    const [opened, { open, close }] = useDisclosure(false);
    const [contactModalOpened, { open: openContactModal, close: closeContactModal }] = useDisclosure(false);
    const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

    // Form state
    const [newSkill, setNewSkill] = useState({
        title: '',
        description: '',
        type: 'OFFER',
        category: 'ACADEMIC',
        tags: '',
    });

    const fetchSkills = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (typeFilter) params.append('type', typeFilter);

            const res = await fetch(`/api/skills?${params.toString()}`);
            const data = await res.json();
            setSkills(data.skills);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSkills();
    }, [search, typeFilter]);

    const handleSubmit = async () => {
        if (!profile) {
            alert('Please complete your profile before posting a skill.');
            return;
        }

        try {
            const res = await fetch('/api/skills', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newSkill,
                    userId: profile._id,
                    tags: newSkill.tags.split(',').map(t => t.trim()).filter(t => t),
                }),
            });

            if (res.ok) {
                close();
                fetchSkills();
                setNewSkill({ title: '', description: '', type: 'OFFER', category: 'ACADEMIC', tags: '' });
            } else {
                const data = await res.json();
                showError({ message: data.error || 'Failed to create skill listing' }, 'Creation Failed');
            }
        } catch (error) {
            console.error(error);
            showError(error, 'Creation Failed');
        }
    };

    const handleMarkDone = async (skillId: string) => {
        if (!confirm('Mark this listing as completed? It will be hidden from the marketplace.')) return;
        try {
            const res = await fetch(`/api/skills/${skillId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'CLOSED' }),
            });
            if (res.ok) {
                fetchSkills(); // This will re-fetch, and since API filters OPEN by default, it will disappear
            } else {
                alert('Failed to update status');
            }
        } catch (error) {
            console.error(error);
            alert('Error updating status');
        }
    };

    const handleDelete = async (skillId: string) => {
        if (!confirm('Are you sure you want to delete this listing?')) return;
        try {
            const res = await fetch(`/api/skills/${skillId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                fetchSkills();
            } else {
                alert('Failed to delete listing');
            }
        } catch (error) {
            console.error(error);
            alert('Error deleting listing');
        }
    };

    return (
        <>
            <Navbar />
            <Container size="lg" py="xl">
                <Group justify="space-between" mb="xl">
                    <Title>Skills Marketplace</Title>
                    {user && (
                        <Button leftSection={<IconPlus size={14} />} onClick={open}>
                            Post Listing
                        </Button>
                    )}
                </Group>

                <Group mb="xl">
                    <TextInput
                        placeholder="Search skills..."
                        leftSection={<IconSearch size={14} />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <Select
                        placeholder="Filter by Type"
                        data={['OFFER', 'REQUEST']}
                        clearable
                        value={typeFilter}
                        onChange={setTypeFilter}
                    />
                </Group>

                <div style={{ position: 'relative', minHeight: 200 }}>
                    <LoadingOverlay visible={loading} />
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                        {skills.map((skill) => {
                            const skillUser = (skill.userId && typeof skill.userId === 'object') ? skill.userId : null;
                            const isOwner = profile && skillUser && String(skillUser._id) === String(profile._id);

                            return (
                            <Card key={skill._id} shadow="sm" padding="lg" radius="md" withBorder>
                                <Group justify="space-between" mb="xs">
                                    <Badge color={skill.type === 'OFFER' ? 'blue' : 'orange'}>{skill.type}</Badge>
                                    <Badge variant="light" color="gray">{skill.category}</Badge>
                                </Group>

                                <Text fw={500}>{skill.title}</Text>
                                <Text size="sm" c="dimmed" lineClamp={3} mt="xs">
                                    {skill.description}
                                </Text>

                                <Group mt="md" gap="xs">
                                    {skill.tags.map(tag => (
                                        <Badge key={tag} variant="outline" size="sm">{tag}</Badge>
                                    ))}
                                </Group>

                                <Text size="xs" c="dimmed" mt="md">
                                    {(() => {
                                        const name = skillUser?.name?.trim() || 'Unknown user';
                                        const branch = skillUser?.branch ? ` (${skillUser.branch})` : '';
                                        return `Posted by ${name}${branch}`;
                                    })()}
                                </Text>

                                {(() => {
                                    const user = (skill.userId && typeof skill.userId === 'object') ? skill.userId : null;
                                    if (!user?.email) {
                                        return (
                                            <Text size="xs" c="red" mt="sm">Contact unavailable</Text>
                                        );
                                    }
                                    // If owner, maybe show nothing or disabled button? 
                                    // User asked "dont remove the contact button", so we leave it as is (or disable it for owner).
                                    // We'll just show it.
                                    return (
                                        <Button
                                            onClick={() => {
                                                setSelectedSkill(skill);
                                                openContactModal();
                                            }}
                                            variant="light"
                                            color="blue"
                                            fullWidth
                                            mt="md"
                                            radius="md"
                                            disabled={skill.status === 'CLOSED'}
                                        >
                                            {skill.status === 'CLOSED' ? 'Closed' : 'Contact'}
                                        </Button>
                                    );
                                })()}
                            </Card>
                        )})}
                    </SimpleGrid>
                    {!loading && skills.length === 0 && (
                        <Text ta="center" c="dimmed" mt="xl">No skills found.</Text>
                    )}
                </div>
            </Container>

            <Modal opened={opened} onClose={close} title="Create New Listing">
                <TextInput
                    label="Title"
                    placeholder="e.g., Photography for Events"
                    required
                    mb="md"
                    value={newSkill.title}
                    onChange={(e) => setNewSkill({ ...newSkill, title: e.target.value })}
                />
                <Select
                    label="Type"
                    data={['OFFER', 'REQUEST']}
                    required
                    mb="md"
                    value={newSkill.type}
                    onChange={(val) => setNewSkill({ ...newSkill, type: val as any })}
                />
                <Select
                    label="Category"
                    data={['ACADEMIC', 'NON_ACADEMIC']}
                    required
                    mb="md"
                    value={newSkill.category}
                    onChange={(val) => setNewSkill({ ...newSkill, category: val as any })}
                />
                <Textarea
                    label="Description"
                    placeholder="Describe what you are offering or looking for..."
                    required
                    mb="md"
                    minRows={3}
                    value={newSkill.description}
                    onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                />
                <TextInput
                    label="Tags"
                    placeholder="comma, separated, tags"
                    mb="xl"
                    value={newSkill.tags}
                    onChange={(e) => setNewSkill({ ...newSkill, tags: e.target.value })}
                />
                <Button fullWidth onClick={handleSubmit}>Post Listing</Button>
            </Modal>
            <Modal opened={contactModalOpened} onClose={closeContactModal} title="Contact Options" centered>
                {selectedSkill && (
                    <SimpleGrid cols={1} spacing="md">
                        <Text size="sm" mb="xs">Choose how you want to contact <b>{typeof selectedSkill.userId === 'object' && selectedSkill.userId?.name ? selectedSkill.userId.name : 'the user'}</b>:</Text>

                        <Button
                            component="a"
                            href={`https://mail.google.com/mail/?view=cm&fs=1&to=${typeof selectedSkill.userId === 'object' && selectedSkill.userId?.email ? selectedSkill.userId.email : ''}&su=Regarding your skill listing: ${selectedSkill.title}`}
                            target="_blank"
                            leftSection={<IconBrandGmail size={20} />}
                            color="red"
                            variant="light"
                        >
                            Gmail
                        </Button>

                        <Button
                            component="a"
                            href={`https://outlook.office.com/mail/deeplink/compose?to=${typeof selectedSkill.userId === 'object' && selectedSkill.userId?.email ? selectedSkill.userId.email : ''}&subject=Regarding your skill listing: ${selectedSkill.title}`}
                            target="_blank"
                            leftSection={<IconBrandWindows size={20} />}
                            color="blue"
                            variant="light"
                        >
                            Outlook
                        </Button>

                        <Button
                            component="a"
                            href={`https://compose.mail.yahoo.com/?to=${typeof selectedSkill.userId === 'object' && selectedSkill.userId?.email ? selectedSkill.userId.email : ''}&subject=Regarding your skill listing: ${selectedSkill.title}`}
                            target="_blank"
                            leftSection={<IconBrandYahoo size={20} />}
                            color="violet"
                            variant="light"
                        >
                            Yahoo Mail
                        </Button>

                        <Button
                            component="a"
                            href={`mailto:${typeof selectedSkill.userId === 'object' && selectedSkill.userId?.email ? selectedSkill.userId.email : ''}?subject=Regarding your skill listing: ${selectedSkill.title}`}
                            leftSection={<IconMail size={20} />}
                            variant="default"
                        >
                            Default Mail App
                        </Button>
                    </SimpleGrid>
                )}
            </Modal>
        </>
    );
}
