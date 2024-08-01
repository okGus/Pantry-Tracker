'use client';
import { Autocomplete, Box, Button, Collapse, List, ListItemButton, ListItemText, ListSubheader, Modal, Stack, TextField, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { firestore } from '../../firebase';
import { collection, query, getDocs, deleteDoc, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import NumberInput from './components/input';

const modalStyle = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
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

  const [collDocs, setCollDocs] = useState<Map<string, string[]>>(new Map());

  const [openCategory, setOpenCategory] = useState<string | null>(null);
  // const handleCategoryClick = () => setOpenCategory(!openCategory);
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
      await updateDoc(docRef, {count: currentCount + itemNumber});
    } else {
      await setDoc(docRef, {count: 1})
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
    const ingredients: string[] = []
    pantry.forEach((p) => {
      const ing = p.name + ' x' + p.count;
      ingredients.push(ing);
    });
    console.log(ingredients);
  }, [pantry]);

  return (
    <Box
      width={'100vw'}
      height={'100vh'}
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
              {Array.from(collDocs.entries()).map(([collections, documents]) => (
                documents.includes(selectedItem) && (
                  <ListItemButton key={selectedItem}>
                    <ListItemText primary={selectedItem} onClick={(e) => !isModalActive && handleOpenModal(selectedItem)} />
                    {/* <Modal
                      open={openModal && selectedItem == selectedItem}
                      onClose={handleCloseModal}
                      slotProps={{ backdrop: {
                        style: {backgroundColor: 'rgba(0, 0, 0, 0.2)', boxShadow: 'none'},
                        onClick: (e) => {
                          e.stopPropagation();
                          handleCloseModal();
                        }
                      }}}
                    >
                      <Box sx={modalStyle} component={'div'} onClick={(e) => e.stopPropagation()}>
                        <Typography variant='h6' component='h2'>
                          How Many
                        </Typography>
                        <Stack width='100%' direction='row' spacing={2}>
                          <NumberInput 
                            placeholder='Type a number...'
                            value={value}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(event, val) => setValue(val)}
                          />
                          <Button 
                            variant='outlined'
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleAddItem(collections);
                              handleCloseModal();
                            }}
                          >
                            Add
                          </Button>
                        </Stack>
                      </Box>
                    </Modal> */}
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
                      <ListItemText primary={item} onClick={(e) => !isModalActive && handleOpenModal(item)}/>
                      {/* <Modal
                        open={openModal && selectedItem === item}
                        onClose={handleCloseModal}
                        slotProps={{ backdrop: {
                          style: {backgroundColor: 'rgba(0, 0, 0, 0.2)', boxShadow: 'none'},
                          onClick: (e) => {
                            e.stopPropagation();
                            handleCloseModal();
                          }
                        }}}
                      >
                        <Box sx={modalStyle} component={'div'} onClick={(e) => e.stopPropagation()}>
                          <Typography variant='h6' component='h2'>
                            How Many
                          </Typography>
                          <Stack width='100%' direction='row' spacing={2}>
                            <NumberInput 
                              placeholder='Type a number...'
                              value={value}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(event, val) => setValue(val)}
                            />
                            <Button 
                              variant='outlined'
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleAddItem(item);
                                handleCloseModal();
                              }}
                            >
                              Add
                            </Button>
                          </Stack>
                        </Box>
                      </Modal> */}
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
                onChange={(event, val) => setValue(val)}
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
  );
}