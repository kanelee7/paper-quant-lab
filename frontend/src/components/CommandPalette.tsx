import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  Box,
  Input,
  VStack,
  HStack,
  Text,
  Kbd,
  Icon,
  Badge,
  useDisclosure,
} from '@chakra-ui/react';
import { 
  SearchIcon, 
  SettingsIcon, 
  TimeIcon, 
  RepeatIcon, 
  ViewIcon,
} from '@chakra-ui/icons';

interface Command {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: any;
  action: () => void;
  shortcut?: string;
}

const CommandPalette: React.FC<{ 
  onModeChange: (mode: 'RESEARCH' | 'REVIEW' | 'TRAINING') => void;
  onFocusModeToggle: () => void;
}> = ({ onModeChange, onFocusModeToggle }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: Command[] = [
    { id: 'mode_research', title: 'Switch to Research Mode', description: 'Enter active experimentation workspace', category: 'Navigation', icon: SearchIcon, action: () => onModeChange('RESEARCH') },
    { id: 'mode_review', title: 'Switch to Review Mode', description: 'Enter post-mortem synthesis workspace', category: 'Navigation', icon: ViewIcon, action: () => onModeChange('REVIEW') },
    { id: 'mode_training', title: 'Switch to Training Mode', description: 'Enter guided learning workspace', category: 'Navigation', icon: RepeatIcon, action: () => onModeChange('TRAINING') },
    { id: 'toggle_focus', title: 'Toggle Focus Mode', description: 'Hide sidebar for distraction-free analysis', category: 'Workspace', icon: SettingsIcon, action: onFocusModeToggle, shortcut: 'F' },
    { id: 'open_archives', title: 'Open Research Archives', description: 'Jump to reliability and archival section', category: 'Tools', icon: TimeIcon, action: () => {} },
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.title.toLowerCase().includes(search.toLowerCase()) || 
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      onOpen();
    }
    if (e.key === 'Escape') onClose();
  }, [onOpen, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const executeCommand = (cmd: Command) => {
    cmd.action();
    onClose();
    setSearch('');
  };

  const onModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      if (filteredCommands[selectedIndex]) executeCommand(filteredCommands[selectedIndex]);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(5px)" />
      <ModalContent bg="background.surface" border="1px solid" borderColor="ui.border" mt="15vh" borderRadius="xl" boxShadow="2xl">
        <Box p={4} borderBottomWidth="1px" borderColor="ui.border">
          <Input 
            placeholder="Type a command or search..." 
            variant="unstyled" 
            autoFocus 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedIndex(0); }}
            onKeyDown={onModalKeyDown}
            fontSize="lg"
            color="white"
          />
        </Box>
        <Box maxH="400px" overflowY="auto">
          <VStack align="stretch" spacing={0} p={2}>
            {filteredCommands.length === 0 && (
              <Box p={8} textAlign="center">
                <Text color="ui.muted">No commands found.</Text>
              </Box>
            )}
            {filteredCommands.map((cmd, idx) => (
              <Box 
                key={cmd.id} 
                p={3} 
                bg={idx === selectedIndex ? 'whiteAlpha.100' : 'transparent'}
                borderRadius="md"
                cursor="pointer"
                onClick={() => executeCommand(cmd)}
                _hover={{ bg: 'whiteAlpha.50' }}
              >
                <HStack spacing={4} justifyContent="space-between">
                  <HStack spacing={3}>
                    <Icon as={cmd.icon} color={idx === selectedIndex ? 'brand.500' : 'ui.muted'} />
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="bold" color={idx === selectedIndex ? 'white' : 'gray.300'}>{cmd.title}</Text>
                      <Text fontSize="xs" color="ui.muted">{cmd.description}</Text>
                    </VStack>
                  </HStack>
                  <HStack spacing={2}>
                    <Badge fontSize="10px" variant="outline" colorScheme="gray" opacity={0.5}>{cmd.category}</Badge>
                    {cmd.shortcut && <Kbd color="brand.500" fontSize="10px" borderColor="brand.500">{cmd.shortcut}</Kbd>}
                  </HStack>
                </HStack>
              </Box>
            ))}
          </VStack>
        </Box>
        <Box p={3} bg="blackAlpha.300" borderBottomRadius="xl">
          <HStack spacing={4} fontSize="xs" color="ui.muted" justifyContent="center">
            <HStack spacing={1}><Kbd>↑↓</Kbd><Text>Navigate</Text></HStack>
            <HStack spacing={1}><Kbd>Enter</Kbd><Text>Select</Text></HStack>
            <HStack spacing={1}><Kbd>Esc</Kbd><Text>Close</Text></HStack>
          </HStack>
        </Box>
      </ModalContent>
    </Modal>
  );
};

export default CommandPalette;
