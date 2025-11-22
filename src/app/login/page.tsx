'use client';

import { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button, Paper, Title, Container, Text, Notification, Modal, List, ThemeIcon, Group, Checkbox, Loader, Center } from '@mantine/core';
import { Navbar } from '@/components/Navbar';
import { IconBrandGoogle, IconX, IconCheck, IconInfoCircle } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useAuth } from '@/components/AuthProvider';

export default function LoginPage() {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [guidelinesOpened, { open: openGuidelines, close: closeGuidelines }] = useDisclosure(false);
    const [pendingUid, setPendingUid] = useState<string | null>(null);
    const [agreed, setAgreed] = useState(false);
    const router = useRouter();
    const { user, profile, refreshProfile, loading: authLoading } = useAuth();

    // Check if user is already logged in but needs to accept guidelines
    useEffect(() => {
        if (!authLoading && user && profile) {
            if (!profile.acceptedGuidelines) {
                setPendingUid(user.uid);
                openGuidelines();
            } else {
                router.replace('/');
            }
        }
    }, [user, profile, authLoading, router, openGuidelines]);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError('');
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);

            const email = result.user.email;
            if (!email || !email.endsWith('@vitstudent.ac.in')) {
                await auth.signOut();
                setError('Access restricted to @vitstudent.ac.in emails only.');
                setLoading(false);
                return;
            }

            // Sync user to MongoDB
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firebaseUid: result.user.uid,
                    email: result.user.email,
                    name: result.user.displayName,
                }),
            });
            
            const data = await res.json();
            
            // Refresh profile to ensure global state is up to date
            await refreshProfile();

            if (data.user && !data.user.acceptedGuidelines) {
                setPendingUid(result.user.uid);
                openGuidelines();
                setLoading(false);
            } else {
                router.push('/');
            }
        } catch (err: any) {
            setError('Failed to log in with Google.');
            console.error(err);
            setLoading(false);
        }
    };

    const handleAcceptGuidelines = async () => {
        if (!pendingUid) return;
        setLoading(true);
        try {
            await fetch(`/api/users/${pendingUid}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ acceptedGuidelines: true }),
            });
            await refreshProfile(); // Update global state
            closeGuidelines();
            router.push('/');
        } catch (err) {
            console.error('Failed to accept guidelines', err);
            setError('Failed to process acceptance. Please try again.');
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <>
                <Navbar />
                <Container size="xs" py="xl" mt="xl">
                    <Center h={200}>
                        <Loader size="lg" />
                    </Center>
                </Container>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <Container size="xs" py="xl" mt="xl">
                <Paper radius="md" p="xl" withBorder>
                    <Title order={2} ta="center" mt="md" mb={50}>
                        Welcome back to Campus Connect
                    </Title>

                    {error && (
                        <Notification icon={<IconX size={18} />} color="red" onClose={() => setError('')} mb="md">
                            {error}
                        </Notification>
                    )}

                    <Text c="dimmed" size="sm" ta="center" mb="md">
                        Please sign in with your VIT student email (@vitstudent.ac.in)
                    </Text>

                    <Button
                        fullWidth
                        variant="default"
                        leftSection={<IconBrandGoogle size={18} />}
                        onClick={handleGoogleSignIn}
                        loading={loading}
                    >
                        Sign in with Google
                    </Button>
                </Paper>
            </Container>

            <Modal 
                opened={guidelinesOpened} 
                onClose={() => {}} 
                withCloseButton={false}
                title={<Group><IconInfoCircle color="blue" /><Title order={4}>Community Guidelines</Title></Group>}
                centered
                size="lg"
                closeOnClickOutside={false}
                closeOnEscape={false}
            >
                <Text size="sm" mb="md">
                    Welcome to CollegeConnect! This platform is designed exclusively for students to collaborate, share skills, and grow together. To maintain a positive environment, please agree to the following:
                </Text>
                
                <List
                    spacing="xs"
                    size="sm"
                    center
                    icon={
                        <ThemeIcon color="blue" size={24} radius="xl">
                            <IconCheck size={16} />
                        </ThemeIcon>
                    }
                    mb="xl"
                >
                    <List.Item>I will maintain professional decorum in all discussions and chats.</List.Item>
                    <List.Item>I will not post spam, hate speech, or inappropriate content.</List.Item>
                    <List.Item>I understand this platform is for academic and skill-building purposes.</List.Item>
                    <List.Item>I will respect the privacy and work of other students.</List.Item>
                    <List.Item>I acknowledge that my actions reflect on my professional reputation.</List.Item>
                </List>

                <Checkbox
                    label="I have read and agree to the Community Guidelines"
                    checked={agreed}
                    onChange={(event) => setAgreed(event.currentTarget.checked)}
                    mb="lg"
                />

                <Group justify="flex-end">
                    <Button 
                        onClick={handleAcceptGuidelines} 
                        disabled={!agreed}
                        loading={loading}
                    >
                        Accept & Continue
                    </Button>
                </Group>
            </Modal>
        </>
    );
}
