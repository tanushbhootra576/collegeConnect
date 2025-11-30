"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Container, Title, TextInput, Select, SimpleGrid, Card, Text, Badge, Group, Button, LoadingOverlay, Pagination, Modal } from '@mantine/core';
import { IconSearch, IconMail, IconBrandGmail, IconBrandWindows, IconBrandYahoo, IconMessage } from '@tabler/icons-react';
import Link from 'next/link';
import { getAuthHeaders } from '@/lib/api';

interface ListedUser {
  firebaseUid: string;
  name: string;
  email: string;
  branch?: string;
  year?: number;
  skills: string[];
  interests: string[];
  role: string;
}

interface UsersResponse {
  users: ListedUser[];
  page: number;
  total: number;
  totalPages: number;
}

export const dynamic = 'force-dynamic';
export default function UsersDirectoryPage() {
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState<string | null>(null);
  const [skill, setSkill] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [contactUser, setContactUser] = useState<ListedUser | null>(null);
  const [contactOpened, setContactOpened] = useState(false);
  const router = useRouter();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', '18');
      if (search) params.append('search', search);
      if (branch) params.append('branch', branch);
      if (skill) params.append('skill', skill);
      const res = await fetch(`/api/users?${params.toString()}`, { headers: getAuthHeaders() });
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Initialize from window.location to avoid useSearchParams prerender constraints
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const initialSearch = sp.get('search');
      const initialBranch = sp.get('branch');
      const initialSkill = sp.get('skill');
      if (initialSearch) setSearch(initialSearch);
      if (initialBranch) setBranch(initialBranch);
      if (initialSkill) setSkill(initialSkill);
      const initialPage = sp.get('page');
      if (initialPage) setPage(parseInt(initialPage, 10) || 1);
    }
  }, []);

  // Sync URL with current filters (shallow push) when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (branch) params.set('branch', branch);
    if (skill) params.set('skill', skill);
    params.set('page', String(page));
    router.replace(`/users?${params.toString()}`);
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, branch, skill, page]);

  return (
    <>
      <Navbar />
      <Suspense fallback={<Container py="xl"><Title order={3}>Loading users...</Title></Container>}>
        <Container size="lg" py="xl">
          <Group justify="space-between" mb="md">
            <Title>User Directory</Title>
          </Group>
          <Group mb="lg" wrap="nowrap">
            <TextInput
              placeholder="Search name, email, skill..."
              leftSection={<IconSearch size={14} />}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ flex: 1 }}
            />
            <TextInput
              placeholder="Filter by skill"
              value={skill}
              onChange={(e) => { setSkill(e.target.value); setPage(1); }}
              style={{ width: 220 }}
            />
            <Select
              placeholder="Branch"
              data={["CSE","ECE","EEE","MECH","CIVIL","IT","AIML","BIO"]}
              clearable
              value={branch}
              onChange={(v) => { setBranch(v); setPage(1); }}
              style={{ width: 180 }}
            />
          </Group>

          <div style={{ position: 'relative', minHeight: 300 }}>
            <LoadingOverlay visible={loading} />
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 3 }} spacing="md">
              {data?.users.map(u => (
                <Card key={u.firebaseUid} withBorder shadow="sm" radius="md">
                  <Group justify="space-between" mb={4}>
                    <Text fw={600}>{u.name}</Text>
                    <Badge color="blue" variant="light">{u.role}</Badge>
                  </Group>
                  <Text size="sm" c="dimmed" mb={6}>{u.branch ? `${u.branch}${u.year ? ' • Year ' + u.year : ''}` : 'Branch not set'}</Text>
                  <Group gap={4} mb={8} wrap="wrap">
                    {u.skills.slice(0,5).map(s => <Badge key={s} size="sm" variant="outline">{s}</Badge>)}
                    {u.skills.length > 5 && <Badge size="sm" variant="light">+{u.skills.length - 5}</Badge>}
                  </Group>
                  <Group gap="xs" mt="xs">
                    <Button size="xs" variant="light" onClick={() => { setContactUser(u); setContactOpened(true); }}>Contact</Button>
                    <Button size="xs" component={Link} href={`/users/${u.firebaseUid}`} variant="default">View</Button>
                  </Group>
                </Card>
              ))}
            </SimpleGrid>
            {!loading && data?.users.length === 0 && (
              <Text ta="center" c="dimmed" mt="xl">No users found.</Text>
            )}
          </div>

          {data && data.totalPages > 1 && (
            <Group justify="center" mt="lg">
              <Pagination total={data.totalPages} value={page} onChange={setPage} />
            </Group>
          )}
        </Container>

        <Modal opened={contactOpened} onClose={() => setContactOpened(false)} title={contactUser ? `Contact ${contactUser.name}` : 'Contact'} centered>
          {contactUser && (
            <SimpleGrid cols={1} spacing="sm">
              <Button
                leftSection={<IconMessage size={18} />}
                color="grape"
                variant="filled"
                onClick={() => {
                  setContactOpened(false);
                  router.push(`/chat?dm=${contactUser.firebaseUid}`);
                }}
              >
                Direct Message
              </Button>
              <Button
                component="a"
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${contactUser.email}&su=Connecting via the platform`}
                target="_blank"
                leftSection={<IconBrandGmail size={18} />}
                color="red"
                variant="light"
              >Gmail</Button>
              <Button
                component="a"
                href={`https://outlook.office.com/mail/deeplink/compose?to=${contactUser.email}&subject=Connecting via the platform`}
                target="_blank"
                leftSection={<IconBrandWindows size={18} />}
                color="blue"
                variant="light"
              >Outlook</Button>
              <Button
                component="a"
                href={`https://compose.mail.yahoo.com/?to=${contactUser.email}&subject=Connecting via the platform`}
                target="_blank"
                leftSection={<IconBrandYahoo size={18} />}
                color="violet"
                variant="light"
              >Yahoo Mail</Button>
              <Button
                component="a"
                href={`mailto:${contactUser.email}?subject=Connecting via the platform`}
                leftSection={<IconMail size={18} />}
                variant="default"
              >Default Mail App</Button>
            </SimpleGrid>
          )}
        </Modal>
      </Suspense>
    </>
  );
}
