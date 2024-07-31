'use client';
import { Box, Button, Collapse, List, ListItemButton, ListItemText, ListSubheader, Modal, Stack, TextField, Typography } from '@mui/material';
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

export default function HomePage() {
  const [pantry, setPantry] = useState<PantryType[]>([]);
  const router = useRouter();

  const [openCategory, setOpenCategory] = useState<boolean>(true);
  const handleCategoryClick = () => setOpenCategory(!openCategory);

  const [openModal, setOpenModal] = useState<boolean>(false);
  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

  const [value, setValue] = useState<number | null>(null);

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

  useEffect(() => {
    updatePantry()
      .then(pantryList => setPantry(pantryList))
      .catch(error => console.error('Error fetching pantry data:', error));
  }, []);

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
        width={'50rem'}
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
        width={'800px'}
        height={'300px'}
      >
        <Box
          width={'300px'}
          height={'100%'}
          border={'1px solid #333'}
        >
          <List
            sx={{width: '100%', maxWidth: 360}}
            component='nav'
            subheader={
              <ListSubheader component='div' id='nested-list-subheader'>
              </ListSubheader>
            }
          >
            <ListItemButton onClick={handleCategoryClick}>
              <ListItemText primary='Fruits' />
                {openCategory ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={openCategory} timeout={'auto'} unmountOnExit>
              <List component='div' disablePadding>
                <ListItemButton>
                  <ListItemText primary='Apple' onClick={handleOpenModal}/>
                  <Modal 
                    open={openModal}
                    onClose={handleCloseModal}
                  >
                    <Box sx={modalStyle}>
                      <Typography variant='h6' component='h2'>
                        How Many
                      </Typography>
                      <Stack width='100%' direction='row' spacing={2}>
                        <NumberInput 
                          placeholder='Type a number...'
                          value={value}
                          onChange={(event, val) => setValue(val)}
                        />
                        <Button 
                          variant='outlined'
                          onClick={() => {
                            void handleAddItem('Apple')
                            handleCloseModal()
                          }}
                        >
                          Add
                        </Button>
                      </Stack>
                    </Box>
                  </Modal>
                </ListItemButton>
                <ListItemButton>
                  <ListItemText primary='Banana' />
                </ListItemButton>
                <ListItemButton>
                  <ListItemText primary='Orange' />
                </ListItemButton>
              </List>
            </Collapse>
            <ListItemButton onClick={handleCategoryClick}>
              <ListItemText primary='Vetegables' />
                {!openCategory ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </List>
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
                  {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
                </Typography>
                <Typography>
                  {item.count}
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