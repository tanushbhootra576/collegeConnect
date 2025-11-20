'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Container, Title, Text, Badge, Group, Card, Loader } from '@mantine/core';

interface UserDetail {
  firebaseUid: string;
  name: string;
  email: string;
  branch?: string;
  year?: number;
  bio?: string;
  skills: string[];
  interests: string[];
  socialLinks?: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
  };
  role: string;
}

export default function UserProfileView() {
  const params = useParams();
  const uid = params?.uid as string | undefined;
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!uid) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/users/${uid}`);
        const json = await res.json();
        setUser(json.user);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [uid]);

  return (
    <>
      <Navbar />
      <Container size="md" py="xl">
        {loading && <Loader />}
        {!loading && !user && <Text c="red">User not found.</Text>}
        {!loading && user && (
          <Card withBorder padding="lg" radius="md" shadow="sm">
            <Group justify="space-between" mb="sm">
              <Title order={2}>{user.name}</Title>
              <Badge color="blue" variant="light">{user.role}</Badge>
            </Group>
            <Text size="sm" c="dimmed" mb="md">{user.email}</Text>
            <Text mb="sm">{user.branch ? `${user.branch}${user.year ? ' • Year ' + user.year : ''}` : 'Branch not set'}</Text>
            {user.bio && <Text mb="md">{user.bio}</Text>}
            <Group gap={6} mb="md" wrap="wrap">
              {user.skills.map(s => <Badge key={s} variant="outline">{s}</Badge>)}
            </Group>
            <Group gap={6} mb="md" wrap="wrap">
              {user.interests.map(i => <Badge key={i} color="teal" variant="light">{i}</Badge>)}
            </Group>
            {user.socialLinks && (
              <Group gap="xs" mt="sm">
                {user.socialLinks.github && <Badge component="a" href={user.socialLinks.github} target="_blank" color="dark" variant="light">GitHub</Badge>}
                {user.socialLinks.linkedin && <Badge component="a" href={user.socialLinks.linkedin} target="_blank" color="blue" variant="light">LinkedIn</Badge>}
                {user.socialLinks.portfolio && <Badge component="a" href={user.socialLinks.portfolio} target="_blank" color="grape" variant="light">Portfolio</Badge>}
              </Group>
            )}
          </Card>
        )}
      </Container>
    </>
  );
}
