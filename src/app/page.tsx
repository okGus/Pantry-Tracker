'use client';
import { Autocomplete, Box, Button, Collapse, Container, Grid, List, ListItemButton, ListItemText, ListSubheader, Modal, Stack, TextField, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { firestore } from '../../firebase';
import { collection, query, getDocs, deleteDoc, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import NumberInput from './components/input';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// import rehypeRaw from 'rehype-raw';
import '~/styles/markdown-styles.css';
import remarkBreaks from 'remark-breaks';

const modalStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '1px solid #000',
  boxShadow: 20,
  p: 4,
};

type PantryType = {
  name: string;
  count: number;
};

const categories = ['Vegetables', 'Dairy', 'Condiments', 'Fruits', 'Grains', 'Proteins', 'Spices and Herbs']

export default function HomePage() {
  const [pantry, setPantry] = useState<PantryType[]>([]);
  const router = useRouter();

  const [result, setResult] = useState<string>('');

  const [collDocs, setCollDocs] = useState<Map<string, string[]>>(new Map());

  const [ingredients, setIngredients] = useState<string>('');

  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const handleCategoryClick = (category: string) => {
    setOpenCategory(prevCategory => (prevCategory === category ? null : category));
  };

  const [openModal, setOpenModal] = useState<boolean>(false);
  const handleOpenModal = (item: string) => {
    setSelectedItem(item);
    setOpenModal(true);
    setIsModalActive(true);
  };
  const handleCloseModal = () => {
    setOpenModal(false);
    setIsModalActive(false);
    setSelectedItem(null);
  };

  const [value, setValue] = useState<number | null>(null);

  const [autoCompleteOptions, setAutoCompleteOptions] = useState<string[]>([]);

  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const [isModalActive, setIsModalActive] = useState<boolean>(false);

  const handleAutoCompleteChange = (event: React.SyntheticEvent, value: string | null) => {
    event.stopPropagation();
    setSelectedItem(value);
  };

  const updatePantry = async () => {
    const snapshot = query(collection(firestore, 'pantry'));
    const docs = await getDocs(snapshot);
    const pantryList: PantryType[] = []
    docs.forEach((doc) => {
      const count = doc.data().count as number;
      pantryList.push({
        name: doc.id, 
        count: count,
        ...doc.data()
      });
    });
    return pantryList;
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(firestore, 'pantry', id));
    updatePantry()
      .then(pantryList => setPantry(pantryList))
      .catch(error => console.error('Error fetching pantry data:', error));
    router.refresh();
  };
  
  const handleAddItem = async (itemName: string) => {
    if (value !== null) {
      await addItem(itemName, value);
    }
  };

  const addItem = async (itemName: string, itemNumber: number) => {
    const docRef = doc(collection(firestore, 'pantry'), itemName);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const currentCount: number = docSnap.data().count as number ?? 0;
      if (currentCount + itemNumber === 0) {
        await handleDelete(itemName);
      } else {
        await updateDoc(docRef, {count: currentCount + itemNumber});
      }
    } else {
      await setDoc(docRef, {count: itemNumber})
    }
    updatePantry()
      .then(pantryList => setPantry(pantryList))
      .catch(error => console.error('Error fetching pantry data:', error));
    router.refresh();
  };

  const getColDocs = async (coll: string) => {
    const documents: string[] = [];

    const snapshot = query(collection(firestore, coll));
    const docs = await getDocs(snapshot);
    docs.forEach((doc) => {
      documents.push(doc.id);
    });

    return documents;
  };

  interface OpenAIResponse {
    result?: string;
    error?: string;
  }

  const handleOpenAIRequest = async () => {
    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: ingredients }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const res = await response.json() as OpenAIResponse;

      if (res.result) {
        const data: string = res.result;
        setResult(data);
      } else {
        console.error('No result found:', res.error);
        setResult('An error occurred while processing your request.');
      }
    } catch (error) {
      console.error('Error:', error);
      setResult('An error occurred while processing your request.');
    }
  };

  useEffect(() => {
    const fetchDocuments = async () => {
      const collmap = new Map<string, string[]>();
      const fetchPromises = categories.map(async (cat) => {
        const documents = await getColDocs(cat);
        collmap.set(cat, documents)
      });

      try {
        await Promise.all(fetchPromises);
        setCollDocs(new Map(collmap));
      } catch (error) {
        console.error('Error collecting docs:', error);
      }
    };
    fetchDocuments().catch((error) => {
      console.error('Error in fetchingDocuments:', error);
    });
  
    updatePantry()
      .then(pantryList => setPantry(pantryList))
      .catch(error => console.error('Error fetching pantry data:', error));
  }, []);

  useEffect(() => {
    const flatOptions = Array.from(collDocs.values()).flat();
    setAutoCompleteOptions(flatOptions);
  }, [collDocs]);

  useEffect(() => {
    const ingredients_: string[] = []
    pantry.forEach((item) => {
      const item_ = item.name + ' x' + item.count;
      ingredients_.push(item_);
    });
    setIngredients('Ingredients: ' + ingredients_.join(', '));
  }, [pantry]);

  return (
    <Box
      width={'100%'}
      height={'100vh'}
      display={'flex'}
      // justifyContent={'center'}
      // alignItems={'center'}
      // bgcolor={'#ffffff'}
      flexDirection={'column'}
    >
      <Box 
        width="100%" 
        bgcolor="#f0f4f8" // A light blue-gray color
        color="#2c3e50" // Dark blue-gray for text
        py={8}
        mb={8} 
      >
        <Container maxWidth="lg">
          <Typography variant="h2" component="h1" gutterBottom>
            Pantry Tracker
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom>
            Effortlessly manage your kitchen inventory
          </Typography>
          <Typography variant="body1">
            Keep track of your ingredients, plan meals, and never run out of essentials again.
          </Typography>
        </Container>
      </Box>

      <Box
        width={'100%'}
        display={'flex'}
        justifyContent={'center'}
        alignItems={'center'}
        bgcolor={'#ffffff'}
        flexDirection={'column'}
      >
        <Box
          width={'62.5rem'}
          height={'2.5rem'}
          sx={{m : 1, p: 1}}
          border={'1px solid #3333'}
        >
          <Typography>
            Pantry
          </Typography>
        </Box>
        
          
        <Box
          display={'flex'}
          // width={'800px'}
          // height={'300px'}
          width={'1000px'}
          height={'500px'}
        >
          <Box
            width={'300px'}
            height={'100%'}
            border={'1px solid #333'}
            overflow={'auto'}
          >
            <Autocomplete
              options={autoCompleteOptions}
              getOptionLabel={(option) => option}
              onChange={handleAutoCompleteChange}
              renderInput={(params) => <TextField {...params} label='Search Item'/>}
            />
            {selectedItem ? (
              <List
                sx={{width: '100%', maxWidth: 360}}
                component='nav'
                subheader={
                  <ListSubheader component='div' id='nested-list-subheader'>
                  </ListSubheader>
                }
              >
                {Array.from(collDocs.entries()).map(([_collections, documents]) => (
                  documents.includes(selectedItem) && (
                    <ListItemButton key={selectedItem}>
                      <ListItemText primary={selectedItem} onClick={(_e) => !isModalActive && handleOpenModal(selectedItem)} />
                    </ListItemButton>
                  )
                ))}
              </List>
            ) : (
            Array.from(collDocs.entries()).map(([collections, documents]) => (
              <List
                key={collections}
                sx={{width: '100%', maxWidth: 360}}
                component='nav'
                subheader={
                  <ListSubheader component='div' id='nested-list-subheader'>
                  </ListSubheader>
                }
              >
                <ListItemButton onClick={() => handleCategoryClick(collections)} sx={{backgroundColor: '#E5E5E5'}}>
                  <ListItemText primary={collections} />
                  {openCategory === collections ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={openCategory === collections} timeout={'auto'} unmountOnExit>
                  <List component='div' disablePadding>
                    {documents.map((item) => (
                      <ListItemButton key={item}>
                        <ListItemText primary={item} onClick={(_e) => !isModalActive && handleOpenModal(item)}/>
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </List>
            ))
          )}

          <Modal
            open={openModal}
            onClose={handleCloseModal}
            slotProps={{ backdrop: {
              style: {backgroundColor: 'rgba(0, 0, 0, 0.2)', boxShadow: 'none'},
            }}}
          >
            <Box sx={modalStyle} component={'div'} onClick={(e) => e.stopPropagation()}>
              <Typography variant='h6' component='h2'>
                How Many {selectedItem}
              </Typography>
              <Stack width='100%' direction='row' spacing={2}>
                <NumberInput 
                  placeholder='Type a number...'
                  value={value}
                  // onClick={(e) => e.stopPropagation()}
                  onChange={(event, val) => {setValue(val)}}
                />
                <Button 
                  variant='outlined'
                  onClick={() => {
                    // e.stopPropagation();
                    if (selectedItem) {
                      void handleAddItem(selectedItem);
                    }
                    handleCloseModal();
                  }}
                >
                  Add
                </Button>
              </Stack>
            </Box>
          </Modal>

          </Box>

          <Stack 
            width={'100%'} 
            height={'100%'} 
            spacing={2} 
            overflow={'auto'} 
            border={'1px solid #333'}
          >
            {pantry.map((item) => (
              <Box
                key={item.name}
                width={'100%'}
                minHeight={'50px'}
                display={'flex'}
                justifyContent={'space-between'}
                // alignItems={'center'}
                bgcolor={'#f0f0f0'}
                // sx={{ m: 1, p: 1}}
              >
                <Box
                  display={'inherit'}
                  justifyContent={'center'}
                  alignItems={'center'}
                  sx={{m: 1, p: 1}}
                >
                  <Typography>
                    {`${item.name.charAt(0).toUpperCase() + item.name.slice(1)} x ${item.count}`}
                  </Typography>
                </Box>
                <Box
                  display={'inherit'}
                  justifyContent={'center'}
                  alignItems={'center'}
                  sx={{m: 1, p: 1}}
                >
                  <Button 
                    variant="contained"
                    size='small'
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDelete(item.name)}
                  >
                    <Typography fontSize={12}>Delete</Typography>
                  </Button>
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>

      <Box
        width={'100%'}
        display={'flex'}
        justifyContent={'center'}
        alignItems={'center'}
        bgcolor={'#ffffff'}
        flexDirection={'column'}
      >
        <Box
          sx={{m: 1, p: 1}}
        >
          <Button
            variant='contained'
            onClick={handleOpenAIRequest}
          >
            Generate Recipies 
          </Button>
        </Box>
        <Box
          display={'flex'}
          flexDirection={'column'}
          width={'1000px'}
          height={'400px'}
          sx={{m : 1, p: 1}}
          border={'1px solid #333'}
          overflow={'auto'}
          whiteSpace={'pre-wrap'}
        >
          <div className='markdown-body'>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm, remarkBreaks]}
              components={{
                li: ({children}) => <li style={{marginBottom: '0.5em'}}>{children}</li>
              }}
            >
              {result}
            </ReactMarkdown>
          </div>
        </Box>
      </Box>
      
      <Box
        component="footer"
        sx={{
          backgroundColor: '#34495e', // Dark blue-gray
          color: 'white',
          py: 6,
          my: 6,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="space-evenly">  
          </Grid>
          <Box mt={5}>
            <Typography variant="body2" align="center">
              © {new Date().getFullYear()} Pantry Tracker. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}