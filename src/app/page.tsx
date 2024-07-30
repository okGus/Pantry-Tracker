'use client';
import { Box, Stack } from '@mui/material';
import { firestore } from '../../firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [pantry, setPantry] = useState<string[]>([]);
  useEffect(() => {
    const updatePantry = async () => {
      const snapshot = query(collection(firestore, 'pantry'));
      const docs = await getDocs(snapshot);
      const pantryList: string[] = []
      docs.forEach((doc) => {
        pantryList.push(doc.id);
      });
      return pantryList;
    };
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
        <Box>
          Pantry
        </Box>
      </Box>
      <Stack 
        width={'800px'} 
        height={'300px'} 
        spacing={2} 
        overflow={'auto'} 
        border={'1px solid #333'}
      >
        {pantry.map((i) => (
          <Box
            key={i}
            width={'100%'}
            minHeight={'40px'}
            display={'flex'}
            // justifyContent={'center'}
            // alignItems={'center'}
            bgcolor={'#f0f0f0'}
            sx={{ m: 1, p: 1}}
          >
            <Box>
              {i.charAt(0).toUpperCase() + i.slice(1)}
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}