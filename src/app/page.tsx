'use client';

import Link from 'next/link';
import React from 'react';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/components/AuthProvider';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  SimpleGrid,
  Card,
  ThemeIcon,
  rem,
  Stack,
  Badge,
  Grid,
  Center,
  List,
  Avatar,
  ActionIcon,
} from '@mantine/core';
import {
  IconSchool,
  IconBooks,
  IconUsers,
  IconTrophy,
  IconArrowRight,
  IconRocket,
  IconMessage,
  IconBolt,
  IconNotes,
  IconCheck,
  IconBrandGithub,
  IconBrandLinkedin,
  IconBrandTwitter,
  IconHeart,
} from '@tabler/icons-react';
import classes from './page.module.css';
import { getAuthHeaders } from '@/lib/api';

interface StatsData {
  users: number;
  resources: number;
  projects: number;
  discussions: number;
}

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = React.useState<StatsData | null>(null);
  const [statsError, setStatsError] = React.useState<string | null>(null);
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/stats', { headers: getAuthHeaders() });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || err.error || 'Failed stats');
        }
        const data = await res.json();
        if (mounted) setStats(data);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        if (mounted) setStatsError(msg);
      }
    })();
    return () => { mounted = false; };
  }, []);
  return (
    <>
      <Navbar />
      <section className={classes.hero}>
        <div className={classes.spotlight} />
        <div className={classes.glow} />
        <Container size="lg">
          <Center>
            <Stack align="center" gap="md" ta="center">
              <Badge variant="gradient" gradient={{ from: 'blue', to: 'cyan' }} size="lg" radius="xl" tt="uppercase">
                The Ultimate Campus Platform
              </Badge>
              <Title order={1} className={classes.headline}>
                Empowering the Next Generation of
                <Text span variant="gradient" gradient={{ from: 'violet', to: 'blue' }} inherit> Innovators</Text>
              </Title>

              <Text className={classes.subheadline}>
                CollegeConnect is your digital campus. Connect with peers, share resources, build projects, and accelerate your career, all in one place.
              </Text>

              <Group>
                {!user ? (
                  <Button
                    component={Link}
                    href="/signup"
                    size="xl"
                    radius="xl"
                    variant="gradient"
                    gradient={{ from: 'violet', to: 'blue' }}
                    rightSection={<IconArrowRight size={20} />}
                  >
                    Join the Community
                  </Button>
                ) : (
                  <Button
                    component={Link}
                    href="/profile"
                    size="xl"
                    radius="xl"
                    variant="gradient"
                    gradient={{ from: 'violet', to: 'blue' }}
                    rightSection={<IconArrowRight size={20} />}
                  >
         Complete Your Profile
                  </Button>
                )}
                <Button component={Link} href="/skills" size="xl" radius="xl" variant="default" leftSection={<IconRocket size={20} />}>
                 Find Skills
                </Button>
              </Group>

              <Group gap="xl" className={classes.stats}>
                <Stat value={formatStat(stats?.users, '1.2k+')} label="Active Students" />
                <Stat value={formatStat(stats?.resources, '350+')} label="Shared Resources" />
                <Stat value={formatStat(stats?.projects, '90+')} label="Projects Built" />
                <Stat value={formatStat(stats?.discussions, '500+')} label="Discussions" />
              </Group>
              {statsError && (
                <Text size="xs" c="red" mt={-8}>Stats unavailable: {statsError}</Text>
              )}
            </Stack>
          </Center>
        </Container>
      </section>

      {/* About Section */}
      <section className={classes.section}>
        <Container size="lg">
          <Grid gutter={50} align="center">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Title order={2} mb="md">Built by Students, For Students</Title>
              <Text size="lg" c="dimmed" mb="xl">
                We understand the college hustle. Finding notes, looking for hackathon teammates, or just needing advice on which elective to pick, it can be chaotic.
              </Text>
              <Text size="lg" c="dimmed" mb="xl">
                CollegeConnect brings order to the chaos. We provide a structured platform where you can:
              </Text>
              <List
                spacing="sm"
                size="md"
                icon={
                  <ThemeIcon color="blue" size={24} radius="xl">
                    <IconCheck size={16} />
                  </ThemeIcon>
                }
              >
                <List.Item>Collaborate on real-world projects</List.Item>
                <List.Item>Access a curated library of study materials</List.Item>
                <List.Item>Get mentorship from seniors and alumni</List.Item>
                <List.Item>Showcase your skills and build a portfolio</List.Item>
              </List>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <SimpleGrid cols={2} spacing="md">
                 <Card withBorder radius="md" padding="xl" bg="var(--mantine-color-body)">
                    <ThemeIcon size="xl" radius="md" variant="light" color="violet" mb="md">
                      <IconUsers />
                    </ThemeIcon>
                    <Text fw={700} size="lg">Community First</Text>
                    <Text size="sm" c="dimmed" mt="sm">A safe, inclusive space for everyone to learn and grow.</Text>
                 </Card>
                 <Card withBorder radius="md" padding="xl" bg="var(--mantine-color-body)">
                    <ThemeIcon size="xl" radius="md" variant="light" color="orange" mb="md">
                      <IconTrophy />
                    </ThemeIcon>
                    <Text fw={700} size="lg">Merit Based</Text>
                    <Text size="sm" c="dimmed" mt="sm">Earn recognition for your contributions and skills.</Text>
                 </Card>
                 <Card withBorder radius="md" padding="xl" bg="var(--mantine-color-body)">
                    <ThemeIcon size="xl" radius="md" variant="light" color="teal" mb="md">
                      <IconSchool />
                    </ThemeIcon>
                    <Text fw={700} size="lg">Academic Focus</Text>
                    <Text size="sm" c="dimmed" mt="sm">Tools designed to boost your GPA and learning.</Text>
                 </Card>
                 <Card withBorder radius="md" padding="xl" bg="var(--mantine-color-body)">
                    <ThemeIcon size="xl" radius="md" variant="light" color="pink" mb="md">
                      <IconHeart />
                    </ThemeIcon>
                    <Text fw={700} size="lg">Open Source</Text>
                    <Text size="sm" c="dimmed" mt="sm">Transparent and constantly evolving with your feedback.</Text>
                 </Card>
              </SimpleGrid>
            </Grid.Col>
          </Grid>
        </Container>
      </section>

      {/* Features */}
      <section className={classes.sectionAlt}>
        <Container size="lg" >
          <SectionHeader title="Everything You Need to Succeed" subtitle="Platform Features" />
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={30} mt={50}>
            <Feature
              icon={<IconSchool style={{ width: rem(28), height: rem(28) }} stroke={2} />}
              title="Skill Marketplace"
              description="Don't just learn alone. Find peers to trade skills with—teach React, learn Python."
              color="blue"
              href="/skills"
            />
            <Feature
              icon={<IconBooks style={{ width: rem(28), height: rem(28) }} stroke={2} />}
              title="Resource Library"
              description="Access a goldmine of notes, previous year papers, and project references."
              color="teal"
              href="/resources"
            />
            <Feature
              icon={<IconUsers style={{ width: rem(28), height: rem(28) }} stroke={2} />}
              title="Discussion Forums"
              description="Stuck on a bug? Need career advice? The community has your back."
              color="grape"
              href="/discussions"
            />
            <Feature
              icon={<IconTrophy style={{ width: rem(28), height: rem(28) }} stroke={2} />}
              title="Events & Hackathons"
              description="Stay updated on the latest campus events, workshops, and competitions."
              color="orange"
              href="/events"
            />
            <Feature
              icon={<IconNotes style={{ width: rem(28), height: rem(28) }} stroke={2} />}
              title="Interactive Quizzes"
              description="Test your knowledge in various domains and climb the leaderboard."
              color="cyan"
              href="/quizzes"
            />
            <Feature
              icon={<IconBolt style={{ width: rem(28), height: rem(28) }} stroke={2} />}
              title="Project Showcase"
              description="Find the perfect teammates and showcase your projects to the world."
              color="yellow"
              href="/projects"
            />
          </SimpleGrid>
        </Container>
      </section>

  
      <section className={classes.ctaWrap}>
        <Container size="lg">
          <Card className={classes.cta} radius="xl" p={50} withBorder>
            <Stack align="center" ta="center" gap="lg">
              <Title order={2}>Ready to Transform Your College Experience?</Title>
              <Text size="lg" c="dimmed" maw={600}>
                Join thousands of students who are already building, learning, and growing together on CollegeConnect.
              </Text>
              <Group>
                {!user ? (
                  <>
                    <Button component={Link} href="/signup" radius="xl" size="lg" variant="gradient" gradient={{ from: 'violet', to: 'blue' }}>
                      Get Started for Free
                    </Button>
                    <Button component={Link} href="/login" radius="xl" size="lg" variant="default">
                      Login
                    </Button>
                  </>
                ) : (
                  <Button component={Link} href="/profile" radius="xl" size="lg" variant="gradient" gradient={{ from: 'violet', to: 'blue' }}>
                    Go to Your Profile
                  </Button>
                )}
              </Group>
            </Stack>
          </Card>
        </Container>
      </section>

      {/* Footer */}
      <footer className={classes.footer}>
        <Container size="lg">
          <Group justify="space-between" align="start">
            <Stack gap="xs" maw={300}>
              <Group gap={8}>
                <IconSchool size={28} color="var(--mantine-color-blue-6)" />
                <Text size="xl" fw={900} c="blue">CollegeConnect</Text>
              </Group>
              <Text size="sm" c="dimmed">
                The all-in-one platform for students to collaborate, share resources, and grow their careers.
              </Text>
              <Group gap="xs" mt="md">
                <ActionIcon size="lg" variant="subtle" color="gray"><IconBrandGithub size={18} /></ActionIcon>
                {/* <ActionIcon size="lg" variant="subtle" color="gray"><IconBrandTwitter size={18} /></ActionIcon> */}
                <ActionIcon size="lg" variant="subtle" color="gray"><IconBrandLinkedin size={18} /></ActionIcon>
              </Group>
            </Stack>

            <Group gap={50} align="start">
              <Stack gap="sm">
                <Text fw={700}>Platform</Text>
                <Text component={Link} href="/skills" size="sm" c="dimmed">Skills</Text>
                <Text component={Link} href="/resources" size="sm" c="dimmed">Resources</Text>
                <Text component={Link} href="/projects" size="sm" c="dimmed">Projects</Text>
                <Text component={Link} href="/discussions" size="sm" c="dimmed">Discussions</Text>
              </Stack>
              <Stack gap="sm">
                <Text fw={700}>Community</Text>
                <Text component={Link} href="/events" size="sm" c="dimmed">Events</Text>
                <Text component={Link} href="/quizzes" size="sm" c="dimmed">Quizzes</Text>
                <Text component={Link} href="/chat" size="sm" c="dimmed">Chat</Text>
              </Stack>
              <Stack gap="sm">
                <Text fw={700}>Legal</Text>
                <Text size="sm" c="dimmed">Privacy Policy</Text>
                <Text size="sm" c="dimmed">Terms of Service</Text>
                <Text size="sm" c="dimmed">Guidelines</Text>
              </Stack>
            </Group>
          </Group>
          <Text size="xs" c="dimmed" mt={40} ta="center">
            © {new Date().getFullYear()} CollegeConnect. All rights reserved.
          </Text>
        </Container>
      </footer>
    </>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Stack gap={4} align="center" ta="center">
      {subtitle && (
        <Badge variant="light" color="blue" size="lg" mb="sm">{subtitle}</Badge>
      )}
      <Title order={2} style={{ fontSize: '2.5rem' }}>{title}</Title>
    </Stack>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Stack gap={0} align="center">
      <Text fw={900} size="xl" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }} style={{ fontSize: '2rem' }}>{value}</Text>
      <Text c="dimmed" size="sm" fw={500}>{label}</Text>
    </Stack>
  );
}

function formatStat(actual: number | undefined, fallback: string): string {
  if (typeof actual === 'number') {
    if (actual >= 1000) {
      const rounded = (actual / 1000).toFixed(actual % 1000 === 0 ? 0 : 1);
      return `${rounded}k+`;
    }
    return `${actual}+`;
  }
  return fallback;
}

function Feature({ icon, title, description, color, href }: { icon: React.ReactNode; title: string; description: string; color: string; href: string }) {
  return (
    <Card className={classes.featureCard} padding="xl" radius="lg">
      <ThemeIcon size={50} radius="md" variant="light" color={color} mb="md">
        {icon}
      </ThemeIcon>
      <Text size="xl" fw={700} mb="xs">{title}</Text>
      <Text size="sm" c="dimmed" mb="lg" style={{ lineHeight: 1.6 }}>{description}</Text>
      <Button component={Link} href={href} variant="light" color={color} fullWidth mt="auto" rightSection={<IconArrowRight size={16} />}>
        Explore
      </Button>
    </Card>
  );
}
