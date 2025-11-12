// src/components/ToolsPanel/ToolsPanel.tsx
import React, { useState } from 'react';
import { Card, Tabs, Stack } from '@mantine/core';
import { IconEye, IconCursorText, IconSearch } from '@tabler/icons-react';
import { VisibilityPanel } from './VisibilityPanel';
import { SelectionPanel } from './SelectionPanel';
import { SearchPanel } from './SearchPanel';

const ToolsPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<string | null>('visibility');

    return (
        <Card
            shadow="md"
            radius="md"
            style={{
                position: 'absolute',
                top: 10,
                left: 10,
                zIndex: 100,
                width: 320,
                minHeight: 400
            }}
        >
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List grow>
                    <Tabs.Tab value="visibility" icon={<IconEye size={16} />}>
                        Visibility
                    </Tabs.Tab>
                    <Tabs.Tab value="selection" icon={<IconCursorText size={16} />}>
                        Selection
                    </Tabs.Tab>
                    <Tabs.Tab value="search" icon={<IconSearch size={16} />}>
                        Search
                    </Tabs.Tab>
                </Tabs.List>

                <Stack spacing="md" mt="md">
                    <Tabs.Panel value="visibility">
                        <VisibilityPanel />
                    </Tabs.Panel>

                    <Tabs.Panel value="selection">
                        <SelectionPanel />
                    </Tabs.Panel>

                    <Tabs.Panel value="search">
                        <SearchPanel />
                    </Tabs.Panel>
                </Stack>
            </Tabs>
        </Card>
    );
};

export default ToolsPanel;