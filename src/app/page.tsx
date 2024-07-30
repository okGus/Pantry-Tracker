import { Box, Stack } from '@mui/material'

const items = [
  'tomato',
  'potato',
  'onion',
  'lettuce',
  'apple',
  'carrot',
  'ginger',
  'kale',
]

export default function HomePage() {
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
        {items.map((i) => (
          <Box
            key={i}
            width={'100%'}
            height={'100px'}
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