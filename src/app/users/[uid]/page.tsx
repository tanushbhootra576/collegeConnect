'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Container, Title, Text, Badge, Group, Card, Loader, Button, Stack, Divider, SimpleGrid } from '@mantine/core';
import { IconMessage, IconMail, IconExternalLink } from '@tabler/icons-react';
import { getAuthHeaders } from '@/lib/api';

interface UserDetail {
  _id: string;
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
  const router = useRouter();
  const uid = params?.uid as string | undefined;
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!uid) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/users/${uid}`, { headers: getAuthHeaders() });
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
          <Card
            shadow="lg"
            radius="lg"
            padding="xl"
            withBorder
          >
            <Stack gap="lg">
              <Group justify="space-between" align="flex-start" gap="sm" wrap="wrap">
                <div>
                  <Title order={1}>{user.name}</Title>
                  <Text size="sm" c="dimmed">{user.email}</Text>
                  <Text mt={4} fw={500} c="dimmed">
                    {user.branch ? `${user.branch}${user.year ? ' • Year ' + user.year : ''}` : 'Branch not set'}
                  </Text>
                </div>
                <Group gap="xs">
                  <Button
                    leftSection={<IconMessage size={18} />}
                    onClick={() => router.push(`/chat?dm=${user._id}`)}
                    color="grape"
                    variant="filled"
                  >
                    Message
                  </Button>
                  <Button
                    leftSection={<IconMail size={18} />}
                    component="a"
                    href={`mailto:${user.email}`}
                    variant="subtle"
                    color="gray"
                  >
                    Email
                  </Button>
                  <Badge color="blue" variant="light" radius="sm" size="lg">
                    {user.role}
                  </Badge>
                </Group>
              </Group>

              {user.bio && (
                <Text size="md">
                  {user.bio}
                </Text>
              )}

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                <div>
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase" mb={6}>Skills</Text>
                  <Group gap={8} wrap="wrap">
                    {user.skills?.length ? (
                      user.skills.map((skill) => (
                        <Badge
                          key={skill}
                          color="violet"
                          variant="light"
                          radius="xl"
                          size="sm"
                        >
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <Text size="sm" c="dimmed">No skills added.</Text>
                    )}
                  </Group>
                </div>
                <div>
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase" mb={6}>Interests</Text>
                  <Group gap={8} wrap="wrap">
                    {user.interests?.length ? (
                      user.interests.map((interest) => (
                        <Badge
                          key={interest}
                          color="teal"
                          variant="light"
                          radius="xl"
                          size="sm"
                        >
                          {interest}
                        </Badge>
                      ))
                    ) : (
                      <Text size="sm" c="dimmed">No interests added.</Text>
                    )}
                  </Group>
                </div>
              </SimpleGrid>

              {user.socialLinks && (
                <>
                  <Divider />
                  <Group gap="sm" wrap="wrap">
                    {user.socialLinks.github && (
                      <Button
                        component="a"
                        href={user.socialLinks.github}
                        target="_blank"
                        variant="light"
                        color="dark"
                        leftSection={<IconExternalLink size={16} />}
                      >
                        GitHub
                      </Button>
                    )}
                    {user.socialLinks.linkedin && (
                      <Button
                        component="a"
                        href={user.socialLinks.linkedin}
                        target="_blank"
                        variant="light"
                        color="blue"
                        leftSection={<IconExternalLink size={16} />}
                      >
                        LinkedIn
                      </Button>
                    )}
                    {user.socialLinks.portfolio && (
                      <Button
                        component="a"
                        href={user.socialLinks.portfolio}
                        target="_blank"
                        variant="light"
                        color="grape"
                        leftSection={<IconExternalLink size={16} />}
                      >
                        Portfolio
                      </Button>
                    )}
                  </Group>
                </>
              )}
            </Stack>
          </Card>
        )}
      </Container>
    </>
  );
}
