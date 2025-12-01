'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Container, Title, Table, Button, Group, Badge, Text, Card, Stack, Loader, ActionIcon, Tooltip } from '@mantine/core';
import { IconCheck, IconX, IconExternalLink } from '@tabler/icons-react';
import { showSuccess, showError } from '@/lib/error-handling';
import { getAuthHeaders } from '@/lib/api';

interface PendingItem {
    resourceId: string;
    courseCode: string;
    category: 'COURSE' | 'SYLLABUS' | 'NOTES' | 'PYQ' | 'OTHER';
    itemId?: string;
    title: string;
    linkUrl: string;
    uploaderName: string;
    date: string;
}

export default function AdminResourcesPage() {
    const [items, setItems] = useState<PendingItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPending = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/resources', { headers: getAuthHeaders() });
            const data = await res.json();
            
            if (res.ok) {
                const flattened: PendingItem[] = [];
                data.resources.forEach((r: any) => {
                    const uploader = r.uploaderId?.name || 'Unknown';
                    
                    // Check Course
                    if (r.isApproved === false) {
                        flattened.push({
                            resourceId: r._id,
                            courseCode: r.courseCode,
                            category: 'COURSE',
                            title: `New Course: ${r.courseName}`,
                            linkUrl: '',
                            uploaderName: uploader,
                            date: r.createdAt
                        });
                    }

                    // Check Syllabus
                    if (r.syllabus && r.syllabus.isApproved === false) {
                        flattened.push({
                            resourceId: r._id,
                            courseCode: r.courseCode,
                            category: 'SYLLABUS',
                            title: 'Syllabus',
                            linkUrl: r.syllabus.linkUrl,
                            uploaderName: uploader,
                            date: r.createdAt // Syllabus doesn't have own date usually
                        });
                    }

                    // Check Modules
                    r.modules?.forEach((m: any) => {
                        if (m.isApproved === false) {
                            flattened.push({
                                resourceId: r._id,
                                courseCode: r.courseCode,
                                category: 'NOTES',
                                itemId: m._id,
                                title: m.title,
                                linkUrl: m.linkUrl,
                                uploaderName: uploader,
                                date: r.createdAt
                            });
                        }
                    });

                    // Check PYQs
                    r.pyqs?.forEach((p: any) => {
                        if (p.isApproved === false) {
                            flattened.push({
                                resourceId: r._id,
                                courseCode: r.courseCode,
                                category: 'PYQ',
                                itemId: p._id,
                                title: `${p.exam} ${p.year}`,
                                linkUrl: p.linkUrl,
                                uploaderName: uploader,
                                date: r.createdAt
                            });
                        }
                    });

                    // Check Others
                    r.others?.forEach((o: any) => {
                        if (o.isApproved === false) {
                            flattened.push({
                                resourceId: r._id,
                                courseCode: r.courseCode,
                                category: 'OTHER',
                                itemId: o._id,
                                title: o.title,
                                linkUrl: o.linkUrl,
                                uploaderName: uploader,
                                date: r.createdAt
                            });
                        }
                    });
                });
                setItems(flattened);
            }
        } catch (error) {
            console.error(error);
            showError(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleAction = async (item: PendingItem, action: 'APPROVE' | 'REJECT') => {
        try {
            const res = await fetch('/api/admin/resources/action', {
                method: 'POST',
                headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resourceId: item.resourceId,
                    category: item.category,
                    itemId: item.itemId,
                    action
                })
            });
            
            if (res.ok) {
                showSuccess(`Item ${action.toLowerCase()}d successfully`);
                setItems(prev => prev.filter(i => i !== item));
            } else {
                const data = await res.json();
                showError({ message: data.error || 'Action failed' });
            }
        } catch (error) {
            showError(error);
        }
    };

    return (
        <>
            <Navbar />
            <Container size="lg" py="xl">
                <Title order={2} mb="xl">Pending Resource Approvals</Title>
                
                {loading ? (
                    <Loader />
                ) : items.length === 0 ? (
                    <Text c="dimmed">No pending resources found.</Text>
                ) : (
                    <Stack>
                        {items.map((item, index) => (
                            <Card key={index} withBorder shadow="sm" radius="md">
                                <Group justify="space-between">
                                    <Stack gap="xs">
                                        <Group>
                                            <Badge color="blue">{item.courseCode}</Badge>
                                            <Badge variant="outline">{item.category}</Badge>
                                            <Text size="sm" c="dimmed">by {item.uploaderName}</Text>
                                        </Group>
                                        <Text fw={500}>{item.title}</Text>
                                        {item.linkUrl && (
                                            <Group gap="xs">
                                                <IconExternalLink size={14} />
                                                <Text component="a" href={item.linkUrl} target="_blank" size="sm" c="blue" td="underline">
                                                    View Resource
                                                </Text>
                                            </Group>
                                        )}
                                    </Stack>
                                    <Group>
                                        <Tooltip label="Reject">
                                            <ActionIcon color="red" variant="light" size="lg" onClick={() => handleAction(item, 'REJECT')}>
                                                <IconX size={20} />
                                            </ActionIcon>
                                        </Tooltip>
                                        <Tooltip label="Approve">
                                            <ActionIcon color="green" variant="filled" size="lg" onClick={() => handleAction(item, 'APPROVE')}>
                                                <IconCheck size={20} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Group>
                                </Group>
                            </Card>
                        ))}
                    </Stack>
                )}
            </Container>
        </>
    );
}
