'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Container, Title, Button, Group, Card, Badge, Text, SimpleGrid, TextInput, Modal, Textarea, LoadingOverlay, Image } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useAuth } from '@/components/AuthProvider';
import { IconBrandGithub, IconExternalLink, IconPlus, IconStar } from '@tabler/icons-react';
import { showError } from '@/lib/error-handling';

interface ProjectTeamMember {
    _id: string;
    firebaseUid?: string;
    name?: string;
    email?: string;
}

interface Project {
    _id: string;
    title: string;
    description: string;
    techStack: string[];
    demoLink?: string;
    repoLink?: string;
    images: string[];
    isFeatured: boolean;
    teamMembers?: ProjectTeamMember[];
}

export default function ProjectsPage() {
    const { user, profile } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    const [opened, { open, close }] = useDisclosure(false);

    // Form state
    const [newProject, setNewProject] = useState({
        title: '',
        description: '',
        techStack: '',
        demoLink: '',
        repoLink: '',
        imageUrl: '',
    });

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/projects');
            const data = await res.json();
            setProjects(data.projects);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const [submitting, setSubmitting] = useState(false);
    const [contactOpened, setContactOpened] = useState(false);
    const [contactMember, setContactMember] = useState<ProjectTeamMember | null>(null);

    const handleSubmit = async () => {
        if (!profile) {
            alert('Please complete your profile before submitting a project.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newProject,
                    techStack: newProject.techStack.split(',').map(t => t.trim()).filter(t => t),
                    images: newProject.imageUrl ? [newProject.imageUrl] : [],
                    teamMembers: [profile._id],
                }),
            });

            if (res.ok) {
                close();
                fetchProjects();
                setNewProject({ title: '', description: '', techStack: '', demoLink: '', repoLink: '', imageUrl: '' });
            } else {
                const data = await res.json();
                showError({ message: data.error || data.detail || 'Failed to submit project' }, 'Submission Failed');
            }
        } catch (error) {
            console.error(error);
            showError(error, 'Submission Failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Navbar />
            <Container size="lg" py="xl">
                <Group justify="space-between" mb="xl">
                    <Title>Campus Projects</Title>
                    {user && (
                        <Button leftSection={<IconPlus size={14} />} onClick={open}>
                            Submit Project
                        </Button>
                    )}
                </Group>

                <div style={{ position: 'relative', minHeight: 200 }}>
                    <LoadingOverlay visible={loading} />
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                        {projects.map((project) => (
                            <Card key={project._id} shadow="sm" padding="lg" radius="md" withBorder>
                                <Card.Section>
                                    <img
                                        src={
                                            project.images?.[0]
                                                ? project.images[0]
                                                : project.demoLink
                                                    ? `/api/screenshot?url=${encodeURIComponent(project.demoLink)}`
                                                    : 'https://placehold.co/600x400?text=No+Preview'
                                        }
                                        alt={project.title}
                                        style={{ height: 160, width: '100%', objectFit: 'cover', display: 'block', background: '#18181b' }}
                                        onError={(e) => {
                                            if (!e.currentTarget.dataset.fallback) {
                                                e.currentTarget.dataset.fallback = '1';
                                                e.currentTarget.src = 'https://placehold.co/600x400?text=Preview+Unavailable';
                                            }
                                        }}
                                    />
                                </Card.Section>

                                <Group justify="space-between" mt="md" mb="xs">
                                    <Text fw={500}>{project.title}</Text>
                                    {project.isFeatured && (
                                        <Badge color="yellow" leftSection={<IconStar size={12} />}>Featured</Badge>
                                    )}
                                </Group>

                                <Text size="sm" c="dimmed" lineClamp={3}>
                                    {project.description}
                                </Text>

                                <Group mt="md" gap="xs">
                                    {project.techStack.map(tech => (
                                        <Badge key={tech} variant="outline" size="sm" color="gray">{tech}</Badge>
                                    ))}
                                </Group>
                                {project.teamMembers && project.teamMembers.length > 0 && (
                                    <Group mt="xs" gap="xs" wrap="wrap">
                                        {project.teamMembers.map(m => (
                                            <Badge key={m._id} color="indigo" variant="light" size="sm">
                                                {m.name || 'Contributor'}
                                            </Badge>
                                        ))}
                                    </Group>
                                )}

                                <Group mt="md" grow>
                                    {project.repoLink && (
                                        <Button
                                            component="a"
                                            href={project.repoLink}
                                            target="_blank"
                                            variant="default"
                                            leftSection={<IconBrandGithub size={16} />}
                                        >
                                            Code
                                        </Button>
                                    )}
                                    {project.demoLink && (
                                        <Button
                                            component="a"
                                            href={project.demoLink}
                                            target="_blank"
                                            variant="light"
                                            leftSection={<IconExternalLink size={16} />}
                                        >
                                            Demo
                                        </Button>
                                    )}
                                </Group>
                                {project.teamMembers && project.teamMembers.length > 0 && (
                                    <Button
                                        variant="outline"
                                        mt="sm"
                                        onClick={() => {
                                            setContactMember(project.teamMembers![0]);
                                            setContactOpened(true);
                                        }}
                                    >
                                        {project.teamMembers[0].name ? `Contact ${project.teamMembers[0].name}` : 'Contact Author'}
                                    </Button>
                                )}
                            </Card>
                        ))}
                    </SimpleGrid>
                    {!loading && projects.length === 0 && (
                        <Text ta="center" c="dimmed" mt="xl">No projects found.</Text>
                    )}
                </div>
            </Container>

            <Modal opened={opened} onClose={close} title="Submit Project">
                <TextInput
                    label="Title"
                    required
                    mb="md"
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                />
                <TextInput
                    label="Tech Stack"
                    placeholder="React, Node.js, MongoDB"
                    required
                    mb="md"
                    value={newProject.techStack}
                    onChange={(e) => setNewProject({ ...newProject, techStack: e.target.value })}
                />
                <TextInput
                    label="Repository Link"
                    placeholder="https://github.com/..."
                    mb="md"
                    value={newProject.repoLink}
                    onChange={(e) => setNewProject({ ...newProject, repoLink: e.target.value })}
                />
                <TextInput
                    label="Demo Link"
                    placeholder="https://..."
                    mb="md"
                    value={newProject.demoLink}
                    onChange={(e) => setNewProject({ ...newProject, demoLink: e.target.value })}
                />
                <TextInput
                    label="Image URL"
                    placeholder="https://..."
                    mb="md"
                    value={newProject.imageUrl}
                    onChange={(e) => setNewProject({ ...newProject, imageUrl: e.target.value })}
                />
                <Textarea
                    label="Description"
                    required
                    mb="xl"
                    minRows={3}
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                />
                <Button fullWidth onClick={handleSubmit} loading={submitting}>Submit Project</Button>
            </Modal>
            <Modal opened={contactOpened} onClose={() => setContactOpened(false)} title={contactMember?.name ? `Contact ${contactMember.name}` : 'Contact Author'} centered>
                {contactMember?.email ? (
                    <SimpleGrid cols={1} spacing="sm">
                        <Button
                            component="a"
                            href={`https://mail.google.com/mail/?view=cm&fs=1&to=${contactMember.email}&su=${encodeURIComponent('Regarding your project')}`}
                            target="_blank"
                            variant="light"
                            color="red"
                        >Gmail</Button>
                        <Button
                            component="a"
                            href={`https://outlook.office.com/mail/deeplink/compose?to=${contactMember.email}&subject=${encodeURIComponent('Regarding your project')}`}
                            target="_blank"
                            variant="light"
                            color="blue"
                        >Outlook</Button>
                        <Button
                            component="a"
                            href={`https://compose.mail.yahoo.com/?to=${contactMember.email}&subject=${encodeURIComponent('Regarding your project')}`}
                            target="_blank"
                            variant="light"
                            color="violet"
                        >Yahoo Mail</Button>
                        <Button
                            component="a"
                            href={`mailto:${contactMember.email}?subject=${encodeURIComponent('Regarding your project')}`}
                            variant="default"
                        >Default Mail App</Button>
                    </SimpleGrid>
                ) : (
                    <Text size="sm" c="dimmed">Email not available for this author.</Text>
                )}
            </Modal>
        </>
    );
}
