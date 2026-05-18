import React, { useState, useEffect } from 'react';
import { demoFetch } from "../demo/demoFetch";
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Badge,
  Icon,
  Button,
  Textarea,
  Collapse,
  useDisclosure,
  IconButton,
  Divider,
  useToast,
  Avatar,
} from '@chakra-ui/react';
import { 
  DeleteIcon, 
  ChevronDownIcon,
  ChevronRightIcon,
  AddIcon,
  LinkIcon,
} from '@chakra-ui/icons';

interface Commentary {
  id: string;
  author: string;
  timestamp: string;
  content: string;
  signal_id?: string;
  replay_context?: string;
}

interface ResearchCommentaryProps {
  signal_id?: string;
  replay_context?: string;
}

const ResearchCommentary: React.FC<ResearchCommentaryProps> = ({ signal_id, replay_context }) => {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });
  const [comments, setComments] = useState<Commentary[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const toast = useToast();

  const fetchComments = async () => {
    try {
      let url = 'http://localhost:8000/api/comments';
      if (signal_id) url += `?signal_id=${signal_id}`;
      const response = await demoFetch(url);
      const data = await response.json();
      setComments(data);
    } catch (e) {
      console.error('Failed to fetch comments:', e);
    }
  };

  useEffect(() => {
    fetchComments();
    const interval = setInterval(fetchComments, 10000);
    return () => clearInterval(interval);
  }, [signal_id]);

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    setIsPosting(true);
    try {
      const response = await demoFetch('http://localhost:8000/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          signal_id,
          replay_context,
          author: "Researcher " + (Math.floor(Math.random() * 100)) // Simulation of multiple authors
        })
      });
      if (response.ok) {
        setNewComment('');
        fetchComments();
        toast({ title: 'Interpretation Added', status: 'success', duration: 2000 });
      }
    } catch (e) {
      toast({ title: 'Failed to post', status: 'error' });
    } finally {
      setIsPosting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await demoFetch(`http://localhost:8000/api/comments/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchComments();
        toast({ title: 'Comment removed', status: 'info', duration: 2000 });
      }
    } catch (e) {}
  };

  return (
    <Box bg="background.surface" borderRadius="lg" p={4} borderWidth="1px" borderColor="ui.border" shadow="sm">
      <HStack justifyContent="space-between" mb={2}>
        <HStack spacing={2}>
            <Heading size="xs" color="brand.500" letterSpacing="widest" textTransform="uppercase">Analytical Commentary</Heading>
            <Badge variant="subtle" fontSize="9px">{comments.length} THREADS</Badge>
        </HStack>
        <IconButton 
          size="xs" 
          variant="ghost" 
          icon={isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />} 
          onClick={onToggle}
          aria-label="Toggle Commentary"
        />
      </HStack>

      <Collapse in={isOpen}>
        <VStack align="stretch" spacing={4} mt={2}>
          <Text fontSize="11px" color="ui.muted">Evidence-linked interpretations and peer analytical debate.</Text>
          
          <VStack align="stretch" spacing={3} maxH="400px" overflowY="auto" pr={2}>
            {comments.length === 0 ? (
                <Box p={4} textAlign="center" borderRadius="md" bg="blackAlpha.200" border="1px dashed" borderColor="ui.border">
                    <Text fontSize="11px" color="ui.muted">No collaborative interpretations yet.</Text>
                </Box>
            ) : (
                (comments || []).map(c => (
                    <Box key={c.id} p={3} bg="blackAlpha.300" borderRadius="md" borderLeft="2px solid" borderColor="brand.500">
                        <VStack align="stretch" spacing={2}>
                            <HStack justifyContent="space-between">
                                <HStack spacing={2}>
                                    <Avatar size="2xs" name={c.author} bg="brand.500" />
                                    <Text fontSize="11px" fontWeight="bold" color="gray.200">{c.author}</Text>
                                    <Text fontSize="9px" color="ui.muted">{new Date(c.timestamp).toLocaleTimeString()}</Text>
                                </HStack>
                                <IconButton 
                                    size="2xs" 
                                    variant="ghost" 
                                    icon={<DeleteIcon />} 
                                    onClick={() => handleDelete(c.id)}
                                    aria-label="Delete"
                                />
                            </HStack>
                            <Text fontSize="xs" color="gray.300" lineHeight="tall">{c.content}</Text>
                            {c.signal_id && (
                                <HStack spacing={1}>
                                    <Icon as={LinkIcon} w={2} h={2} color="brand.400" />
                                    <Text fontSize="9px" color="brand.400" fontWeight="800">LINKED TO SIGNAL: {c.signal_id.slice(-8)}</Text>
                                </HStack>
                            )}
                        </VStack>
                    </Box>
                ))
            )}
          </VStack>

          <Divider borderColor="ui.border" />

          <Box>
            <Textarea 
                placeholder="Attach interpretation to this context..." 
                size="sm" 
                fontSize="xs" 
                rows={2}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                bg="blackAlpha.400"
                borderColor="ui.border"
                _focus={{ borderColor: 'brand.500' }}
            />
            <Button 
                size="xs" 
                mt={2} 
                w="100%" 
                colorScheme="brand" 
                leftIcon={<AddIcon />}
                onClick={handlePostComment}
                isLoading={isPosting}
            >
                Add Peer Interpretation
            </Button>
          </Box>
        </VStack>
      </Collapse>
    </Box>
  );
};

export default ResearchCommentary;
