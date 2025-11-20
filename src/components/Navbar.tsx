'use client';

import { Group, Button, Text, Box, Burger, Drawer, ScrollArea, Divider, rem, Avatar, Menu, UnstyledButton, ActionIcon, useMantineColorScheme, useComputedColorScheme, Container, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Link from 'next/link';
import classes from './Navbar.module.css';
import { useAuth } from '@/components/AuthProvider';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { IconLogout, IconUser, IconChevronDown, IconSun, IconMoon, IconSchool, IconSearch } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import cx from 'clsx';

export function Navbar() {
    const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
    const { user, profile } = useAuth();
    const router = useRouter();
    const { setColorScheme } = useMantineColorScheme();
    const computedColorScheme = useComputedColorScheme('dark', { getInitialValueInEffect: true });
    // Search icon navigates to people directory; searching happens there.

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/');
    };

    return (
        <Box pb={120}>
            <header className={classes.header}>
                <Container size="xl" className={classes.inner}>
                    <Group justify="space-between" h="100%" wrap="nowrap">
                        <Group gap={5}>
                            <IconSchool size={28} color="var(--mantine-color-blue-6)" />
                            <Text size="xl" fw={900} component={Link} href="/" c="blue">
                                CollegeConnect
                            </Text>
                        </Group>

                        <Group h="100%" gap={0} visibleFrom="sm">
                            <Link href="/skills" className={classes.link}>
                                Skills
                            </Link>
                            <Link href="/resources" className={classes.link}>
                                Resources
                            </Link>
                            <Link href="/events" className={classes.link}>
                                Events
                            </Link>
                            <Link href="/projects" className={classes.link}>
                                Projects
                            </Link>
                            <Link href="/discussions" className={classes.link}>
                                Discussions
                            </Link>
                            <Link href="/quizzes" className={classes.link}>
                                Quizzes
                            </Link>
                        </Group>

                        <Group visibleFrom="sm" gap="md">
                            <ActionIcon
                                component={Link}
                                href="/users"
                                variant="default"
                                size="lg"
                                aria-label="Search people"
                                title="Search people"
                            >
                                <IconSearch size={16} />
                            </ActionIcon>
                            <ActionIcon
                                onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
                                variant="default"
                                size="lg"
                                aria-label="Toggle color scheme"
                            >
                                <IconSun className={cx(classes.icon, classes.light)} stroke={1.5} />
                                <IconMoon className={cx(classes.icon, classes.dark)} stroke={1.5} />
                            </ActionIcon>

                            {user ? (
                                <Menu shadow="md" width={200}>
                                    <Menu.Target>
                                        <UnstyledButton className={classes.user}>
                                            <Group gap={7}>
                                                <Avatar src={user.photoURL} alt={user.displayName || ''} radius="xl" size={30} color="blue">
                                                    {profile?.name?.[0] || user.email?.[0]}
                                                </Avatar>
                                                <Text fw={500} size="sm" lh={1} mr={3}>
                                                    {profile?.name || user.displayName || 'User'}
                                                </Text>
                                                <IconChevronDown style={{ width: rem(12), height: rem(12) }} stroke={1.5} />
                                            </Group>
                                        </UnstyledButton>
                                    </Menu.Target>

                                    <Menu.Dropdown>
                                        <Menu.Label>Account</Menu.Label>
                                        <Menu.Item leftSection={<IconUser style={{ width: rem(14), height: rem(14) }} />}>
                                            <Link href="/profile" >
                                                Profile
                                            </Link>
                                        </Menu.Item>
                                        <Menu.Divider />
                                        <Menu.Item
                                            color="red"
                                            leftSection={<IconLogout style={{ width: rem(14), height: rem(14) }} />}
                                            onClick={handleLogout}
                                        >
                                            Logout
                                        </Menu.Item>
                                    </Menu.Dropdown>
                                </Menu>
                            ) : (
                                <>
                                    <Button variant="default" component={Link} href="/login">Log in</Button>
                                    <Button component={Link} href="/signup">Sign up</Button>
                                </>
                            )}
                        </Group>

                        <Burger opened={drawerOpened} onClick={toggleDrawer} hiddenFrom="sm" />
                    </Group>
                </Container>
            </header>

            <Drawer
                opened={drawerOpened}
                onClose={closeDrawer}
                size="100%"
                padding="md"
                title="Navigation"
                hiddenFrom="sm"
                zIndex={1000000}
            >
                <ScrollArea h={`calc(100vh - ${rem(80)})`} mx="-md">
                    <Divider my="sm" />

                    <Link href="/" className={classes.link} onClick={closeDrawer}>
                        Home
                    </Link>
                    <Link href="/skills" className={classes.link} onClick={closeDrawer}>
                        Skills
                    </Link>
                    <Link href="/resources" className={classes.link} onClick={closeDrawer}>
                        Resources
                    </Link>
                    <Link href="/events" className={classes.link} onClick={closeDrawer}>
                        Events
                    </Link>
                    <Link href="/projects" className={classes.link} onClick={closeDrawer}>
                        Projects
                    </Link>
                    <Link href="/discussions" className={classes.link} onClick={closeDrawer}>
                        Discussions
                    </Link>
                    <Link href="/quizzes" className={classes.link} onClick={closeDrawer}>
                        Quizzes
                    </Link>

                    <Divider my="sm" />

                    <Group justify="center" pb="xl" px="md">
                        <ActionIcon
                            onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
                            variant="default"
                            size="lg"
                            aria-label="Toggle color scheme"
                        >
                            <IconSun className={cx(classes.icon, classes.light)} stroke={1.5} />
                            <IconMoon className={cx(classes.icon, classes.dark)} stroke={1.5} />
                        </ActionIcon>
                    </Group>

                    <Group justify="center" grow pb="xl" px="md">
                        {user ? (
                            <Button color="red" onClick={() => { handleLogout(); closeDrawer(); }}>Logout</Button>
                        ) : (
                            <>
                                <Button variant="default" component={Link} href="/login" onClick={closeDrawer}>Log in</Button>
                                <Button component={Link} href="/signup" onClick={closeDrawer}>Sign up</Button>
                            </>
                        )}
                    </Group>
                </ScrollArea>
            </Drawer>
        </Box>
    );
}
