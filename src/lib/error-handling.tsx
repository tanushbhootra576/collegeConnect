import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { Text, Button, Group, ThemeIcon } from '@mantine/core';
import { IconAlertTriangle, IconX } from '@tabler/icons-react';
import React from 'react';

export function showError(error: any, title: string = 'Error') {
    const message = error?.message || 'An unexpected error occurred';
    
    // Check if it's a moderation error
    if (message.toLowerCase().includes('inappropriate') || message.toLowerCase().includes('profanity') || message.toLowerCase().includes('abusive')) {
        modals.open({
            title: <Text c="red" fw={700}>Content Flagged</Text>,
            children: (
                <>
                    <Group align="flex-start" mb="md" wrap="nowrap">
                        <ThemeIcon color="red" size="xl" radius="xl" variant="light" style={{ flexShrink: 0 }}>
                            <IconAlertTriangle size={24} />
                        </ThemeIcon>
                        <div style={{ flex: 1 }}>
                            <Text size="sm" fw={600} mb={4}>
                                Whoops! We couldn't post that.
                            </Text>
                            <Text size="sm" c="dimmed" mb="xs">
                                {message}
                            </Text>
                            <Text size="xs" c="dimmed" style={{ lineHeight: 1.4 }}>
                                We want to keep this community safe and professional. Please revise your content to remove any inappropriate language and try again.
                            </Text>
                        </div>
                    </Group>
                    <Group justify="flex-end">
                        <Button color="red" variant="subtle" onClick={() => modals.closeAll()}>
                            Understood
                        </Button>
                    </Group>
                </>
            ),
            centered: true,
            withCloseButton: false,
        });
        return;
    }

    // Default error notification
    notifications.show({
        color: 'red',
        title: title,
        message: message,
        icon: <IconX size={16} />,
        autoClose: 5000,
    });
}
